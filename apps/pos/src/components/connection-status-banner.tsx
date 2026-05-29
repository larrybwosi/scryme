'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const DEGRADED_STATES = new Set(['disconnected', 'suspended', 'failed', 'closed']);

function getStatusConfig(state: ConnectionState) {
  switch (state) {
    case 'disconnected':
      return {
        icon: WifiOff,
        label: 'Disconnected — real-time updates paused',
        sublabel: 'Reconnecting…',
        className: 'bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-400',
        iconClass: 'text-amber-500 animate-pulse',
        spinning: false,
      };
    case 'suspended':
      return {
        icon: AlertTriangle,
        label: 'Connection suspended — real-time updates paused',
        sublabel: 'Will retry automatically',
        className: 'bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-400',
        iconClass: 'text-amber-500',
        spinning: false,
      };
    case 'failed':
      return {
        icon: WifiOff,
        label: 'Connection failed — real-time updates unavailable',
        sublabel: 'Reinitialising…',
        className: 'bg-red-500/10 border-red-400/30 text-red-700 dark:text-red-400',
        iconClass: 'text-red-500',
        spinning: false,
      };
    case 'closed':
      return {
        icon: WifiOff,
        label: 'Connection closed',
        sublabel: 'Real-time updates unavailable',
        className: 'bg-red-500/10 border-red-400/30 text-red-700 dark:text-red-400',
        iconClass: 'text-red-500',
        spinning: false,
      };
    case 'connecting':
      return {
        icon: RefreshCw,
        label: 'Connecting to real-time service…',
        sublabel: '',
        className: 'bg-blue-500/10 border-blue-400/30 text-blue-700 dark:text-blue-400',
        iconClass: 'text-blue-500',
        spinning: true,
      };
    default:
      return null;
  }
}

/**
 * ConnectionStatusBanner
 *
 * A non-intrusive banner that appears at the top of the app only when the
 * Ably connection is degraded. Disappears automatically once reconnected.
 * Staff can also manually dismiss it (it will reappear if state worsens again).
 */
export function ConnectionStatusBanner() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (import.meta.env.MODE === 'standalone') return;
    const handleChange = (e: Event) => {
      const { state, reason } = (e as CustomEvent<ConnectionStatus>).detail;

      if (state === 'connected') {
        // Connection restored – hide banner and reset dismiss flag
        setStatus(null);
        setDismissed(false);
      } else {
        setStatus({ state, reason });
        setDismissed(false); // Re-show if state worsens
      }
    };

    window.addEventListener('ably-connection-change', handleChange);
    return () => window.removeEventListener('ably-connection-change', handleChange);
  }, []);

  const config = status ? getStatusConfig(status.state) : null;
  const visible = !dismissed && !!config && DEGRADED_STATES.has(status?.state ?? '');

  if (!visible) return null;

  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'fixed top-0 inset-x-0 z-[200] flex items-center justify-between gap-3',
        'px-4 py-2 text-sm border-b backdrop-blur-sm transition-all duration-300',
        config.className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={cn('h-4 w-4 shrink-0', config.iconClass, config.spinning && 'animate-spin')} />
        <span className="font-medium truncate">{config.label}</span>
        {config.sublabel && <span className="text-xs opacity-70 truncate hidden sm:inline">— {config.sublabel}</span>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status?.state === 'connected' && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Wifi className="h-3.5 w-3.5" /> Reconnected
          </span>
        )}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss connection warning"
          className="rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
