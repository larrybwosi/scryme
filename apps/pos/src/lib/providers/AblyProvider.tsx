'use client';
import { useEffect } from 'react';
import { useAblyStore } from '@/store/ablyStore';
import { useAuthStore } from '@/store/pos-auth-store';

export default function AblyInitializer() {
  const initializeAbly = useAblyStore((state) => state.initializeAbly);
  const client = useAblyStore((state) => state.client);
  const connectionState = useAblyStore((state) => state.connectionState);
  const currentLocation = useAuthStore((state) => state.currentLocation);
  const currentMember = useAuthStore((state) => state.currentMember);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);

  // ── Initialize Ably once auth is ready ─────────────────────────────────────
  useEffect(() => {
    const isDisabled = localStorage.getItem('ably-disabled') === 'true';
    if (isAuthInitialized && currentMember && !isDisabled) {
      initializeAbly();
    }
  }, [initializeAbly, isAuthInitialized, currentMember]);

  // ── Presence management ────────────────────────────────────────────────────
  useEffect(() => {
    if (!client || !currentLocation?.id || !currentMember) return;

    const presenceChannel = client.channels.get(`presence:${currentLocation.id}`);

    presenceChannel.presence
      .enter({ id: currentMember.id, name: currentMember.name, updatedAt: new Date().toISOString() })
      .catch(() => {});

    return () => {
      presenceChannel.presence.leave().catch(() => {});
    };
  }, [client, currentLocation?.id, currentMember]);

  // ── Reconnect when page becomes visible after being backgrounded ───────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const current = useAblyStore.getState();
      if (
        current.client &&
        ['disconnected', 'suspended', 'failed'].includes(current.connectionState)
      ) {
        current.client.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── Re-init when connection is definitively failed or closed ───────────────
  useEffect(() => {
    if (connectionState === 'failed' && isAuthInitialized && currentMember) {
      const timeoutId = setTimeout(() => {
        initializeAbly();
      }, 5_000);
      return () => clearTimeout(timeoutId);
    }
  }, [connectionState, initializeAbly, isAuthInitialized, currentMember]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      useAblyStore.getState().client?.close();
    };
  }, []);

  return null;
}