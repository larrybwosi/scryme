import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { Message } from 'ably';
import { ServerNotification } from '@/types/notifications';
import { useAuthStore } from '@/store/pos-auth-store';
import { notificationService } from '@/lib/notification-service';
import { useRealtimeStore } from '@/store/realtimeStore';

// ─── Dedup config ─────────────────────────────────────────────────────────────
/** Maximum number of processed IDs to remember (prevents memory leak) */
const DEDUP_CACHE_MAX = 500;

// ─── Context ──────────────────────────────────────────────────────────────────
interface ServerNotificationContextType {
  lastNotification: ServerNotification | null;
  history: ServerNotification[];
  clearHistory: () => void;
  /** Granular Ably connection state string */
  connectionState: string;
  /** How many queued items are awaiting backend persistence */
  pendingCount: number;
}

const ServerNotificationContext = createContext<ServerNotificationContextType | undefined>(undefined);

// ─── Helper: map server notification type → internal notification type ─────────
function mapNotificationType(type: ServerNotification['type']) {
  switch (type) {
    case 'order_ready':
      return 'sale' as const;
    case 'announcement':
      return 'info' as const;
    case 'error':
      return 'error' as const;
    case 'warning':
      return 'warning' as const;
    case 'success':
      return 'success' as const;
    default:
      return 'info' as const;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ServerNotificationProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ServerNotification[]>([]);
  const [lastNotification, setLastNotification] = useState<ServerNotification | null>(null);

  // Realtime client + meta
  const ably = useRealtimeStore(state => state.ablyClient);
  const connectionState = useRealtimeStore(state => state.connectionState);
  const subscribe = useRealtimeStore(state => state.subscribe);
  const { currentLocation } = useAuthStore();
  const storeId = currentLocation?.id;

  // ── Deduplication: LRU-capped Set of seen IDs ───────────────────────────────
  const seenIds = useRef<string[]>([]);

  const isDuplicate = useCallback((id: string): boolean => {
    if (seenIds.current.includes(id)) return true;
    seenIds.current.push(id);
    // Evict oldest entries when over the cap
    if (seenIds.current.length > DEDUP_CACHE_MAX) {
      seenIds.current = seenIds.current.slice(-DEDUP_CACHE_MAX);
    }
    return false;
  }, []);

  // ── Core message handler ─────────────────────────────────────────────────────
  const handleIncomingMessage = useCallback(
    async (data: any) => {
      try {
        const notification: ServerNotification = data as ServerNotification;

        // Guard: ignore bad payloads
        if (!notification?.id || !notification?.title) {
          return;
        }

        // Guard: deduplicate
        if (isDuplicate(notification.id)) {
          return;
        }

        // 1. Update state
        setLastNotification(notification);
        setHistory(prev => [notification, ...prev].slice(0, 50)); // Keep last 50

        // 2. Route through notification service
        const notificationType = mapNotificationType(notification.type);
        const priority =
          notification.priority === 'high' ? 'high' : notification.priority === 'medium' ? 'medium' : 'low';

        await notificationService.send({
          title: notification.title,
          body: notification.message,
          type: notificationType,
          priority,
          persistent: true,
          action: notification.action
            ? {
                label: notification.action.label,
                actionType: notification.action.actionType || 'custom',
                payload: notification.action.payload,
              }
            : undefined,
        });
      } catch (err) {
        // Error handling message
      }
    },
    [isDuplicate]
  );

  // ── Replay missed messages from Ably channel history ─────────────────────────
  const replayHistory = useCallback(
    async (channelName: string) => {
      if (!ably) return;
      try {
        const channel = ably.channels.get(channelName);
        // Fetch the last 100 messages published in the past 2 minutes
        const page = await channel.history({ limit: 100 });
        const items: Message[] = page.items ?? [];
        if (items.length > 0) {
          // Oldest first so they arrive in chronological order
          for (const msg of [...items].reverse()) {
            await handleIncomingMessage(msg);
          }
        }
      } catch (err) {
        // History replay failed
      }
    },
    [ably, handleIncomingMessage]
  );

  // ── Realtime subscription ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!storeId) return;

    const unsubStore = subscribe(`store:${storeId}`, 'message', handleIncomingMessage);
    const unsubSystem = subscribe(`system:global`, 'message', handleIncomingMessage);

    return () => {
      unsubStore();
      unsubSystem();
    };
  }, [storeId, handleIncomingMessage, subscribe]);

  // ── Replay on reconnect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (connectionState !== 'connected' || !storeId) return;
    // Small delay to let channel subscriptions re-establish first
    const tid = setTimeout(() => {
      replayHistory(`store:${storeId}`);
      replayHistory('system:global');
    }, 500);
    return () => clearTimeout(tid);
  }, [connectionState, storeId, replayHistory]);

  // ── Pending count (refresh every 5 s) ────────────────────────────────────────
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setPendingCount(notificationService.pendingRetryCount);
    }, 5_000);
    return () => clearInterval(id);
  }, []);

  return (
    <ServerNotificationContext.Provider
      value={{
        lastNotification,
        history,
        clearHistory: () => setHistory([]),
        connectionState,
        pendingCount,
      }}
    >
      {children}
    </ServerNotificationContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
export const useServerNotifications = () => {
  const context = useContext(ServerNotificationContext);
  if (!context) throw new Error('useServerNotifications must be used within ServerNotificationProvider');
  return context;
};
