import React, { createContext, useContext, useEffect, useState } from "react";
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { getScrymeV3API } from "./index";
import type {
  CartControllerGetCartParams,
  CartResponseDto,
  AddToCartDto,
  RemoveFromCartDto,
  CartControllerClearCartParams,
  CartItemDto,
  OrderResponseDto,
  CustomerResponseDto,
  AddressDto,
  CreateBookingDto,
  ServiceBookingItemDto,
  CompleteBookingDto,
  RegisterCustomerDto,
  AuthExchangeToken201,
  UpdateCustomerDto,
  ProductResponseDto,
  ServiceCatalogResponseDto,
} from "./generated/model";
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
  CustomerSessionDto,
  CustomerAuthResponseDto,
} from "./base";

/**
 * Defines a storage contract for persisting authentication tokens and session data.
 * Ideal for client-side environments (localStorage, secure storage, custom cookies).
 */
export interface StorageProvider {
  /**
   * Retrieves an item from storage.
   * @param key Unique storage key.
   */
  getItem(key: string): string | null | Promise<string | null>;
  /**
   * Stores an item in storage.
   * @param key Unique storage key.
   * @param value Stringified value to store.
   */
  setItem(key: string, value: string): void | Promise<void>;
  /**
   * Deletes an item from storage.
   * @param key Unique storage key.
   */
  removeItem(key: string): void | Promise<void>;
}

/**
 * Clean, volatile fallback in-memory storage for non-browser/server-side and testing scopes.
 */
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

/**
 * Configuration options for the stateful ScrymeClientSDK.
 */
export interface ClientSDKConfig {
  /**
   * The client ID of your Storefront application.
   */
  clientId: string;
  /**
   * The optional client secret. It is omitted on the client side for maximum security.
   */
  clientSecret?: string;
  /**
   * The unique slug of the organization to target.
   */
  orgSlug: string;
  /**
   * Optional base API URL. Defaults to "https://api.scryme.tech".
   */
  baseURL?: string;
  /**
   * Custom storage provider to persist session tokens. Defaults to localStorage where available.
   */
  storage?: StorageProvider;
}

/**
 * Represents the authentication change events emitted by the SDK.
 */
export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "INITIAL_SESSION";

/**
 * Represents the active customer session status.
 * @template TUser Custom User profile type.
 */
export interface SessionState<TUser = CustomerResponseDto> {
  /**
   * The current customer authentication JWT token.
   */
  token: string | null;
  /**
   * The deserialized customer profile details.
   */
  user: TUser | null;
  /**
   * Epoch millisecond expiration timestamp of the token.
   */
  expiresAt?: number | null;
}

/**
 * Standard client-side session structure matching better-auth.
 */
export interface ClientSessionStructure<TUser = CustomerResponseDto> {
  data: {
    session: {
      id: string;
      userId: string;
      expiresAt: Date | null;
      token: string | null;
    };
    user: TUser;
  } | null;
  isPending: boolean;
  error: any;
}

/**
 * Callback signature triggered whenever the customer authentication status changes.
 */
export type AuthStateCallback<TUser = CustomerResponseDto> = (
  event: AuthChangeEvent,
  session: SessionState<TUser>,
) => void;

const SCRYME_SESSION_TOKEN_KEY = "scryme_session_token";
const SCRYME_USER_KEY = "scryme_user";
const SCRYME_EXPIRES_AT_KEY = "scryme_expires_at";

/**
 * Stateful, reactive Client-Side SDK for Scryme V3.
 *
 * Automatically handles JWT token exchanges, reactive customer session refreshes,
 * stateful shopping cart synchronization, and real-time authentication state updates.
 *
 * @template TProduct Custom Product DTO type override. Defaults to ProductResponseDto.
 * @template TService Custom Service DTO type override. Defaults to ServiceCatalogResponseDto.
 * @template TCartItem Custom Cart Item DTO type override. Defaults to CartItemDto.
 * @template TCartResponse Custom Cart Response DTO type override. Defaults to CartResponseDto.
 * @template TUser Custom User Profile DTO type override. Defaults to CustomerResponseDto.
 * @template TSession Custom Customer Session DTO type override. Defaults to CustomerSessionDto.
 */
