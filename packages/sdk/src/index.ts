import axios, { AxiosInstance, AxiosResponse } from "axios";

export interface SDKConfig {
  baseURL: string;
  onUnauthorized?: () => void;
  apiKey?: string;
}

export const getSDK = (config: SDKConfig) => {
  const client: AxiosInstance = axios.create({
    baseURL: config.baseURL,
    headers: config.apiKey ? { "x-api-key": config.apiKey } : {},
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => {
      if (error.response?.status === 401 && config.onUnauthorized) {
        config.onUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  const sdk = {
    client: {
      getBaseURL: () => client.defaults.baseURL,
      setBaseURL: (url: string) => {
        client.defaults.baseURL = url;
      },
      get: <T = any>(url: string, config?: any) => client.get<T>(url, config).then((r: AxiosResponse<T>) => r.data),
      post: <T = any>(url: string, data?: any, config?: any) => client.post<T>(url, data, config).then((r: AxiosResponse<T>) => r.data),
      put: <T = any>(url: string, data?: any, config?: any) => client.put<T>(url, data, config).then((r: AxiosResponse<T>) => r.data),
      patch: <T = any>(url: string, data?: any, config?: any) => client.patch<T>(url, data, config).then((r: AxiosResponse<T>) => r.data),
      delete: <T = any>(url: string, config?: any) => client.delete<T>(url, config).then((r: AxiosResponse<T>) => r.data),
    },
    setApiKey: (key: string) => {
      client.defaults.headers.common["x-api-key"] = key;
    },
    setMemberToken: (token: string) => {
      client.defaults.headers.common["x-member-token"] = token;
    },
    auth: {
      getAuthStatus: () => sdk.client.get("/auth/status"),
      logout: () => sdk.client.post("/auth/logout"),
    },
    catalog: {
      getProducts: (params?: any) => sdk.client.get("/catalog/products", { params }),
      createProduct: (data: any) => sdk.client.post("/catalog/products", data),
      getProduct: (id: string) => sdk.client.get(`/catalog/products/${id}`),
      updateProduct: (id: string, data: any) => sdk.client.patch(`/catalog/products/${id}`, data),
      deleteProduct: (id: string) => sdk.client.delete(`/catalog/products/${id}`),
      getVariants: (params?: any) => sdk.client.get("/catalog/variants", { params }),
      getCategories: (params?: any) => sdk.client.get("/catalog/categories", { params }),
      createCategory: (data: any) => sdk.client.post("/catalog/categories", data),
      getCategory: (id: string) => sdk.client.get(`/catalog/categories/${id}`),
      updateCategory: (id: string, data: any) => sdk.client.patch(`/catalog/categories/${id}`, data),
      deleteCategory: (id: string) => sdk.client.delete(`/catalog/categories/${id}`),
    },
    inventory: {
      getInventory: (params?: any) => sdk.client.get("/inventory", { params }),
      list: (params?: any) => sdk.client.get("/inventory", { params }),
    },
    pos: {
      getLocations: (params?: any) => sdk.client.get("/pos/locations", { params }),
      listLocations: (params?: any) => sdk.client.get("/pos/locations", { params }),
      registerPettyCash: (orgSlug: string, data: any) => sdk.client.post(`/${orgSlug}/pos/petty-cash`, data),
      getPettyCashFunds: (orgSlug: string) => sdk.client.get(`/${orgSlug}/pos/petty-cash/funds`),
    },
    bakery: {
      getAuthStatus: () => sdk.client.get("/bakery/auth/status"),
      sso: () => sdk.client.post("/bakery/auth/sso"),
      logout: () => sdk.client.post("/bakery/auth/logout"),
      getOverview: () => sdk.client.get("/bakery"),
      getIngredients: () => sdk.client.get("/bakery/ingredients"),
      getIngredientRecords: () => sdk.client.get("/bakery/ingredients/records"),
      getRecipes: () => sdk.client.get("/bakery/recipes"),
      getRecipe: (id: string) => sdk.client.get(`/bakery/recipes/${id}`),
      createRecipe: (data: CreateRecipeInput) => sdk.client.post("/bakery/recipes", data),
      updateRecipe: (id: string, data: Partial<CreateRecipeInput>) => sdk.client.patch(`/bakery/recipes/${id}`, data),
      deleteRecipe: (id: string) => sdk.client.delete(`/bakery/recipes/${id}`),
      duplicateRecipe: (id: string) => sdk.client.post(`/bakery/recipes/${id}/duplicate`),
      generateRecipeAi: (prompt: string) => sdk.client.post("/bakery/recipes/generate", { prompt }),
      getBatches: (params?: { status?: BatchStatus; recipeId?: string }) => sdk.client.get("/bakery/batches", { params }),
      getBatch: (id: string) => sdk.client.get(`/bakery/batches/${id}`),
      getBatchTraceability: (id: string) => sdk.client.get(`/bakery/batches/${id}/traceability`),
      createBatch: (data: CreateBatchInput) => sdk.client.post("/bakery/batches", data),
      updateBatch: (id: string, data: Partial<CreateBatchInput> & { status?: BatchStatus }) => sdk.client.patch(`/bakery/batches/${id}`, data),
      deleteBatch: (id: string) => sdk.client.delete(`/bakery/batches/${id}`),
      startBatch: (id: string) => sdk.client.post(`/bakery/batches/${id}/start`),
      completeBatch: (id: string, data: CompleteBatchInput) => sdk.client.post(`/bakery/batches/${id}/complete`, data),
      cancelBatch: (id: string) => sdk.client.post(`/bakery/batches/${id}/cancel`),
      duplicateBatch: (id: string) => sdk.client.post(`/bakery/batches/${id}/duplicate`),
      getTemplates: () => sdk.client.get("/bakery/templates"),
      createTemplate: (data: CreateTemplateInput) => sdk.client.post("/bakery/templates", data),
      updateTemplate: (id: string, data: Partial<CreateTemplateInput>) => sdk.client.patch(`/bakery/templates/${id}`, data),
      deleteTemplate: (id: string) => sdk.client.delete(`/bakery/templates/${id}`),
      duplicateTemplate: (id: string) => sdk.client.post(`/bakery/templates/${id}/duplicate`),
      createBatchFromTemplate: (id: string) => sdk.client.post(`/bakery/templates/${id}/create-batch`),
      getCategories: () => sdk.client.get("/bakery/categories"),
      getCategory: (id: string) => sdk.client.get(`/bakery/categories/${id}`),
      createCategory: (data: { name: string; description?: string | null }) => sdk.client.post("/bakery/categories", data),
      updateCategory: (id: string, data: { name?: string; description?: string | null }) => sdk.client.put(`/bakery/categories/${id}`, data),
      deleteCategory: (id: string) => sdk.client.delete(`/bakery/categories/${id}`),
      getSettings: () => sdk.client.get("/bakery/settings"),
      updateSettings: (data: BakerySettingsUpdate) => sdk.client.put("/bakery/settings", data),
      getBakers: () => sdk.client.get("/bakery/bakers"),
      addBaker: (data: AddBakerInput) => sdk.client.post("/bakery/bakers", data),
      updateBaker: (id: string, data: Partial<AddBakerInput>) => sdk.client.patch(`/bakery/bakers/${id}`, data),
      removeBaker: (id: string) => sdk.client.delete(`/bakery/bakers/${id}`),
      getPartners: () => sdk.client.get("/bakery/partners"),
      createPartner: (data: CreateDeliveryPartnerInput) => sdk.client.post("/bakery/partners", data),
      getPartner: (id: string) => sdk.client.get(`/bakery/partners/${id}`),
      updatePartner: (id: string, data: Partial<CreateDeliveryPartnerInput>) => sdk.client.patch(`/bakery/partners/${id}`, data),
      adjustPartnerWallet: (id: string, data: { amount: number; type?: WalletTransactionType; notes?: string | null }) => sdk.client.post(`/bakery/partners/${id}/wallet/adjust`, data),
      dispatchDelivery: (data: { transactionId: string; partnerId: string; driverId?: string | null; notes?: string | null }) => sdk.client.post("/bakery/deliveries/dispatch", data),
      reconcileDelivery: (data: { fulfillmentId: string; status: DeliveryStatus; notes?: string | null }) => sdk.client.post("/bakery/deliveries/reconcile", data),
      getActiveDeliveries: () => sdk.client.get("/bakery/deliveries/active"),
      receiveIngredients: (data: ReceiveIngredientsInput) => sdk.client.post("/bakery/ingredients/receive", data),
      createIngredient: (data: any) => sdk.client.post("/bakery/ingredients", data),
      updateIngredient: (id: string, data: any) => sdk.client.patch(`/bakery/ingredients/${id}`, data),
      deleteIngredient: (id: string) => sdk.client.delete(`/bakery/ingredients/${id}`),
    },
  };

  return sdk;
};

export interface BakeryBatchListResponse {
  data: any[];
  metadata?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type RecipeDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type BatchStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ExpirationStatus = 'FRESH' | 'NEAR_EXPIRY' | 'EXPIRED' | 'DISPOSED';
export type DisposalReason = 'EXPIRED' | 'NEAR_EXPIRY_UNSOLD' | 'DAMAGED' | 'QUALITY_ISSUE' | 'CONTAMINATION' | 'RECALL' | 'OTHER';
export type DeliveryBenefitType = 'COMMISSION' | 'FIXED_FEE' | 'PROFIT_MARGIN' | 'NONE';
export type ReconciliationPolicy = 'RETURN_TO_STOCK' | 'MARK_AS_WASTE' | 'PARTNER_CHARGED';
export type WalletTransactionType = 'BENEFIT_ACCRUAL' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'RECONCILIATION_CHARGE' | 'DEPOSIT';
export type DeliveryStatus = 'DELIVERED' | 'FAILED' | 'RETURNED';

export interface CreateRecipeInput {
  name: string;
  categoryId: string;
  producesVariantId: string;
  yieldQuantity: number;
  systemUnitId?: string | null;
  orgUnitId?: string | null;
  costPrice?: number | null;
  description?: string | null;
  prepTime?: number | null;
  bakeTime?: number | null;
  totalTime?: number | null;
  difficulty?: RecipeDifficulty;
  temperatureCelsius?: number | null;
  servingSize?: string | null;
  instructions?: string | null;
  notes?: string | null;
  tags?: string[];
  ingredients?: {
    ingredientVariantId: string;
    quantity: number;
    systemUnitId?: string | null;
    orgUnitId?: string | null;
    preparationNotes?: string | null;
  }[];
}

export interface CreateBatchInput {
  recipeId: string;
  plannedQuantity: number;
  systemUnitId?: string | null;
  orgUnitId?: string | null;
  recipeMultiplier?: number;
  scheduledStartAt?: string | Date;
  date?: string;
  time?: string;
  leadBakerId?: string | null;
  notes?: string | null;
  outputLocationId?: string | null;
  tags?: string[];
}

export interface CompleteBatchInput {
  actualQuantity: number;
  wasteQuantity?: number;
  wasteReason?: string | null;
  qcData?: any;
  notes?: string | null;
  ingredientConsumptions?: {
    stockBatchId: string;
    quantity: number;
  }[];
}

export interface CreateTemplateInput {
  name: string;
  recipeId: string;
  quantity: number;
  systemUnitId?: string | null;
  orgUnitId?: string | null;
  recipeMultiplier?: number;
  duration?: number | null;
  leadBakerId?: string | null;
  notes?: string | null;
  isActive?: boolean;
  shelfLifeDays?: number | null;
}

export interface BakerySettingsUpdate {
  defaultBakerId?: string | null;
  autoCreateDailyBatches?: boolean;
  expiryWarningDays?: number;
  authMode?: 'SSO' | 'CARD_PIN';
  batchPrefix?: string;
  batchSeparator?: string;
  batchDateFormat?: string;
  batchSequence?: string;
  autoApproveBatches?: boolean;
  lowStockAlerts?: boolean;
  timezone?: string;
}

export interface AddBakerInput {
  memberId: string;
  specialties?: string[];
  isActive?: boolean;
}

export interface CreateDeliveryPartnerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  commissionRate?: number | null;
  fixedFee?: number | null;
  benefitType?: DeliveryBenefitType;
  reconciliationPolicy?: ReconciliationPolicy;
  isActive?: boolean;
}

export interface ReceiveIngredientsInput {
  receiptReference: string;
  receiptDate?: string | Date;
  notes?: string | null;
  lines: {
    ingredientId: string;
    quantity: number;
    unitCost: number;
    lotNumber?: string | null;
    expiryDate?: string | Date | null;
    supplier?: string | null;
  }[];
}

export type Product = any;
export type ProductType = any;
export type ProductVariant = any;
export type MemberRole = any;
export type BakeryBranding = any;
