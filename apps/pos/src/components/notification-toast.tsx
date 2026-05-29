'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ShoppingCart, Package, AlertCircle, CheckCircle, Info, XCircle, RefreshCw } from 'lucide-react';
import { type AppNotification, type NotificationType } from '@/lib/notification-service';

/**
 * NotificationToast
 * Listens to the 'show-notification-toast' CustomEvent dispatched by
 * NotificationService and renders a Sonner toast for each incoming notification.
 * High-priority notifications are persistent (no auto-dismiss).
 */
export function NotificationToast() {
  // Dedup: track recently shown toast IDs to avoid double-firing
  const shownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const notification = (event as CustomEvent<AppNotification>).detail;

      if (!notification?.id) return;

      // Suppress duplicates
      if (shownIds.current.has(notification.id)) return;
      shownIds.current.add(notification.id);

      // Clean up old entries (keep last 100)
      if (shownIds.current.size > 100) {
        const arr = [...shownIds.current];
        shownIds.current = new Set(arr.slice(-100));
      }

      const { title, body, notificationType, priority } = notification;

      // High-priority notifications stay until dismissed
      const duration = priority === 'high' ? Infinity : 5_000;

      const Icon = getIcon(notificationType);

      switch (notificationType) {
        case 'error':
          toast.error(title, {
            description: body,
            duration,
            icon: <Icon className="h-4 w-4" />,
          });
          break;

        case 'warning':
          toast.warning(title, {
            description: body,
            duration,
            icon: <Icon className="h-4 w-4" />,
          });
          break;

        case 'success':
          toast.success(title, {
            description: body,
            duration,
            icon: <Icon className="h-4 w-4" />,
          });
          break;

        case 'sale':
          toast.success(title, {
            description: body,
            duration,
            icon: <Icon className="h-4 w-4 text-blue-500" />,
            classNames: {
              toast: 'border-blue-200 dark:border-blue-800',
              icon: 'text-blue-500',
            },
          });
          break;

        case 'sync':
          toast(title, {
            description: body,
            duration,
            icon: <Icon className="h-4 w-4 text-violet-500 animate-spin" />,
          });
          break;

        default:
          toast(title, {
            description: body,
            duration,
            icon: <Icon className="h-4 w-4" />,
          });
      }
    };

    window.addEventListener('show-notification-toast', handleToastEvent);
    return () => window.removeEventListener('show-notification-toast', handleToastEvent);
  }, []);

  return null;
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function getIcon(type: NotificationType) {
  switch (type) {
    case 'sale':
      return ShoppingCart;
    case 'sync':
      return RefreshCw;
    case 'warning':
      return AlertCircle;
    case 'error':
      return XCircle;
    case 'success':
      return CheckCircle;
    case 'system':
      return Package;
    default:
      return Info;
  }
}
