import axios, { AxiosInstance } from "axios";
import { getScrymeV3API } from "./index";
import type { RegisterCustomerDto } from "./generated/model/registerCustomerDto";

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
  baseURL?: string;
  orgSlug?: string;
  clientId?: string;
  clientSecret?: string;
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

export function createClientSDK(config: ClientSDKConfig = {}) {
  const axiosInstance: AxiosInstance = axios.create({
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

  function notify(event: AuthChangeEvent) {
    const currentState = { ...state };
    listeners.forEach((listener) => {
      try {
        listener(event, currentState);
      } catch (e) {
        console.error("Error in auth state listener:", e);
      }
    });
  }

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
  axiosInstance.interceptors.request.use(async (req) => {
    await initPromise; // Wait for initial session state to be loaded if async
    if (state.token) {
      req.headers["Authorization"] = `Bearer ${state.token}`;
    }
    return req;
  });

  const api = getScrymeV3API(axiosInstance, config.orgSlug);

  const auth = {
    signUp: async (orgSlug: string, dto: RegisterCustomerDto) => {
      const response = await api.customersRegister(orgSlug, dto);
      // Wait, let's see if customer response can be resolved and returned
      return response;
    },

    authenticate: async () => {
      if (!config.clientId || !config.clientSecret) {
        throw new Error("clientId and clientSecret must be configured to authenticate");
      }
      const response = await api.authExchangeToken({
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
      const response = await axiosInstance.post("/auth/sign-in/email", credentials);
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
        await axiosInstance.post("/auth/sign-out");
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

  return {
    api,
    auth,
    axiosInstance,
  };
}
