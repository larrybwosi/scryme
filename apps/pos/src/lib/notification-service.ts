import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'sale' | 'sync' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationAction {
  label: string;
  actionType: string;
  payload?: unknown;
}

export interface AppNotification {
  id: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  persistent: boolean;
  action?: NotificationAction;
  soundEnabled: boolean;
}

export interface NotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  persistent?: boolean;
  action?: NotificationAction;
  soundEnabled?: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  soundVolume: number;
  infoSoundEnabled: boolean;
  successSoundEnabled: boolean;
  warningSoundEnabled: boolean;
  errorSoundEnabled: boolean;
  saleSoundEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  soundVolume: 0.5,
  infoSoundEnabled: true,
  successSoundEnabled: true,
  warningSoundEnabled: true,
  errorSoundEnabled: true,
  saleSoundEnabled: true,
};

// ─── Retry configuration ──────────────────────────────────────────────────────
const SEND_MAX_RETRIES = 3;
const SEND_RETRY_DELAY_MS = 2_000;

// ─── Service ──────────────────────────────────────────────────────────────────
class NotificationService {
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private listeners: Array<(notification: AppNotification) => void> = [];
  private isWindowVisible: boolean = true;
  /** Notifications that failed to persist and are awaiting retry */
  private retryQueue: Array<{ notification: AppNotification; attempt: number }> = [];
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  /** Callbacks invoked when a notification permanently fails to persist */
  private errorHandlers: Array<(notification: AppNotification, error: unknown) => void> = [];

  constructor() {
    this.init().catch(console.error);
  }

