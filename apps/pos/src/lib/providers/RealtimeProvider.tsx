'use client';
import { useEffect } from 'react';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';
import { invoke } from '@tauri-apps/api/core';
import { useQueryClient } from '@tanstack/react-query';

export default function RealtimeInitializer() {
  const initialize = useRealtimeStore((state) => state.initialize);
  const ablyClient = useRealtimeStore((state) => state.ablyClient);
  const socketClient = useRealtimeStore((state) => state.socketClient);
  const connectionState = useRealtimeStore((state) => state.connectionState);
  const subscribe = useRealtimeStore((state) => state.subscribe);
  const currentLocation = useAuthStore((state) => state.currentLocation);
  const currentMember = useAuthStore((state) => state.currentMember);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const updateProductStock = usePosStore((state) => state.updateProductStock);
  const organizationId = useAuthStore((state) => state.deviceConfig?.orgSlug);
  const currentLocationId = useAuthStore((state) => state.currentLocation?.id);
  const queryClient = useQueryClient();

  // ── Initialize Realtime once auth is ready ──────────────────────────────────
  useEffect(() => {
    const isDisabled = localStorage.getItem('realtime-disabled') === 'true';
    if (isAuthInitialized && currentMember && !isDisabled) {
      initialize();
    }
  }, [initialize, isAuthInitialized, currentMember]);

  // ── Presence management ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentLocation?.id || !currentMember) return;

    if (ablyClient) {
        const presenceChannel = ablyClient.channels.get(`presence:${currentLocation.id}`);
        presenceChannel.presence
          .enter({ id: currentMember.id, name: currentMember.name, updatedAt: new Date().toISOString() })
          .catch(() => {});

        return () => {
          presenceChannel.presence.leave().catch(() => {});
        };
    } else if (socketClient && socketClient.connected) {
        socketClient.emit('join', { channel: `presence:${currentLocation.id}` });
    }

  }, [ablyClient, socketClient, currentLocation?.id, currentMember]);

  // ── Reconnect when page becomes visible after being backgrounded ───────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const current = useRealtimeStore.getState();
      if (
        current.ablyClient &&
        ['disconnected', 'suspended', 'failed'].includes(current.connectionState)
      ) {
        current.ablyClient.connect();
      } else if (current.socketClient && !current.socketClient.connected) {
        current.socketClient.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── Re-init when connection is definitively failed or closed ───────────────
  useEffect(() => {
    if (connectionState === 'failed' && isAuthInitialized && currentMember) {
      const timeoutId = setTimeout(() => {
        initialize();
      }, 5_000);
      return () => clearTimeout(timeoutId);
    }
  }, [connectionState, initialize, isAuthInitialized, currentMember]);

  // ── Inventory sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!organizationId) return;

    const channel = `organization:${organizationId}:inventory`;
    const unsubStockUpdate = subscribe(channel, 'stock-update', (data: any) => {
        console.log('[Realtime] Stock update received:', data);
        if (data.productId && typeof data.newStock === 'number') {
            updateProductStock(data.productId, data.newStock);
        }
    });

    const unsubProductDeleted = subscribe(channel, 'product-deleted', async (data: any) => {
        console.log('[Realtime] Product deletion received:', data);
        if (data.productId && currentLocationId) {
            try {
                await invoke('delete_local_product_command', {
                    productId: data.productId,
                    locationId: currentLocationId
                });
                queryClient.invalidateQueries({ queryKey: ['pos-products'] });
            } catch (err) {
                console.error('Failed to delete local product:', err);
            }
        }
    });

    return () => {
        unsubStockUpdate();
        unsubProductDeleted();
    };
  }, [organizationId, subscribe, updateProductStock, currentLocationId, queryClient]);

  // ── Customer & Pricing sync ─────────────────────────────────────────────────
  useEffect(() => {
      if (!organizationId) return;

      const pricingChannel = `organization:${organizationId}:pricing`;
      const customersChannel = `organization:${organizationId}:customers`;

      const unsubPriceListDeleted = subscribe(pricingChannel, 'price-list-deleted', async (data: any) => {
          console.log('[Realtime] Price list deletion received:', data);
          if (data.priceListId) {
              try {
                  await invoke('delete_local_price_list_command', { id: data.priceListId });
                  queryClient.invalidateQueries({ queryKey: ['pricing-batch'] });
              } catch (err) {
                  console.error('Failed to delete local price list:', err);
              }
          }
      });

      const unsubCustomerDeleted = subscribe(customersChannel, 'customer-deleted', async (data: any) => {
          console.log('[Realtime] Customer deletion received:', data);
          if (data.customerId) {
              try {
                  await invoke('delete_local_customer_command', { id: data.customerId });
                  queryClient.invalidateQueries({ queryKey: ['pos-customers'] });
              } catch (err) {
                  console.error('Failed to delete local customer:', err);
              }
          }
      });

      return () => {
          unsubPriceListDeleted();
          unsubCustomerDeleted();
      };
  }, [organizationId, subscribe, queryClient]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const state = useRealtimeStore.getState();
      state.ablyClient?.close();
      state.socketClient?.disconnect();
    };
  }, []);

  return null;
}
