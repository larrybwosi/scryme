import { createWithEqualityFn as create } from 'zustand/traditional';
import { invoke } from '@tauri-apps/api/core';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface EntitySyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  message?: string | null;
}

interface SyncEngineState {
  isOnline: boolean;
  isSyncing: boolean;
  products: EntitySyncState;
  customers: EntitySyncState;
  pricing: EntitySyncState;

  setIsOnline: (online: boolean) => void;
  syncProducts: (forceFullSync?: boolean) => Promise<boolean>;
  syncCustomers: () => Promise<boolean>;
  syncPricing: () => Promise<boolean>;
  syncAll: (forceFullSync?: boolean) => Promise<void>;
}

const initialEntityState: EntitySyncState = {
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  message: null,
};

export const useSyncEngineStore = create<SyncEngineState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  products: { ...initialEntityState },
  customers: { ...initialEntityState },
  pricing: { ...initialEntityState },

  setIsOnline: (online: boolean) => {
    set({ isOnline: online });
  },

  syncProducts: async (forceFullSync = false) => {
    if (!get().isOnline) return false;

    set((state) => ({
      products: { ...state.products, status: 'syncing', error: null },
      isSyncing: true,
    }));

    try {
      const result = await invoke<string>('sync_products_command', { forceFullSync });
      set({
        products: {
          status: 'success',
          lastSyncedAt: new Date().toISOString(),
          error: null,
          message: result,
        },
      });
      return true;
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to sync products';
      set((state) => ({
        products: {
          ...state.products,
          status: 'error',
          error: errorMsg,
        },
      }));
      return false;
    } finally {
      const state = get();
      const stillSyncing =
        state.products.status === 'syncing' ||
        state.customers.status === 'syncing' ||
        state.pricing.status === 'syncing';
      set({ isSyncing: stillSyncing });
    }
  },

  syncCustomers: async () => {
    if (!get().isOnline) return false;

    set((state) => ({
      customers: { ...state.customers, status: 'syncing', error: null },
      isSyncing: true,
    }));

    try {
      const result = await invoke<string>('sync_customers_command');
      set({
        customers: {
          status: 'success',
          lastSyncedAt: new Date().toISOString(),
          error: null,
          message: result,
        },
      });
      return true;
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to sync customers';
      set((state) => ({
        customers: {
          ...state.customers,
          status: 'error',
          error: errorMsg,
        },
      }));
      return false;
    } finally {
      const state = get();
      const stillSyncing =
        state.products.status === 'syncing' ||
        state.customers.status === 'syncing' ||
        state.pricing.status === 'syncing';
      set({ isSyncing: stillSyncing });
    }
  },

  syncPricing: async () => {
    if (!get().isOnline) return false;

    set((state) => ({
      pricing: { ...state.pricing, status: 'syncing', error: null },
      isSyncing: true,
    }));

    try {
      const result = await invoke<string>('sync_pricing_command');
      set({
        pricing: {
          status: 'success',
          lastSyncedAt: new Date().toISOString(),
          error: null,
          message: result,
        },
      });
      return true;
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to sync pricing';
      set((state) => ({
        pricing: {
          ...state.pricing,
          status: 'error',
          error: errorMsg,
        },
      }));
      return false;
    } finally {
      const state = get();
      const stillSyncing =
        state.products.status === 'syncing' ||
        state.customers.status === 'syncing' ||
        state.pricing.status === 'syncing';
      set({ isSyncing: stillSyncing });
    }
  },

  syncAll: async (forceFullSync = false) => {
    if (!get().isOnline) return;

    set({ isSyncing: true });
    await Promise.allSettled([
      get().syncProducts(forceFullSync),
      get().syncCustomers(),
      get().syncPricing(),
    ]);
    set({ isSyncing: false });
  },
}));
