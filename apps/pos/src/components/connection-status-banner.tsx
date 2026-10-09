'use client';

import { useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncEngineStore } from '@/store/syncEngineStore';

type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'suspended'
  | 'failed'
  | 'closed'
  | 'idle'
  | string;

interface ConnectionStatus {
  state: ConnectionState;
  reason?: { message?: string };
}


/**
 * ConnectionStatusBanner
 *
 * A non-intrusive banner that appears at the top of the app when the
 * connection is degraded or when offline sync is active.
 */
export function ConnectionStatusBanner() {
  const isSyncing = useSyncEngineStore((state) => state.isSyncing);
  const isOnline = useSyncEngineStore((state) => state.isOnline);

  useEffect(() => {
    if (import.meta.env.MODE === 'standalone') return;
    const handleChange = (e: Event) => {
      const { state } = (e as CustomEvent<ConnectionStatus>).detail;

      if (state === 'connected') {
      } else {
      }
    };

    window.addEventListener('realtime-connection-change', handleChange);
    return () => window.removeEventListener('realtime-connection-change', handleChange);
  }, []);

  if (isSyncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'fixed top-0 inset-x-0 z-[200] flex items-center justify-between gap-3',
          'px-4 py-2 text-sm border-b backdrop-blur-sm transition-all duration-300',
          'bg-blue-500/10 border-blue-400/30 text-blue-700 dark:text-blue-400'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <RefreshCw className="h-4 w-4 shrink-0 text-blue-500 animate-spin" />
          <span className="font-medium truncate">Syncing data with backend…</span>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={cn(
          'fixed top-0 inset-x-0 z-[200] flex items-center justify-between gap-3',
          'px-4 py-2 text-sm border-b backdrop-blur-sm transition-all duration-300',
          'bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-400'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="font-medium truncate">Offline Mode — changes saved locally</span>
        </div>
      </div>
    );
  }

  return null;
}
