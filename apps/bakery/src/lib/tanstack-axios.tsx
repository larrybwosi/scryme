import { tauriInvoke } from './tauri-bridge';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ReactNode } from 'react';
import type { InventoryLocation } from '@repo/db';
import { getOrgSlug } from '@/config/api';

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

class ApiClient {
  private async request<T = any>(config: { method: string; path: string; data?: any }): Promise<T> {
    const orgSlug = getOrgSlug();
    const fullPath = config.path.startsWith('/api/')
      ? config.path
      : `/api/v3/${orgSlug}${config.path.startsWith('/') ? '' : '/'}${config.path}`;

    const resData = await tauriInvoke<T>('authenticated_api_request', {
      method: config.method,
      path: fullPath,
      body: config.data,
    });

    if (resData && typeof resData === 'object' && 'success' in resData && 'data' in resData) {
      if ((resData as any).meta || (resData as any).metadata) {
        return {
          data: (resData as any).data,
          metadata: (resData as any).meta || (resData as any).metadata,
        } as any;
      }
      return (resData as any).data;
    }
    return resData;
  }

  // Locations Service
  locations = {
    list: async (_organizationId: string) =>
      this.request({ method: 'GET', path: '/pos/locations' }),
    create: async (_organizationId: string, data: Partial<InventoryLocation>): Promise<ApiResponse<InventoryLocation>> =>
      this.request({ method: 'POST', path: '/pos/locations', data }),
    get: async (_organizationId: string, locationId: string): Promise<ApiResponse<InventoryLocation>> =>
      this.request({ method: 'GET', path: `/pos/locations/${locationId}` }),
    update: async (
      _organizationId: string,
      locationId: string,
      data: Partial<InventoryLocation>
    ): Promise<ApiResponse<InventoryLocation>> =>
      this.request({ method: 'PATCH', path: `/pos/locations/${locationId}`, data }),
    delete: async (_organizationId: string, locationId: string): Promise<ApiResponse<void>> =>
      this.request({ method: 'DELETE', path: `/pos/locations/${locationId}` }),
  };
}

export const apiClient = new ApiClient();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 12,
      staleTime: 1000 * 60 * 30,
    },
    mutations: {
      onSuccess: (data: any) => {
        if (data?.meta?.message && data?.meta?.success) {
          toast.success(data.meta.message);
        }
      },
      onError: (error: unknown) => {
        let errorMessage = 'An unexpected error occurred';
        let errorStatus: number | undefined;

        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error instanceof Error && error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          const err = error as any;
          errorStatus = err.response?.status;

          if (errorStatus === 403) {
            errorMessage = 'Access denied. You do not have permission to perform this action.';
          } else if (err.response?.data?.error) {
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

        if (errorStatus === 403) {
          toast.error('Permission Required', {
            description: errorMessage,
            duration: 5000,
          });
        } else {
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
