/**
 * Universal Fetch-Based HTTP Client with Enterprise Middleware Pipeline
 */

import {
  ScrymeError,
  NetworkError,
  TimeoutError,
  createApiErrorFromResponse,
} from "./errors";
import {
  DEFAULT_RETRY_OPTIONS,
  RetryOptions,
  calculateRetryDelay,
  isRetryableStatus,
  sleep,
} from "./retry";
import { Logger, noopLogger } from "./logger";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface RequestOptions {
  headers?: Record<string, string | undefined>;
  params?: Record<string, any>;
  data?: any;
  body?: any;
  signal?: AbortSignal;
  timeout?: number;
  idempotencyKey?: string;
  skipAuth?: boolean;
  retries?: number | RetryOptions;
  responseType?: "json" | "text" | "blob" | "arraybuffer";
  [key: string]: any;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestOptions;
  request?: any;
}

export interface HttpClientConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retry?: RetryOptions;
  logger?: Logger;
  fetch?: typeof fetch;
  onRequest?: (url: string, init: RequestInit, options: RequestOptions) => void | Promise<void>;
  onResponse?: (response: HttpResponse) => void | Promise<void>;
  onError?: (error: Error, options: RequestOptions) => void | Promise<void>;
  tokenProvider?: () => string | null | undefined | Promise<string | null | undefined>;
}

