import axios, { AxiosInstance, AxiosResponse } from "axios";
import type { AxiosRequestConfig } from "axios";
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
  servicesMapping,
  ServicesModule,
  CustomerSessionDto,
  CustomerAuthResponseDto,
} from "./base";

/**
 * Configuration options for the isolated ScrymeServerSDK.
 */
export interface ServerSDKConfig {
  /**
   * The client ID of your Server application credentials.
   */
  clientId: string;
  /**
   * The client secret of your Server application credentials.
   */
  clientSecret: string;
  /**
   * The unique slug of the organization to target.
   */
  orgSlug: string;
  /**
   * Optional base API URL. Defaults to "https://api.scryme.tech".
   */
  baseURL?: string;
  /**
   * Optional high-performance customer session or admin JWT token.
   */
  token?: string;
  /**
   * Optional organization API key for system-level integrations.
   */
  apiKey?: string;
}

/**
 * Isolated, Multi-Tenant Safe Server-Side SDK for Scryme V3.
 *
 * Allocates strict request/session isolation to prevent token leakages, supporting
 * backoffice orchestration, batch catalog syncs, scheduling updates, and administrative audits.
 *
 * @template TProduct Custom Product DTO type override. Defaults to ProductResponseDto.
 * @template TService Custom Service DTO type override. Defaults to ServiceCatalogResponseDto.
 * @template TCartItem Custom Cart Item DTO type override. Defaults to CartItemDto.
 * @template TCartResponse Custom Cart Response DTO type override. Defaults to CartResponseDto.
 * @template TUser Custom User Profile DTO type override. Defaults to CustomerResponseDto.
 * @template TSession Custom Customer Session DTO type override. Defaults to CustomerSessionDto.
 */
