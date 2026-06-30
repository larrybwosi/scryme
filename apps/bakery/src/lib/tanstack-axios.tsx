import axios, { AxiosInstance } from 'axios';
import { isTauri } from './sdk';
import { tauriInvoke } from './tauri-bridge';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ReactNode } from 'react';
import type { InventoryLocation } from '@repo/db';

export interface ProductSupplier {
  id: string;
  supplierId: string;
  productId: string;
  organizationId: string;
}

export interface SalesReportCriteria {
  startDate: string;
  endDate: string;
  locationId?: string;
  productId?: string;
  customerId?: string;
}

export interface SalesReportResponse {
  totalSales: number;
  totalOrders: number;
  items: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export interface ReceiptResponse {
  id: string;
  orderId: string;
  createdAt: string;
  content: string;
  url: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    message?: string;
    success: boolean;
  };
  error?: string;
}

export interface InvoiceResponse {
  url: string;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  pointsPerDollar: number;
  redemptionRate: number;
  isActive: boolean;
  organizationId: string;
  tiers: LoyaltyTier[];
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  pointMultiplier: number;
  benefits: string[];
  programId: string;
}

export interface PointsConfig {
  id: string;
  actionType: string;
  points: number;
  description?: string;
  isActive: boolean;
  organizationId: string;
}

export interface CreateLoyaltyProgramInput {
  organizationId: string;
  name: string;
  description?: string;
  pointsPerDollar: number;
  redemptionRate: number;
  isActive: boolean;
  tiers: Omit<LoyaltyTier, 'id' | 'programId'>[];
}

export interface UpdateLoyaltyProgramInput {
  programId: string;
  name?: string;
  description?: string;
  pointsPerDollar?: number;
  redemptionRate?: number;
  isActive?: boolean;
  tiersToCreate?: Omit<LoyaltyTier, 'id' | 'programId'>[];
  tiersToUpdate?: Partial<LoyaltyTier> & { id: string };
  tierIdsToDelete?: string[];
}

export interface SetPointsConfigInput {
  organizationId: string;
  configs: Omit<PointsConfig, 'id' | 'organizationId'>[];
}

// Axios client constructor
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.axiosInstance.interceptors.request.use(
      async config => {
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => {
        if (response.data.meta?.message && response.data.meta.success) {
          toast.success(response.data.meta.message);
        }
        return response;
      },
      error => {
        const message = error.response?.data?.error || error.response?.data?.message || 'An unexpected error occurred';
        console.log(message);
        // toast.error(message);
        return Promise.reject(error);
      }
    );
  }

  private async request<T = any>(config: { method: string; path: string; data?: any }): Promise<T> {
    if (isTauri()) {
       return tauriInvoke<T>('authenticated_api_request', {
         method: config.method,
         path: config.path,
         body: config.data
       });
    }

    const { method, path, data } = config;
    const axiosMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';

    if (axiosMethod === 'get' || axiosMethod === 'delete') {
      return this.axiosInstance[axiosMethod](path).then(res => res.data);
    }
    return this.axiosInstance[axiosMethod](path, data).then(res => res.data);
  }

  // Locations Service
  locations = {
    list: async (organizationId: string) =>
      this.request({ method: 'GET', path: `/${organizationId}/locations` }),
    create: async (organizationId: string, data: Partial<InventoryLocation>): Promise<ApiResponse<InventoryLocation>> =>
      this.request({ method: 'POST', path: `/${organizationId}/locations`, data }),
    get: async (organizationId: string, locationId: string): Promise<ApiResponse<InventoryLocation>> =>
      this.request({ method: 'GET', path: `/${organizationId}/locations/${locationId}` }),
    update: async (
      organizationId: string,
      locationId: string,
      data: Partial<InventoryLocation>
    ): Promise<ApiResponse<InventoryLocation>> =>
      this.request({ method: 'PATCH', path: `/${organizationId}/locations/${locationId}`, data }),
    delete: async (organizationId: string, locationId: string): Promise<ApiResponse<void>> =>
      this.request({ method: 'DELETE', path: `/${organizationId}/locations/${locationId}` }),
  };
}

// Singleton instance
export const apiClient = new ApiClient(
  import.meta.env.VITE_API_URL || 'https://api.scryme.app/api/v2'
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 403 errors (unauthorized/forbidden)
        if (error?.response?.status === 403) {
          return false;
        }
        // Retry once for other errors
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 12, // 12 hours
      staleTime: 1000 * 60 * 30, // 30 minutes
    },
    mutations: {
      onSuccess: (data: any) => {
        if (data.meta?.message && data.meta.success) {
          toast.success(data.meta.message);
        }
      },
      onError: (error: unknown) => {
        let errorMessage = 'An unexpected error occurred';
        let errorStatus: number | undefined;

        // Handle different error formats
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error instanceof Error && error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          const err = error as any;
          errorStatus = err.response?.status;

          // Handle 403 errors specifically
          if (errorStatus === 403) {
            errorMessage = 'Access denied. You do not have permission to perform this action.';
          }
          // Handle other error formats
          else if (err.response?.data?.error) {
            if (typeof err.response.data.error === 'string') {
              errorMessage = err.response.data.error;
            } else if (typeof err.response.data.error === 'object' && err.response.data.error?.message) {
              errorMessage = err.response.data.error.message;
            }
          } else if (err.response?.data?.message && typeof err.response.data.message === 'string') {
            errorMessage = err.response.data.message;
          } else if (err.message && typeof err.message === 'string') {
            errorMessage = err.message;
          }
        }

        // Log detailed error information for debugging
        console.log('Mutation error:', {
          error,
          status: errorStatus,
          extractedMessage: errorMessage,
        });

        // Custom toast for 403 errors
        if (errorStatus === 403) {
          toast.error('Permission Required', {
            description: errorMessage,
            duration: 5000,
            action: {
              label: 'Request Access',
              onClick: () => {
                // Add your access request logic here
                console.log('Request access clicked');
              },
            },
          });
        } else {
          // Default error toast for other errors
          toast.error(errorMessage, {
            description:
              errorMessage !== 'An unexpected error occurred' ? undefined : 'Please try again or contact support.',
          });
        }
      },
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
