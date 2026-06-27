import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';
import { invoke } from '@tauri-apps/api/core';
import { useDebounce } from 'use-debounce';
import { useCallback, useEffect } from 'react';

// --- Types (Kept the same) ---
export interface SellableUnit {
  unitId: string;
  unitName: string;
  price: number;
  conversion: number;
  isBaseUnit: boolean;
}

export interface Variant {
  variantId: string;
  variantName: string;
  name?: string;
  barcode: string;
  updatedAt?: string;
}

export interface Batch {
  batchNumber: string;
  expiryDate: string;
  manufacturingDate?: string;
  stock: number;
}

export interface PosProduct {
  productId: string;
  productName: string;
  name?: string;
  variantId: string;
  variantName: string;
  category: string;
  sku: string;
  barcode?: string;
  imageUrl?: string;
  stock: number;
  totalStock?: number;
  sellableUnits: SellableUnit[];
  variants: (Variant & { batches?: Batch[] })[];
  updatedAt?: string;
  activeIngredient?: string;
}

interface UsePosProductsParams {
  search: string;
  category: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function usePosProducts({ search, category, page = 1, pageSize = 50, enabled = true }: UsePosProductsParams) {
  const queryClient = useQueryClient();
  const setProducts = usePosStore(state => state.setProducts);

  // 1. Selectors prevent unnecessary re-renders when other auth parts change
  const locationId = useAuthStore(state => state.currentLocation?.id);

  // 2. Debounce the search input (150ms delay for high-traffic supermarket)
  const safeSearch = search || '';
  const [debouncedSearch] = useDebounce(safeSearch, 150);

  // --- QUERY: Local Search ---
  const { data: searchResponse = { products: [], totalCount: 0 }, isLoading: isSearching } = useQuery({
    queryKey: ['pos-products', debouncedSearch, category, locationId, page, pageSize], // Added pagination params
    queryFn: async () => {
      // Invoke Tauri command to search local DB
      const response = await invoke<{ products: PosProduct[]; totalCount: number }>('search_products_command', {
        query: debouncedSearch,
        category: category,
        page: page,
        pageSize: pageSize,
      });

      // Map backend totalStock to frontend stock and ensure names are present
      return {
        products: response.products.map(p => ({
          ...p,
          productName: p.productName || p.name || '',
          stock: p.stock ?? p.totalStock ?? 0,
          variants:
            p.variants?.map(v => ({
              ...v,
              variantName: v.variantName || v.name || '',
            })) || [],
        })),
        totalCount: response.totalCount,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled,
    placeholderData: prev => prev,
  });

  const products = searchResponse.products;
  const totalCount = searchResponse.totalCount;

  // --- SYNC TO GLOBAL STORE ---
  // When we fetch "all" products (no search, no category filter), update the global store
  // so that features like Low Stock Alerts works.
  useEffect(() => {
    if (products.length > 0 && !debouncedSearch && category === 'all' && page === 1) {
      setProducts(products as any);
    }
  }, [products, debouncedSearch, category, page, setProducts]);

  const syncMutation = useMutation({
    mutationFn: async (variables?: { forceFullSync?: boolean }) => {
      if (!locationId) throw new Error('No Location ID');

      const res = await invoke('sync_products_command', {
        forceFullSync: variables?.forceFullSync ?? false,
      });
      return res;
    },
    onSuccess: () => {
      // After syncing, invalidate the search cache so the new products appear immediately
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    },
    onError: err => console.error('Sync Failed:', err),
  });

  const handleSync = useCallback(
    (forceFullSync: boolean = false) => {
      if (enabled && locationId && !syncMutation.isPending) {
        syncMutation.mutate({ forceFullSync });
      }
    },
    [enabled, locationId, syncMutation]
  );

  return {
    products,
    totalCount,
    isLoading: isSearching && products.length === 0, // Only show loading on initial load
    isSyncing: syncMutation.isPending,
    triggerSync: handleSync, // Attach this to a "Sync" button or a "Pull to Refresh"
    error: syncMutation.error,
  };
}
