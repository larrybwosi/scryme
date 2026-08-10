import React, { createContext, useContext, useEffect, useState } from "react";
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
  clientSecret?: string; // Optional on client side for security
  orgSlug: string;
  baseURL?: string;
  storage?: StorageProvider;
}

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "INITIAL_SESSION";

export interface SessionState {
  token: string | null;
  user: any | null;
  expiresAt?: number | null;
}

export type AuthStateCallback = (event: AuthChangeEvent, session: SessionState) => void;

const SCRYME_SESSION_TOKEN_KEY = "scryme_session_token";
const SCRYME_USER_KEY = "scryme_user";
const SCRYME_EXPIRES_AT_KEY = "scryme_expires_at";

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
  public cart: {
    get(params?: any): Promise<any>;
    add(dto: any): Promise<any>;
    remove(dto: any): Promise<any>;
    clear(params?: any): Promise<any>;
    update(dto: any): Promise<any>;
    getItems(params?: any): Promise<any[]>;
    getTotals(params?: any): Promise<{ itemsCount: number; items: any[]; raw: any }>;
    mergeGuestCart(guestSessionId: string, customerId: string): Promise<any>;
    checkout(params: { locationId: string; notes?: string; channel?: string }): Promise<any>;
  };

  public customer: {
    getProfile(): Promise<any>;
    updateProfile(dto: any): Promise<any>;
    getAddresses(): Promise<any>;
    addAddress(dto: any): Promise<any>;
  };

  public bookings: {
    create(dto: {
      serviceId: string;
      scheduledStartTime: string;
      scheduledEndTime?: string;
      staffIds?: string[];
      resourceIds?: string[];
      notes?: string;
    }): Promise<any>;
    get(id: string): Promise<any>;
    list(): Promise<any>;
    cancel(id: string): Promise<any>;
  };

  public auth: AuthModule & {
    signUp(dto: RegisterCustomerDto): Promise<any>;
    authenticate(): Promise<any>;
    signIn(credentials: { email: string; password?: string }): Promise<any>;
    signOut(): Promise<void>;
    getSession(): Promise<SessionState>;
    onAuthStateChange(callback: AuthStateCallback): { unsubscribe(): void };
    getSessions(): Promise<any>;
    revokeSession(id: string): Promise<any>;
    revokeAllSessions(mode?: string): Promise<any>;
    getCurrentSession(): Promise<any>;
  };

  constructor(config: ClientSDKConfig) {
    if (!config || !config.clientId || !config.orgSlug) {
      throw new Error("clientId and orgSlug are required to initialize the SDK.");
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
        const storedExpiresAt = await storage.getItem(SCRYME_EXPIRES_AT_KEY);
        if (storedToken) {
          state.token = storedToken;
          if (storedExpiresAt) {
            state.expiresAt = Number(storedExpiresAt);
          } else {
            const jwtExp = getJwtExpiry(storedToken);
            if (jwtExp) {
              state.expiresAt = jwtExp;
            } else {
              delete state.expiresAt;
            }
          }
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

    let activeAuthPromise: Promise<any> | null = null;

    const performExchange = async (): Promise<any> => {
      if (activeAuthPromise) {
        return activeAuthPromise;
      }
      activeAuthPromise = (async () => {
        try {
          const response = await this.api.authExchangeToken({
            clientId: config.clientId,
            clientSecret: config.clientSecret || "",
          });
          const tokenData = response.data?.data;
          const accessToken = tokenData?.access_token;
          const expiresIn = tokenData?.expires_in;

          if (accessToken) {
            state.token = accessToken;
            if (expiresIn) {
              state.expiresAt = Date.now() + expiresIn * 1000;
              await storage.setItem(SCRYME_EXPIRES_AT_KEY, String(state.expiresAt));
            } else {
              const jwtExp = getJwtExpiry(accessToken);
              if (jwtExp) {
                state.expiresAt = jwtExp;
                await storage.setItem(SCRYME_EXPIRES_AT_KEY, String(jwtExp));
              } else {
                delete state.expiresAt;
              }
            }
            await storage.setItem(SCRYME_SESSION_TOKEN_KEY, accessToken);
            notify("SIGNED_IN");
          }
          return response.data;
        } finally {
          activeAuthPromise = null;
        }
      })();
      return activeAuthPromise;
    };

    // Attach authorization interceptor
    this.axiosInstance.interceptors.request.use(async (req) => {
      await initPromise; // Wait for initial session state to be loaded if async

      // Check if this is a token exchange request to prevent infinite loops
      const isAuthTokenRequest = req.url && (req.url.endsWith("/auth/token") || req.url.includes("/auth/token"));

      if (!isAuthTokenRequest) {
        const isExpired = !state.token || (state.expiresAt && Date.now() >= (state.expiresAt || 0) - 30000);
        if (isExpired && config.clientId && config.clientSecret) {
          try {
            await performExchange();
          } catch (e) {
            console.error("Auto-authentication failed in request interceptor:", e);
          }
        }
      }

      if (state.token) {
        req.headers["Authorization"] = `Bearer ${state.token}`;
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
          config.clientId &&
          config.clientSecret
        ) {
          originalRequest._retry = true;
          try {
            await performExchange();
            if (state.token) {
              originalRequest.headers["Authorization"] = `Bearer ${state.token}`;
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

    this.cart = {
      get: async (params?: any) => {
        return this.orders.getCart(params || {});
      },
      add: async (dto: any) => {
        return this.orders.addToCart(dto);
      },
      remove: async (dto: any) => {
        return this.orders.removeFromCart(dto);
      },
      clear: async (params?: any) => {
        return this.orders.clearCart(params || {});
      },
      update: async (dto: any) => {
        const response = await this.orders.getCart({ sessionId: dto.sessionId });
        const data: any = response.data;
        const items = data?.data?.items || data?.items || [];

        let existingItem: any = null;
        if (dto.productId) {
          existingItem = items.find((item: any) => item.productId === dto.productId && (item.variantId || null) === (dto.variantId || null));
        } else if (dto.serviceId) {
          existingItem = items.find((item: any) => item.serviceId === dto.serviceId);
        }

        if (existingItem) {
          const currentQty = existingItem.quantity || 0;
          if (dto.quantity <= 0) {
            return this.orders.removeFromCart({
              productId: dto.productId,
              variantId: dto.variantId,
              serviceId: dto.serviceId,
              sessionId: dto.sessionId,
              customerId: dto.customerId,
            });
          } else {
            const diff = dto.quantity - currentQty;
            if (diff !== 0) {
              return this.orders.addToCart({
                ...dto,
                quantity: diff,
              });
            }
            return response;
          }
        } else {
          if (dto.quantity > 0) {
            return this.orders.addToCart(dto);
          }
        }
      },
      getItems: async (params?: any) => {
        const res = await this.orders.getCart(params || {});
        const data: any = res?.data || res;
        return data?.items || data?.data?.items || [];
      },
      getTotals: async (params?: any) => {
        const res = await this.orders.getCart(params || {});
        const data: any = res?.data || res;
        const items = data?.items || data?.data?.items || [];
        const itemsCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        return {
          itemsCount,
          items,
          raw: data,
        };
      },
      mergeGuestCart: async (guestSessionId: string, customerId: string) => {
        return this.orders.getCart({ sessionId: guestSessionId });
      },
      checkout: async (params: { locationId: string; notes?: string; channel?: string }) => {
        const session = await this.auth.getSession();
        const customerId = session.user?.customerId || session.user?.id || session.user?.customer?.id;
        if (!customerId) throw new Error("No authenticated customer found for checkout.");

        const items = await this.cart.getItems();
        if (!items || items.length === 0) {
          throw new Error("Cannot checkout an empty cart.");
        }

        const orderItems = items.map((item: any) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

        const orderResponse = await this.orders.createOrder({
          customerId,
          locationId: params.locationId,
          items: orderItems,
          notes: params.notes,
          channel: params.channel as any,
        });

        await this.cart.clear();
        return orderResponse?.data || orderResponse;
      }
    };

    this.customer = {
      getProfile: async () => {
        return this.auth.getCurrentSession();
      },
      updateProfile: async (dto: any) => {
        const session = await this.auth.getSession();
        const customerId = session.user?.customerId || session.user?.id || session.user?.customer?.id;
        if (!customerId) throw new Error("No authenticated customer found.");
        return this.admin.updateCustomer(customerId, dto);
      },
      getAddresses: async () => {
        const session = await this.auth.getSession();
        const customerId = session.user?.customerId || session.user?.id || session.user?.customer?.id;
        if (!customerId) throw new Error("No authenticated customer found.");
        return this.admin.getCustomerAddresses(customerId);
      },
      addAddress: async (dto: any) => {
        const session = await this.auth.getSession();
        const customerId = session.user?.customerId || session.user?.id || session.user?.customer?.id;
        if (!customerId) throw new Error("No authenticated customer found.");
        return this.admin.addCustomerAddress(customerId, dto);
      }
    };

    this.bookings = {
      create: async (dto: any) => {
        return this.catalog.createBooking(dto);
      },
      get: async (id: string) => {
        return this.catalog.getBooking(id);
      },
      list: async () => {
        return this.catalog.getBookings();
      },
      cancel: async (id: string) => {
        return this.catalog.updateBookingStatus(id, "CANCELLED" as any);
      }
    };

    const baseAuth = buildModule(this.api, config.orgSlug, authMapping);

    // Enrich the auth submodule with stateful and helper methods
    this.auth = {
      ...baseAuth,

      signUp: async (dto: RegisterCustomerDto) => {
        return this.api.customersRegister(config.orgSlug, dto);
      },

      authenticate: async () => {
        return performExchange();
      },

      signIn: async (credentials: { email: string; password?: string }) => {
        // Sign in using our isolated Customer Auth Microservice (Better Auth) via the exposed routes or the login fallback
        try {
          const authServiceUrl = process.env.CUSTOMER_AUTH_URL || `${this.axiosInstance.defaults.baseURL || "http://localhost:3002"}/api/customer-auth`;
          const postUrl = authServiceUrl.endsWith("/api/auth") ? `${authServiceUrl}/sign-in/email` : (authServiceUrl.endsWith("/api/customer-auth") ? `${authServiceUrl}/sign-in/email` : `${authServiceUrl}/api/auth/sign-in/email`);
          const response = await axios.post(postUrl, credentials);
          const data = response.data;

          const token = data?.session?.token || data?.token || null;
          const user = data?.user || null;

          if (token) {
            state.token = token;
            state.user = user;
            const jwtExp = getJwtExpiry(token);

            await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
            if (jwtExp) {
              state.expiresAt = jwtExp;
              await storage.setItem(SCRYME_EXPIRES_AT_KEY, String(state.expiresAt));
            } else {
              delete state.expiresAt;
              await storage.removeItem(SCRYME_EXPIRES_AT_KEY);
            }
            if (user) {
              await storage.setItem(SCRYME_USER_KEY, JSON.stringify(user));
            }

            notify("SIGNED_IN");
            return data;
          } else {
            throw new Error("No token returned");
          }
        } catch (e) {
          // Fall back to client local email login proxy
        }

        const response = await this.axiosInstance.post(`/${config.orgSlug}/customers/auth/login`, credentials);
        const data = response.data?.data || response.data;
        const token = data?.token || null;
        const user = data?.session || null;

        if (token) {
          state.token = token;
          state.user = user;
          const jwtExp = getJwtExpiry(token);

          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
          if (jwtExp) {
            state.expiresAt = jwtExp;
            await storage.setItem(SCRYME_EXPIRES_AT_KEY, String(state.expiresAt));
          } else {
            delete state.expiresAt;
            await storage.removeItem(SCRYME_EXPIRES_AT_KEY);
          }
          if (user) {
            await storage.setItem(SCRYME_USER_KEY, JSON.stringify(user));
          }

          notify("SIGNED_IN");
        }

        return data;
      },

      signOut: async () => {
        try {
          // If we have a sessionId in state.user, also attempt customer logout or clear sessions
          await this.axiosInstance.post("/auth/sign-out");
        } catch {
          // Fallback or ignore network error for local sign-out
        }

        state.token = null;
        state.user = null;
        delete state.expiresAt;

        await storage.removeItem(SCRYME_SESSION_TOKEN_KEY);
        await storage.removeItem(SCRYME_USER_KEY);
        await storage.removeItem(SCRYME_EXPIRES_AT_KEY);

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

      getSessions: async () => {
        const res = await this.axiosInstance.get(`/${config.orgSlug}/customers/auth/sessions`);
        return res.data?.data || res.data;
      },

      revokeSession: async (id: string) => {
        const res = await this.axiosInstance.delete(`/${config.orgSlug}/customers/auth/sessions/${id}`);
        return res.data?.data || res.data;
      },

      revokeAllSessions: async (mode?: string) => {
        const url = mode ? `/${config.orgSlug}/customers/auth/sessions?mode=${mode}` : `/${config.orgSlug}/customers/auth/sessions`;
        const res = await this.axiosInstance.delete(url);
        return res.data?.data || res.data;
      },

      getCurrentSession: async () => {
        const res = await this.axiosInstance.get(`/${config.orgSlug}/customers/auth/session`);
        return res.data?.data || res.data;
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

export interface AuthContextType {
  sdk: ScrymeClientSDK;
  session: SessionState;
  user: any | null;
  token: string | null;
  isLoading: boolean;
  signIn: (credentials: { email: string; password?: string }) => Promise<any>;
  signUp: (dto: RegisterCustomerDto) => Promise<any>;
  signOut: () => Promise<void>;
  cart: any | null;
  cartLoading: boolean;
  addToCart: (dto: any) => Promise<void>;
  removeFromCart: (dto: any) => Promise<void>;
  updateCartItem: (dto: any) => Promise<void>;
  clearCart: (params?: any) => Promise<void>;
  refreshCart: () => Promise<void>;

  // Customer profile & addresses states
  customerProfile: any | null;
  customerAddresses: any[];
  bookings: any[];
  bookingsLoading: boolean;

  // Convenience actions
  addAddress: (dto: any) => Promise<any>;
  updateProfile: (dto: any) => Promise<any>;
  createBooking: (dto: any) => Promise<any>;
  cancelBooking: (id: string) => Promise<any>;
  checkoutCart: (params: { locationId: string; notes?: string; channel?: string }) => Promise<any>;
  refreshProfile: () => Promise<void>;
  refreshBookings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface ScrymeAuthProviderProps {
  sdk: ScrymeClientSDK;
  children: React.ReactNode;
}

export const ScrymeAuthProvider: React.FC<ScrymeAuthProviderProps> = ({ sdk, children }) => {
  const [session, setSession] = useState<SessionState>({ token: null, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<any | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  // Customer and bookings state
  const [customerProfile, setCustomerProfile] = useState<any | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    const { unsubscribe } = sdk.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [sdk]);

  const refreshCart = async () => {
    if (!session.token) {
      setCart(null);
      return;
    }
    setCartLoading(true);
    try {
      const res = await sdk.cart.get();
      setCart(res.data?.data || res.data || null);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setCartLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!session.token) {
      setCustomerProfile(null);
      setCustomerAddresses([]);
      return;
    }
    try {
      const profile = await sdk.customer.getProfile();
      setCustomerProfile(profile?.data || profile || null);

      const addresses = await sdk.customer.getAddresses();
      setCustomerAddresses(addresses?.data || addresses || []);
    } catch (err) {
      console.error("Failed to fetch customer profile or addresses:", err);
    }
  };

  const refreshBookings = async () => {
    if (!session.token) {
      setBookingsList([]);
      return;
    }
    setBookingsLoading(true);
    try {
      const res = await sdk.bookings.list();
      setBookingsList(res?.data || res || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (session.token) {
      refreshCart();
      refreshProfile();
      refreshBookings();
    } else {
      setCart(null);
      setCustomerProfile(null);
      setCustomerAddresses([]);
      setBookingsList([]);
    }
  }, [session.token]);

  const signIn = async (credentials: { email: string; password?: string }) => {
    const res = await sdk.auth.signIn(credentials);
    return res;
  };

  const signUp = async (dto: RegisterCustomerDto) => {
    const res = await sdk.auth.signUp(dto);
    return res;
  };

  const signOut = async () => {
    await sdk.auth.signOut();
  };

  const addToCart = async (dto: any) => {
    if (!session.token) throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.add(dto);
    await refreshCart();
  };

  const removeFromCart = async (dto: any) => {
    if (!session.token) throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.remove(dto);
    await refreshCart();
  };

  const updateCartItem = async (dto: any) => {
    if (!session.token) throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.update(dto);
    await refreshCart();
  };

  const clearCart = async (params?: any) => {
    if (!session.token) throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.clear(params);
    await refreshCart();
  };

  const addAddress = async (dto: any) => {
    if (!session.token) throw new Error("Customer must be logged in to manage addresses");
    const res = await sdk.customer.addAddress(dto);
    await refreshProfile();
    return res;
  };

  const updateProfile = async (dto: any) => {
    if (!session.token) throw new Error("Customer must be logged in to update profile");
    const res = await sdk.customer.updateProfile(dto);
    await refreshProfile();
    return res;
  };

  const createBooking = async (dto: any) => {
    if (!session.token) throw new Error("Customer must be logged in to create bookings");
    const res = await sdk.bookings.create(dto);
    await refreshBookings();
    return res;
  };

  const cancelBooking = async (id: string) => {
    if (!session.token) throw new Error("Customer must be logged in to cancel bookings");
    const res = await sdk.bookings.cancel(id);
    await refreshBookings();
    return res;
  };

  const checkoutCart = async (params: { locationId: string; notes?: string; channel?: string }) => {
    if (!session.token) throw new Error("Customer must be logged in to checkout");
    const res = await sdk.cart.checkout(params);
    await refreshCart();
    await refreshBookings();
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        sdk,
        session,
        user: session.user,
        token: session.token,
        isLoading,
        signIn,
        signUp,
        signOut,
        cart,
        cartLoading,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        refreshCart,
        customerProfile,
        customerAddresses,
        bookings: bookingsList,
        bookingsLoading,
        addAddress,
        updateProfile,
        createBooking,
        cancelBooking,
        checkoutCart,
        refreshProfile,
        refreshBookings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useScrymeAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useScrymeAuth must be used within a ScrymeAuthProvider");
  }
  return context;
};
