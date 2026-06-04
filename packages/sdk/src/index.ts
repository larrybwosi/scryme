import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface SDKConfig {
  baseURL?: string;
  apiKey?: string;
  onUnauthorized?: () => void;
}

export const getSDK = (config: SDKConfig) => {
  const client: AxiosInstance = axios.create({
    baseURL: config.baseURL || '/api/v2',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
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
      get: <T = any>(url: string, config?: any) => client.get<T>(url, config).then(r => r.data),
      post: <T = any>(url: string, data?: any, config?: any) => client.post<T>(url, data, config).then(r => r.data),
      put: <T = any>(url: string, data?: any, config?: any) => client.put<T>(url, data, config).then(r => r.data),
      patch: <T = any>(url: string, data?: any, config?: any) => client.patch<T>(url, data, config).then(r => r.data),
      delete: <T = any>(url: string, config?: any) => client.delete<T>(url, config).then(r => r.data),
    },
    setApiKey: (key: string) => {
      client.defaults.headers.common['x-api-key'] = key;
    },

    bakery: {
      getOverview: () => sdk.client.get('/bakery'),
      getIngredients: () => sdk.client.get('/bakery/ingredients'),
      createIngredient: (data: any) => sdk.client.post('/bakery/ingredients', data),
      updateIngredient: (id: string, data: any) => sdk.client.patch(`/bakery/ingredients/${id}`, data),
      deleteIngredient: (id: string) => sdk.client.delete(`/bakery/ingredients/${id}`),

      getRecipes: () => sdk.client.get('/bakery/recipes'),
      getRecipe: (id: string) => sdk.client.get(`/bakery/recipes/${id}`),
      createRecipe: (data: any) => sdk.client.post('/bakery/recipes', data),
      updateRecipe: (id: string, data: any) => sdk.client.patch(`/bakery/recipes/${id}`, data),
      deleteRecipe: (id: string) => sdk.client.delete(`/bakery/recipes/${id}`),
      duplicateRecipe: (id: string) => sdk.client.post(`/bakery/recipes/${id}/duplicate`),
      generateRecipeAi: (prompt: string) => sdk.client.post('/bakery/recipes/generate', { prompt }),

      getBatches: (params?: any) => sdk.client.get('/bakery/batches', { params }),
      getBatch: (id: string) => sdk.client.get(`/bakery/batches/${id}`),
      createBatch: (data: any) => sdk.client.post('/bakery/batches', data),
      updateBatch: (id: string, data: any) => sdk.client.patch(`/bakery/batches/${id}`, data),
      deleteBatch: (id: string) => sdk.client.delete(`/bakery/batches/${id}`),
      startBatch: (id: string) => sdk.client.post(`/bakery/batches/${id}/start`),
      completeBatch: (id: string, data: any) => sdk.client.post(`/bakery/batches/${id}/complete`, data),
      cancelBatch: (id: string) => sdk.client.post(`/bakery/batches/${id}/cancel`),
      duplicateBatch: (id: string) => sdk.client.post(`/bakery/batches/${id}/duplicate`),
      getBatchTraceability: (id: string) => sdk.client.get(`/bakery/batches/${id}/traceability`),

      getTemplates: () => sdk.client.get('/bakery/templates'),
      createTemplate: (data: any) => sdk.client.post('/bakery/templates', data),
      updateTemplate: (id: string, data: any) => sdk.client.patch(`/bakery/templates/${id}`, data),
      deleteTemplate: (id: string) => sdk.client.delete(`/bakery/templates/${id}`),
      duplicateTemplate: (id: string) => sdk.client.post(`/bakery/templates/${id}/duplicate`),
      createBatchFromTemplate: (id: string) => sdk.client.post(`/bakery/templates/${id}/create-batch`),

      getCategories: () => sdk.client.get('/bakery/categories'),
      createCategory: (data: any) => sdk.client.post('/bakery/categories', data),
      updateCategory: (id: string, data: any) => sdk.client.put(`/bakery/categories/${id}`, data),
      deleteCategory: (id: string) => sdk.client.delete(`/bakery/categories/${id}`),

      getSettings: () => sdk.client.get('/bakery/settings'),
      updateSettings: (data: any) => sdk.client.put('/bakery/settings', data),

      getBakers: () => sdk.client.get('/bakery/bakers'),
      addBaker: (data: any) => sdk.client.post('/bakery/bakers', data),
      updateBaker: (id: string, data: any) => sdk.client.patch(`/bakery/bakers/${id}`, data),
      removeBaker: (id: string) => sdk.client.delete(`/bakery/bakers/${id}`),

      getAuthStatus: () => sdk.client.get('/bakery/auth/status'),
      sso: () => sdk.client.post('/bakery/auth/sso'),
      logout: () => sdk.client.post('/bakery/auth/logout'),
    },

    units: {
      getSystemUnits: () => sdk.client.get('/units/system'),
      getOrganizationUnits: () => sdk.client.get('/units/organization'),
      createOrganizationUnit: (data: any) => sdk.client.post('/units/organization', data),
      updateOrganizationUnit: (id: string, data: any) => sdk.client.patch(`/units/organization/${id}`, data),
      deleteOrganizationUnit: (id: string) => sdk.client.delete(`/units/organization/${id}`),
    },

    catalog: {
      getProducts: (params?: any) => sdk.client.get('/catalog/products', { params }),
      createProduct: (data: any) => sdk.client.post('/catalog/products', data),
      updateProduct: (id: string, data: any) => sdk.client.patch(`/catalog/products/${id}`, data),
      deleteProduct: (id: string) => sdk.client.delete(`/catalog/products/${id}`),
      getCategories: () => sdk.client.get('/catalog/categories'),
    }
  };

  return sdk;
};

export type BakeryBatchListResponse = { data: any[] };
export type Product = any;
export type ProductType = any;
export type ProductVariant = any;
export type MemberRole = any;
export type BakeryBranding = any;