  private async init() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } catch {
        console.warn('[NotificationService] Failed to parse saved settings; using defaults.');
      }
    }

    // Monitor window visibility
    try {
      const currentWindow = getCurrentWindow();
      if (currentWindow) {
        currentWindow.onFocusChanged(({ payload: focused }) => {
          this.isWindowVisible = focused;
        });
      }
    } catch (e) {
      console.warn('[NotificationService] Failed to get current window, possibly not running in Tauri:', e);
    }

    // Listen for notifications pushed from the backend
    await listen<AppNotification>('notification-received', event => {
      this.handleIncomingNotification(event.payload);
    });

    // Start the retry worker
    this.startRetryWorker();
  }

  // ─── Retry worker ────────────────────────────────────────────────────────────
  private startRetryWorker() {
    if (this.retryTimer) return;
    this.retryTimer = setInterval(() => {
      this.flushRetryQueue();
    }, SEND_RETRY_DELAY_MS);
  }

  private flushRetryQueue() {
    if (this.retryQueue.length === 0) return;
    const batch = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of batch) {
      invoke<string>('send_native_notification', { notification: item.notification }).catch((error: unknown) => {
        if (item.attempt < SEND_MAX_RETRIES) {
          console.warn(
            `[NotificationService] Retry ${item.attempt + 1}/${SEND_MAX_RETRIES} for notification "${item.notification.id}"`
          );
          this.retryQueue.push({ notification: item.notification, attempt: item.attempt + 1 });
        } else {
          console.error(
            `[NotificationService] Permanently failed to persist notification "${item.notification.id}" after ${SEND_MAX_RETRIES} retries:`,
            error
          );
          this.errorHandlers.forEach(h => h(item.notification, error));
        }
      });
    }
  }

  // ─── Incoming notification handler ───────────────────────────────────────────
  private handleIncomingNotification(notification: AppNotification) {
    // Always fire the in-app toast immediately – do not gate on backend confirmation
    this.showInAppToast(notification);

    // Play sound if enabled
    if (this.settings.soundEnabled && notification.soundEnabled) {
      this.playNotificationSound(notification.notificationType);
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (err) {
        console.error('[NotificationService] Listener error:', err);
      }
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  /**
   * Send a notification. Shows an in-app toast immediately, then persists to
   * the backend. If backend persistence fails it retries up to SEND_MAX_RETRIES
   * times before giving up and calling any registered `onSendError` handlers.
   */
  async send(options: NotificationOptions): Promise<string> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const notification: AppNotification = {
      id,
      notificationType: options.type || 'info',
      priority: options.priority || 'medium',
      title: options.title,
      body: options.body,
      timestamp,
      read: false,
      persistent: options.persistent !== undefined ? options.persistent : true,
      action: options.action,
      soundEnabled: options.soundEnabled !== undefined ? options.soundEnabled : true,
    };

    // ① Show in-app toast immediately – never blocks on the backend
    if (this.isWindowVisible) {
      this.showInAppToast(notification);
    }

    // ② Play sound immediately
    if (this.settings.soundEnabled && notification.soundEnabled) {
      this.playNotificationSound(notification.notificationType);
    }

    // ③ Notify listeners immediately
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (err) {
        console.error('[NotificationService] Listener error:', err);
      }
    });

    // ④ Persist to backend (fire-and-forget, with retry)
    invoke<string>('send_native_notification', { notification }).catch((error: unknown) => {
      console.warn('[NotificationService] Backend persist failed, will retry:', error);
      this.retryQueue.push({ notification, attempt: 1 });
    });

    return id;
  }

  // ─── Convenience helpers ──────────────────────────────────────────────────────
  async info(title: string, body: string, options?: Partial<NotificationOptions>) {
    return this.send({ title, body, type: 'info', ...options });
  }

  async success(title: string, body: string, options?: Partial<NotificationOptions>) {
    return this.send({ title, body, type: 'success', ...options });
  }

  async warning(title: string, body: string, options?: Partial<NotificationOptions>) {
    return this.send({ title, body, type: 'warning', priority: 'medium', ...options });
  }

  async error(title: string, body: string, options?: Partial<NotificationOptions>) {
    return this.send({ title, body, type: 'error', priority: 'high', ...options });
  }

  async sale(title: string, body: string, options?: Partial<NotificationOptions>) {
    return this.send({ title, body, type: 'sale', priority: 'medium', ...options });
  }

  // ─── Backend queries ──────────────────────────────────────────────────────────
  async getHistory(): Promise<AppNotification[]> {
    try {
      return await invoke<AppNotification[]>('get_notification_history');
    } catch (error) {
      console.error('[NotificationService] getHistory failed:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      return await invoke<number>('get_unread_notification_count');
    } catch (error) {
      console.error('[NotificationService] getUnreadCount failed:', error);
      return 0;
    }
  }

  async markRead(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('mark_notification_read', { id });
    } catch (error) {
      console.error('[NotificationService] markRead failed:', error);
      return false;
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await invoke('mark_all_notifications_read');
    } catch (error) {
      console.error('[NotificationService] markAllRead failed:', error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_notification', { id });
    } catch (error) {
      console.error('[NotificationService] delete failed:', error);
      return false;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await invoke('clear_all_notifications');
    } catch (error) {
      console.error('[NotificationService] clearAll failed:', error);
    }
  }

  // ─── Settings ─────────────────────────────────────────────────────────────────
  updateSettings(settings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // ─── Subscription ─────────────────────────────────────────────────────────────
  subscribe(callback: (notification: AppNotification) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Register a handler called when a notification permanently fails to be
   * persisted to the backend after all retries.
   */
  onSendError(handler: (notification: AppNotification, error: unknown) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  /** Number of notifications currently awaiting backend persistence */
  get pendingRetryCount(): number {
    return this.retryQueue.length;
  }

  // ─── Internals ────────────────────────────────────────────────────────────────
  private playNotificationSound(type: NotificationType) {
    const soundMap: Record<NotificationType, { file: string; enabled: keyof NotificationSettings }> = {
      info: { file: '/sounds/notification-info.mp3', enabled: 'infoSoundEnabled' },
      success: { file: '/sounds/notification-success.mp3', enabled: 'successSoundEnabled' },
      warning: { file: '/sounds/notification-warning.mp3', enabled: 'warningSoundEnabled' },
      error: { file: '/sounds/notification-error.mp3', enabled: 'errorSoundEnabled' },
      sale: { file: '/sounds/notification-sale.mp3', enabled: 'saleSoundEnabled' },
      sync: { file: '/sounds/notification-info.mp3', enabled: 'infoSoundEnabled' },
      system: { file: '/sounds/notification-info.mp3', enabled: 'infoSoundEnabled' },
    };

    const sound = soundMap[type];
    if (!sound || !this.settings[sound.enabled]) return;

    try {
      const audio = new Audio(sound.file);
      audio.volume = this.settings.soundVolume;
      audio.play().catch(e => console.warn('[NotificationService] Audio play failed:', e));
    } catch (error) {
      console.warn('[NotificationService] Failed to create Audio:', error);
    }
  }

  private showInAppToast(notification: AppNotification) {
    window.dispatchEvent(new CustomEvent('show-notification-toast', { detail: notification }));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
