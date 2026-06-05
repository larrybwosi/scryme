import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';

export interface ScrymeConfig {
  baseURL?: string;
  clientId?: string;
  clientSecret?: string;
  orgSlug?: string;
  apiKey?: string; // For V2 backward compatibility
  onUnauthorized?: () => void;
  enableLogging?: boolean;
  logger?: (message: string, data?: any) => void;
  retryConfig?: {
    retries?: number;
    retryDelay?: (retryCount: number) => number;
  };
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

export class ScrymeClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private config: ScrymeConfig;
  private isAuthenticating: Promise<string | null> | null = null;

  constructor(config: ScrymeConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.scryme.app/api',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
        ...(config.orgSlug ? { 'x-org-slug': config.orgSlug } : {}),
      },
    });

    // Configure retries
    axiosRetry(this.client, {
      retries: config.retryConfig?.retries ?? 3,
      retryDelay: config.retryConfig?.retryDelay ?? axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Logging Interceptor
    this.client.interceptors.request.use((config) => {
      if (this.config.enableLogging) {
        const logger = this.config.logger || console.log;
        logger(`[Scryme SDK] Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          headers: config.headers,
        });
      }
      return config;
    });

    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      // Skip auth for token exchange
      if (config.url?.endsWith('/v3/auth/token')) {
        return config;
      }

      // If we have V3 credentials and no token, or token is expired (logic can be added)
      if (this.config.clientId && this.config.clientSecret && !this.accessToken) {
        await this.authenticate();
      }

      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.enableLogging) {
          const logger = this.config.logger || console.log;
          logger(`[Scryme SDK] Response: ${response.status} ${response.config.url}`, {
            data: response.data,
          });
        }
        return response;
      },
      async (error: any) => {
        const originalRequest = error.config;

        if (this.config.enableLogging) {
          const logger = this.config.logger || console.error;
          logger(`[Scryme SDK] Error: ${error.response?.status || 'Network Error'} ${originalRequest?.url}`, {
            message: error.message,
            response: error.response?.data,
          });
        }

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (this.config.onUnauthorized) {
            this.config.onUnauthorized();
          }

          if (this.config.clientId && this.config.clientSecret) {
            originalRequest._retry = true;
            const token = await this.authenticate();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async authenticate(): Promise<string | null> {
    if (this.isAuthenticating) {
      return this.isAuthenticating;
    }

    this.isAuthenticating = (async () => {
      try {
        const response = await axios.post<TokenResponse>(
          `${this.client.defaults.baseURL}/v3/auth/token`,
          {
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
          }
        );
        this.accessToken = response.data.accessToken;
        return this.accessToken;
      } catch (error) {
        console.error('Failed to authenticate with Scryme V3 API', error);
        return null;
      } finally {
        this.isAuthenticating = null;
      }
    })();

    return this.isAuthenticating;
  }

  public setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
    this.client.defaults.headers.common['x-api-key'] = apiKey;
  }

  public setOrgSlug(orgSlug: string) {
    this.config.orgSlug = orgSlug;
    this.client.defaults.headers.common['x-org-slug'] = orgSlug;
  }

  public setBaseURL(url: string) {
    this.config.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  public getBaseURL() {
    return this.client.defaults.baseURL;
  }

  public async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  public getOrgSlug(): string | undefined {
    return this.config.orgSlug;
  }
}
