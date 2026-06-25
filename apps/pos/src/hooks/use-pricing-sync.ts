import { invoke } from '@tauri-apps/api/core';
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

// --- HOOKS ---

export const usePosPricingSync = () => {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const result = await invoke('sync_pricing_command', {});
      return result;
    },
    onSuccess: newTimestamp => {
      console.log('Pricing Synced. New Timestamp:', newTimestamp);
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['pricing-batch'] });
    },
    onError: error => {
      console.error('Pricing Sync Failed:', error);
    },
  });

  return {
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    triggerSync: syncMutation.mutateAsync,
    lastSyncTime: null, // We could fetch this from Rust if needed, but it's less critical now
  };
};

export type PricingItem = {
  variantId: string;
  unitId: string | null;
  isBaseUnit: boolean;
};

/**
 * Builds a deterministic, sorted cache key string from pricing items.
 * Sorted so row reordering doesn't bust the cache.
 */
export function buildPricingKey(items: PricingItem[]): string {
  if (items.length === 0) return '';
  return items
    .map(i => `${i.variantId}:${i.unitId ?? 'null'}:${i.isBaseUnit}`)
    .sort()
    .join('|');
}

/**
 * Stabilizes an array reference based on a content key.
 * * If the computed key (currentKey) is the same as the previous render,
 * useMemo returns the *previous* items array reference.
 * If the key changes, it returns the *current* items array.
 */
function useStableItems(items: PricingItem[]): [PricingItem[], string] {
  const currentKey = buildPricingKey(items);

  // We intentionally depend ONLY on currentKey.
  // When currentKey changes, we return the new 'items' array.
  // When currentKey is stable, we return the cached 'items' array from the previous run.
  const stableItems = useMemo(() => items, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return [stableItems, currentKey];
}

// ---------------------------------------------------------------------------

export const useBatchPricing = (items: PricingItem[], customerId?: string) => {
  const [stableItems, requestKey] = useStableItems(items);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['pricing-batch', customerId ?? null, requestKey],

    queryFn: async ({ queryKey }): Promise<Record<string, number>> => {
      const [, qCustomerId] = queryKey as [string, string | null, string];

      if (stableItems.length === 0) return {};

      const requests = stableItems.map(item => ({
        variant_id: item.variantId,
        unit_id: item.unitId,
        is_base_unit: item.isBaseUnit,
      }));

      const results = await invoke<Array<number | null>>('resolve_price_batch_command', {
        customerId: qCustomerId === 'walk-in' ? null : qCustomerId,
        requests,
      });

      const map: Record<string, number> = {};
      results.forEach((price, index) => {
        if (price !== null && price !== undefined) {
          const item = stableItems[index];
          // Key format must match resolvePrice() in the page component:
          // `${variantId}:${unitId ?? 'null'}`
          const key = `${item.variantId}:${item.unitId ?? 'null'}`;
          map[key] = price;
        }
      });

      return map;
    },

    enabled: requestKey !== '',
    staleTime: 1000 * 60 * 5,

    // Only keep previous data when the CUSTOMER hasn't changed.
    // Switching customers must clear immediately — otherwise the old
    // customer's special prices show as if they belong to the new one.
    // Same customer: keep previous data to avoid price flicker while
    // new items are being added to the batch.
    placeholderData: (previousData, previousQuery) => {
      if (!previousData) return undefined;
      const prevCustomerId = (previousQuery?.queryKey as any[])?.[1] ?? null;
      const currCustomerId = customerId ?? null;
      return prevCustomerId === currCustomerId ? previousData : undefined;
    },

    // CRITICAL: always return a NEW object reference when data changes so
    // that dependent useEffects in OrderItemRow reliably fire.
    // Without this, React Query may return the exact same cached object
    // and `priceMap !==` checks in effects won't detect the change.
    select: rawData => ({ ...rawData }),
  });

  return {
    priceMap: data ?? {},
    isLoading,
    isFetching,
  };
};
