import { getApiEndpoint } from '@/lib/api-config';

export const getOrgSlug = (): string => {
  if (typeof window === 'undefined') return 'default-org';
  return localStorage.getItem('bakery_org_slug') || 'default-org';
};

export const API_ROUTES = {
  PRODUCTION: {
    OVERVIEW: () => `/api/v3/${getOrgSlug()}/production/overview`,
    ATTENDANCE_STATUS: () => `/api/v3/${getOrgSlug()}/production/attendance/status`,

    // Batches
    BATCHES: () => `/api/v3/${getOrgSlug()}/production/batches`,
    BATCH_BY_ID: (id: string) => `/api/v3/${getOrgSlug()}/production/batches/${id}`,
    BATCH_TRACEABILITY: (id: string) => `/api/v3/${getOrgSlug()}/production/batches/${id}/traceability`,
    BATCH_START: (id: string) => `/api/v3/${getOrgSlug()}/production/batches/${id}/start`,
    BATCH_COMPLETE: (id: string) => `/api/v3/${getOrgSlug()}/production/batches/${id}/complete`,
    BATCH_CANCEL: (id: string) => `/api/v3/${getOrgSlug()}/production/batches/${id}/cancel`,
    BATCH_DUPLICATE: (id: string) => `/api/v3/${getOrgSlug()}/production/batches/${id}/duplicate`,

    // Recipes
    RECIPES: () => `/api/v3/${getOrgSlug()}/production/recipes`,
    RECIPE_BY_ID: (id: string) => `/api/v3/${getOrgSlug()}/production/recipes/${id}`,
    RECIPE_DUPLICATE: (id: string) => `/api/v3/${getOrgSlug()}/production/recipes/${id}/duplicate`,
    RECIPE_GENERATE_AI: () => `/api/v3/${getOrgSlug()}/production/recipes/generate`,

    // Templates
    TEMPLATES: () => `/api/v3/${getOrgSlug()}/production/templates`,
    TEMPLATE_BY_ID: (id: string) => `/api/v3/${getOrgSlug()}/production/templates/${id}`,
    TEMPLATE_DUPLICATE: (id: string) => `/api/v3/${getOrgSlug()}/production/templates/${id}/duplicate`,
    TEMPLATE_CREATE_BATCH: (id: string) => `/api/v3/${getOrgSlug()}/production/templates/${id}/create-batch`,

    // Categories
    CATEGORIES: () => `/api/v3/${getOrgSlug()}/production/categories`,
    CATEGORY_BY_ID: (id: string) => `/api/v3/${getOrgSlug()}/production/categories/${id}`,

    // Ingredients
    INGREDIENTS: () => `/api/v3/${getOrgSlug()}/production/ingredients`,
    INGREDIENT_BY_ID: (id: string) => `/api/v3/${getOrgSlug()}/production/ingredients/${id}`,
    INGREDIENTS_RECEIVE: () => `/api/v3/${getOrgSlug()}/production/ingredients/receive`,
    INGREDIENT_RECORDS: () => `/api/v3/${getOrgSlug()}/production/ingredients/records`,

    // Settings & Staff/Bakers
    SETTINGS: () => `/api/v3/${getOrgSlug()}/production/settings`,
    BAKERS: () => `/api/v3/${getOrgSlug()}/production/bakers`,
    BAKER_BY_ID: (id: string) => `/api/v3/${getOrgSlug()}/production/bakers/${id}`,

    // Quality Incidents
    QUALITY_INCIDENTS: () => `/api/v3/${getOrgSlug()}/production/quality-incidents`,
    QUALITY_INCIDENT_BY_ID: (id: string) => `/api/v3/${getOrgSlug()}/production/quality-incidents/${id}`,

    // Auth & Status
    AUTH_SETUP: () => `/api/v3/${getOrgSlug()}/production/auth/setup`,
    AUTH_STATUS: () => `/api/v3/${getOrgSlug()}/production/auth/status`,
    AUTH_LOGOUT: () => `/api/v3/${getOrgSlug()}/production/auth/logout`,
    AUTH_SSO: () => `/api/v3/${getOrgSlug()}/production/auth/sso`,
  },
  POS: {
    LOGIN: () => `/api/v3/${getOrgSlug()}/pos/login`,
  },
  INVENTORY: {
    LOCATIONS: () => `/api/v3/${getOrgSlug()}/pos/locations`,
  },
  DEVICES: {
    ME: () => `/api/v3/${getOrgSlug()}/pos/me`,
  },
};