export class HttpClient {
  public baseUrl: string;
  public defaultHeaders: Record<string, string>;
  public timeout: number;
  public retryConfig: Required<RetryOptions>;
  public logger: Logger;
  private customFetch?: typeof fetch;
  private onRequestHook?: HttpClientConfig["onRequest"];
  private onResponseHook?: HttpClientConfig["onResponse"];
  private onErrorHook?: HttpClientConfig["onError"];
  private tokenProvider?: HttpClientConfig["tokenProvider"];

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = (config.baseUrl || "https://api.scryme.tech").replace(/\/+$/, "");
    this.defaultHeaders = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout ?? 30000;
    this.retryConfig = { ...DEFAULT_RETRY_OPTIONS, ...config.retry };
    this.logger = config.logger || noopLogger;
    this.customFetch = config.fetch;
    this.onRequestHook = config.onRequest;
    this.onResponseHook = config.onResponse;
    this.onErrorHook = config.onError;
    this.tokenProvider = config.tokenProvider;
  }

  public setTokenProvider(provider: HttpClientConfig["tokenProvider"]): void {
    this.tokenProvider = provider;
  }

  public setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  public removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  private resolveFetch(): typeof fetch {
    if (this.customFetch) return this.customFetch;
    if (typeof globalThis !== "undefined" && typeof globalThis.fetch === "function") {
      return globalThis.fetch.bind(globalThis);
    }
    throw new ScrymeError("Universal fetch implementation not found in runtime environment");
  }

  public buildUrl(endpoint: string, params?: Record<string, any>): string {
    const isAbsolute = endpoint.startsWith("http://") || endpoint.startsWith("https://");
    const fullUrl = isAbsolute
      ? endpoint
      : `${this.baseUrl}/${endpoint.replace(/^\/+/, "")}`;

    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const url = new URL(fullUrl);
    for (const [key, val] of Object.entries(params)) {
      if (val === undefined || val === null) continue;
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item !== undefined && item !== null) {
            url.searchParams.append(key, String(item));
          }
        }
      } else {
        url.searchParams.append(key, String(val));
      }
    }
    return url.toString();
  }

  public async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const fetchFn = this.resolveFetch();
    const finalUrl = this.buildUrl(endpoint, options.params);
    const bodyContent = options.data !== undefined ? options.data : options.body;

    const retryOptions: Required<RetryOptions> =
      typeof options.retries === "number"
        ? { ...this.retryConfig, maxRetries: options.retries }
        : { ...this.retryConfig, ...(options.retries || {}) };

    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      let isTimedOut = false;
      const timeoutMs = options.timeout ?? this.timeout;

      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        controller.abort();
      }, timeoutMs);

      // Chain caller's AbortSignal if provided
      let cleanupAbortListener: (() => void) | undefined;
      if (options.signal) {
        if (options.signal.aborted) {
          clearTimeout(timeoutId);
          throw new NetworkError("Request was cancelled before sending", options.signal.reason as any);
        }
        const onCallerAbort = () => {
          controller.abort();
        };
        options.signal.addEventListener("abort", onCallerAbort);
        cleanupAbortListener = () => options.signal?.removeEventListener("abort", onCallerAbort);
      }

      // Headers assembly
      const headers: Record<string, string> = { ...this.defaultHeaders };

      if (!options.skipAuth && this.tokenProvider) {
        const token = await this.tokenProvider();
        if (token && !headers["Authorization"] && !headers["authorization"]) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      if (options.idempotencyKey) {
        headers["Idempotency-Key"] = options.idempotencyKey;
      }

      if (options.headers) {
        for (const [k, v] of Object.entries(options.headers)) {
          if (v !== undefined) {
            headers[k] = v;
          }
        }
      }

      let formattedBody: any = undefined;
      if (bodyContent !== undefined && method !== "GET" && method !== "HEAD") {
        if (
          typeof bodyContent === "string" ||
          bodyContent instanceof FormData ||
          bodyContent instanceof Blob ||
          bodyContent instanceof ArrayBuffer ||
          (typeof URLSearchParams !== "undefined" && bodyContent instanceof URLSearchParams)
        ) {
          formattedBody = bodyContent;
          if (bodyContent instanceof FormData) {
            delete headers["Content-Type"];
            delete headers["content-type"];
          }
        } else {
          formattedBody = JSON.stringify(bodyContent);
          headers["Content-Type"] = "application/json";
        }
      }

      const requestInit: RequestInit = {
        method,
        headers,
        body: formattedBody,
        signal: controller.signal,
      };

      if (this.onRequestHook) {
        await this.onRequestHook(finalUrl, requestInit, options);
      }

      try {
        this.logger.debug(`[${method}] ${finalUrl} (attempt ${attempt + 1}/${retryOptions.maxRetries + 1})`);
        const res = await fetchFn(finalUrl, requestInit);

        clearTimeout(timeoutId);
        cleanupAbortListener?.();

        const responseHeaders: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          responseHeaders[key.toLowerCase()] = value;
        });

        // Parse body
        let parsedData: any = null;
        const contentType = res.headers.get("content-type") || "";
        if (options.responseType === "blob") {
          parsedData = await res.blob();
        } else if (options.responseType === "arraybuffer") {
          parsedData = await res.arrayBuffer();
        } else if (options.responseType === "text" || !contentType.includes("application/json")) {
          const txt = await res.text();
          if (contentType.includes("application/json")) {
            try {
              parsedData = JSON.parse(txt);
            } catch {
              parsedData = txt;
            }
          } else {
            parsedData = txt;
          }
        } else {
          try {
            parsedData = await res.json();
          } catch {
            parsedData = null;
          }
        }

        const httpResponse: HttpResponse<T> = {
          data: parsedData,
          status: res.status,
          statusText: res.statusText,
          headers: responseHeaders,
          config: options,
        };

        if (res.ok) {
          if (this.onResponseHook) {
            await this.onResponseHook(httpResponse);
          }
          return httpResponse;
        }

        // Response status is 4xx or 5xx
        const apiError = createApiErrorFromResponse(res.status, parsedData, res.headers);

        if (attempt < retryOptions.maxRetries && isRetryableStatus(res.status)) {
          const retryAfterSec = apiError.code === "RATE_LIMIT_EXCEEDED" && "retryAfter" in apiError
            ? (apiError as any).retryAfter
            : undefined;
          const delay = calculateRetryDelay(attempt, retryOptions, retryAfterSec);
          this.logger.warn(`Retrying request after ${delay}ms due to status ${res.status}`);
          await sleep(delay, options.signal);
          attempt++;
          continue;
        }

        if (this.onErrorHook) {
          await this.onErrorHook(apiError, options);
        }
        throw apiError;

      } catch (err: any) {
        clearTimeout(timeoutId);
        cleanupAbortListener?.();

        let finalError = err;
        if (isTimedOut) {
          finalError = new TimeoutError(`Request timed out after ${timeoutMs}ms`, timeoutMs);
        } else if (err.name === "AbortError" && options.signal?.aborted) {
          finalError = new NetworkError("Request was cancelled by user signal", err);
        } else if (!(err instanceof ScrymeError)) {
          finalError = new NetworkError(err.message || "Network request failed", err);
        }

        if (
          attempt < retryOptions.maxRetries &&
          !isTimedOut &&
          !options.signal?.aborted &&
          finalError instanceof NetworkError
        ) {
          const delay = calculateRetryDelay(attempt, retryOptions);
          this.logger.warn(`Retrying request after ${delay}ms due to network error: ${err.message}`);
          await sleep(delay, options.signal);
          attempt++;
          continue;
        }

        if (this.onErrorHook) {
          await this.onErrorHook(finalError, options);
        }
        throw finalError;
      }
    }
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("GET", endpoint, options);
  }

  public post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("POST", endpoint, { ...options, data });
  }

  public put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PUT", endpoint, { ...options, data });
  }

  public patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PATCH", endpoint, { ...options, data });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("DELETE", endpoint, options);
  }
}
