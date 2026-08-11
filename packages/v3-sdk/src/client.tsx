import React, { createContext, useContext, useEffect, useState } from "react";
import axios, { AxiosInstance, AxiosResponse } from "axios";
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
  TSession = CustomerSessionDto
> {
  /**
   * Underlying Axios instance initialized with the customized baseUrl and automatic interceptors.
   */
  public axiosInstance: AxiosInstance;
  /**
   * Raw proxy API client exposing all standard endpoints auto-bound with the configured orgSlug.
   */
  public api: RawAPI;

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
    /**
     * Retrieves the current customer shopping cart.
     * @param params Query arguments containing optional guest session identifier.
     */
    get<T = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<AxiosResponse<T & Record<string, any>>>;
    /**
     * Adds a quantity of a specific product/variant or service to the cart.
     * @param dto Item, variant, and quantity details.
     */
    add(dto: AddToCartDto): Promise<AxiosResponse<void>>;
    /**
     * Removes an item completely from the cart.
     * @param dto Item identifier details.
     */
    remove(dto: RemoveFromCartDto): Promise<AxiosResponse<void>>;
    /**
     * Clears all items from the current active shopping cart.
     * @param params Query parameters containing optional session identifier.
     */
    clear(params?: CartControllerClearCartParams): Promise<AxiosResponse<void>>;
    /**
     * Dynamically updates the item quantity, performing smart delta additions or removals as needed.
     * @param dto Item details and the target final quantity.
     */
    update<T = TCartResponse>(
      dto: AddToCartDto & { quantity: number },
    ): Promise<
      AxiosResponse<void> | AxiosResponse<T> | undefined
    >;
    /**
     * Retrieves a flat array of all compiled items currently in the cart.
     * @param params Query parameters containing optional session identifier.
     */
    getItems<T = TCartItem>(params?: CartControllerGetCartParams): Promise<T[]>;
    /**
     * Computes totals including total count of items and provides raw un-destructured cart response details.
     * @param params Query parameters containing optional session identifier.
     */
    getTotals<TItem = TCartItem, TRaw = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<{
      itemsCount: number;
      items: TItem[];
      raw: TRaw;
    }>;
    /**
     * Merges a temporary guest-user cart into a registered customer's permanent cart.
     * @param guestSessionId Temporary session token/cookie of the anonymous cart.
     * @param customerId Registered customer database identifier.
     */
    mergeGuestCart<T = TCartResponse>(
      guestSessionId: string,
      customerId: string,
    ): Promise<AxiosResponse<T & Record<string, any>>>;
    /**
     * Standard storefront checkout workflow that converts active cart items into a sales order.
     * @param params Checkout configurations (locationId, customer instructions/notes, channel).
     */
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
    /**
     * Fetches the current authenticated customer's profile.
     */
    getProfile<T = TUser>(): Promise<T>;
    /**
     * Updates the authenticated customer's profile attributes.
     * @param dto Customer fields to update.
     */
    updateProfile<T = TUser>(
      dto: UpdateCustomerDto,
    ): Promise<AxiosResponse<T>>;
    /**
     * Retrieves the address directory associated with the customer.
     */
    getAddresses(): Promise<AxiosResponse<AddressDto[]>>;
    /**
     * Adds a shipping/billing address to the customer's directory.
     * @param dto New address specifications.
     */
    addAddress(dto: AddressDto): Promise<AxiosResponse<void>>;
  };

  /**
   * Service Bookings & Appointments Submodule.
   * Handles booking creation, individual booking details lookup, appointment history listing, and cancellations.
   */
  public bookings: {
    /**
     * Creates a new booking reservation.
     * @param dto Reservation details including timing, service, and resource requirements.
     */
    create(dto: CreateBookingDto): Promise<AxiosResponse<void>>;
    /**
     * Looks up detailed configuration and status information for a specific booking.
     * @param id Database booking identifier.
     */
    get(id: string): Promise<AxiosResponse<ServiceBookingItemDto>>;
    /**
     * Lists the customer's booking history and upcoming reservations.
     */
    list(): Promise<AxiosResponse<ServiceBookingItemDto[]>>;
    /**
     * Cancels an active reservation, marking its status as CANCELLED.
     * @param id Database booking identifier.
     */
    cancel(id: string): Promise<AxiosResponse<void>>;
  };

  /**
   * Authentication & Customer Session Submodule.
   * Handles user sign-up, sign-in, token validation, event-driven state listeners, active sessions listing, and session revocation.
   */
  public auth: AuthModule & {
    /**
     * Registers a new customer account.
     * @param dto Sign-up information including email, credentials, and profile name.
     */
    signUp<T = TUser>(
      dto: RegisterCustomerDto,
    ): Promise<AxiosResponse<T>>;
    /**
     * Programmatically performs client credentials exchange using the configured application client credentials.
     */
    authenticate(): Promise<AuthExchangeToken201>;
    /**
     * Logs in a storefront customer using email and password credentials.
     * @param credentials Email and optional password.
     */
    signIn<TSess = TSession, TU = TUser>(credentials: {
      email: string;
      password?: string;
    }): Promise<CustomerAuthResponseDto<TU, TSess>>;
    /**
     * Signs out the active customer, purging local persistent storage tokens and notifying state listeners.
     */
    signOut(): Promise<void>;
    /**
     * Returns the active local session state snapshot.
     */
    getSession<TU = TUser>(): Promise<SessionState<TU>>;
    /**
     * Registers a listener to receive real-time updates when customer authentication status changes.
     * @param callback State callback function.
     * @returns An unsubscribe helper.
     */
    onAuthStateChange<TU = TUser>(callback: AuthStateCallback<TU>): { unsubscribe(): void };
    /**
     * Lists all active concurrent sessions logged in for this customer.
     */
    getSessions<TSess = TSession>(): Promise<TSess[]>;
    /**
     * Revokes and invalidates a specific logged-in customer session.
     * @param id Session database identifier.
     */
    revokeSession(id: string): Promise<AxiosResponse<void>>;
    /**
     * Revokes active concurrent customer sessions.
     * @param mode Optional configuration parameter (e.g. 'all', 'others').
     */
    revokeAllSessions(mode?: string): Promise<AxiosResponse<void>>;
    /**
     * Fetches current server-synchronized customer session metadata.
     */
    getCurrentSession<TU = TUser>(): Promise<TU>;
    /**
     * Performs a proactive or reactive customer token refresh cycle.
     */
    refreshSession<TSess = TSession, TU = TUser>(): Promise<CustomerAuthResponseDto<TU, TSess>>;
    /**
     * Swaps a valid Zitadel OIDC token for an active high-performance local customer session.
     * @param zitadelToken Valid Zitadel OIDC ID/access token.
     */
    swapZitadel<TSess = TSession, TU = TUser>(
      zitadelToken: string,
    ): Promise<CustomerAuthResponseDto<TU, TSess>>;
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
      await initPromise; // Wait for initial session state to be loaded if async

      // Check if this is a token exchange request or refresh to prevent infinite loops
      const isAuthTokenRequest =
        req.url &&
        (req.url.endsWith("/auth/token") ||
          req.url.includes("/auth/token") ||
          req.url.includes("/customers/auth/refresh") ||
          req.url.includes("/customers/auth/swap-zitadel"));

      if (!isAuthTokenRequest) {
        const isExpired =
          !state.token ||
          (state.expiresAt && Date.now() >= (state.expiresAt || 0) - 30000);
        if (isExpired) {
          if (state.token) {
            // Customer session expired, try refreshing
            try {
              await this.auth.refreshSession();
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
            originalRequest.url.includes("/customers/auth/refresh") ||
            originalRequest.url.includes("/customers/auth/swap-zitadel"));

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
              // Customer token is active, but got a 401. Try refreshing.
              await this.auth.refreshSession();
              if (state.token) {
                originalRequest.headers["Authorization"] =
                  `Bearer ${state.token}`;
              }
              return this.axiosInstance(originalRequest);
            } else if (config.clientId && config.clientSecret) {
              // App credentials token expired or invalid, try client exchange
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

    // Build the submodules using buildModule
    this.catalog = buildModule(this.api, config.orgSlug, catalogMapping) as any;
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
        return this.orders.addToCart(dto);
      },
      remove: async (dto: RemoveFromCartDto) => {
        return this.orders.removeFromCart(dto);
      },
      clear: async (params?: CartControllerClearCartParams) => {
        return this.orders.clearCart(params as CartControllerClearCartParams);
      },
      update: async <T = TCartResponse>(dto: AddToCartDto & { quantity: number }): Promise<AxiosResponse<void> | AxiosResponse<T> | undefined> => {
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
      mergeGuestCart: async <T = TCartResponse>(guestSessionId: string, customerId: string): Promise<AxiosResponse<T & Record<string, any>>> => {
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

    this.customer = {
      getProfile: async <T = TUser>(): Promise<T> => {
        return this.auth.getCurrentSession() as any;
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
        return this.admin.addCustomerAddress(customerId, dto);
      },
    };

    this.bookings = {
      create: async (dto: CreateBookingDto) => {
        return this.catalog.createBooking(dto);
      },
      get: async (id: string) => {
        return this.catalog.getBooking(id) as any;
      },
      list: async () => {
        return this.catalog.getBookings() as any;
      },
      cancel: async (id: string) => {
        return this.catalog.updateBookingStatus(id, "CANCELLED" as any);
      },
    };

    const baseAuth = buildModule(this.api, config.orgSlug, authMapping);

    // Enrich the auth submodule with stateful and helper methods
    this.auth = {
      ...baseAuth,

      signUp: async <T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>> => {
        return this.api.customersRegister(config.orgSlug, dto) as any;
      },

      authenticate: async () => {
        return performExchange();
      },

      signIn: async <TSess = TSession, TU = TUser>(credentials: { email: string; password?: string }): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        // Sign in using our isolated Customer Auth Microservice (Better Auth) via the exposed routes or the login fallback
        try {
          const authServiceUrl =
            process.env.CUSTOMER_AUTH_URL ||
            `${this.axiosInstance.defaults.baseURL || "http://localhost:3002"}/api/customer-auth`;
          const postUrl = authServiceUrl.endsWith("/api/auth")
            ? `${authServiceUrl}/sign-in/email`
            : authServiceUrl.endsWith("/api/customer-auth")
              ? `${authServiceUrl}/sign-in/email`
              : `${authServiceUrl}/api/auth/sign-in/email`;
          const response = await axios.post(postUrl, credentials);
          const data = response.data;

          const token = data?.session?.token || data?.token || null;
          const user = data?.user || null;

          if (token) {
            state.token = token;
            state.user = user as any;
            const jwtExp = getJwtExpiry(token);

            await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
            if (jwtExp) {
              state.expiresAt = jwtExp;
              await storage.setItem(
                SCRYME_EXPIRES_AT_KEY,
                String(state.expiresAt),
              );
            } else {
              delete state.expiresAt;
              await storage.removeItem(SCRYME_EXPIRES_AT_KEY);
            }
            if (user) {
              await storage.setItem(SCRYME_USER_KEY, JSON.stringify(user));
            }

            notify("SIGNED_IN");
            return data as any;
          } else {
            throw new Error("No token returned");
          }
        } catch (e) {
          // Fall back to client local email login proxy
        }

        const response = await this.axiosInstance.post(
          `/${config.orgSlug}/customers/auth/login`,
          credentials,
        );
        const data = response.data?.data || response.data;
        const token = data?.token || null;
        const user = data?.session || null;

        if (token) {
          state.token = token;
          state.user = user as any;
          const jwtExp = getJwtExpiry(token);

          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
          if (jwtExp) {
            state.expiresAt = jwtExp;
            await storage.setItem(
              SCRYME_EXPIRES_AT_KEY,
              String(state.expiresAt),
            );
          } else {
            delete state.expiresAt;
            await storage.removeItem(SCRYME_EXPIRES_AT_KEY);
          }
          if (user) {
            await storage.setItem(SCRYME_USER_KEY, JSON.stringify(user));
          }

          notify("SIGNED_IN");
        }

        return data as any;
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

      getSession: async <TU = TUser>(): Promise<SessionState<TU>> => {
        await initPromise;
        return { ...state } as any;
      },

      onAuthStateChange: <TU = TUser>(callback: AuthStateCallback<TU>) => {
        listeners.add(callback as any);
        // Immediately invoke callback with the current state if already loaded
        initPromise.then(() => {
          try {
            callback("INITIAL_SESSION", { ...state } as any);
          } catch (e) {
            console.error("Error in immediate auth state listener call:", e);
          }
        });

        return {
          unsubscribe: () => {
            listeners.delete(callback as any);
          },
        };
      },

      getSessions: async <TSess = TSession>(): Promise<TSess[]> => {
        const res = await this.axiosInstance.get(
          `/${config.orgSlug}/customers/auth/sessions`,
        );
        return (res.data?.data || res.data) as TSess[];
      },

      revokeSession: async (id: string) => {
        const res = await this.axiosInstance.delete(
          `/${config.orgSlug}/customers/auth/sessions/${id}`,
        );
        return res.data?.data || res.data;
      },

      revokeAllSessions: async (mode?: string) => {
        const url = mode
          ? `/${config.orgSlug}/customers/auth/sessions?mode=${mode}`
          : `/${config.orgSlug}/customers/auth/sessions`;
        const res = await this.axiosInstance.delete(url);
        return res.data?.data || res.data;
      },

      getCurrentSession: async <TU = TUser>(): Promise<TU> => {
        const res = await this.axiosInstance.get(
          `/${config.orgSlug}/customers/auth/session`,
        );
        return (res.data?.data || res.data) as TU;
      },

      refreshSession: async <TSess = TSession, TU = TUser>(): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        const response = await this.axiosInstance.post(
          `/${config.orgSlug}/customers/auth/refresh`,
        );
        const data = response.data?.data || response.data;
        const token = data?.token || null;
        const user = data?.session || null;

        if (token) {
          state.token = token;
          state.user = user as any;
          const jwtExp = getJwtExpiry(token);

          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
          if (jwtExp) {
            state.expiresAt = jwtExp;
            await storage.setItem(
              SCRYME_EXPIRES_AT_KEY,
              String(state.expiresAt),
            );
          } else {
            delete state.expiresAt;
            await storage.removeItem(SCRYME_EXPIRES_AT_KEY);
          }
          if (user) {
            await storage.setItem(SCRYME_USER_KEY, JSON.stringify(user));
          }

          notify("SIGNED_IN");
        }

        return data as any;
      },

      swapZitadel: async <TSess = TSession, TU = TUser>(zitadelToken: string): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        const response = await this.axiosInstance.post(
          `/${config.orgSlug}/customers/auth/swap-zitadel`,
          { zitadelToken },
        );
        const data = response.data?.data || response.data;
        const token = data?.token || null;
        const user = data?.session || null;

        if (token) {
          state.token = token;
          state.user = user as any;
          const jwtExp = getJwtExpiry(token);

          await storage.setItem(SCRYME_SESSION_TOKEN_KEY, token);
          if (jwtExp) {
            state.expiresAt = jwtExp;
            await storage.setItem(
              SCRYME_EXPIRES_AT_KEY,
              String(state.expiresAt),
            );
          } else {
            delete state.expiresAt;
            await storage.removeItem(SCRYME_EXPIRES_AT_KEY);
          }
          if (user) {
            await storage.setItem(SCRYME_USER_KEY, JSON.stringify(user));
          }

          notify("SIGNED_IN");
        }

        return data as any;
      },
    };
  }
}

/**
 * Factory helper function to instantiate a ScrymeClientSDK.
 * Retains backward compatibility while enforcing strict ClientSDKConfig types.
 *
 * @param config Client configuration overrides.
 */
export function createClientSDK<
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto
>(config: Partial<ClientSDKConfig> = {}): ScrymeClientSDK<TProduct, TService, TCartItem, TCartResponse, TUser, TSession> {
  const finalConfig = {
    clientId: config.clientId || "mock-client-id",
    clientSecret: config.clientSecret || "mock-client-secret",
    orgSlug: config.orgSlug || "mock-org-slug",
    ...config,
  } as ClientSDKConfig;
  return new ScrymeClientSDK<TProduct, TService, TCartItem, TCartResponse, TUser, TSession>(finalConfig);
}

/**
 * React context value type structure representing storefront authentication states and cart actions.
 */
export interface AuthContextType<
  TUser = CustomerResponseDto,
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TSession = CustomerSessionDto
> {
  /**
   * The underlying active stateful ScrymeClientSDK instance.
   */
  sdk: ScrymeClientSDK<TProduct, TService, TCartItem, TCartResponse, TUser, TSession>;
  /**
   * Current active customer session state (token, user profile, exp).
   */
  session: SessionState<TUser>;
  /**
   * Fast-access reference to the signed-in user object.
   */
  user: TUser | null;
  /**
   * Fast-access reference to the active customer bearer token.
   */
  token: string | null;
  /**
   * Indicates whether the initial session hydration from Storage is in progress.
   */
  isLoading: boolean;
  /**
   * Performs credentials-based sign-in for the customer.
   */
  signIn: (credentials: {
    email: string;
    password?: string;
  }) => Promise<CustomerAuthResponseDto<TUser, TSession>>;
  /**
   * Registers a brand-new customer account.
   */
  signUp: (
    dto: RegisterCustomerDto,
  ) => Promise<AxiosResponse<TUser>>;
  /**
   * Invalidates active tokens and logs out the storefront customer.
   */
  signOut: () => Promise<void>;
  /**
   * Fast-access state containing the current storefront shopping cart.
   */
  cart: TCartResponse | null;
  /**
   * Indicates whether the cart is currently performing a network update/fetch.
   */
  cartLoading: boolean;
  /**
   * Adds a quantity of a specific item to the cart.
   */
  addToCart: (dto: AddToCartDto) => Promise<void>;
  /**
   * Removes an item from the cart.
   */
  removeFromCart: (dto: RemoveFromCartDto) => Promise<void>;
  /**
   * Modifies an item's exact quantity in the cart with smart delta additions or removals.
   */
  updateCartItem: (dto: AddToCartDto & { quantity: number }) => Promise<void>;
  /**
   * Removes all items from the active storefront cart.
   */
  clearCart: (params?: CartControllerClearCartParams) => Promise<void>;
  /**
   * Triggers a manual refresh of the active storefront cart.
   */
  refreshCart: () => Promise<void>;

  /** Fast-access state containing the full server-synchronized customer profile record. */
  customerProfile: TUser | null;
  /** Fast-access array containing customer's shipping and billing addresses. */
  customerAddresses: AddressDto[];
  /** Fast-access array containing booking list history and upcoming appointments. */
  bookings: ServiceBookingItemDto[];
  /** Indicates whether bookings are currently being requested from the server. */
  bookingsLoading: boolean;

  /**
   * Utility action to add a new shipping/billing address.
   */
  addAddress: (dto: AddressDto) => Promise<AxiosResponse<void>>;
  /**
   * Utility action to modify profile fields.
   */
  updateProfile: (
    dto: UpdateCustomerDto,
  ) => Promise<AxiosResponse<TUser>>;
  /**
   * Utility action to schedule a new service booking reservation.
   */
  createBooking: (dto: CreateBookingDto) => Promise<AxiosResponse<void>>;
  /**
   * Utility action to cancel a service booking.
   */
  cancelBooking: (id: string) => Promise<AxiosResponse<void>>;
  /**
   * Checkout action to finalize shopping cart items and produce a sales order.
   */
  checkoutCart: (params: {
    locationId: string;
    notes?: string;
    channel?: string;
  }) => Promise<OrderResponseDto>;
  /**
   * Re-fetches the customer profile and address list.
   */
  refreshProfile: () => Promise<void>;
  /**
   * Re-fetches the bookings and appointment list.
   */
  refreshBookings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType<any, any, any, any, any, any> | undefined>(undefined);

/**
 * Prop interface for the ScrymeAuthProvider component.
 */
export interface ScrymeAuthProviderProps<
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto
> {
  /**
   * Initialized stateful ScrymeClientSDK.
   */
  sdk: ScrymeClientSDK<TProduct, TService, TCartItem, TCartResponse, TUser, TSession>;
  /**
   * Child nodes to wrap.
   */
  children: React.ReactNode;
}

/**
 * High-performance React Context Provider that orchestrates active customer sessions,
 * shopping cart synchronization, bookings updates, and user profiles.
 */
export const ScrymeAuthProvider = <
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto
>({
  sdk,
  children,
}: ScrymeAuthProviderProps<TProduct, TService, TCartItem, TCartResponse, TUser, TSession>) => {
  const [session, setSession] = useState<SessionState<TUser>>({
    token: null,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<any | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  // Customer and bookings state
  const [customerProfile, setCustomerProfile] =
    useState<TUser | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<AddressDto[]>([]);
  const [bookingsList, setBookingsList] = useState<ServiceBookingItemDto[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    const { unsubscribe } = sdk.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession as any);
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
      const profile = await sdk.customer.getProfile<TUser>();
      setCustomerProfile(profile || null);

      const addresses = await sdk.customer.getAddresses();
      setCustomerAddresses(addresses?.data || (addresses as any) || []);
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
      setBookingsList(res?.data || (res as any) || []);
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
    const res = await sdk.auth.signIn<TSession, TUser>(credentials);
    return res;
  };

  const signUp = async (dto: RegisterCustomerDto) => {
    const res = await sdk.auth.signUp<TUser>(dto);
    return res;
  };

  const signOut = async () => {
    await sdk.auth.signOut();
  };

  const addToCart = async (dto: any) => {
    if (!session.token)
      throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.add(dto);
    await refreshCart();
  };

  const removeFromCart = async (dto: any) => {
    if (!session.token)
      throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.remove(dto);
    await refreshCart();
  };

  const updateCartItem = async (dto: any) => {
    if (!session.token)
      throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.update(dto);
    await refreshCart();
  };

  const clearCart = async (params?: any) => {
    if (!session.token)
      throw new Error("Customer must be logged in to manage cart");
    await sdk.cart.clear(params);
    await refreshCart();
  };

  const addAddress = async (dto: AddressDto) => {
    if (!session.token)
      throw new Error("Customer must be logged in to manage addresses");
    const res = await sdk.customer.addAddress(dto);
    await refreshProfile();
    return res;
  };

  const updateProfile = async (dto: UpdateCustomerDto) => {
    if (!session.token)
      throw new Error("Customer must be logged in to update profile");
    const res = await sdk.customer.updateProfile<TUser>(dto);
    await refreshProfile();
    return res;
  };

  const createBooking = async (dto: CreateBookingDto) => {
    if (!session.token)
      throw new Error("Customer must be logged in to create bookings");
    const res = await sdk.bookings.create(dto);
    await refreshBookings();
    return res;
  };

  const cancelBooking = async (id: string) => {
    if (!session.token)
      throw new Error("Customer must be logged in to cancel bookings");
    const res = await sdk.bookings.cancel(id);
    await refreshBookings();
    return res;
  };

  const checkoutCart = async (params: {
    locationId: string;
    notes?: string;
    channel?: string;
  }) => {
    if (!session.token)
      throw new Error("Customer must be logged in to checkout");
    const res = await sdk.cart.checkout(params);
    await refreshCart();
    await refreshBookings();
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        sdk: sdk as any,
        session: session as any,
        user: session.user as any,
        token: session.token,
        isLoading,
        signIn: signIn as any,
        signUp: signUp as any,
        signOut,
        cart,
        cartLoading,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        refreshCart,
        customerProfile: customerProfile as any,
        customerAddresses,
        bookings: bookingsList,
        bookingsLoading,
        addAddress,
        updateProfile: updateProfile as any,
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

/**
 * React Hook providing streamlined access to the current customer session status,
 * active shopping cart, and client-side actions.
 * Must be called within a ScrymeAuthProvider context.
 */
export const useScrymeAuth = <
  TUser = CustomerResponseDto,
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TSession = CustomerSessionDto
>(): AuthContextType<TUser, TProduct, TService, TCartItem, TCartResponse, TSession> => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useScrymeAuth must be used within a ScrymeAuthProvider");
  }
  return context as any;
};
