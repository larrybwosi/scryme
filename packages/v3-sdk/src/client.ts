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
} from "./base";

export interface StorageProvider {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

class InMemoryStorage implements StorageProvider {
  private cache = new Map<string, string>();
  getItem(key: string): string | null {
    return this.cache.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.cache.set(key, value);
  }
  removeItem(key: string): void {
    this.cache.delete(key);
  }
}

export interface ClientSDKConfig {
  clientId: string;
  clientSecret: string;
  orgSlug: string;
  baseURL?: string;
  storage?: StorageProvider;
}

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "INITIAL_SESSION";

export interface SessionState {
  token: string | null;
  user: any | null;
}

export type AuthStateCallback = (event: AuthChangeEvent, session: SessionState) => void;

const SCRYME_SESSION_TOKEN_KEY = "scryme_session_token";
const SCRYME_USER_KEY = "scryme_user";

export class ScrymeClientSDK {
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
    signOut(): Promise<void>;
    getSession(): Promise<SessionState>;
    onAuthStateChange(callback: AuthStateCallback): { unsubscribe(): void };
  };

  constructor(config: ClientSDKConfig) {
    if (!config || !config.clientId || !config.clientSecret || !config.orgSlug) {
      throw new Error("clientId, clientSecret, and orgSlug are required to initialize the SDK.");
    }

    this.axiosInstance = axios.create({
      baseURL: config.baseURL || "https://api.scryme.tech",
    });

    // Determine storage provider
    let storage: StorageProvider;
    if (config.storage) {
      storage = config.storage;
    } else if (typeof window !== "undefined" && window.localStorage) {
      storage = {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
        removeItem: (key: string) => window.localStorage.removeItem(key),
      };
    } else {
      storage = new InMemoryStorage();
    }

    // Session state
    const state: SessionState = {
      token: null,
      user: null,
    };

    const listeners = new Set<AuthStateCallback>();

    const notify = (event: AuthChangeEvent) => {
      const currentState = { ...state };
      listeners.forEach((listener) => {
        try {
          listener(event, currentState);
        } catch (e) {
          console.error("Error in auth state listener:", e);
        }
      });
    };

    // Initialize and load saved session
    const initPromise = (async () => {
      try {
        const storedToken = await storage.getItem(SCRYME_SESSION_TOKEN_KEY);
        const storedUser = await storage.getItem(SCRYME_USER_KEY);
        if (storedToken) {
          state.token = storedToken;
          if (storedUser) {
            try {
              state.user = JSON.parse(storedUser);
            } catch {
              state.user = storedUser;
            }
          }
          notify("INITIAL_SESSION");
        }
      } catch (e) {
        console.error("Failed to initialize Scryme Client SDK session:", e);
      }
    })();

    // Attach authorization interceptor
    this.axiosInstance.interceptors.request.use(async (req) => {
      await initPromise; // Wait for initial session state to be loaded if async
      if (state.token) {
        req.headers["Authorization"] = `Bearer ${state.token}`;
      }
      return req;
    });

    this.api = getScrymeV3API(this.axiosInstance, config.orgSlug);

    // Build the submodules using buildModule
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

    // Enrich the auth submodule with stateful and helper methods
    this.auth = {
      ...baseAuth,

      signUp: async (dto: RegisterCustomerDto) => {
        return this.api.customersRegister(config.orgSlug, dto);
      },

      authenticate: async () => {
        const response = await this.api.authExchangeToken({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        });
        const tokenData = response.data?.data;
        const accessToken = tokenData?.access_token;
        if (accessToken) {
          state.token = accessToken;
          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, accessToken);
          notify("SIGNED_IN");
        }
        return response.data;
      },

      signIn: async (credentials: { email: string; password?: string }) => {
        const response = await this.axiosInstance.post("/auth/sign-in/email", credentials);
        const data = response.data;

        // Extract session/token and user details
        const token = data?.session?.token || data?.token || null;
        const user = data?.user || null;

        if (token) {
          state.token = token;
          state.user = user;

          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
          if (user) {
            await storage.setItem(SCRYME_USER_KEY, JSON.stringify(user));
          }

          notify("SIGNED_IN");
        }

        return data;
      },

      signOut: async () => {
        try {
          await this.axiosInstance.post("/auth/sign-out");
        } catch {
          // Fallback or ignore network error for local sign-out
        }

        state.token = null;
        state.user = null;

        await storage.removeItem(SCRYME_SESSION_TOKEN_KEY);
        await storage.removeItem(SCRYME_USER_KEY);

        notify("SIGNED_OUT");
      },

      getSession: async (): Promise<SessionState> => {
        await initPromise;
        return { ...state };
      },

      onAuthStateChange: (callback: AuthStateCallback) => {
        listeners.add(callback);
        // Immediately invoke callback with the current state if already loaded
        initPromise.then(() => {
          try {
            callback("INITIAL_SESSION", { ...state });
          } catch (e) {
            console.error("Error in immediate auth state listener call:", e);
          }
        });

        return {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        };
      },
    };
  }
}

// Retain backwards compatibility for createClientSDK function
export function createClientSDK(config: any = {}) {
  const finalConfig = {
    clientId: config.clientId || "mock-client-id",
    clientSecret: config.clientSecret || "mock-client-secret",
    orgSlug: config.orgSlug || "mock-org-slug",
    ...config,
  };
  return new ScrymeClientSDK(finalConfig);
}
