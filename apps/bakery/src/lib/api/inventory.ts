import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import sdk, { isTauri, isOfflineMode } from '@/lib/sdk';
import { tauriInvoke } from '@/lib/tauri-bridge';
import { InventoryAdjustment, InventoryItem, InventoryMovement } from '../types/inventory';

// fallow-ignore-next-line unused-exports
export const useListInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => await sdk.inventory.list(),
  });
};

// fallow-ignore-next-line unused-exports
export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<InventoryItem>) => await sdk.client.post('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// fallow-ignore-next-line unused-exports
export const useGetInventoryItem = (inventoryId: string) => {
  return useQuery({
    queryKey: ['inventory', inventoryId],
    queryFn: async () => await sdk.client.get(`/inventory/${inventoryId}`),
    enabled: !!inventoryId,
  });
};

// fallow-ignore-next-line unused-exports
export const useUpdateInventoryItem = (inventoryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<InventoryItem>) => await sdk.client.patch(`/inventory/${inventoryId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory'],
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory', inventoryId],
      });
    },
  });
};

// fallow-ignore-next-line unused-exports
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventoryId: string) => await sdk.client.delete(`/inventory/${inventoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory'],
      });
    },
  });
};

// fallow-ignore-next-line unused-exports
export const useListInventoryMovements = (inventoryId: string) => {
  return useQuery({
    queryKey: ['inventory-movements', inventoryId],
    queryFn: async () => await sdk.client.get(`/inventory/${inventoryId}/movements`),
    enabled: !!inventoryId,
  });
};

// fallow-ignore-next-line unused-exports
export const useCreateInventoryMovement = (inventoryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<InventoryMovement>) => await sdk.client.post(`/inventory/${inventoryId}/movements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory-movements', inventoryId],
      });
    },
  });
};

// fallow-ignore-next-line unused-exports
export const useListInventoryAdjustments = (inventoryId: string) => {
  return useQuery({
    queryKey: ['inventory-adjustments', inventoryId],
    queryFn: async () => await sdk.client.get(`/inventory/${inventoryId}/adjustments`),
    enabled: !!inventoryId,
  });
};

// fallow-ignore-next-line unused-exports
export const useApproveInventoryAdjustment = (inventoryId: string, adjustmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => await sdk.client.post(`/inventory/${inventoryId}/adjustments/${adjustmentId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory-adjustments', inventoryId],
      });
    },
  });
};

export const useRestockInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
        if (isTauri() || isOfflineMode()) {
            return tauriInvoke('restock_inventory', { userId: 'local-user', data });
        }
        return sdk.client.post(`/catalog/products/${data?.productId}/variants/${data?.variantId}/restock`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory'],
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
};
