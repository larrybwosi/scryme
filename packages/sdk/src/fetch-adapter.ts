/**
 * Axios-compatible Bridge Adapter over Universal HttpClient
 * This allows generated Orval API code to execute over universal native fetch
 * while exposing AxiosRequestConfig / AxiosResponse signatures with zero runtime Axios dependency.
 */

import { HttpClient, RequestOptions, HttpResponse } from "./http";

export interface AxiosCompatibleRequestConfig extends RequestOptions {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: any;
  params?: any;
  data?: any;
  signal?: AbortSignal;
}

export interface AxiosCompatibleResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
  request?: any;
}

export interface AxiosCompatibleInstance {
  (config: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse>;
  (url: string, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse>;
  defaults: {
    headers: {
      common: Record<string, string>;
      [key: string]: any;
    };
    baseURL?: string;
  };
  interceptors: {
    request: {
      use: (
        onFulfilled?: (config: AxiosCompatibleRequestConfig) => any,
        onRejected?: (error: any) => any
      ) => number;
      eject: (id: number) => void;
    };
    response: {
      use: (
        onFulfilled?: (response: AxiosCompatibleResponse) => any,
        onRejected?: (error: any) => any
      ) => number;
      eject: (id: number) => void;
    };
  };
  get<T = any>(url: string, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse<T>>;
  delete<T = any>(url: string, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse<T>>;
  head<T = any>(url: string, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse<T>>;
  options<T = any>(url: string, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse<T>>;
  post<T = any>(url: string, data?: any, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse<T>>;
  put<T = any>(url: string, data?: any, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse<T>>;
  httpClient: HttpClient;
}

export function createAxiosCompatibleInstance(client: HttpClient): AxiosCompatibleInstance {
  type RequestInterceptor = {
    onFulfilled?: (config: AxiosCompatibleRequestConfig) => any;
    onRejected?: (error: any) => any;
  };
  type ResponseInterceptor = {
    onFulfilled?: (response: AxiosCompatibleResponse) => any;
    onRejected?: (error: any) => any;
  };

  const requestInterceptors: (RequestInterceptor | null)[] = [];
  const responseInterceptors: (ResponseInterceptor | null)[] = [];

  const defaults = {
    headers: {
      common: { ...client.defaultHeaders },
    },
    baseURL: client.baseUrl,
  };

  const executeRequest = async (configOrUrl: string | AxiosCompatibleRequestConfig, maybeConfig?: AxiosCompatibleRequestConfig): Promise<AxiosCompatibleResponse> => {
    let finalConfig: AxiosCompatibleRequestConfig =
      typeof configOrUrl === "string"
        ? { ...(maybeConfig || {}), url: configOrUrl }
        : { ...configOrUrl };

    // Apply defaults
    finalConfig.headers = {
      ...defaults.headers.common,
      ...(finalConfig.headers || {}),
    };

    // Run request interceptors
    for (const interceptor of requestInterceptors) {
      if (interceptor?.onFulfilled) {
        try {
          finalConfig = await interceptor.onFulfilled(finalConfig);
        } catch (err) {
          if (interceptor.onRejected) {
            return await interceptor.onRejected(err);
          }
          throw err;
        }
      }
    }

    const method = (finalConfig.method?.toUpperCase() || "GET") as any;
    const url = finalConfig.url || "";

    try {
      const res = await client.request(method, url, {
        headers: finalConfig.headers,
        params: finalConfig.params,
        data: finalConfig.data,
        signal: finalConfig.signal,
        timeout: finalConfig.timeout,
      });

      let responseWrapper: AxiosCompatibleResponse = {
        data: res.data,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        config: finalConfig,
      };

      // Run response interceptors
      for (const interceptor of responseInterceptors) {
        if (interceptor?.onFulfilled) {
          responseWrapper = await interceptor.onFulfilled(responseWrapper);
        }
      }

      return responseWrapper;
    } catch (error: any) {
      let handledError = error;
      for (const interceptor of responseInterceptors) {
        if (interceptor?.onRejected) {
          try {
            return await interceptor.onRejected(handledError);
          } catch (rejectedErr) {
            handledError = rejectedErr;
          }
        }
      }
      throw handledError;
    }
  };

  const instance: any = (configOrUrl: any, maybeConfig?: any) => executeRequest(configOrUrl, maybeConfig);

  instance.defaults = defaults;
  instance.httpClient = client;

  instance.interceptors = {
    request: {
      use: (onFulfilled?: any, onRejected?: any) => {
        requestInterceptors.push({ onFulfilled, onRejected });
        return requestInterceptors.length - 1;
      },
      eject: (id: number) => {
        if (requestInterceptors[id]) {
          requestInterceptors[id] = null;
        }
      },
    },
    response: {
      use: (onFulfilled?: any, onRejected?: any) => {
        responseInterceptors.push({ onFulfilled, onRejected });
        return responseInterceptors.length - 1;
      },
      eject: (id: number) => {
        if (responseInterceptors[id]) {
          responseInterceptors[id] = null;
        }
      },
    },
  };

  instance.get = (url: string, config?: any) => executeRequest(url, { ...config, method: "GET" });
  instance.delete = (url: string, config?: any) => executeRequest(url, { ...config, method: "DELETE" });
  instance.head = (url: string, config?: any) => executeRequest(url, { ...config, method: "HEAD" });
  instance.options = (url: string, config?: any) => executeRequest(url, { ...config, method: "OPTIONS" });
  instance.post = (url: string, data?: any, config?: any) => executeRequest(url, { ...config, data, method: "POST" });
  instance.put = (url: string, data?: any, config?: any) => executeRequest(url, { ...config, data, method: "PUT" });
  instance.patch = (url: string, data?: any, config?: any) => executeRequest(url, { ...config, data, method: "PATCH" });

  return instance as AxiosCompatibleInstance;
}
