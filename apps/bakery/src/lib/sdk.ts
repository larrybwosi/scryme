import { ScrymeClientSDK } from '@scryme/sdk/client';
import { invoke } from '@tauri-apps/api/core';
import { sanitizeApiUrl } from '@/utils/url';
import { tauriInvoke } from './tauri-bridge';

// Check if running in Tauri
export const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined)
  );
};

export const isOfflineMode = () => {
  return typeof window !== 'undefined' && (localStorage.getItem('bakery_local_mode') === 'true' || !window.navigator.onLine);
};

const initialApiUrl = sanitizeApiUrl(
  (typeof window !== 'undefined' ? localStorage.getItem('bakery_api_url') : null) ||
    import.meta.env.VITE_API_URL ||
    'https://api.scryme.tech/api/v2'
);

const initialOrgSlug = (typeof window !== 'undefined' ? localStorage.getItem('bakery_org_slug') : null) || 'default-org';

// Initialize ScrymeClientSDK instance
export const scrymeSDK = new ScrymeClientSDK({
  clientId: 'bakery-app',
  orgSlug: initialOrgSlug,
  baseURL: initialApiUrl,
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

// Request interceptor to attach authentication headers
scrymeSDK.axiosInstance.interceptors.request.use((config) => {
  if (memberTokenState) {
    config.headers['x-member-token'] = memberTokenState;
    if (!config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${memberTokenState}`;
    }
  } else if (apiKeyState) {
    config.headers['x-api-key'] = apiKeyState;
  }
  return config;
});

// Response interceptor for 401 unauthorized handling
scrymeSDK.axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bakery-unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Client wrapper handling HTTP calls, routing through Tauri IPC proxy when running in Tauri
const originalAxios = scrymeSDK.axiosInstance;

export const client = {
  get: async <T = any>(url: string, config?: any): Promise<any> => {
    if (isTauri() && !url.startsWith('http') && config?.useProxy !== false) {
      let path = url;
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
      return tauriInvoke<T>('authenticated_api_request', {
        method: 'GET',
        path,
      });
    }
    const res = await originalAxios.get<T>(url, config);
    return res.data;
  },

  post: async <T = any>(url: string, data?: any, config?: any): Promise<any> => {
    if (isTauri() && !url.startsWith('http') && config?.useProxy !== false) {
      return tauriInvoke<T>('authenticated_api_request', {
        method: 'POST',
        path: url,
        body: data,
      });
    }
    const res = await originalAxios.post<T>(url, data, config);
    return res.data;
  },

  put: async <T = any>(url: string, data?: any, config?: any): Promise<any> => {
    if (isTauri() && !url.startsWith('http') && config?.useProxy !== false) {
      return tauriInvoke<T>('authenticated_api_request', {
        method: 'PUT',
        path: url,
        body: data,
      });
    }
    const res = await originalAxios.put<T>(url, data, config);
    return res.data;
  },

  patch: async <T = any>(url: string, data?: any, config?: any): Promise<any> => {
    if (isTauri() && !url.startsWith('http') && config?.useProxy !== false) {
      return tauriInvoke<T>('authenticated_api_request', {
        method: 'PATCH',
        path: url,
        body: data,
      });
    }
    const res = await originalAxios.patch<T>(url, data, config);
    return res.data;
  },

  delete: async <T = any>(url: string, config?: any): Promise<any> => {
    if (isTauri() && !url.startsWith('http') && config?.useProxy !== false) {
      return tauriInvoke<T>('authenticated_api_request', {
        method: 'DELETE',
        path: url,
      });
    }
    const res = await originalAxios.delete<T>(url, config);
    return res.data;
  },

  setBaseURL: (url: string) => {
    scrymeSDK.axiosInstance.defaults.baseURL = url;
  },

  getBaseURL: () => {
    return scrymeSDK.axiosInstance.defaults.baseURL || '';
  },
};

// Bakery domain module
export const bakery = {
  getBatches: (filters?: any) => client.get('/bakery/batches', { params: filters }),
  getBatch: (id: string) => client.get(`/bakery/batches/${id}`),
  getBatchTraceability: (id: string) => client.get(`/bakery/batches/${id}/traceability`),
  createBatch: (data: any) => client.post('/bakery/batches', data),
  updateBatch: (id: string, data: any) => client.patch(`/bakery/batches/${id}`, data),
  deleteBatch: (id: string) => client.delete(`/bakery/batches/${id}`),
  startBatch: (id: string) => client.post(`/bakery/batches/${id}/start`),
  completeBatch: (batchId: string, data: any) => client.post(`/bakery/batches/${batchId}/complete`, data),
  cancelBatch: (id: string) => client.post(`/bakery/batches/${id}/cancel`),
  duplicateBatch: (id: string) => client.post(`/bakery/batches/${id}/duplicate`),

  getRecipes: () => client.get('/bakery/recipes'),
  getRecipe: (id: string) => client.get(`/bakery/recipes/${id}`),
  createRecipe: (data: any) => client.post('/bakery/recipes', data),
  updateRecipe: (id: string, data: any) => client.patch(`/bakery/recipes/${id}`, data),
  deleteRecipe: (id: string) => client.delete(`/bakery/recipes/${id}`),
  generateRecipeAi: (prompt: string) => client.post('/bakery/recipes/generate', { prompt }),

  getTemplates: () => client.get('/bakery/templates'),
  createTemplate: (data: any) => client.post('/bakery/templates', data),
  updateTemplate: (id: string, data: any) => client.patch(`/bakery/templates/${id}`, data),
  deleteTemplate: (id: string) => client.delete(`/bakery/templates/${id}`),
  duplicateTemplate: (id: string) => client.post(`/bakery/templates/${id}/duplicate`),
  createBatchFromTemplate: (id: string) => client.post(`/bakery/templates/${id}/create-batch`),

  getSettings: () => client.get('/bakery/settings'),
  updateSettings: (data: any) => client.patch('/bakery/settings', data),

  getBakers: () => client.get('/bakery/bakers'),
  addBaker: (data: any) => client.post('/bakery/bakers', data),
  updateBaker: (id: string, data: any) => client.patch(`/bakery/bakers/${id}`, data),
  removeBaker: (id: string) => client.delete(`/bakery/bakers/${id}`),

  getOverview: () => client.get('/bakery/overview'),

  getCategories: () => client.get('/bakery/categories'),
  createCategory: (data: any) => client.post('/bakery/categories', data),
  updateCategory: (id: string, data: any) => client.patch(`/bakery/categories/${id}`, data),
  deleteCategory: (id: string) => client.delete(`/bakery/categories/${id}`),

  getIngredients: () => client.get('/bakery/ingredients'),
  createIngredient: (data: any) => client.post('/bakery/ingredients', data),
  updateIngredient: (id: string, data: any) => client.patch(`/bakery/ingredients/${id}`, data),
  deleteIngredient: (id: string) => client.delete(`/bakery/ingredients/${id}`),

  getAuthStatus: () => client.get('/bakery/auth/status'),
  sso: () => client.post('/bakery/auth/sso'),
  logout: () => client.post('/bakery/auth/logout'),
  getMe: () => client.get('/bakery/me'),
};

// Catalog submodule extensions for bakery app
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

// POS submodule extensions
const pos = {
  ...scrymeSDK.pos,
  listLocations: () => client.get('/inventory/locations'),
};

// Inventory submodule extensions
const inventory = {
  ...scrymeSDK.inventory,
  list: () => client.get('/inventory'),
};

// Auth submodule extensions
const auth = {
  ...scrymeSDK.auth,
  terminalLogin: (cardId: string, pin: string, locationId?: string) =>
    client.post('/auth/terminal-login', { cardId, pin, locationId }),
};

// Main SDK export bundle
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

// Persistent token loading on startup
if (typeof window !== 'undefined' && !isTauri()) {
  const memberToken = localStorage.getItem('bakery_member_token');
  if (memberToken) {
    setMemberToken(memberToken);
  }
}

// Tauri IPC setup
if (isTauri()) {
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
