import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react"
import { ServerNotification } from "@/types/notifications"
import { useAuthStore } from "@/store/pos-auth-store"
import { notificationService } from "@/lib/notification-service"
import { useRealtimeStore } from "@/store/realtimeStore"

// ─── Dedup config ─────────────────────────────────────────────────────────────
/** Maximum number of processed IDs to remember (prevents memory leak) */
const DEDUP_CACHE_MAX = 500;

// ─── Context ──────────────────────────────────────────────────────────────────
interface ServerNotificationContextType {
  lastNotification: ServerNotification | null;
  history: ServerNotification[];
  clearHistory: () => void;
  /** Realtime connection state string */
  connectionState: string;
  /** How many queued items are awaiting backend persistence */
  pendingCount: number;
}

const ServerNotificationContext = createContext<ServerNotificationContextType | undefined>(undefined)

// ─── Helper: map server notification type → internal notification type ─────────
function mapNotificationType(type: ServerNotification['type']) {
  switch (type) {
    case 'order_ready': return 'sale' as const;
    case 'announcement': return 'info' as const;
    case 'error': return 'error' as const;
    case 'warning': return 'warning' as const;
    case 'success': return 'success' as const;
    default: return 'info' as const;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ServerNotificationProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ServerNotification[]>([])
  const [lastNotification, setLastNotification] = useState<ServerNotification | null>(null)

  // Realtime client + meta
  const connectionState = useRealtimeStore((state) => state.connectionState);
  const subscribe = useRealtimeStore((state) => state.subscribe);
  const { currentLocation, isConfigured, currentMember } = useAuthStore();
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
  const handleIncomingMessage = useCallback(async (data: any) => {
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
      setLastNotification(notification)
      setHistory(prev => [notification, ...prev].slice(0, 50)) // Keep last 50

      // 2. Route through notification service
      const notificationType = mapNotificationType(notification.type);
      const priority = notification.priority === 'high' ? 'high' :
                       notification.priority === 'medium' ? 'medium' : 'low';

      await notificationService.send({
        title: notification.title,
        body: notification.message,
        type: notificationType,
        priority,
        persistent: true,
        action: notification.action ? {
          label: notification.action.label,
          actionType: notification.action.actionType || 'custom',
          payload: notification.action.payload
        } : undefined
      });
    } catch (err) {
      // Error handling message
    }
  }, [isDuplicate]);

  // ── Realtime subscription ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured || !currentMember || !storeId) return;

    const unsubStore = subscribe(`store:${storeId}`, 'message', handleIncomingMessage);
    const unsubSystem = subscribe(`system:global`, 'message', handleIncomingMessage);

    return () => {
      unsubStore();
      unsubSystem();
    };
  }, [isConfigured, currentMember, storeId, handleIncomingMessage, subscribe]);

  // ── Pending count (refresh every 5 s) ────────────────────────────────────────
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    if (!isConfigured || !currentMember) return;

    const id = setInterval(() => {
      setPendingCount(notificationService.pendingRetryCount);
    }, 5_000);
    return () => clearInterval(id);
  }, [isConfigured, currentMember]);

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
  )
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
export const useServerNotifications = () => {
  const context = useContext(ServerNotificationContext)
  if (!context) throw new Error("useServerNotifications must be used within ServerNotificationProvider")
  return context
}
