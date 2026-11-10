/**
 * Universal Fetch-Based HTTP Client with Enterprise Middleware Pipeline,
 * Circuit Breaker, In-Memory Caching, Sensitive Data Redaction, and Security Validation.
 */

import {
  ScrymeError,
  SecurityError,
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
import {
  sanitizeSensitiveData,
  sanitizeHeaderValue,
  validateUrlSecurity,
  generateUuidV4,
} from "./security";
import { CircuitBreaker, CircuitBreakerOptions } from "./circuit-breaker";
import { MemoryCache, CacheOptions } from "./cache";

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
  skipCache?: boolean;
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
  allowInsecureHttp?: boolean;
  circuitBreaker?: CircuitBreakerOptions;
  cache?: CacheOptions;
  idempotency?: {
    autoGenerate?: boolean;
  };
  onRequest?: (url: string, init: RequestInit, options: RequestOptions) => void | Promise<void>;
  onResponse?: (response: HttpResponse) => void | Promise<void>;
  onError?: (error: Error, options: RequestOptions) => void | Promise<void>;
  tokenProvider?: () => string | null | undefined | Promise<string | null | undefined>;
}

export const SDK_VERSION = "10.2.45";

export class HttpClient {
  public baseUrl: string;
  public defaultHeaders: Record<string, string>;
  public timeout: number;
  public retryConfig: Required<RetryOptions>;
  public logger: Logger;
  public allowInsecureHttp: boolean;
  public circuitBreaker: CircuitBreaker;
  public cache: MemoryCache;
  public autoGenerateIdempotencyKey: boolean;

  private customFetch?: typeof fetch;
  private onRequestHook?: HttpClientConfig["onRequest"];
  private onResponseHook?: HttpClientConfig["onResponse"];
  private onErrorHook?: HttpClientConfig["onError"];
  private tokenProvider?: HttpClientConfig["tokenProvider"];

  constructor(config: HttpClientConfig = {}) {
    const rawBaseUrl = (config.baseUrl || "https://api.scryme.tech").replace(/\/+$/, "");
    this.allowInsecureHttp = config.allowInsecureHttp ?? false;

    // Validate security of target base URL
    validateUrlSecurity(rawBaseUrl, this.allowInsecureHttp);
    this.baseUrl = rawBaseUrl;

    this.defaultHeaders = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Client-Info": `@scryme/sdk/${SDK_VERSION}`,
      ...config.defaultHeaders,
    };

    this.timeout = config.timeout ?? 30000;
    this.retryConfig = { ...DEFAULT_RETRY_OPTIONS, ...config.retry };
    this.logger = config.logger || noopLogger;
    this.customFetch = config.fetch;
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.cache = new MemoryCache(config.cache);
    this.autoGenerateIdempotencyKey = config.idempotency?.autoGenerate ?? true;

    this.onRequestHook = config.onRequest;
    this.onResponseHook = config.onResponse;
    this.onErrorHook = config.onError;
    this.tokenProvider = config.tokenProvider;
  }

  public setTokenProvider(provider: HttpClientConfig["tokenProvider"]): void {
    this.tokenProvider = provider;
  }

  public setHeader(key: string, value: string): void {
    this.defaultHeaders[sanitizeHeaderValue(key)] = sanitizeHeaderValue(value);
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

    validateUrlSecurity(fullUrl, this.allowInsecureHttp);

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

    // Check in-memory cache for GET requests
    const cacheKey = `${method}:${finalUrl}`;
    if (method === "GET" && !options.skipCache && this.cache.enabled) {
      const cachedResponse = this.cache.get<HttpResponse<T>>(cacheKey);
      if (cachedResponse) {
        this.logger.debug(`[CACHE HIT] ${method} ${finalUrl}`);
        return {
          ...cachedResponse,
          config: options,
        };
      }
    }

    // Fail-fast via Circuit Breaker
    this.circuitBreaker.checkHealth();

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

      // Auto-generate or set Idempotency Key for mutating requests
      const isMutating = method === "POST" || method === "PUT" || method === "PATCH";
      if (options.idempotencyKey) {
        headers["Idempotency-Key"] = sanitizeHeaderValue(options.idempotencyKey);
      } else if (isMutating && this.autoGenerateIdempotencyKey && !headers["Idempotency-Key"] && !headers["idempotency-key"]) {
        headers["Idempotency-Key"] = generateUuidV4();
      }

      if (options.headers) {
        for (const [k, v] of Object.entries(options.headers)) {
          if (v !== undefined) {
            headers[sanitizeHeaderValue(k)] = sanitizeHeaderValue(String(v));
          }
        }
      }

      let formattedBody: any = undefined;
      if (bodyContent !== undefined && method !== "GET" && method !== "HEAD") {
        if (
          typeof bodyContent === "string" ||
          (typeof FormData !== "undefined" && bodyContent instanceof FormData) ||
          (typeof Blob !== "undefined" && bodyContent instanceof Blob) ||
          (typeof ArrayBuffer !== "undefined" && bodyContent instanceof ArrayBuffer) ||
          (typeof URLSearchParams !== "undefined" && bodyContent instanceof URLSearchParams)
        ) {
          formattedBody = bodyContent;
          if (typeof FormData !== "undefined" && bodyContent instanceof FormData) {
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
        const safeHeaders = sanitizeSensitiveData(headers);
        this.logger.debug(
          `[${method}] ${finalUrl} (attempt ${attempt + 1}/${retryOptions.maxRetries + 1})`,
          safeHeaders
        );
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
          // Record success on circuit breaker
          this.circuitBreaker.recordSuccess();

          // Store in cache if enabled for GET
          if (method === "GET" && !options.skipCache && this.cache.enabled) {
            this.cache.set(cacheKey, httpResponse);
          }

          if (this.onResponseHook) {
            await this.onResponseHook(httpResponse);
          }
          return httpResponse;
        }

        // Response status is 4xx or 5xx
        const isServerErr = res.status >= 500;
        this.circuitBreaker.recordFailure(isServerErr);

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
          this.circuitBreaker.recordFailure(true);
        } else if (err.name === "AbortError" && options.signal?.aborted) {
          finalError = new NetworkError("Request was cancelled by user signal", err);
        } else if (!(err instanceof ScrymeError)) {
          finalError = new NetworkError(err.message || "Network request failed", err);
          this.circuitBreaker.recordFailure(true);
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
