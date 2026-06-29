import { toast } from 'sonner';
import { useAuthStore } from '@/store/pos-auth-store';
import { ProcessSaleInput } from '@/lib/validation/transactions';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

// --- Types & Enums ---

export const isNetworkError = (error: unknown): boolean => {
  if (typeof error === 'string') {
    return error.toLowerCase().includes('network') || error.toLowerCase().includes('failed to fetch');
  }
  return false;
};

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  CARD = 'CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  STORE_CREDIT = 'STORE_CREDIT',
  GIFT_CARD = 'GIFT_CARD',
  LOYALTY_POINTS = 'LOYALTY_POINTS',
  ON_ACCOUNT = 'ON_ACCOUNT',
  MPESA = 'MPESA',
  SPLIT = 'SPLIT',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  VOIDED = 'VOIDED',
}

export const FulfillmentType = {
  IMMEDIATE: 'IMMEDIATE',
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
  SHIPPING: 'SHIPPING',
  DIGITAL: 'DIGITAL',
  DINE_IN: 'DINE_IN',
  SERVICE: 'SERVICE',
} as const;

export enum TransactionType {
  POS_SALE = 'POS_SALE',
  ONLINE_ORDER = 'ONLINE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  SERVICE_BOOKING = 'SERVICE_BOOKING',
  SUBSCRIPTION = 'SUBSCRIPTION',
  QUOTE = 'QUOTE',
}

// --- Rust Response Types ---
interface RustSaleResponse {
  success: boolean;
  message: string;
  server_response?: any; // Now optional as backend processes in background
}

interface RustQueuedSale {
  id: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  timestamp: number;
  locationId: string;
  lastError?: string;
  transactionData: {
    saleNumber: string;
    customerId: string | null;
    paymentMethod: 'CASH' | 'MPESA' | 'CARD';
    paymentStatus: 'COMPLETED' | 'PENDING' | 'FAILED';
    mpesaPhoneNumber?: string;
    amountReceived: number;
    change: number;
    discountAmount: number;
    isWholesale: boolean;
    enableStockTracking: boolean;
    locationId: string;
    notes: string;
    cartItems: Array<{
      productId: string;
      productName?: string;
      variantId: string;
      variantName?: string;
      quantity: number;
      sellingUnitId: string;
      sellingUnitName?: string;
      unitPrice?: number;
    }>;
  };
}

export type { RustQueuedSale };

// --- Hooks ---

/**
 * Hook to process a new sale via Rust Backend.
 * 1. Generates UUID.
 * 2. Sends to Rust (which encrypts & saves to disk).
 * 3. Rust attempts background sync immediately.
 */
export const useProcessSale = () => {
  const { currentLocation, currentMember } = useAuthStore();
  const locationId = currentLocation?.id;
  const memberId = currentMember?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProcessSaleInput) => {
      if (!locationId) throw new Error('Location ID is missing');

      // Generate a UUID for the sale to track it locally and remotely
      const saleId = crypto.randomUUID();

      // Combine data for Rust
      const payload = {
        ...data,
        locationId,
        memberId,
      };

      // Call Rust Command (Non-blocking background process)
      const response = await invoke<RustSaleResponse>('process_sale_command', {
        saleId,
        payload,
      });

      return { ...response, saleId };
    },
    onSuccess: data => {
      // Invalidate queries to update local stock counts or sales lists
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pos-sales-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });

      // If it was an offline queue or background process
      if (data.message.toLowerCase().includes('background') || data.message.toLowerCase().includes('offline')) {
        // Don't show success toast here for M-Pesa, the UI handles the "Waiting" state
        console.log('Sale processed in background:', data.message);
      } else {
        toast.success('Sale Processed', {
          description: 'Transaction saved successfully.',
          duration: 2000,
        });
      }
    },
    onError: error => {
      console.error('Critical error processing sale:', error);
      toast.error('System Error', {
        description: 'Failed to process sale. Please check logs.',
      });
    },
  });
};

export const usePendingSales = () => {
  const {
    data: pendingSales = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pos-sales-queue'],
    queryFn: async () => {
      const sales = await invoke<RustQueuedSale[]>('get_pending_sales_command');
      return sales;
    },
    refetchInterval: 5000, // Poll every 5s to see if queue clears
  });

  const queryClient = useQueryClient();
  const syncMutation = useMutation({
    mutationFn: async () => {
      // Trigger manual sync
      const count = await invoke<number>('sync_sales_command', {});
      return count;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sales-queue'] });
      toast.success('Sync Complete');
    },
  });

  return {
    syncSales: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    pendingCount: pendingSales.length,
    pendingSales,
    isLoading,
    error,
  };
};

