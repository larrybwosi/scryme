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
  };

  constructor(config: ServerSDKConfig) {
    if (!config || !config.clientId || !config.clientSecret || !config.orgSlug) {
      throw new Error("clientId, clientSecret, and orgSlug are required to initialize the SDK.");
    }

    this.axiosInstance = axios.create({
      baseURL: config.baseURL || "https://api.scryme.tech",
    });

    // Attach token or apiKey if present
    if (config.token) {
      this.axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${config.token}`;
    }

    if (config.apiKey) {
      this.axiosInstance.defaults.headers.common["x-api-key"] = config.apiKey;
    }

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
        const response = await this.api.authExchangeToken({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        });
        const tokenData = response.data?.data;
        const accessToken = tokenData?.access_token;
        if (accessToken) {
          this.axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        }
        return response.data;
      },

      signIn: async (credentials: { email: string; password?: string }) => {
        const response = await this.axiosInstance.post("/auth/sign-in/email", credentials);
        return response.data;
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
