import axios, { AxiosInstance } from "axios";
import { getScrymeV3API } from "./index";
import type { RegisterCustomerDto } from "./generated/model/registerCustomerDto";
import {
  RawAPI,
  buildModule,
  catalogMapping,
  authMapping,
  inventoryMapping,
  ordersMapping,
  crmMapping,
  posMapping,
  accountingMapping,
  loyaltyMapping,
  membersMapping,
  adminMapping,
  CatalogModule,
  AuthModule,
  InventoryModule,
  OrdersModule,
  CRMModule,
  POSModule,
  AccountingModule,
  LoyaltyModule,
  MembersModule,
  AdminModule,
  getJwtExpiry,
} from "./base";

export interface ServerSDKConfig {
  clientId: string;
  clientSecret: string;
  orgSlug: string;
  baseURL?: string;
  token?: string;
  apiKey?: string;
}

export class ScrymeServerSDK {
  public axiosInstance: AxiosInstance;
  public api: RawAPI;

  public catalog: CatalogModule;
  public inventory: InventoryModule;
  public orders: OrdersModule;
  public crm: CRMModule;
  public pos: POSModule;
  public accounting: AccountingModule;
  public loyalty: LoyaltyModule;
  public members: MembersModule;
  public admin: AdminModule;

  public auth: AuthModule & {
    signUp(dto: RegisterCustomerDto): Promise<any>;
    authenticate(): Promise<any>;
    signIn(credentials: { email: string; password?: string }): Promise<any>;
    getCurrentSession(): Promise<any>;
  };

  private token: string | null = null;
  private expiresAt: number | null = null;
  private activeAuthPromise: Promise<any> | null = null;

  constructor(config: ServerSDKConfig) {
    if (!config || !config.clientId || !config.clientSecret || !config.orgSlug) {
      throw new Error("clientId, clientSecret, and orgSlug are required to initialize the SDK.");
    }

    this.axiosInstance = axios.create({
      baseURL: config.baseURL || "https://api.scryme.tech",
    });

    // Attach token or apiKey if present
    if (config.token) {
      this.token = config.token;
      this.expiresAt = getJwtExpiry(config.token);
      this.axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${config.token}`;
    }

    if (config.apiKey) {
      this.axiosInstance.defaults.headers.common["x-api-key"] = config.apiKey;
    }

    const performExchange = async (): Promise<any> => {
      if (this.activeAuthPromise) {
        return this.activeAuthPromise;
      }
      this.activeAuthPromise = (async () => {
        try {
          const response = await this.api.authExchangeToken({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
          });
          const tokenData = response.data?.data;
          const accessToken = tokenData?.access_token;
          const expiresIn = tokenData?.expires_in;

          if (accessToken) {
            this.token = accessToken;
            if (expiresIn) {
              this.expiresAt = Date.now() + expiresIn * 1000;
            } else {
              this.expiresAt = getJwtExpiry(accessToken);
            }
            this.axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          }
          return response.data;
        } finally {
          this.activeAuthPromise = null;
        }
      })();
      return this.activeAuthPromise;
    };

    // Attach authorization interceptor
    this.axiosInstance.interceptors.request.use(async (req) => {
      // Check if this is a token exchange request or if apiKey is present to bypass token exchange
      const isAuthTokenRequest = req.url && (req.url.endsWith("/auth/token") || req.url.includes("/auth/token"));

      if (!isAuthTokenRequest && !config.apiKey) {
        const isExpired = !this.token || (this.expiresAt && Date.now() >= this.expiresAt - 30000);
        if (isExpired && config.clientId && config.clientSecret) {
          try {
            await performExchange();
          } catch (e) {
            console.error("Auto-authentication failed in request interceptor:", e);
          }
        }
      }

      if (this.token) {
        req.headers["Authorization"] = `Bearer ${this.token}`;
      }
      return req;
    });

    // Attach response interceptor for 401 retries
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isAuthTokenRequest = originalRequest && originalRequest.url && (originalRequest.url.endsWith("/auth/token") || originalRequest.url.includes("/auth/token"));

        if (
          error.response &&
          error.response.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthTokenRequest &&
          !config.apiKey &&
          config.clientId &&
          config.clientSecret
        ) {
          originalRequest._retry = true;
          try {
            await performExchange();
            if (this.token) {
              originalRequest.headers["Authorization"] = `Bearer ${this.token}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (e) {
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    this.api = getScrymeV3API(this.axiosInstance, config.orgSlug);

    // Build submodules
    this.catalog = buildModule(this.api, config.orgSlug, catalogMapping);
    this.inventory = buildModule(this.api, config.orgSlug, inventoryMapping);
    this.orders = buildModule(this.api, config.orgSlug, ordersMapping);
    this.crm = buildModule(this.api, config.orgSlug, crmMapping);
    this.pos = buildModule(this.api, config.orgSlug, posMapping);
    this.accounting = buildModule(this.api, config.orgSlug, accountingMapping);
    this.loyalty = buildModule(this.api, config.orgSlug, loyaltyMapping);
    this.members = buildModule(this.api, config.orgSlug, membersMapping);
    this.admin = buildModule(this.api, config.orgSlug, adminMapping);

    const baseAuth = buildModule(this.api, config.orgSlug, authMapping);

    this.auth = {
      ...baseAuth,

      signUp: async (dto: RegisterCustomerDto) => {
        return this.api.customersRegister(config.orgSlug, dto);
      },

      authenticate: async () => {
        return performExchange();
      },

      signIn: async (credentials: { email: string; password?: string }) => {
        const response = await this.axiosInstance.post("/auth/sign-in/email", credentials);
        const data = response.data;
        const token = data?.session?.token || data?.token || null;
        if (token) {
          this.token = token;
          this.expiresAt = getJwtExpiry(token);
          this.axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        return data;
      },

      getCurrentSession: async () => {
        const response = await this.axiosInstance.get(`/${config.orgSlug}/customers/auth/session`);
        return response.data?.data || response.data;
      },
    };
  }
}

// Retain backwards compatibility for createServerSDK function
export function createServerSDK(config: any = {}) {
  const finalConfig = {
    clientId: config.clientId || "mock-client-id",
    clientSecret: config.clientSecret || "mock-client-secret",
    orgSlug: config.orgSlug || "mock-org-slug",
    ...config,
  };
  return new ScrymeServerSDK(finalConfig);
}