export class ScrymeClientSDK<
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto,
> {
  /**
   * Underlying Axios instance initialized with the customized baseUrl and automatic interceptors.
   */
  public axiosInstance: AxiosInstance;
  /**
   * Raw proxy API client exposing all standard endpoints auto-bound with the configured orgSlug.
   */
  protected api: RawAPI;

  /** Catalog operations submodule (products, services, categories, bookings, staff schedules). */
  public catalog: CatalogModule<TProduct, TService>;
  /** Traceability, split/merge, physical reconciliation, and partner wallet operations submodule. */
  public inventory: InventoryModule;
  /** Cart management, sales order orchestration, checkout processing, and payments submodule. */
  public orders: OrdersModule;
  /** Custom fields, relationships, note logging, associations, and CRM timeline submodule. */
  public crm: CRMModule;
  /** Cash flow register, sale processing, terminal synchronization, and device provision submodule. */
  public pos: POSModule;
  /** Balance sheets, Profit & Loss reports, expenses, invoices, and utility account submodule. */
  public accounting: AccountingModule;
  /** Rewards, voucher validation, point balances, and customer favorite records submodule. */
  public loyalty: LoyaltyModule;
  /** Staff members, department directories, check-in logs, and broadcast announcements submodule. */
  public members: MembersModule;
  /** Global setup parameters, organization definitions, audit trails, and tier limit submodule. */
  public admin: AdminModule;

  /**
   * Stateful Shopping Cart Submodule.
   * Leverages internal tracking and smart delta calculations for optimized storefront shopping.
   */
  public cart: {
    get<T = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<AxiosResponse<T & Record<string, any>>>;
    add(dto: AddToCartDto): Promise<AxiosResponse<void>>;
    remove(dto: RemoveFromCartDto): Promise<AxiosResponse<void>>;
    clear(params?: CartControllerClearCartParams): Promise<AxiosResponse<void>>;
    update<T = TCartResponse>(
      dto: AddToCartDto & { quantity: number },
    ): Promise<
      AxiosResponse<void> | AxiosResponse<T> | undefined
    >;
    getItems<T = TCartItem>(params?: CartControllerGetCartParams): Promise<T[]>;
    getTotals<TItem = TCartItem, TRaw = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<{
      itemsCount: number;
      items: TItem[];
      raw: TRaw;
    }>;
    mergeGuestCart<T = TCartResponse>(
      guestSessionId: string,
      customerId: string,
    ): Promise<AxiosResponse<T & Record<string, any>>>;
    checkout(params: {
      locationId: string;
      notes?: string;
      channel?: string;
    }): Promise<OrderResponseDto>;
  };

  /**
   * Storefront Customer Profile Submodule.
   * Manages the authenticated user's self-serve account, update workflows, and shipping/billing directories.
   */
  public customer: {
    getProfile<T = TUser>(): Promise<T>;
    updateProfile<T = TUser>(
      dto: UpdateCustomerDto,
    ): Promise<AxiosResponse<T>>;
    getAddresses(): Promise<AxiosResponse<AddressDto[]>>;
    addAddress(dto: AddressDto): Promise<AxiosResponse<void>>;
    auth: {
      signUp<T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>>;
      signIn<TSess = TSession, TU = TUser>(credentials: {
        email: string;
        password?: string;
      }): Promise<CustomerAuthResponseDto<TU, TSess>>;
      signOut(): Promise<void>;
      getSession<TU = TUser>(): Promise<SessionState<TU>>;
      onAuthStateChange<TU = TUser>(
        callback: AuthStateCallback<TU>,
      ): { unsubscribe(): void };
      getSessions<TSess = TSession>(): Promise<TSess[]>;
      revokeSession(id: string): Promise<AxiosResponse<void>>;
      revokeAllSessions(mode?: string): Promise<AxiosResponse<void>>;
      getCurrentSession<TU = TUser>(): Promise<TU>;
      refreshSession<TSess = TSession, TU = TUser>(): Promise<
        CustomerAuthResponseDto<TU, TSess>
      >;
      session: ClientSessionStructure<TUser>;
      useSession(): ClientSessionStructure<TUser>;
    };
  };

  /**
   * Service Bookings & Appointments Submodule.
   */
  public bookings: {
    create(dto: CreateBookingDto): Promise<AxiosResponse<void>>;
    get(id: string): Promise<AxiosResponse<ServiceBookingItemDto>>;
    list(): Promise<AxiosResponse<ServiceBookingItemDto[]>>;
    cancel(id: string): Promise<AxiosResponse<void>>;
  };

  /**
   * Authentication & Customer Session Submodule.
   */
  public auth: AuthModule & {
    signUp<T = TUser>(
      dto: RegisterCustomerDto,
    ): Promise<AxiosResponse<T>>;
    authenticate(): Promise<AuthExchangeToken201>;
    signIn<TSess = TSession, TU = TUser>(credentials: {
      email: string;
      password?: string;
    }): Promise<CustomerAuthResponseDto<TU, TSess>>;
    signOut(): Promise<void>;
    getSession<TU = TUser>(): Promise<SessionState<TU>>;
    onAuthStateChange<TU = TUser>(callback: AuthStateCallback<TU>): { unsubscribe(): void };
    getSessions<TSess = TSession>(): Promise<TSess[]>;
    revokeSession(id: string): Promise<AxiosResponse<void>>;
    revokeAllSessions(mode?: string): Promise<AxiosResponse<void>>;
    getCurrentSession<TU = TUser>(): Promise<TU>;
    refreshSession<TSess = TSession, TU = TUser>(): Promise<CustomerAuthResponseDto<TU, TSess>>;
    session: ClientSessionStructure<TUser>;
    useSession(): ClientSessionStructure<TUser>;
  };

  /**
   * Initializes the ScrymeClientSDK.
   * @param config Application and organization configuration parameters.
   */
  constructor(config: ClientSDKConfig) {
    if (!config || !config.clientId || !config.orgSlug) {
      throw new Error(
        "clientId and orgSlug are required to initialize the SDK.",
      );
    }

    let finalBaseURL = config.baseURL || "https://api.scryme.tech";
    if (
      finalBaseURL &&
      !finalBaseURL.includes("/api") &&
      !finalBaseURL.endsWith("/api")
    ) {
      finalBaseURL = finalBaseURL.replace(/\/$/, "") + "/api";
    }

    this.axiosInstance = axios.create({
      baseURL: finalBaseURL,
    });

    // Determine storage provider
    let storage: StorageProvider;
    if (config.storage) {
      storage = config.storage;
    } else if (typeof window !== "undefined" && window.localStorage) {
      storage = {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, value: string) =>
          window.localStorage.setItem(key, value),
        removeItem: (key: string) => window.localStorage.removeItem(key),
      };
    } else {
      storage = new InMemoryStorage();
    }

    // Session state
    const state: SessionState<TUser> = {
      token: null,
      user: null,
    };

    const listeners = new Set<AuthStateCallback<TUser>>();

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
              state.user = JSON.parse(storedUser) as TUser;
            } catch {
              state.user = null;
            }
          }
        }
        notify("INITIAL_SESSION");
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
              await storage.setItem(
                SCRYME_EXPIRES_AT_KEY,
                String(state.expiresAt),
              );
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
      await initPromise;

      const isAuthTokenRequest =
        req.url &&
        (req.url.endsWith("/auth/token") ||
          req.url.includes("/auth/token") ||
          req.url.includes("/customers/auth/refresh"));

      if (!isAuthTokenRequest) {
        const isExpired =
          !state.token ||
          (state.expiresAt && Date.now() >= (state.expiresAt || 0) - 30000);
        if (isExpired) {
          if (state.token) {
            try {
              await this.customer.auth.refreshSession();
            } catch (e) {
              console.error(
                "Proactive customer session refresh failed in request interceptor:",
                e,
              );
            }
          } else if (config.clientId && config.clientSecret) {
            try {
              await performExchange();
            } catch (e) {
              console.error(
                "Auto-authentication failed in request interceptor:",
                e,
              );
            }
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
        const isAuthTokenRequest =
          originalRequest &&
          originalRequest.url &&
          (originalRequest.url.endsWith("/auth/token") ||
            originalRequest.url.includes("/auth/token") ||
            originalRequest.url.includes("/customers/auth/refresh"));

        if (
          error.response &&
          error.response.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthTokenRequest
        ) {
          originalRequest._retry = true;
          try {
            if (state.token) {
              await this.customer.auth.refreshSession();
              if (state.token) {
                originalRequest.headers["Authorization"] =
                  `Bearer ${state.token}`;
              }
              return this.axiosInstance(originalRequest);
            } else if (config.clientId && config.clientSecret) {
              await performExchange();
              if (state.token) {
                originalRequest.headers["Authorization"] =
                  `Bearer ${state.token}`;
              }
              return this.axiosInstance(originalRequest);
            }
          } catch (e) {
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      },
    );

    this.api = getScrymeV3API(this.axiosInstance, config.orgSlug);

    // Build submodules using buildModule
    const baseCatalog = buildModule(this.api, config.orgSlug, catalogMapping) as any;
    this.catalog = {
      ...baseCatalog,
      getProduct: async <T = TProduct,>(
        idOrSlug: string | { id?: string; slug?: string },
        options?: AxiosRequestConfig,
      ): Promise<AxiosResponse<T>> => {
        const response = await this.catalog.getProducts<T>(undefined, options);
        const products = response.data || [];
        const product = products.find((p: any) => {
          if (typeof idOrSlug === "string") {
            return p.id === idOrSlug || p.slug === idOrSlug;
          } else {
            const { id, slug } = idOrSlug;
            if (id && p.id === id) return true;
            if (slug && p.slug === slug) return true;
            return false;
          }
        });
        if (!product) {
          const criteria = typeof idOrSlug === "string" ? idOrSlug : JSON.stringify(idOrSlug);
          throw new Error(`Product not found matching criteria: ${criteria}`);
        }
        return {
          ...response,
          data: product,
        };
      },
      getService: async <T = TService,>(
        idOrSlug: string | { id?: string; slug?: string },
        options?: AxiosRequestConfig,
      ): Promise<AxiosResponse<T>> => {
        const response = await this.catalog.getServices<T>(undefined, options);
        const services = response.data || [];
        const service = services.find((s: any) => {
          if (typeof idOrSlug === "string") {
            return s.id === idOrSlug || s.slug === idOrSlug;
          } else {
            const { id, slug } = idOrSlug;
            if (id && s.id === id) return true;
            if (slug && s.slug === slug) return true;
            return false;
          }
        });
        if (!service) {
          const criteria = typeof idOrSlug === "string" ? idOrSlug : JSON.stringify(idOrSlug);
          throw new Error(`Service not found matching criteria: ${criteria}`);
        }
        return {
          ...response,
          data: service,
        };
      },
    };
    this.inventory = buildModule(this.api, config.orgSlug, inventoryMapping);
    this.orders = buildModule(this.api, config.orgSlug, ordersMapping);
    this.crm = buildModule(this.api, config.orgSlug, crmMapping);
    this.pos = buildModule(this.api, config.orgSlug, posMapping);
    this.accounting = buildModule(this.api, config.orgSlug, accountingMapping);
    this.loyalty = buildModule(this.api, config.orgSlug, loyaltyMapping);
    this.members = buildModule(this.api, config.orgSlug, membersMapping);
    this.admin = buildModule(this.api, config.orgSlug, adminMapping);

    this.cart = {
      get: async <T = TCartResponse>(params?: CartControllerGetCartParams): Promise<AxiosResponse<T & Record<string, any>>> => {
        return this.orders.getCart(params as CartControllerGetCartParams) as any;
      },
      add: async (dto: AddToCartDto) => {
        if (!dto.customerId) {
          const session = await this.auth.getSession();
          const user = session?.user as any;
          const customerId = user?.customerId || user?.id || user?.customer?.id;
          if (!customerId) {
            throw new Error("Unauthorized: customerId is required.");
          }
          dto = { ...dto, customerId };
        }
        return this.orders.addToCart(dto);
      },
      remove: async (dto: RemoveFromCartDto) => {
        if (!dto.customerId) {
          const session = await this.auth.getSession();
          const user = session?.user as any;
          const customerId = user?.customerId || user?.id || user?.customer?.id;
          if (!customerId) {
            throw new Error("Unauthorized: customerId is required.");
          }
          dto = { ...dto, customerId };
        }
        return this.orders.removeFromCart(dto);
      },
      clear: async (params?: CartControllerClearCartParams) => {
        return this.orders.clearCart(params as CartControllerClearCartParams);
      },
      update: async <T = TCartResponse>(dto: AddToCartDto & { quantity: number }): Promise<AxiosResponse<void> | AxiosResponse<T> | undefined> => {
        if (!dto.customerId) {
          const session = await this.auth.getSession();
          const user = session?.user as any;
          const customerId = user?.customerId || user?.id || user?.customer?.id;
          if (!customerId) {
            throw new Error("Unauthorized: customerId is required.");
          }
          dto = { ...dto, customerId };
        }
        const response = await this.orders.getCart({
          sessionId: dto.sessionId || "",
        });
        const data: any = response.data;
        const items = data?.data?.items || data?.items || [];

        let existingItem: any = null;
        if (dto.productId) {
          existingItem = items.find(
            (item: any) =>
              item.productId === dto.productId &&
              (item.variantId || null) === (dto.variantId || null),
          );
        } else if (dto.serviceId) {
          existingItem = items.find(
            (item: any) => item.serviceId === dto.serviceId,
          );
        }

        if (existingItem) {
          const currentQty = existingItem.quantity || 0;
          if (dto.quantity <= 0) {
            return this.orders.removeFromCart({
              productId: dto.productId,
              variantId: dto.variantId,
              serviceId: dto.serviceId,
              sessionId: dto.sessionId || "",
              customerId: dto.customerId,
            }) as any;
          } else {
            const diff = dto.quantity - currentQty;
            if (diff !== 0) {
              return this.orders.addToCart({
                ...dto,
                quantity: diff,
              }) as any;
            }
            return response as any;
          }
        } else {
          if (dto.quantity > 0) {
            return this.orders.addToCart(dto) as any;
          }
        }
      },
      getItems: async <T = TCartItem>(params?: CartControllerGetCartParams): Promise<T[]> => {
        const res = await this.orders.getCart(params as CartControllerGetCartParams);
        const data: any = res?.data || res;
        return (data?.items || data?.data?.items || []) as T[];
      },
      getTotals: async <TItem = TCartItem, TRaw = TCartResponse>(params?: CartControllerGetCartParams): Promise<{ itemsCount: number; items: TItem[]; raw: TRaw }> => {
        const res = await this.orders.getCart(params as CartControllerGetCartParams);
        const data: any = res?.data || res;
        const items = (data?.items || data?.data?.items || []) as TItem[];
        const itemsCount = items.reduce(
          (sum: number, item: any) => sum + ((item as any).quantity || 0),
          0,
        );
        return {
          itemsCount,
          items,
          raw: data as TRaw,
        };
      },
      mergeGuestCart: async <T = TCartResponse,>(
        guestSessionId: string,
        customerId: string,
      ): Promise<AxiosResponse<T & Record<string, any>>> => {
        return this.orders.getCart({ sessionId: guestSessionId }) as any;
      },
      checkout: async (params: {
        locationId: string;
        notes?: string;
        channel?: string;
      }) => {
        const session = await this.auth.getSession();
        const user = session.user as any;
        const customerId = user?.customerId || user?.id || user?.customer?.id;
        if (!customerId)
          throw new Error("No authenticated customer found for checkout.");

        const items = await this.cart.getItems();
        if (!items || items.length === 0) {
          throw new Error("Cannot checkout an empty cart.");
        }

        const orderItems: any[] = items.map((item: any) => ({
          variantId: item.variantId || "",
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
      },
    };

    const customerAuth = {
      signUp: async <T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>> => {
        const res = await this.api.customersRegister(config.orgSlug, dto);
        if (dto.password) {
          try {
            await customerAuth.signIn({
              email: dto.email,
              password: dto.password,
            });
          } catch (e) {
            console.error("Auto-login after signup failed:", e);
          }
        }
        return res as any;
      },
      signIn: async <TSess = TSession, TU = TUser>(credentials: {
        email: string;
        password?: string;
      }): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        const res = await this.api.customersLogin(config.orgSlug, credentials as any);
        const authData: any = res.data;
        const token = authData?.accessToken || authData?.token;

        if (token) {
          state.token = token;
          state.user = (authData?.user || authData?.customer || authData?.session) as any;
          const jwtExp = getJwtExpiry(token);
          if (jwtExp) state.expiresAt = jwtExp;

          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
          if (state.user) {
            await storage.setItem(SCRYME_USER_KEY, JSON.stringify(state.user));
          }
          if (state.expiresAt) {
            await storage.setItem(SCRYME_EXPIRES_AT_KEY, String(state.expiresAt));
          }
          notify("SIGNED_IN");
        }
        return authData;
      },
      signOut: async () => {
        state.token = null;
        state.user = null;
        delete state.expiresAt;
        await storage.removeItem(SCRYME_SESSION_TOKEN_KEY);
        await storage.removeItem(SCRYME_USER_KEY);
        await storage.removeItem(SCRYME_EXPIRES_AT_KEY);
        notify("SIGNED_OUT");
      },
      getSession: async <TU = TUser>(): Promise<SessionState<TU>> => {
        await initPromise;
        return { ...state } as any;
      },
      onAuthStateChange: <TU = TUser>(callback: AuthStateCallback<TU>) => {
        listeners.add(callback as any);
        return {
          unsubscribe: () => {
            listeners.delete(callback as any);
          },
        };
      },
      getSessions: async <TSess = TSession>(): Promise<TSess[]> => {
        const res: any = await this.api.customersGetSessions(config.orgSlug);
        return (res.data?.data || res.data) as TSess[];
      },
      revokeSession: async (id: string) => {
        return this.api.customersRevokeSession(config.orgSlug, id) as any;
      },
      revokeAllSessions: async (mode?: string) => {
        return this.api.customersRevokeAllSessions(config.orgSlug, { mode: mode as any }) as any;
      },
      getCurrentSession: async <TU = TUser>(): Promise<TU> => {
        const res: any = await this.api.customersGetCurrentSession(config.orgSlug);
        return (res.data?.data || res.data) as TU;
      },
      refreshSession: async <TSess = TSession, TU = TUser>(): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        const res = await this.api.customersRefreshSession(config.orgSlug);
        const authData: any = res.data;
        const token = authData?.accessToken || authData?.token;

        if (token) {
          state.token = token;
          if (authData?.user || authData?.customer) {
            state.user = (authData.user || authData.customer) as any;
          }
          const jwtExp = getJwtExpiry(token);
          if (jwtExp) state.expiresAt = jwtExp;

          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
          if (state.user) {
            await storage.setItem(SCRYME_USER_KEY, JSON.stringify(state.user));
          }
          if (state.expiresAt) {
            await storage.setItem(SCRYME_EXPIRES_AT_KEY, String(state.expiresAt));
          }
          notify("SIGNED_IN");
        }
        return authData;
      },
      get session(): ClientSessionStructure<TUser> {
        const u = state.user;
        if (!u || !state.token) {
          return {
            data: null,
            isPending: false,
            error: null,
          };
        }
        return {
          data: {
            session: {
              id: (u as any).customerId || (u as any).id || "session-id",
              userId: (u as any).id,
              expiresAt: state.expiresAt ? new Date(state.expiresAt) : null,
              token: state.token,
            },
            user: u,
          },
          isPending: false,
          error: null,
        };
      },
      useSession(): ClientSessionStructure<TUser> {
        const [currentSession, setCurrentSession] = useState<ClientSessionStructure<TUser>>(() => {
          const u = state.user;
          if (!u || !state.token) {
            return { data: null, isPending: false, error: null };
          }
          return {
            data: {
              session: {
                id: (u as any).customerId || (u as any).id || "session-id",
                userId: (u as any).id,
                expiresAt: state.expiresAt ? new Date(state.expiresAt) : null,
                token: state.token,
              },
              user: u,
            },
            isPending: false,
            error: null,
          };
        });

        useEffect(() => {
          const update = () => {
            const u = state.user;
            if (!u || !state.token) {
              setCurrentSession({ data: null, isPending: false, error: null });
            } else {
              setCurrentSession({
                data: {
                  session: {
                    id: (u as any).customerId || (u as any).id || "session-id",
                    userId: (u as any).id,
                    expiresAt: state.expiresAt ? new Date(state.expiresAt) : null,
                    token: state.token,
                  },
                  user: u,
                },
                isPending: false,
                error: null,
              });
            }
          };

          // Trigger update initially to keep everything up to date with loaded state
          update();

          const { unsubscribe } = customerAuth.onAuthStateChange(update);
          return () => unsubscribe();
        }, []);

        return currentSession;
      },
    };

    this.customer = {
      getProfile: async <T = TUser>(): Promise<T> => {
        return this.customer.auth.getCurrentSession() as any;
      },
      updateProfile: async <T = TUser>(dto: UpdateCustomerDto): Promise<AxiosResponse<T>> => {
        const session = await this.auth.getSession();
        const user = session.user as any;
        const customerId = user?.customerId || user?.id || user?.customer?.id;
        if (!customerId) throw new Error("No authenticated customer found.");
        return this.admin.updateCustomer(customerId, dto) as any;
      },
      getAddresses: async () => {
        const session = await this.auth.getSession();
        const user = session.user as any;
        const customerId = user?.customerId || user?.id || user?.customer?.id;
        if (!customerId) throw new Error("No authenticated customer found.");
        return this.admin.getCustomerAddresses(customerId) as any;
      },
      addAddress: async (dto: AddressDto) => {
        const session = await this.auth.getSession();
        const user = session.user as any;
        const customerId = user?.customerId || user?.id || user?.customer?.id;
        if (!customerId) throw new Error("No authenticated customer found.");
        return this.admin.addCustomerAddress(customerId, dto) as any;
      },
      auth: customerAuth,
    };

    const baseAuth = buildModule(this.api, config.orgSlug, authMapping);
    this.auth = {
      ...baseAuth,
      ...customerAuth,
      authenticate: async () => {
        return performExchange();
      },
      get session() {
        return customerAuth.session;
      },
      useSession() {
        return customerAuth.useSession();
      },
    };

    this.bookings = {
      create: async (dto: CreateBookingDto) => {
        if (!dto.customerId) {
          const session = await this.auth.getSession();
          const user = session?.user as any;
          const customerId = user?.customerId || user?.id || user?.customer?.id;
          if (!customerId) {
            throw new Error("Unauthorized: customerId is required.");
          }
          dto = { ...dto, customerId };
        }
        return this.catalog.createBooking(dto) as any;
      },
      get: async (id: string) => {
        return this.catalog.getBooking(id) as any;
      },
      list: async () => {
        return this.catalog.getBookings() as any;
      },
      cancel: async (id: string) => {
        return this.catalog.updateBookingStatus(id, "CANCELLED" as any) as any;
      },
    };
  }
}

/**
 * Factory helper function to instantiate a ScrymeClientSDK.
 * Retains backward compatibility while enforcing strict ClientSDKConfig types.
 */
export function createClientSDK<
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto,
>(
  config: Partial<ClientSDKConfig> = {},
): ScrymeClientSDK<
  TProduct,
  TService,
  TCartItem,
  TCartResponse,
  TUser,
  TSession
> {
  const finalConfig = {
    clientId: config.clientId || "mock-client-id",
    orgSlug: config.orgSlug || "mock-org-slug",
    ...config,
  } as ClientSDKConfig;
  return new ScrymeClientSDK<
    TProduct,
    TService,
    TCartItem,
    TCartResponse,
    TUser,
    TSession
  >(finalConfig);
}
