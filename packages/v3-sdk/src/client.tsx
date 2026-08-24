import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  CreateProductReviewDto,
  UpdateProductReviewDto,
  ProductReviewResponseDto,
  CatalogDeleteReviewParams,
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
  webhooksMapping,
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
  WebhooksModule,
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
  private api: RawAPI;

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
  /** Webhook registration, management, listing, and deletion submodule. */
  public webhooks: WebhooksModule;

  /**
   * Stateful Shopping Cart Submodule.
   * Leverages internal tracking and smart delta calculations for optimized storefront shopping.
   */
  public cart: {
    /**
     * Retrieves the active shopping cart for the current session or customer.
     * @param params Optional cart parameters including sessionId.
     * @returns Promise containing the axios response with the cart details.
     */
    get<T = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<AxiosResponse<T & Record<string, any>>>;

    /**
     * Adds a product variant or service to the shopping cart.
     * Automatically resolves and appends the customer ID from the active customer session if omitted.
     * @param dto Data transfer object containing the item details and quantity.
     * @returns Promise containing the axios response.
     */
    add(dto: AddToCartDto): Promise<AxiosResponse<void>>;

    /**
     * Removes a product variant or service from the shopping cart.
     * Automatically resolves and appends the customer ID from the active customer session if omitted.
     * @param dto Data transfer object specifying the item to remove.
     * @returns Promise containing the axios response.
     */
    remove(dto: RemoveFromCartDto): Promise<AxiosResponse<void>>;

    /**
     * Clears all items from the active shopping cart.
     * @param params Optional clear parameters containing sessionId.
     * @returns Promise containing the axios response.
     */
    clear(params?: CartControllerClearCartParams): Promise<AxiosResponse<void>>;

    /**
     * Updates the quantity of a product variant or service in the shopping cart.
     * Computes the difference and invokes add or remove operations accordingly.
     * Automatically resolves and appends the customer ID from the active customer session if omitted.
     * @param dto Data transfer object containing item identifiers and the target absolute quantity.
     * @returns Promise resolving to the updated cart state or undefined.
     */
    update<T = TCartResponse>(
      dto: AddToCartDto & { quantity: number },
    ): Promise<
      AxiosResponse<void> | AxiosResponse<T> | undefined
    >;

    /**
     * Retrieves the flat list of cart items currently in the cart.
     * @param params Optional parameters.
     * @returns Promise resolving to an array of cart items.
     */
    getItems<T = TCartItem>(params?: CartControllerGetCartParams): Promise<T[]>;

    /**
     * Calculates the totals, item counts, and summary metrics of the current shopping cart.
     * @param params Optional parameters.
     * @returns Promise resolving to the totals object containing the itemsCount, item array, and raw cart.
     */
    getTotals<TItem = TCartItem, TRaw = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<{
      itemsCount: number;
      items: TItem[];
      raw: TRaw;
    }>;

    /**
     * Merges a guest shopping cart session into an authenticated customer's shopping cart.
     * @param guestSessionId The guest session token to migrate items from.
     * @param customerId The destination customer ID.
     * @returns Promise resolving to the merged cart state.
     */
    mergeGuestCart<T = TCartResponse>(
      guestSessionId: string,
      customerId: string,
    ): Promise<AxiosResponse<T & Record<string, any>>>;

    /**
     * Finalizes the shopping cart, creating a physical Sales Order or executing STK Push checkout.
     * Automatically resolves and appends the customer ID from the active customer session if phoneNumber is omitted.
     * Clears the shopping cart state upon successful transaction creation.
     * @param params Checkout configurations including locationId, phoneNumber, cartId, channel, and custom notes.
     * @returns Promise resolving to the created order or payment response.
     */
    checkout(params: {
      locationId: string;
      phoneNumber?: string;
      cartId?: string;
      notes?: string;
      channel?: string;
    }): Promise<any>;
  };

  /**
   * Storefront Customer Profile Submodule.
   * Manages the authenticated user's self-serve account, update workflows, and shipping/billing directories.
   */
  public customer: {
    /**
     * Fetches the current customer profile details.
     * @template T The expected type of the user profile.
     * @returns Promise resolving to the user profile object.
     */
    getProfile<T = TUser>(): Promise<T>;

    /**
     * Updates the profile information of the authenticated customer.
     * @param dto Updated field attributes.
     * @returns Promise containing the updated customer profile response.
     */
    updateProfile<T = TUser>(
      dto: UpdateCustomerDto,
    ): Promise<AxiosResponse<T>>;

    /**
     * Retrieves all saved billing/shipping addresses for the active customer.
     * @returns Promise resolving to the list of address records.
     */
    getAddresses(): Promise<AxiosResponse<AddressDto[]>>;

    /**
     * Saves a new address record to the active customer's profile directory.
     * @param dto The address details to persist.
     * @returns Promise containing the response of the creation operation.
     */
    addAddress(dto: AddressDto): Promise<AxiosResponse<void>>;

    /**
     * Reactive & Stateful Customer Authentication Submodule.
     */
    auth: {
      /**
       * Gets the current customer session synchronously in standard format.
       * Reflects the active customer state immediately without causing React re-renders.
       */
      get session(): ClientSessionStructure<TUser>;

      /**
       * Registers a new customer storefront profile.
       * Automatically performs sign-in and establishes a customer session if a password is provided.
       * @param dto The customer registration attributes (email, name, password, etc.).
       * @returns Promise containing the created customer details.
       */
      signUp<T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>>;

      /**
       * Authenticates a customer using their credentials, starting an active session.
       * Triggers a 'SIGNED_IN' authentication state change event.
       * @param credentials Customer login email and optional password.
       * @returns Promise containing the session token and user profile.
       */
      signIn<TSess = TSession, TU = TUser>(credentials: {
        email: string;
        password?: string;
      }): Promise<CustomerAuthResponseDto<TU, TSess>>;

      /**
       * Terminate the active customer session, clearing persisted tokens and session memory.
       * Triggers a 'SIGNED_OUT' authentication state change event.
       * @returns Promise resolving once state cleanup is done.
       */
      signOut(): Promise<void>;

      /**
       * Retrieves the raw internal authentication state synchronously/asynchronously.
       * @returns Promise containing token and user state.
       */
      getSession<TU = TUser>(): Promise<SessionState<TU>>;

      /**
       * Registers a listener to reactively monitor authentication events.
       * Triggers callback upon 'SIGNED_IN', 'SIGNED_OUT', or 'INITIAL_SESSION' events.
       * @param callback Callback function.
       * @returns Subscription reference containing unsubscribe cleanup method.
       */
      onAuthStateChange<TU = TUser>(
        callback: AuthStateCallback<TU>,
      ): { unsubscribe(): void };

      /**
       * Lists all active concurrent sessions associated with this customer profile.
       * @returns Promise containing the list of active session tokens and metadata.
       */
      getSessions<TSess = TSession>(): Promise<TSess[]>;

      /**
       * Revokes and terminates a specific active customer session by its identifier.
       * @param id The session identifier to destroy.
       * @returns Promise containing the revocation response.
       */
      revokeSession(id: string): Promise<AxiosResponse<void>>;

      /**
       * Revokes and terminates all other concurrent sessions for this customer.
       * @param mode Optional mode configurations.
       * @returns Promise containing the response.
       */
      revokeAllSessions(mode?: string): Promise<AxiosResponse<void>>;

      /**
       * Retrieves the current customer user record from the backend.
       * @returns Promise containing the active customer user details.
       */
      getCurrentSession<TU = TUser>(): Promise<TU>;

      /**
       * Refreshes the active customer session, extending the validity of the customer JWT token.
       * Triggers automatic session token updates and reactive state updates.
       * @returns Promise resolving to the fresh customer authentication response.
       */
      refreshSession<TSess = TSession, TU = TUser>(): Promise<
        CustomerAuthResponseDto<TU, TSess>
      >;

      /**
       * Stateful, reactive React Hook that fetches, manages, and updates the customer session.
       * Subscribes to authentication state change listeners to ensure immediate UI synchronization.
       * @returns Reactive session state containing session, user, error, pending flags, and refetch handler.
       */
      useSession<TSess = TSession, TU = TUser>(): {
        data: { session: TSess; user: TU } | null;
        isPending: boolean;
        error: any;
        refetch: () => Promise<void>;
      };
    };
  };

  /**
   * Service Bookings & Appointments Submodule.
   */
  public bookings: {
    /**
     * Creates a new booking appointment.
     * Automatically resolves and appends the customer ID from the active customer session if omitted.
     * @param dto The service booking reservation parameters.
     * @returns Promise containing the booking creation response.
     */
    create(dto: CreateBookingDto): Promise<AxiosResponse<void>>;

    /**
     * Retrieves the full details of a specific service booking by its identifier.
     * @param id Service booking ID.
     * @returns Promise containing the booking details response.
     */
    get(id: string): Promise<AxiosResponse<ServiceBookingItemDto>>;

    /**
     * Lists all service bookings and reservations associated with the authenticated customer.
     * @returns Promise containing the list of service booking records.
     */
    list(): Promise<AxiosResponse<ServiceBookingItemDto[]>>;

    /**
     * Cancels an existing service booking appointment.
     * @param id Service booking ID to cancel.
     * @returns Promise containing the cancellation response.
     */
    cancel(id: string): Promise<AxiosResponse<void>>;
  };

  /**
   * Authentication & Customer Session Submodule.
   */
  public auth: AuthModule & {
    /**
     * Gets the current customer session synchronously in standard format.
     * Reflects the active customer state immediately without causing React re-renders.
     */
    get session(): ClientSessionStructure<TUser>;

    /**
     * Registers a new customer storefront profile.
     * Automatically performs sign-in and establishes a customer session if a password is provided.
     * @param dto The customer registration attributes (email, name, password, etc.).
     * @returns Promise containing the created customer details.
     */
    signUp<T = TUser>(
      dto: RegisterCustomerDto,
    ): Promise<AxiosResponse<T>>;

    /**
     * Authenticates application or SDK client via client ID and client secret credentials.
     * @returns Promise resolving to the token exchange response containing access token.
     */
    authenticate(): Promise<AuthExchangeToken201>;

    /**
     * Authenticates a customer using their credentials, starting an active session.
     * Triggers a 'SIGNED_IN' authentication state change event.
     * @param credentials Customer login email and optional password.
     * @returns Promise containing the session token and user profile.
     */
    signIn<TSess = TSession, TU = TUser>(credentials: {
      email: string;
      password?: string;
    }): Promise<CustomerAuthResponseDto<TU, TSess>>;

    /**
     * Terminate the active customer session, clearing persisted tokens and session memory.
     * Triggers a 'SIGNED_OUT' authentication state change event.
     * @returns Promise resolving once state cleanup is done.
     */
    signOut(): Promise<void>;

    /**
     * Retrieves the raw internal authentication state synchronously/asynchronously.
     * @returns Promise containing token and user state.
     */
    getSession<TU = TUser>(): Promise<SessionState<TU>>;

    /**
     * Registers a listener to reactively monitor authentication events.
     * Triggers callback upon 'SIGNED_IN', 'SIGNED_OUT', or 'INITIAL_SESSION' events.
     * @param callback Callback function.
     * @returns Subscription reference containing unsubscribe cleanup method.
     */
    onAuthStateChange<TU = TUser>(callback: AuthStateCallback<TU>): { unsubscribe(): void };

    /**
     * Lists all active concurrent sessions associated with this customer profile.
     * @returns Promise containing the list of active session tokens and metadata.
     */
    getSessions<TSess = TSession>(): Promise<TSess[]>;

    /**
     * Revokes and terminates a specific active customer session by its identifier.
     * @param id The session identifier to destroy.
     * @returns Promise containing the revocation response.
     */
    revokeSession(id: string): Promise<AxiosResponse<void>>;

    /**
     * Revokes and terminates all other concurrent sessions for this customer.
     * @param mode Optional mode configurations.
     * @returns Promise containing the response.
     */
    revokeAllSessions(mode?: string): Promise<AxiosResponse<void>>;

    /**
     * Retrieves the current customer user record from the backend.
     * @returns Promise containing the active customer user details.
     */
    getCurrentSession<TU = TUser>(): Promise<TU>;

    /**
     * Refreshes the active customer session, extending the validity of the customer JWT token.
     * Triggers automatic session token updates and reactive state updates.
     * @returns Promise resolving to the fresh customer authentication response.
     */
    refreshSession<TSess = TSession, TU = TUser>(): Promise<CustomerAuthResponseDto<TU, TSess>>;

    /**
     * Stateful, reactive React Hook that fetches, manages, and updates the customer session.
     * Subscribes to authentication state change listeners to ensure immediate UI synchronization.
     * @returns Reactive session state containing session, user, error, pending flags, and refetch handler.
     */
    useSession<TSess = TSession, TU = TUser>(): {
      data: { session: TSess; user: TU } | null;
      isPending: boolean;
      error: any;
      refetch: () => Promise<void>;
    };
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
      createReview: async (
        productId: string,
        dto: CreateProductReviewDto & { customerId?: string },
        options?: AxiosRequestConfig,
      ): Promise<AxiosResponse<ProductReviewResponseDto>> => {
        if (!dto.customerId) {
          const session = await this.auth.getSession();
          const user = session?.user as any;
          const customerId = user?.customerId || user?.id || user?.customer?.id;
          if (customerId) {
            dto = { ...dto, customerId };
          }
        }
        return baseCatalog.createReview(productId, dto, options);
      },
      updateReview: async (
        reviewId: string,
        dto: UpdateProductReviewDto & { customerId?: string },
        options?: AxiosRequestConfig,
      ): Promise<AxiosResponse<ProductReviewResponseDto>> => {
        if (!dto.customerId) {
          const session = await this.auth.getSession();
          const user = session?.user as any;
          const customerId = user?.customerId || user?.id || user?.customer?.id;
          if (customerId) {
            dto = { ...dto, customerId };
          }
        }
        return baseCatalog.updateReview(reviewId, dto, options);
      },
      deleteReview: async (
        reviewId: string,
        params?: CatalogDeleteReviewParams,
        options?: AxiosRequestConfig,
      ): Promise<AxiosResponse<void>> => {
        if (!params || !params.customerId) {
          const session = await this.auth.getSession();
          const user = session?.user as any;
          const customerId = user?.customerId || user?.id || user?.customer?.id;
          if (customerId) {
            params = { ...params, customerId };
          }
        }
        return baseCatalog.deleteReview(reviewId, params, options);
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
    this.webhooks = buildModule(this.api, config.orgSlug, webhooksMapping);

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
        phoneNumber?: string;
        cartId?: string;
        notes?: string;
        channel?: string;
      }) => {
        if (params.phoneNumber) {
          const res = await (this.orders as any).checkout({
            cartId: params.cartId,
            phoneNumber: params.phoneNumber,
            locationId: params.locationId,
            notes: params.notes,
          });
          return res?.data || res;
        }

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
      get session(): ClientSessionStructure<TUser> {
        if (!state.token) {
          return {
            data: null,
            isPending: false,
            error: null,
          };
        }
        const userId =
          (state.user as any)?.id ||
          (state.user as any)?.userId ||
          (state.user as any)?.customerId ||
          "";
        return {
          data: {
            session: {
              id: userId || state.token,
              userId: userId,
              expiresAt: state.expiresAt ? new Date(state.expiresAt) : null,
              token: state.token,
            },
            user: state.user as TUser,
          },
          isPending: false,
          error: null,
        };
      },
      signUp: async <T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>> => {
        const res = await this.api.customersRegister(config.orgSlug, dto) as any;
        if (dto.password) {
          try {
            await customerAuth.signIn({
              email: dto.email,
              password: dto.password,
            });
          } catch (e) {
            console.error("Auto sign-in after sign-up failed:", e);
          }
        }
        return res;
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
      useSession: <TSess = TSession, TU = TUser>(): {
        data: { session: TSess; user: TU } | null;
        isPending: boolean;
        error: any;
        refetch: () => Promise<void>;
      } => {
        const currentSession = customerAuth.session;
        const [data, setData] = useState<any>(currentSession.data);
        const [isPending, setIsPending] = useState<boolean>(false);
        const [error, setError] = useState<Error | null>(null);

        const fetchSessionSync = () => {
          const s = customerAuth.session;
          setData(s.data);
          setError(s.error);
          setIsPending(s.isPending);
        };

        const fetchSessionAsync = async () => {
          setIsPending(true);
          try {
            const res = (await customerAuth.getCurrentSession()) as any;
            if (res && (res.session || res.customer || res.user)) {
              setData({
                session: res.session,
                user: res.customer || res.user,
              });
            } else {
              const sessionState = await customerAuth.getSession();
              setData({
                session: {
                  id: (sessionState.user as any)?.id || (sessionState.user as any)?.userId || (sessionState.user as any)?.customerId || sessionState.token,
                  userId: (sessionState.user as any)?.id || (sessionState.user as any)?.userId || (sessionState.user as any)?.customerId || "",
                  expiresAt: sessionState.expiresAt ? new Date(sessionState.expiresAt) : null,
                  token: sessionState.token,
                },
                user: sessionState.user,
              });
            }
            setError(null);
          } catch (e) {
            setError(e instanceof Error ? e : new Error(String(e)));
            setData(null);
          } finally {
            setIsPending(false);
          }
        };

        useEffect(() => {
          fetchSessionSync();
          const { unsubscribe } = customerAuth.onAuthStateChange(() => {
            fetchSessionSync();
          });
          return () => unsubscribe();
        }, []);

        return {
          data: data as any,
          isPending,
          error,
          refetch: fetchSessionAsync,
        };
      }
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
