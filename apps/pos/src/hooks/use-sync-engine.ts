import { useEffect, useRef } from 'react';
import { useSyncEngineStore } from '@/store/syncEngineStore';
import { useAuthStore } from '@/store/pos-auth-store';

const AUTO_SYNC_INTERVAL_MS = 60_000; // 60 seconds

export function useSyncEngine() {
  const isOnline = useSyncEngineStore((state) => state.isOnline);
  const setIsOnline = useSyncEngineStore((state) => state.setIsOnline);
  const syncAll = useSyncEngineStore((state) => state.syncAll);
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const currentMember = useAuthStore((state) => state.currentMember);
  const isAuthenticated = !!currentMember;
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);

  const initialSyncDone = useRef(false);

  // ── Network status event handlers ───────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isConfigured && isAuthenticated) {
        syncAll();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, syncAll, isConfigured]);

  // ── Realtime connection change reactivity ──────────────────────────────
  useEffect(() => {
    const handleRealtimeConnectionChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.state === 'connected') {
        setIsOnline(true);
        if (isConfigured && isAuthenticated) {
          syncAll();
        }
      } else if (['disconnected', 'suspended', 'failed', 'closed'].includes(detail?.state)) {
        // Keep navigator.onLine as source of truth for internet connection,
        // but note realtime service state.
      }
    };

    window.addEventListener('realtime-connection-change', handleRealtimeConnectionChange);
    return () => {
      window.removeEventListener('realtime-connection-change', handleRealtimeConnectionChange);
    };
  }, [setIsOnline, syncAll, isConfigured, isAuthenticated]);

  // ── Initial Boot Sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthInitialized && isConfigured && isAuthenticated && isOnline && !initialSyncDone.current) {
      initialSyncDone.current = true;
      syncAll();
    }
  }, [isAuthInitialized, isConfigured, isAuthenticated, isOnline, syncAll]);

  // ── Periodic Background Sync ───────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured || !isAuthenticated || !isOnline) return;

    const interval = setInterval(() => {
      syncAll();
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isConfigured, isAuthenticated, isOnline, syncAll]);

  return {
    isOnline,
    syncAll,
  };
}
