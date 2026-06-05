import { ScrymeClient } from '../core/client';

export class ScrymeV2 {
  constructor(private readonly client: ScrymeClient) {}

  public readonly bakery = {
    getOverview: () => this.client.get('/v2/bakery'),
    getIngredients: (): Promise<any> => this.client.get('/v2/bakery/ingredients'),
    createIngredient: (data: any): Promise<any> => this.client.post('/v2/bakery/ingredients', data),
    updateIngredient: (id: string, data: any): Promise<any> => this.client.patch(`/v2/bakery/ingredients/${id}`, data),
    deleteIngredient: (id: string) => this.client.delete(`/v2/bakery/ingredients/${id}`),

    getRecipes: (): Promise<any> => this.client.get('/v2/bakery/recipes'),
    getRecipe: (id: string): Promise<any> => this.client.get(`/v2/bakery/recipes/${id}`),
    createRecipe: (data: any): Promise<any> => this.client.post('/v2/bakery/recipes', data),
    updateRecipe: (id: string, data: any): Promise<any> => this.client.patch(`/v2/bakery/recipes/${id}`, data),
    deleteRecipe: (id: string) => this.client.delete(`/v2/bakery/recipes/${id}`),
    duplicateRecipe: (id: string): Promise<any> => this.client.post(`/v2/bakery/recipes/${id}/duplicate`),
    generateRecipeAi: (prompt: string) => this.client.post('/v2/bakery/recipes/generate', { prompt }),

    getBatches: (params?: any): Promise<any> => this.client.get('/v2/bakery/batches', { params }),
    getBatch: (id: string): Promise<any> => this.client.get(`/v2/bakery/batches/${id}`),
    createBatch: (data: any): Promise<any> => this.client.post('/v2/bakery/batches', data),
    updateBatch: (id: string, data: any): Promise<any> => this.client.patch(`/v2/bakery/batches/${id}`, data),
    deleteBatch: (id: string) => this.client.delete(`/v2/bakery/batches/${id}`),
    startBatch: (id: string): Promise<any> => this.client.post(`/v2/bakery/batches/${id}/start`),
    completeBatch: (id: string, data: any): Promise<any> => this.client.post(`/v2/bakery/batches/${id}/complete`, data),
    cancelBatch: (id: string): Promise<any> => this.client.post(`/v2/bakery/batches/${id}/cancel`),
    duplicateBatch: (id: string): Promise<any> => this.client.post(`/v2/bakery/batches/${id}/duplicate`),
    getBatchTraceability: (id: string) => this.client.get(`/v2/bakery/batches/${id}/traceability`),

    getTemplates: () => this.client.get('/v2/bakery/templates'),
    createTemplate: (data: any) => this.client.post('/v2/bakery/templates', data),
    updateTemplate: (id: string, data: any) => this.client.patch(`/v2/bakery/templates/${id}`, data),
    deleteTemplate: (id: string) => this.client.delete(`/v2/bakery/templates/${id}`),
    duplicateTemplate: (id: string) => this.client.post(`/v2/bakery/templates/${id}/duplicate`),
    createBatchFromTemplate: (id: string) => this.client.post(`/v2/bakery/templates/${id}/create-batch`),

    getCategories: (): Promise<any> => this.client.get('/v2/bakery/categories'),
    createCategory: (data: any): Promise<any> => this.client.post('/v2/bakery/categories', data),
    updateCategory: (id: string, data: any): Promise<any> => this.client.put(`/v2/bakery/categories/${id}`, data),
    deleteCategory: (id: string) => this.client.delete(`/v2/bakery/categories/${id}`),

    getSettings: () => this.client.get('/v2/bakery/settings'),
    updateSettings: (data: any) => this.client.put('/v2/bakery/settings', data),

    getBakers: () => this.client.get('/v2/bakery/bakers'),
    addBaker: (data: any) => this.client.post('/v2/bakery/bakers', data),
    updateBaker: (id: string, data: any) => this.client.patch(`/v2/bakery/bakers/${id}`, data),
    removeBaker: (id: string) => this.client.delete(`/v2/bakery/bakers/${id}`),

    getAuthStatus: () => this.client.get('/v2/bakery/auth/status'),
    sso: () => this.client.post('/v2/bakery/auth/sso'),
    logout: () => this.client.post('/v2/bakery/auth/logout'),
  };

  public readonly units = {
    getSystemUnits: (): Promise<any> => this.client.get('/v2/units/system'),
    getOrganizationUnits: (): Promise<any> => this.client.get('/v2/units/organization'),
    createOrganizationUnit: (data: any): Promise<any> => this.client.post('/v2/units/organization', data),
    updateOrganizationUnit: (id: string, data: any): Promise<any> => this.client.patch(`/v2/units/organization/${id}`, data),
    deleteOrganizationUnit: (id: string) => this.client.delete(`/v2/units/organization/${id}`),
  };

  public readonly catalog = {
    getProducts: (params?: any): Promise<any> => this.client.get('/v2/catalog/products', { params }),
    createProduct: (data: any): Promise<any> => this.client.post('/v2/catalog/products', data),
    getProduct: (id: string): Promise<any> => this.client.get(`/v2/catalog/products/${id}`),
    updateProduct: (id: string, data: any): Promise<any> => this.client.patch(`/v2/catalog/products/${id}`, data),
    deleteProduct: (id: string) => this.client.delete(`/v2/catalog/products/${id}`),
    getCategories: (): Promise<any> => this.client.get('/v2/catalog/categories'),
    getCategory: (id: string): Promise<any> => this.client.get(`/v2/catalog/categories/${id}`),
    createCategory: (data: any): Promise<any> => this.client.post('/v2/catalog/categories', data),
    updateCategory: (id: string, data: any): Promise<any> => this.client.patch(`/v2/catalog/categories/${id}`, data),
    deleteCategory: (id: string) => this.client.delete(`/v2/catalog/categories/${id}`),
    getVariants: (params?: any): Promise<any> => this.client.get('/v2/catalog/variants', { params }),
  };

  public readonly inventory = {
    list: (): Promise<any> => this.client.get('/v2/inventory'),
  };

  public readonly pos = {
    listLocations: (): Promise<any> => this.client.get('/v2/catalog/locations'),
  };
}
