import { invoke } from '@tauri-apps/api/core';
import { useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/pos-auth-store';
import { logger, writeAudit } from '@/lib/logger';

// --- HOOKS ---

export const usePosPricingSync = () => {
  const queryClient = useQueryClient();
  const locationId = useAuthStore(state => state.currentLocation?.id);
  const currentMember = useAuthStore(state => state.currentMember);

  const syncMutation = useMutation({
    mutationFn: async () => {
      logger.info('[Sync] Initiating Pricing Sync request', { locationId, actorId: currentMember?.id });
      console.log('[API Console] Sending GET Pricing Sync request via Rust engine...');

      const result = await invoke<string>('sync_pricing_command', {});
      console.log('[API Console] Pricing Sync Response:', result);

      writeAudit({
        action: 'SYNC_PRICING',
        level: 'INFO',
        actorId: currentMember?.id,
        actorName: currentMember?.name,
        locationId,
        details: { result },
      });

      return result;
    },
    onSuccess: newTimestamp => {
      console.log('[API Console] Pricing Synced. New Timestamp:', newTimestamp);
      queryClient.invalidateQueries({ queryKey: ['pricing-batch'] });
      queryClient.invalidateQueries({ queryKey: ['pos-pricing'] });
    },
    onError: error => {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('[Sync] Pricing Sync Failed', error, { locationId });
      console.error('[API Console] Pricing Sync Error:', msg);

      writeAudit({
        action: 'SYNC_PRICING_FAILED',
        level: 'WARNING',
        actorId: currentMember?.id,
        actorName: currentMember?.name,
        locationId,
        details: { error: msg },
      });
    },
  });

  return {
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    triggerSync: syncMutation.mutateAsync,
    lastSyncTime: null,
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

export const useBatchPricing = (items: PricingItem[], customerId?: string | null) => {
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