// Hook to monitor network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await invoke<boolean>('get_network_status_command');
        setIsOnline(status);
      } catch (error) {
        console.error('Failed to check network status:', error);
      }
    };

    // Check immediately
    checkStatus();

    // Listen for network status changes
    const unlisten = listen('network-status-changed', (event: any) => {
      setIsOnline(event.payload);
    });

    // Listen for trigger to sync sales
    const unlistenSync = listen('trigger-sales-sync', async () => {
      console.log('[Network] Connection restored, triggering sync...');
      toast.info('Connection Restored', {
        description: 'Syncing pending sales...',
      });
      try {
        const count = await invoke<number>('sync_sales_command', {});
        if (count > 0) {
          toast.success('Sales Synced', {
            description: `Successfully synced ${count} pending sales.`,
          });
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    });

    return () => {
      unlisten.then(fn => fn());
      unlistenSync.then(fn => fn());
    };
  }, []);

  return { isOnline };
};

// Hook to retry a single sale
export const useRetrySale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      const result = await invoke<boolean>('retry_sale_command', { saleId });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sales-queue'] });
      toast.success('Sale Retried', {
        description: 'Sale synced successfully.',
      });
    },
    onError: (error: any) => {
      toast.error('Retry Failed', {
        description: error?.message || 'Failed to retry sale. Please check your connection.',
      });
    },
  });
};

// Hook to delete a sale
export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      const result = await invoke<boolean>('delete_sale_command', { saleId });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sales-queue'] });
      toast.success('Sale Deleted', {
        description: 'Failed sale removed from queue.',
      });
    },
    onError: (error: any) => {
      toast.error('Delete Failed', {
        description: error?.message || 'Failed to delete sale.',
      });
    },
  });
};

// Hook to check for old pending sales on mount
export const useOldSalesCheck = () => {
  useEffect(() => {
    const checkOldSales = async () => {
      try {
        const oldSales = await invoke<RustQueuedSale[]>('check_old_sales_command', {
          daysThreshold: 3,
        });

        if (oldSales.length > 0) {
          toast.warning('Old Pending Sales', {
            description: `You have ${oldSales.length} sales older than 3 days. Please connect to sync them.`,
            duration: 10000,
          });
        }
      } catch (error) {
        console.error('Failed to check old sales:', error);
      }
    };

    checkOldSales();

    // Listen for old sales detected event from backend
    const unlisten = listen('old-sales-detected', (event: any) => {
      const count = event.payload;
      toast.warning('Old Pending Sales Detected', {
        description: `You have ${count} pending sales older than 3 days. Please connect to the internet to sync them and avoid data loss.`,
        duration: 15000,
        action: {
          label: 'View Sales',
          onClick: () => {
            window.location.href = '/history';
          },
        },
      });
    });

    // Listen for failed sales detected event
    const unlistenFailed = listen('failed-sales-detected', (event: any) => {
      const failedSales = event.payload as RustQueuedSale[];
      if (failedSales.length > 0) {
        toast.error('Failed Sales Detected', {
          description: `${failedSales.length} sales have failed to sync multiple times. You can delete them from the history page.`,
          duration: 15000,
          action: {
            label: 'View Sales',
            onClick: () => {
              window.location.href = '/history';
            },
          },
        });
      }
    });

    return () => {
      unlisten.then(fn => fn());
      unlistenFailed.then(fn => fn());
    };
  }, []);
};

export const useCreateOrder = (options: UseCreateOrderOptions = {}) => {
  const { currentLocation, currentMember } = useAuthStore();
  const locationId = currentLocation?.id;
  const memberId = currentMember?.id;

  return useMutation({
    mutationFn: async (newOrder: OrderFormValues) => {
      if (!locationId) throw new Error('Location ID is missing');

      const response = await invoke<any>('create_order_command', {
        locationId,
        order: {
          ...newOrder,
          memberId,
        },
      });
      return response;
    },
    onSuccess: data => {
      options.onSuccess?.(data);
    },
    onError: error => {
      console.error('Failed to create order:', error);
      options.onError?.(error as Error);
    },
    onSettled: options.onSettled,
  });
};

// --- Order Creation Hook (Online Only / Special Orders) ---
export interface OrderFormValues {
  [key: string]: any;
}

export interface UseCreateOrderOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}
