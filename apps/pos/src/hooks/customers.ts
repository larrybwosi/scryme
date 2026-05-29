import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { useCallback } from 'react';
import { useAuthStore } from '@/store/pos-auth-store';
import { Customer } from '@/types';
import { useDebounce } from 'use-debounce';

// Types match the Rust JSON output (camelCase)
export interface PosCustomer extends Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  customerType?: string;
  company?: string;
  city?: string;
  primaryAddress?: string;
  updatedAt: string;
  addresses?: any[];
  businessAccountId?: string;
  loyaltyPoints?: number;
  totalPurchases?: number;
  lastVisit?: Date;
  notes?: string;
}

interface UsePosCustomersParams {
  search?: string;
  enabled?: boolean;
}

export const usePosCustomers = ({ search, enabled = true }: UsePosCustomersParams = {}) => {
  const queryClient = useQueryClient();

  // 1. Optimization: Use Selectors to prevent unnecessary re-renders
  const locationId = useAuthStore(state => state.currentLocation?.id);

  const safeSearch = search || '';
  const [debouncedSearch] = useDebounce(safeSearch, 500);

  const { data: customers = [], isLoading: isSearching } = useQuery({
    queryKey: ['pos-customers', debouncedSearch],
    queryFn: async () => {
      return await invoke<PosCustomer[]>('search_customers_command', {
        query: debouncedSearch,
      });
    },
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 5, // Consider local data fresh for 5 mins
    enabled: enabled,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!locationId) throw new Error('No Location ID');

      console.log('Syncing Customers...');
      // No args needed now, backend uses stored auth state
      const res = await invoke('sync_customers_command', {});
      console.log('Sync Result:', res);
      return res;
    },
    onSuccess: () => {
      // After sync, invalidate the search query so the UI updates with new data
      queryClient.invalidateQueries({ queryKey: ['pos-customers'] });
    },
    onError: err => console.error('Customer Sync Failed:', err),
  });

  const handleSync = useCallback(() => {
    if (enabled && locationId && !syncMutation.isPending) {
      syncMutation.mutate();
    }
  }, [enabled, locationId, syncMutation]);

  return {
    customers,
    // Loading is true only if we are searching and have no data yet (initial load)
    isLoading: isSearching && customers.length === 0,
    isSyncing: syncMutation.isPending,
    triggerSync: handleSync,
    totalCount: customers.length,
  };
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<PosCustomer, Error, any>({
    mutationFn: async data => {
      const res = await invoke<PosCustomer>('create_customer_command', { data });
      return res;
    },
    onSuccess: () => {
      // After creating online, we invalidate the query.
      queryClient.invalidateQueries({ queryKey: ['pos-customers'] });
    },
  });
};
