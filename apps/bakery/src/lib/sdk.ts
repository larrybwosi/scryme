import { ScrymeClientSDK } from '@scryme/sdk/client';
import { invoke } from '@tauri-apps/api/core';
import { sanitizeApiUrl } from '@/utils/url';
import { tauriInvoke } from './tauri-bridge';
import { API_ROUTES, getOrgSlug } from '@/config/api';

export const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined)
  );
};

export const isOfflineMode = () => {
  return typeof window !== 'undefined' && (localStorage.getItem('bakery_local_mode') === 'true' || !window.navigator.onLine);
};

const getInitialApiUrl = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('bakery_api_url') : null;
  const envUrl = import.meta.env.VITE_API_URL;
  return sanitizeApiUrl(customUrl || envUrl || 'https://api.scryme.tech');
};

const getInitialOrgSlug = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bakery_org_slug') || 'default-org';
  }
  return 'default-org';
};

export const scrymeSDK = new ScrymeClientSDK({
  clientId: 'bakery-app',
  orgSlug: getInitialOrgSlug(),
  baseURL: getInitialApiUrl(),
});

let memberTokenState: string | null = null;
let apiKeyState: string | null = null;

export const setMemberToken = (token: string) => {
  memberTokenState = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bakery_member_token', token);
  }
};

export const setApiKey = (key: string) => {
  apiKeyState = key;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bakery_api_key', key);
  }
};

const formatApiPath = (url: string): string => {
  if (!url || url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return url;

  const orgSlug = getOrgSlug();
  return `/api/v3/${orgSlug}/production${url.startsWith('/') ? '' : '/'}${url}`;
};

const unwrapResponse = (data: any) => {
  if (data && typeof data === 'object' && data.success !== undefined && 'data' in data) {
    if (data.meta || data.metadata) {
      return {
        data: data.data,
        metadata: data.meta || data.metadata,
      };
    }
    return data.data;
  }
  return data;
};

export const client = {
  get: async <T = any>(url: string, config?: any): Promise<any> => {
    let path = formatApiPath(url);
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        path += (path.includes('?') ? '&' : '?') + qs;
      }
    }
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'GET',
      path,
    });
    return unwrapResponse(resData);
  },

  post: async <T = any>(url: string, data?: any, config?: any): Promise<any> => {
    const formattedUrl = formatApiPath(url);
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'POST',
      path: formattedUrl,
      body: data,
    });
    return unwrapResponse(resData);
  },

  put: async <T = any>(url: string, data?: any, config?: any): Promise<any> => {
    const formattedUrl = formatApiPath(url);
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'PUT',
      path: formattedUrl,
      body: data,
    });
    return unwrapResponse(resData);
  },

  patch: async <T = any>(url: string, data?: any, config?: any): Promise<any> => {
    const formattedUrl = formatApiPath(url);
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'PATCH',
      path: formattedUrl,
      body: data,
    });
    return unwrapResponse(resData);
  },

  delete: async <T = any>(url: string, config?: any): Promise<any> => {
    const formattedUrl = formatApiPath(url);
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'DELETE',
      path: formattedUrl,
    });
    return unwrapResponse(resData);
  },

  setBaseURL: (url: string) => {
    scrymeSDK.axiosInstance.defaults.baseURL = url;
  },

  getBaseURL: () => {
    return scrymeSDK.axiosInstance.defaults.baseURL || '';
  },
};

