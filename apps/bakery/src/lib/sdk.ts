import { tauriInvoke } from './tauri-bridge';

export const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined)
  );
};

export const isOfflineMode = () => {
  return typeof window !== 'undefined' && (localStorage.getItem('bakery_local_mode') === 'true' || !window.navigator.onLine);
};

export const setMemberToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bakery_member_token', token);
  }
};

export const setApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bakery_api_key', key);
  }
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
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'GET',
      path,
    });
    return unwrapResponse(resData);
  },

  post: async <T = any>(url: string, data?: any): Promise<any> => {
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'POST',
      path: url,
      body: data,
    });
    return unwrapResponse(resData);
  },

  put: async <T = any>(url: string, data?: any): Promise<any> => {
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'PUT',
      path: url,
      body: data,
    });
    return unwrapResponse(resData);
  },

  patch: async <T = any>(url: string, data?: any): Promise<any> => {
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'PATCH',
      path: url,
      body: data,
    });
    return unwrapResponse(resData);
  },

  delete: async <T = any>(url: string): Promise<any> => {
    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: 'DELETE',
      path: url,
    });
    return unwrapResponse(resData);
  },
};

export const bakery = {
  getBatches: (filters?: any) => tauriInvoke('get_batches', { filters }),
  getBatch: (id: string) => client.get(`/batches/${id}`),
  getBatchTraceability: (id: string) => tauriInvoke('get_batch_traceability', { id }),
  createBatch: (data: any) => tauriInvoke('create_batch', { userId: 'active-user', input: data }),
  updateBatch: (id: string, data: any) => tauriInvoke('update_batch', { userId: 'active-user', input: { id, ...data } }),
  deleteBatch: (id: string) => tauriInvoke('delete_batch', { userId: 'active-user', id }),
  startBatch: (id: string) => tauriInvoke('update_batch_status', { userId: 'active-user', id, status: 'IN_PROGRESS' }),
  completeBatch: (batchId: string, data: any) => tauriInvoke('update_batch_status', { userId: 'active-user', id: batchId, status: 'COMPLETED' }),
  cancelBatch: (id: string) => tauriInvoke('update_batch_status', { userId: 'active-user', id, status: 'CANCELLED' }),
  duplicateBatch: (id: string) => client.post(`/batches/${id}/duplicate`),

  getRecipes: () => tauriInvoke('get_recipes'),
  getRecipe: (id: string) => client.get(`/recipes/${id}`),
  createRecipe: (data: any) => tauriInvoke('create_recipe', { userId: 'active-user', input: data }),
  updateRecipe: (id: string, data: any) => tauriInvoke('update_recipe', { userId: 'active-user', recipe: { id, ...data } }),
  deleteRecipe: (id: string) => tauriInvoke('delete_recipe', { userId: 'active-user', id }),
  generateRecipeAi: (prompt: string) => client.post('/recipes/generate', { prompt }),

  getTemplates: () => tauriInvoke('get_templates'),
  createTemplate: (data: any) => tauriInvoke('create_template', { userId: 'active-user', input: data }),
  updateTemplate: (id: string, data: any) => tauriInvoke('update_template', { userId: 'active-user', template: { id, ...data } }),
  deleteTemplate: (id: string) => tauriInvoke('delete_template', { userId: 'active-user', id }),
  duplicateTemplate: (id: string) => client.post(`/templates/${id}/duplicate`),
  createBatchFromTemplate: (id: string) => client.post(`/templates/${id}/create-batch`),

  getSettings: () => tauriInvoke('get_settings', { organizationId: 'local-org' }),
  updateSettings: (data: any) => tauriInvoke('update_settings', { userId: 'active-user', settings: data }),

  getBakers: () => tauriInvoke('get_bakers'),
  addBaker: (data: any) => tauriInvoke('create_baker', { userId: 'active-user', baker: data }),
  updateBaker: (id: string, data: any) => tauriInvoke('update_baker', { userId: 'active-user', baker: { id, ...data } }),
  removeBaker: (id: string) => tauriInvoke('delete_baker', { userId: 'active-user', id }),

  getOverview: () => tauriInvoke('get_overview', { organizationId: 'local-org' }),

  getCategories: () => tauriInvoke('get_categories'),
  createCategory: (data: any) => tauriInvoke('create_category', { userId: 'active-user', category: data }),
  updateCategory: (id: string, data: any) => tauriInvoke('update_category', { userId: 'active-user', category: { id, ...data } }),
  deleteCategory: (id: string) => tauriInvoke('delete_category', { userId: 'active-user', id }),

  getIngredients: () => tauriInvoke('get_ingredients'),

  getAuthStatus: () => client.get('/auth/status'),
  sso: () => client.post('/auth/sso'),
  logout: () => tauriInvoke('logout_cloud_command'),
  getMe: () => client.get('/devices/me'),
};

const catalog = {
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
  listLocations: () => tauriInvoke('get_locations_command'),
};

const inventory = {
  list: () => client.get('/inventory'),
};

const auth = {
  terminalLogin: (cardId: string, pin: string, locationId?: string) => {
    return tauriInvoke('login_cloud_command', { cardId, pin, locationId });
  },
};

const sdk = {
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

  tauriInvoke<any>('get_settings', { organizationId: 'local-org' })
    .then((settings) => {
      if (settings?.apiEndpointUrl) {
        localStorage.setItem('bakery_api_url', settings.apiEndpointUrl);
        tauriInvoke('update_bakery_api_url', { apiUrl: settings.apiEndpointUrl }).catch(console.error);
      }
    })
    .catch((err) => console.error('Failed to load settings for API URL', err));

  if (!isOfflineMode()) {
    tauriInvoke<any>('get_device_config')
      .then((config) => {
        if (config?.deviceKey) {
          setApiKey(config.deviceKey);
        } else {
          return tauriInvoke<string | null>('get_provisioned_api_key');
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
