// types/notifications.ts

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order_ready' | 'announcement';

export interface ServerNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  priority?: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    url?: string;
    actionType?: 'refresh_data' | 'open_dialog';
    payload?: any;
  };
}
