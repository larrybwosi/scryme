import axios, { AxiosInstance } from "axios";

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  BAKER = "BAKER",
  STAFF = "STAFF",
  EMPLOYEE = "EMPLOYEE",
}

export type ProductType = "RETAIL" | "SERVICE" | "RAW_MATERIAL" | "COMPONENT";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  [key: string]: any;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  [key: string]: any;
}

export interface BakeryBatchListResponse {
  data: any[];
  metadata: {
    total: number;
    [key: string]: any;
  };
}

// Retained from HEAD to prevent external import breakage
export type BakeryBranding = any;

export interface SDKOptions {
  baseURL: string;
  onUnauthorized?: () => void;
  apiKey?: string;
}

export interface SDK {
  client: AxiosInstance & {
    getBaseURL: () => string;
    setBaseURL: (url: string) => void;
  };
  bakery: any;
  catalog: any;
  inventory: any;
  pos: any;
  setApiKey: (key: string) => void;
}

export const getSDK = (options: SDKOptions): SDK => {
  const client = axios.create({
    baseURL: options.baseURL,
  }) as any;

  client.getBaseURL = () => client.defaults.baseURL || "";
  client.setBaseURL = (url: string) => {
    client.defaults.baseURL = url;
  };

  if (options.apiKey) {
    client.defaults.headers.common["x-api-key"] = options.apiKey;
  }

  client.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      if (error.response?.status === 401 && options.onUnauthorized) {
        options.onUnauthorized();
      }
      return Promise.reject(error);
    },
  );

  const bakery = {
    getAuthStatus: () =>
      client.get("/bakery/auth/status").then((res: any) => res.data),
    sso: () => client.post("/bakery/auth/sso").then((res: any) => res.data),
    logout: () =>
      client.post("/bakery/auth/logout").then((res: any) => res.data),
    getBatches: (params: any) =>
      client.get("/bakery/batches", { params }).then((res: any) => res.data),
    getBatch: (id: string) =>
      client.get(`/bakery/batches/${id}`).then((res: any) => res.data),
    getBatchTraceability: (id: string) =>
      client
        .get(`/bakery/batches/${id}/traceability`)
        .then((res: any) => res.data),
    createBatch: (data: any) =>
      client.post("/bakery/batches", data).then((res: any) => res.data),
    getRecipes: () =>
      client.get("/bakery/recipes").then((res: any) => res.data),
    getRecipe: (id: string) =>
      client.get(`/bakery/recipes/${id}`).then((res: any) => res.data),
    createRecipe: (data: any) =>
      client.post("/bakery/recipes", data).then((res: any) => res.data),
    getTemplates: () =>
      client.get("/bakery/templates").then((res: any) => res.data),
    getSettings: () =>
      client.get("/bakery/settings").then((res: any) => res.data),
    getBakers: () => client.get("/bakery/bakers").then((res: any) => res.data),
    getOverview: () => client.get("/bakery").then((res: any) => res.data),
    getCategories: () =>
      client.get("/bakery/categories").then((res: any) => res.data),
    updateRecipe: (id: string, data: any) =>
      client.patch(`/bakery/recipes/${id}`, data).then((res: any) => res.data),
    deleteRecipe: (id: string) =>
      client.delete(`/bakery/recipes/${id}`).then((res: any) => res.data),
    updateBatch: (id: string, data: any) =>
      client.patch(`/bakery/batches/${id}`, data).then((res: any) => res.data),
    deleteBatch: (id: string) =>
      client.delete(`/bakery/batches/${id}`).then((res: any) => res.data),
    startBatch: (id: string) =>
      client.post(`/bakery/batches/${id}/start`).then((res: any) => res.data),
    completeBatch: (id: string, data: any) =>
      client
        .post(`/bakery/batches/${id}/complete`, data)
        .then((res: any) => res.data),
    cancelBatch: (id: string) =>
      client.post(`/bakery/batches/${id}/cancel`).then((res: any) => res.data),
    duplicateBatch: (id: string) =>
      client
        .post(`/bakery/batches/${id}/duplicate`)
        .then((res: any) => res.data),
    createTemplate: (data: any) =>
      client.post("/bakery/templates", data).then((res: any) => res.data),
    updateTemplate: (id: string, data: any) =>
      client
        .patch(`/bakery/templates/${id}`, data)
        .then((res: any) => res.data),
    deleteTemplate: (id: string) =>
      client.delete(`/bakery/templates/${id}`).then((res: any) => res.data),
    duplicateTemplate: (id: string) =>
      client
        .post(`/bakery/templates/${id}/duplicate`)
        .then((res: any) => res.data),
    createBatchFromTemplate: (id: string) =>
      client
        .post(`/bakery/templates/${id}/create-batch`)
        .then((res: any) => res.data),
    createCategory: (data: any) =>
      client.post("/bakery/categories", data).then((res: any) => res.data),
    updateCategory: (id: string, data: any) =>
      client.put(`/bakery/categories/${id}`, data).then((res: any) => res.data),
    deleteCategory: (id: string) =>
      client.delete(`/bakery/categories/${id}`).then((res: any) => res.data),
    generateRecipeAi: (prompt: string) =>
      client
        .post("/bakery/recipes/generate", { prompt })
        .then((res: any) => res.data),
    updateSettings: (data: any) =>
      client.put("/bakery/settings", data).then((res: any) => res.data),
    addBaker: (data: any) =>
      client.post("/bakery/bakers", data).then((res: any) => res.data),
    removeBaker: (id: string) =>
      client.delete(`/bakery/bakers/${id}`).then((res: any) => res.data),
    updateBaker: (id: string, data: any) =>
      client.patch(`/bakery/bakers/${id}`, data).then((res: any) => res.data),
    getIngredients: () =>
      client.get("/bakery/ingredients").then((res: any) => res.data),
    createIngredient: (data: any) =>
      client.post("/bakery/ingredients", data).then((res: any) => res.data),
    updateIngredient: (id: string, data: any) =>
      client
        .patch(`/bakery/ingredients/${id}`, data)
        .then((res: any) => res.data),
    deleteIngredient: (id: string) =>
      client.delete(`/bakery/ingredients/${id}`).then((res: any) => res.data),
  };

  const catalog = {
    getCategories: () =>
      client.get("/catalog/categories").then((res: any) => res.data),
    createCategory: (data: any) =>
      client.post("/catalog/categories", data).then((res: any) => res.data),
    updateCategory: (id: string, data: any) =>
      client
        .patch(`/catalog/categories/${id}`, data)
        .then((res: any) => res.data),
    deleteCategory: (id: string) =>
      client.delete(`/catalog/categories/${id}`).then((res: any) => res.data),
    getProducts: (params: any) =>
      client.get("/catalog/products", { params }).then((res: any) => res.data),
    getProduct: (id: string) =>
      client.get(`/catalog/products/${id}`).then((res: any) => res.data),
    createProduct: (data: any) =>
      client.post("/catalog/products", data).then((res: any) => res.data),
    updateProduct: (id: string, data: any) =>
      client
        .patch(`/catalog/products/${id}`, data)
        .then((res: any) => res.data),
    deleteProduct: (id: string) =>
      client.delete(`/catalog/products/${id}`).then((res: any) => res.data),
  };

  const inventory = {
    getLocations: () =>
      client.get("/inventory/locations").then((res: any) => res.data),
  };

  const pos = {
    getLocations: () =>
      client.get("/pos/locations").then((res: any) => res.data),
  };

  return {
    client,
    bakery,
    catalog,
    inventory,
    pos,
    setApiKey: (key: string) => {
      client.defaults.headers.common["x-api-key"] = key;
    },
  };
};
