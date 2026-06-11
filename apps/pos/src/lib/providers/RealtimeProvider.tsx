'use client';
import { useEffect } from 'react';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';

export default function RealtimeInitializer() {
  const initialize = useRealtimeStore((state) => state.initialize);
  const client = useRealtimeStore((state) => state.client);
  const isConnected = useRealtimeStore((state) => state.isConnected);
  const subscribe = useRealtimeStore((state) => state.subscribe);
  const presenceEnter = useRealtimeStore((state) => state.presenceEnter);
  const presenceLeave = useRealtimeStore((state) => state.presenceLeave);
  const currentLocation = useAuthStore((state) => state.currentLocation);
  const currentMember = useAuthStore((state) => state.currentMember);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const updateProductStock = usePosStore((state) => state.updateProductStock);
  const organizationId = useAuthStore((state) => state.deviceConfig?.orgSlug);

  // ── Initialize Realtime once auth is ready ──────────────────────────────────
  useEffect(() => {
    const isDisabled = localStorage.getItem('realtime-disabled') === 'true';
    if (isAuthInitialized && currentMember && !isDisabled) {
      initialize();
    }
  }, [initialize, isAuthInitialized, currentMember]);

  // ── Presence management ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentLocation?.id || !currentMember || !isConnected) return;

    presenceEnter(`presence:${currentLocation.id}`, {
      id: currentMember.id,
      name: currentMember.name,
      updatedAt: new Date().toISOString()
    });

    return () => {
      presenceLeave(`presence:${currentLocation.id}`);
    };
  }, [isConnected, currentLocation?.id, currentMember, presenceEnter, presenceLeave]);

  // ── Reconnect when page becomes visible after being backgrounded ───────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (client && !isConnected) {
        // Most clients handle auto-reconnect, but we can nudge it
        if (client.ably) client.ably.connect();
        if (client.socket) client.socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [client, isConnected]);

  // ── Inventory sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!organizationId || !isConnected) return;

    const channel = `organization:${organizationId}:inventory`;
    const unsub = subscribe(channel, 'stock-update', (data: any) => {
        console.log('[Realtime] Stock update received:', data);
        if (data.productId && typeof data.newStock === 'number') {
            updateProductStock(data.productId, data.newStock);
        }
    });

    return () => unsub();
  }, [organizationId, isConnected, subscribe, updateProductStock]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const state = useRealtimeStore.getState();
      state.client?.close();
    };
  }, []);

  return null;
}