export const bakery = {
  getBatches: (filters?: any) => client.get('/batches', { params: filters }),
  getBatch: (id: string) => client.get(`/batches/${id}`),
  getBatchTraceability: (id: string) => client.get(`/batches/${id}/traceability`),
  createBatch: (data: any) => client.post('/batches', data),
  updateBatch: (id: string, data: any) => client.patch(`/batches/${id}`, data),
  deleteBatch: (id: string) => client.delete(`/batches/${id}`),
  startBatch: (id: string) => client.post(`/batches/${id}/start`),
  completeBatch: (batchId: string, data: any) => client.post(`/batches/${batchId}/complete`, data),
  cancelBatch: (id: string) => client.post(`/batches/${id}/cancel`),
  duplicateBatch: (id: string) => client.post(`/batches/${id}/duplicate`),

  getRecipes: () => client.get('/recipes'),
  getRecipe: (id: string) => client.get(`/recipes/${id}`),
  createRecipe: (data: any) => client.post('/recipes', data),
  updateRecipe: (id: string, data: any) => client.patch(`/recipes/${id}`, data),
  deleteRecipe: (id: string) => client.delete(`/recipes/${id}`),
  generateRecipeAi: (prompt: string) => client.post('/recipes/generate', { prompt }),

  getTemplates: () => client.get('/templates'),
  createTemplate: (data: any) => client.post('/templates', data),
  updateTemplate: (id: string, data: any) => client.patch(`/templates/${id}`, data),
  deleteTemplate: (id: string) => client.delete(`/templates/${id}`),
  duplicateTemplate: (id: string) => client.post(`/templates/${id}/duplicate`),
  createBatchFromTemplate: (id: string) => client.post(`/templates/${id}/create-batch`),

  getSettings: () => client.get('/settings'),
  updateSettings: (data: any) => client.patch('/settings', data),

  getBakers: () => client.get('/bakers'),
  addBaker: (data: any) => client.post('/bakers', data),
  updateBaker: (id: string, data: any) => client.patch(`/bakers/${id}`, data),
  removeBaker: (id: string) => client.delete(`/bakers/${id}`),

  getOverview: () => client.get('/overview'),

  getCategories: () => client.get('/categories'),
  createCategory: (data: any) => client.post('/categories', data),
  updateCategory: (id: string, data: any) => client.patch(`/categories/${id}`, data),
  deleteCategory: (id: string) => client.delete(`/categories/${id}`),

  getIngredients: () => client.get('/ingredients'),
  createIngredient: (data: any) => client.post('/ingredients', data),
  updateIngredient: (id: string, data: any) => client.patch(`/ingredients/${id}`, data),
  deleteIngredient: (id: string) => client.delete(`/ingredients/${id}`),

  getAuthStatus: () => client.get('/auth/status'),
  sso: () => client.post('/auth/sso'),
  logout: () => client.post('/auth/logout'),
  getMe: () => client.get('/devices/me'),
};

const catalog = {
  ...scrymeSDK.catalog,
  getProducts: (params?: any) => client.get('/catalog/products', { params }),
  createProduct: (data: any) => client.post('/catalog/products', data),
  getProduct: (productId: string) => client.get(`/catalog/products/${productId}`),
  updateProduct: (productId: string, data: any) => client.patch(`/catalog/products/${productId}`, data),
  deleteProduct: (productId: string) => client.delete(`/catalog/products/${productId}`),
  getVariants: (params: any) => client.get('/catalog/variants', { params }),
  getCategories: () => client.get('/catalog/categories'),
  createCategory: (data: any) => client.post('/catalog/categories', data),
  getCategory: (categoryId: string) => client.get(`/catalog/categories/${categoryId}`),
  updateCategory: (categoryId: string, data: any) => client.patch(`/catalog/categories/${categoryId}`, data),
  deleteCategory: (categoryId: string) => client.delete(`/catalog/categories/${categoryId}`),
};

const pos = {
  ...scrymeSDK.pos,
  listLocations: () => client.get(API_ROUTES.INVENTORY.LOCATIONS()),
};

const inventory = {
  ...scrymeSDK.inventory,
  list: () => client.get('/inventory'),
};

const auth = {
  ...scrymeSDK.auth,
  terminalLogin: (cardId: string, pin: string, locationId?: string) => {
    return client.post(API_ROUTES.POS.LOGIN(), { cardId, pin, locationId });
  },
};

const sdk = {
  ...scrymeSDK,
  client,
  bakery,
  catalog,
  pos,
  inventory,
  auth,
  setMemberToken,
  setApiKey,
};

if (typeof window !== 'undefined') {
  const memberToken = localStorage.getItem('bakery_member_token');
  const memberId = localStorage.getItem('bakery_member_id');
  const savedUser = localStorage.getItem('bakery_user');

  if (memberToken && memberId) {
    tauriInvoke('sync_member_token_command', { token: memberToken, memberId }).catch(console.error);
    if (savedUser) {
      try {
        tauriInvoke('restore_member_session', { member: JSON.parse(savedUser) }).catch(console.error);
      } catch (e) {
        console.error('Failed to restore member session', e);
      }
    }
  }

  invoke<any>('get_settings', { organizationId: 'local-org' })
    .then((settings) => {
      if (settings?.apiEndpointUrl) {
        const sanitizedUrl = sanitizeApiUrl(settings.apiEndpointUrl);
        localStorage.setItem('bakery_api_url', sanitizedUrl);
        if (client.getBaseURL() !== sanitizedUrl) {
          client.setBaseURL(sanitizedUrl);
        }
        tauriInvoke('update_bakery_api_url', { apiUrl: sanitizedUrl }).catch(console.error);
      }
    })
    .catch((err) => console.error('Failed to load settings for API URL', err));

  if (!isOfflineMode()) {
    invoke<any>('get_device_config')
      .then((config) => {
        if (config?.deviceKey) {
          setApiKey(config.deviceKey);
        } else {
          return invoke<string | null>('get_provisioned_api_key');
        }
      })
      .then((apiKey) => {
        if (typeof apiKey === 'string') {
          setApiKey(apiKey);
        }
      })
      .catch((err) => {
        console.error('Failed to load provisioned API Key', err);
      });
  }
}

export default sdk;
