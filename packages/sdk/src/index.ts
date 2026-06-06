export const getSDK = (config: any) => {
  const defaultResponse = () => Promise.resolve({ data: [] });
  const proxyHandler = {
    get: (target: any, prop: string) => {
      if (prop === "getAuthStatus")
        return () => Promise.resolve({ user: { id: "1", role: "ADMIN" } });
      if (prop === "getSettings")
        return () => Promise.resolve({ settings: {} });
      if (prop === "logout") return () => Promise.resolve();
      if (prop === "getBatches") return () => Promise.resolve({ data: [] });
      if (prop === "getIngredients") return () => Promise.resolve({ data: [] });
      if (prop === "getRecipes") return () => Promise.resolve({ data: [] });
      return defaultResponse;
    },
  };

  const sdk: any = {
    client: {
      getBaseURL: () => config.baseURL,
      setBaseURL: (url: string) => {
        config.baseURL = url;
      },
      get: <T = any>(url: string, config?: any) => client.get<T>(url, config).then(r => r.data),
      post: <T = any>(url: string, data?: any, config?: any) => client.post<T>(url, data, config).then(r => r.data),
      put: <T = any>(url: string, data?: any, config?: any) => client.put<T>(url, data, config).then(r => r.data),
      patch: <T = any>(url: string, data?: any, config?: any) => client.patch<T>(url, data, config).then(r => r.data),
      delete: <T = any>(url: string, config?: any) => client.delete<T>(url, config).then(r => r.data),
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
    setApiKey: (key: string) => {},
  };

  sdk.bakery = new Proxy({}, proxyHandler);
  sdk.catalog = new Proxy({}, proxyHandler);
  sdk.inventory = new Proxy({}, proxyHandler);
  sdk.pos = new Proxy({}, proxyHandler);
  sdk.auth = new Proxy({}, proxyHandler);

  return sdk;
};

export type BakeryBatchListResponse = { data: any[] };
export type Product = any;
export type ProductType = any;
export type ProductVariant = any;
export type MemberRole = any;
export type BakeryBranding = any;