export class ScrymeServerSDK<
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto,
> {
  /** Underlying Axios instance allocated exclusively to this server instance. */
  public axiosInstance: AxiosInstance;
  /** Raw proxy API client exposing all standard endpoints auto-bound with the configured orgSlug. */
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
  /** Scheduling operations, break/shift management, staff schedules, and resource utilization submodule. */
  public services: ServicesModule;

  /**
   * Server Cart Submodule.
   * Enables backend processes to orchestrate customer checkout sessions, retrieve active item lists, and manage shopping states.
   */
  public cart: {
    /**
     * Retrieves a customer shopping cart.
     * @param params Query arguments containing guest session or customer identifier.
     */
    get<T = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<AxiosResponse<T>>;
    /**
     * Adds an item to a target shopping cart.
     * @param dto Item and target cart identifier details.
     */
    add(dto: AddToCartDto): Promise<AxiosResponse<void>>;
    /**
     * Removes an item from a target shopping cart.
     * @param dto Item and target cart identifier details.
     */
    remove(dto: RemoveFromCartDto): Promise<AxiosResponse<void>>;
    /**
     * Clears all items from a target shopping cart.
     * @param params Query arguments containing target session/customer identifiers.
     */
    clear(params?: CartControllerClearCartParams): Promise<AxiosResponse<void>>;
    /**
     * Performs a smart delta-based update of item quantities in a shopping cart.
     * @param dto Item, quantity, and cart identifier details.
     */
    update<T = TCartResponse>(
      dto: AddToCartDto & { quantity: number },
    ): Promise<AxiosResponse<void> | AxiosResponse<T> | undefined>;
    /**
     * Returns a flat list of all items present in a shopping cart.
     * @param params Query arguments containing target session/customer identifiers.
     */
    getItems<T = TCartItem>(params?: CartControllerGetCartParams): Promise<T[]>;
    /**
     * Calculates totals including items counts and returns full raw cart response details.
     * @param params Query arguments containing target session/customer identifiers.
     */
    getTotals<TItem = TCartItem, TRaw = TCartResponse>(
      params?: CartControllerGetCartParams,
    ): Promise<{
      itemsCount: number;
      items: TItem[];
      raw: TRaw;
    }>;
    /**
     * Orchestrates cart checkouts, finalizes shopping workflows, and outputs a registered sales order.
     * @param params Target customer, location, and metadata details.
     */
    checkout(params: {
      sessionId?: string;
      customerId?: string;
      locationId: string;
      notes?: string;
      channel?: string;
    }): Promise<OrderResponseDto>;
  };

  /**
   * Server Customer Management Submodule.
   * Provides administrative lookup, profile updates, and shipping/billing address configurations.
   */
  public customer: {
    /**
     * Fetches detailed profile information for a specific customer.
     * @param customerId Customer database identifier.
     */
    getProfile<T = TUser>(customerId: string): Promise<AxiosResponse<T>>;
    /**
     * Modifies profile attributes for a specific customer.
     * @param customerId Customer database identifier.
     * @param dto Updated fields.
     */
    updateProfile<T = TUser>(
      customerId: string,
      dto: UpdateCustomerDto,
    ): Promise<AxiosResponse<T>>;
    /**
     * Retrieves shipping and billing addresses for a specific customer.
     * @param customerId Customer database identifier.
     */
    getAddresses(customerId: string): Promise<AxiosResponse<AddressDto[]>>;
    /**
     * Adds an address to a customer's directory.
     * @param customerId Customer database identifier.
     * @param dto Address details.
     */
    addAddress(
      customerId: string,
      dto: AddressDto,
    ): Promise<AxiosResponse<void>>;
    /**
     * Server Customer Authentication Submodule.
     */
    auth: {
      /**
       * Administer registration of a new customer account.
       * @param dto Customer credentials and details.
       */
      signUp<T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>>;
      /**
       * Swaps credentials for an active, high-performance customer session token.
       * @param credentials Email and password.
       */
      signIn<TSess = TSession, TU = TUser>(credentials: {
        email: string;
        password?: string;
      }): Promise<CustomerAuthResponseDto<TU, TSess>>;
      /**
       * Fetches details of the customer session associated with the active token.
       */
      getCurrentSession<TU = TUser>(headers?: any | Record<string, string | string[]>): Promise<TU>;
      /**
       * Refreshes the current active customer session token.
       */
      refreshSession<TSess = TSession, TU = TUser>(): Promise<
        CustomerAuthResponseDto<TU, TSess>
      >;
      /**
       * Exchanges a verified Zitadel OIDC token for a local customer session.
       * @param zitadelToken Valid Zitadel OIDC ID/access token.
       */
      swapZitadel<TSess = TSession, TU = TUser>(
        zitadelToken: string,
      ): Promise<CustomerAuthResponseDto<TU, TSess>>;
    };
  };

  /**
   * Server Bookings & Appointment Submodule.
   * Enables booking creation, history audits, cancellations, and secure completion workflows.
   */
  public bookings: {
    /**
     * Schedules a new booking reservation.
     * @param dto Booking specifications.
     */
    create(dto: CreateBookingDto): Promise<AxiosResponse<void>>;
    /**
     * Looks up detailed configuration and status details for a specific booking.
     * @param id Booking database identifier.
     */
    get(id: string): Promise<AxiosResponse<ServiceBookingItemDto>>;
    /**
     * Lists the full history of booking reservations inside the organization.
     */
    list(): Promise<AxiosResponse<ServiceBookingItemDto[]>>;
    /**
     * Cancels an active reservation, marking its status as CANCELLED.
     * @param id Booking database identifier.
     */
    cancel(id: string): Promise<AxiosResponse<void>>;
    /**
     * Securely completes a booking reservation (including post-service audits and QC reports).
     * @param id Booking database identifier.
     * @param dto Completion data.
     */
    complete(
      id: string,
      dto: CompleteBookingDto & Record<string, any>,
    ): Promise<AxiosResponse<void>>;
  };

  /**
   * Server Authentication & Customer Session Submodule.
   * Handles server-orchestrated sign-ups, credential-based customer login, token validations, and Zitadel OIDC session swapping.
   */
  public auth: AuthModule & {
    /**
     * Administer registration of a new customer account.
     * @param dto Customer credentials and details.
     */
    signUp<T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>>;
    /**
     * Triggers client credentials exchange for your Server credentials.
     */
    authenticate(): Promise<AuthExchangeToken201>;
    /**
     * Swaps credentials for an active, high-performance customer session token.
     * @param credentials Email and password.
     */
    signIn<TSess = TSession, TU = TUser>(credentials: {
      email: string;
      password?: string;
    }): Promise<CustomerAuthResponseDto<TU, TSess>>;
    /**
     * Fetches details of the customer session associated with the active token.
     */
    getCurrentSession<TU = TUser>(headers?: any | Record<string, string | string[]>): Promise<TU>;
    /**
     * Refreshes the current active customer session token.
     */
    refreshSession<TSess = TSession, TU = TUser>(): Promise<
      CustomerAuthResponseDto<TU, TSess>
    >;
    /**
     * Exchanges a verified Zitadel OIDC token for a local customer session.
     * @param zitadelToken Valid Zitadel OIDC ID/access token.
     */
    swapZitadel<TSess = TSession, TU = TUser>(
      zitadelToken: string,
    ): Promise<CustomerAuthResponseDto<TU, TSess>>;
  };

  private token: string | null = null;
  private expiresAt: number | null = null;
  private activeAuthPromise: Promise<any> | null = null;

  constructor(config: ServerSDKConfig) {
    if (
      !config ||
      !config.clientId ||
      !config.clientSecret ||
      !config.orgSlug
    ) {
      throw new Error(
        "clientId, clientSecret, and orgSlug are required to initialize the SDK.",
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

    // Attach token or apiKey if present
    if (config.token) {
      this.token = config.token;
      this.expiresAt = getJwtExpiry(config.token);
      this.axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${config.token}`;
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
            this.axiosInstance.defaults.headers.common["Authorization"] =
              `Bearer ${accessToken}`;
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
      // Check if this is a token exchange request or refresh to prevent infinite loops
      const isAuthTokenRequest =
        req.url &&
        (req.url.endsWith("/auth/token") ||
          req.url.includes("/auth/token") ||
          req.url.includes("/customers/auth/refresh") ||
          req.url.includes("/customers/auth/swap-zitadel"));

      if (!isAuthTokenRequest && !config.apiKey) {
        const isExpired =
          !this.token ||
          (this.expiresAt && Date.now() >= this.expiresAt - 30000);
        if (isExpired) {
          const isCustomerToken =
            this.token && getJwtExpiry(this.token) && !config.clientSecret;
          if (isCustomerToken || (this.token && !config.clientSecret)) {
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
          !isAuthTokenRequest &&
          !config.apiKey
        ) {
          originalRequest._retry = true;
          try {
            const isCustomerToken =
              this.token && getJwtExpiry(this.token) && !config.clientSecret;
            if (isCustomerToken || (this.token && !config.clientSecret)) {
              // Customer token got a 401. Try refreshing.
              await this.auth.refreshSession();
              if (this.token) {
                originalRequest.headers["Authorization"] =
                  `Bearer ${this.token}`;
              }
              return this.axiosInstance(originalRequest);
            } else if (config.clientId && config.clientSecret) {
              // App credentials token expired or invalid, try client credentials exchange
              await performExchange();
              if (this.token) {
                originalRequest.headers["Authorization"] =
                  `Bearer ${this.token}`;
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

    // Build submodules
    const baseCatalog = buildModule(this.api, config.orgSlug, catalogMapping) as any;
    this.catalog = {
      ...baseCatalog,
      getProduct: async <T = TProduct>(
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
      getService: async <T = TService>(
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
    this.services = buildModule(this.api, config.orgSlug, servicesMapping);

    this.cart = {
      get: async <T = TCartResponse>(
        params?: CartControllerGetCartParams,
      ): Promise<AxiosResponse<T>> => {
        return this.orders.getCart(
          params as CartControllerGetCartParams,
        ) as any;
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
      update: async <T = TCartResponse>(
        dto: AddToCartDto & { quantity: number },
      ): Promise<AxiosResponse<void> | AxiosResponse<T> | undefined> => {
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
      getItems: async <T = TCartItem>(
        params?: CartControllerGetCartParams,
      ): Promise<T[]> => {
        const res = await this.orders.getCart(
          params as CartControllerGetCartParams,
        );
        const data: any = res?.data || res;
        return (data?.items || data?.data?.items || []) as T[];
      },
      getTotals: async <TItem = TCartItem, TRaw = TCartResponse>(
        params?: CartControllerGetCartParams,
      ): Promise<{ itemsCount: number; items: TItem[]; raw: TRaw }> => {
        const res = await this.orders.getCart(
          params as CartControllerGetCartParams,
        );
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
      checkout: async (params: {
        sessionId?: string;
        customerId?: string;
        locationId: string;
        notes?: string;
        channel?: string;
      }) => {
        if (!params.customerId)
          throw new Error("customerId is required for server checkout.");

        const items = await this.cart.getItems({
          sessionId: params.sessionId,
          customerId: params.customerId,
        } as any);
        if (!items || items.length === 0) {
          throw new Error("Cannot checkout an empty cart.");
        }

        const orderItems: any[] = items.map((item: any) => ({
          variantId: item.variantId || "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

        const orderResponse = await this.orders.createOrder({
          customerId: params.customerId!,
          locationId: params.locationId!,
          items: orderItems,
          notes: params.notes,
          channel: params.channel as any,
        });

        await this.cart.clear({
          sessionId: params.sessionId || "",
          customerId: params.customerId,
        } as any);
        return orderResponse?.data || orderResponse;
      },
    };

    this.customer = {
      getProfile: async <T = TUser>(
        customerId: string,
      ): Promise<AxiosResponse<T>> => {
        return this.admin.getCustomerById(customerId) as any;
      },
      updateProfile: async <T = TUser>(
        customerId: string,
        dto: UpdateCustomerDto,
      ): Promise<AxiosResponse<T>> => {
        return this.admin.updateCustomer(customerId, dto) as any;
      },
      getAddresses: async (customerId: string) => {
        return this.admin.getCustomerAddresses(customerId) as any;
      },
      addAddress: async (customerId: string, dto: AddressDto) => {
        return this.admin.addCustomerAddress(customerId, dto);
      },
      auth: {
        signUp: async <T = TUser>(
          dto: RegisterCustomerDto,
        ): Promise<AxiosResponse<T>> => {
          return this.api.customersRegister(config.orgSlug, dto) as any;
        },

        signIn: async <TSess = TSession, TU = TUser>(credentials: {
          email: string;
          password?: string;
        }): Promise<CustomerAuthResponseDto<TU, TSess>> => {
          const response = await this.axiosInstance.post(
            "/auth/sign-in/email",
            credentials,
          );
          const data = response.data;
          const token = data?.session?.token || data?.token || null;
          if (token) {
            this.token = token;
            this.expiresAt = getJwtExpiry(token);
            this.axiosInstance.defaults.headers.common["Authorization"] =
              `Bearer ${token}`;
          }
          return data as any;
        },

        getCurrentSession: async <TU = TUser>(
          headers?: any | Record<string, string | string[]>,
        ): Promise<TU> => {
          const requestConfig: AxiosRequestConfig = {};
          if (headers) {
            const requestHeaders: Record<string, string> = {};
            if (typeof headers.forEach === "function") {
              (headers as Headers).forEach((value, key) => {
                requestHeaders[key] = value;
              });
            } else {
              for (const [key, value] of Object.entries(headers)) {
                if (value !== undefined) {
                  requestHeaders[key] = Array.isArray(value) ? value.join(", ") : String(value);
                }
              }
            }
            requestConfig.headers = requestHeaders;
          }

          const response = await this.axiosInstance.get(
            `/${config.orgSlug}/customers/auth/session`,
            requestConfig,
          );
          return (response.data?.data || response.data) as TU;
        },

        refreshSession: async <TSess = TSession, TU = TUser>(): Promise<
          CustomerAuthResponseDto<TU, TSess>
        > => {
          const response = await this.axiosInstance.post(
            `/${config.orgSlug}/customers/auth/refresh`,
          );
          const data = response.data?.data || response.data;
          const token = data?.token || null;
          if (token) {
            this.token = token;
            this.expiresAt = getJwtExpiry(token);
            this.axiosInstance.defaults.headers.common["Authorization"] =
              `Bearer ${token}`;
          }
          return data as any;
        },

        swapZitadel: async <TSess = TSession, TU = TUser>(
          zitadelToken: string,
        ): Promise<CustomerAuthResponseDto<TU, TSess>> => {
          const response = await this.axiosInstance.post(
            `/${config.orgSlug}/customers/auth/swap-zitadel`,
            { zitadelToken },
          );
          const data = response.data?.data || response.data;
          const token = data?.token || null;
          if (token) {
            this.token = token;
            this.expiresAt = getJwtExpiry(token);
            this.axiosInstance.defaults.headers.common["Authorization"] =
              `Bearer ${token}`;
          }
          return data as any;
        },
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
      complete: async (
        id: string,
        dto: CompleteBookingDto & Record<string, any>,
      ) => {
        return this.catalog.completeBooking(id, dto);
      },
    };

    const baseAuth = buildModule(this.api, config.orgSlug, authMapping);

    this.auth = {
      ...baseAuth,
      ...this.customer.auth,

      authenticate: async () => {
        return performExchange();
      },

      signUp: async <T = TUser>(dto: RegisterCustomerDto): Promise<AxiosResponse<T>> => {
        return this.customer.auth.signUp<T>(dto);
      },

      signIn: async <TSess = TSession, TU = TUser>(credentials: { email: string; password?: string }): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        return this.customer.auth.signIn<TSess, TU>(credentials);
      },

      getCurrentSession: async <TU = TUser>(headers?: any | Record<string, string | string[]>): Promise<TU> => {
        return this.customer.auth.getCurrentSession<TU>(headers);
      },

      refreshSession: async <TSess = TSession, TU = TUser>(): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        return this.customer.auth.refreshSession<TSess, TU>();
      },

      swapZitadel: async <TSess = TSession, TU = TUser>(zitadelToken: string): Promise<CustomerAuthResponseDto<TU, TSess>> => {
        return this.customer.auth.swapZitadel<TSess, TU>(zitadelToken);
      },
    };
  }
}

/**
 * Factory helper function to instantiate a ScrymeServerSDK.
 * Retains backward compatibility while enforcing strict ServerSDKConfig types.
 *
 * @param config Server configuration overrides.
 */
export function createServerSDK<
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto,
  TCartItem = CartItemDto,
  TCartResponse = CartResponseDto,
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto,
>(
  config: Partial<ServerSDKConfig> = {},
): ScrymeServerSDK<
  TProduct,
  TService,
  TCartItem,
  TCartResponse,
  TUser,
  TSession
> {
  const finalConfig = {
    clientId: config.clientId || "mock-client-id",
    clientSecret: config.clientSecret || "mock-client-secret",
    orgSlug: config.orgSlug || "mock-org-slug",
    ...config,
  } as ServerSDKConfig;
  return new ScrymeServerSDK<
    TProduct,
    TService,
    TCartItem,
    TCartResponse,
    TUser,
    TSession
  >(finalConfig);
}
