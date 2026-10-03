import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import { invoke } from '@tauri-apps/api/core';
import { useAuthStore } from './authStore';
import { getApiEndpoint } from '../lib/api-config';

type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'suspended' | 'failed' | 'closed';

interface SubscribedChannelInfo {
  channel: string;
  options?: { rewind?: number };
  refCount: number;
}

type EventCallback = (data: any) => void;

interface RealtimeState {
  provider: 'socketio';
  socketClient: Socket | null;
  paymentChannel: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  connectionState: RealtimeConnectionState;
  authRetryCount: number;
  error: string | null;
  activeChannels: Map<string, SubscribedChannelInfo>;
  listeners: Map<string, Set<EventCallback>>;
  initialize: (force?: boolean) => void;
  reconnect: () => void;
  publish: (channel: string, event: string, data: any) => Promise<void>;
  subscribe: (channel: string, event: string, callback: EventCallback, options?: { rewind?: number }) => () => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  provider: 'socketio',
  socketClient: null,
  paymentChannel: null,
  status: 'idle',
  connectionState: 'idle',
  authRetryCount: 0,
  error: null,
  activeChannels: new Map<string, SubscribedChannelInfo>(),
  listeners: new Map<string, Set<EventCallback>>(),

  reconnect: () => {
    get().initialize(true);
  },

  initialize: (force = false) => {
    const { socketClient, connectionState } = get();

    // Guard: Do not initialize realtime connection if no staff member is checked in
    const authStoreState = useAuthStore.getState();
    if (!authStoreState.isConfigured || !authStoreState.currentMember) {
      if (socketClient) {
        socketClient.removeAllListeners();
        socketClient.disconnect();
      }
      set({ status: 'idle', connectionState: 'idle', socketClient: null });
      return;
    }

    if (!force && socketClient && !['closed', 'failed', 'idle'].includes(connectionState)) {
      return;
    }

    if (socketClient) {
      socketClient.removeAllListeners();
      socketClient.disconnect();
    }

    set({ status: 'loading', error: null, socketClient: null, authRetryCount: 0, connectionState: 'connecting' });

    const configuredApiUrl = useAuthStore.getState().apiUrl || getApiEndpoint();
    const productionFallback = 'https://api.scryme.tech';
    const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.NEXT_PUBLIC_SOCKET_URL || configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:3002' : productionFallback);

    // Strip trailing slashes and any trailing /api or /v3 paths from socket base URL to ensure clean namespace attach
    const cleanSocketBaseUrl = rawSocketUrl
      .replace(/\/+$/, '')
      .replace(/\/(api|v3)+$/g, '');

    const currentAuth = useAuthStore.getState();
    const memberToken = (currentAuth.currentMember as any)?.token || (currentAuth as any).memberToken || (currentAuth as any).sessionToken;
    const apiKey = currentAuth.deviceConfig?.apiKey;
    const finalToken = memberToken || apiKey || 'socket-io-realtime';

    const initSocket = async () => {
      const { io } = await import('socket.io-client');
      const socket = io(`${cleanSocketBaseUrl}/v3`, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: {
          token: finalToken,
        },
        extraHeaders: {
          Authorization: `Bearer ${finalToken}`,
          'x-member-token': finalToken,
        },
      });

      socket.on('connect', () => {
        set({ connectionState: 'connected', status: 'success' });
        invoke('update_network_status_command', { isOnline: true }).catch(console.error);
        window.dispatchEvent(new CustomEvent('realtime-connection-change', { detail: { state: 'connected' } }));

        const authStore = useAuthStore.getState();
        const locationId = authStore.currentLocation?.id;
        const member = authStore.currentMember;
        if (locationId && member) {
            socket.emit('presence:enter', {
                channel: `presence:${locationId}`,
                metadata: { id: member.id, name: member.name, lastSeen: new Date().toISOString() }
            });
        }

        // Re-join all active subscribed channels upon connect/reconnect
        const { activeChannels } = get();
        activeChannels.forEach((info) => {
          socket.emit('join', { channel: info.channel, options: info.options });
        });
      });

      socket.onAny((event: string, data: any) => {
        const { listeners } = get();
        const eventListeners = listeners.get(event);
        if (eventListeners) {
          eventListeners.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error(`[Realtime] Listener error for event ${event}:`, err);
            }
          });
        }
      });

      socket.on('disconnect', (reason) => {
        set({ connectionState: 'disconnected' });
        invoke('update_network_status_command', { isOnline: false }).catch(console.error);
        window.dispatchEvent(new CustomEvent('realtime-connection-change', { detail: { state: 'disconnected', reason } }));
      });

      socket.on('connect_error', (error) => {
        set({ connectionState: 'failed', status: 'error', error: error.message });
        window.dispatchEvent(new CustomEvent('realtime-connection-change', { detail: { state: 'failed', reason: error } }));
      });

      socket.connect();
      set({ socketClient: socket });
    };

    initSocket();
  },

  publish: async (channelName, event, data) => {
    const { socketClient } = get();
    if (socketClient) {
      socketClient.emit('publish', { channel: channelName, event, data });
    }
  },

  subscribe: (channelName, event, callback, options) => {
    const { socketClient, activeChannels, listeners } = get();

    // Track active channel subscription
    const existing = activeChannels.get(channelName);
    if (existing) {
      existing.refCount += 1;
    } else {
      activeChannels.set(channelName, { channel: channelName, options, refCount: 1 });
    }

    // Register callback in listeners map
    let eventSet = listeners.get(event);
    if (!eventSet) {
      eventSet = new Set();
      listeners.set(event, eventSet);
    }
    eventSet.add(callback);

    if (socketClient && socketClient.connected) {
      socketClient.emit('join', { channel: channelName, options });
    }

    return () => {
      const currentListeners = get().listeners.get(event);
      if (currentListeners) {
        currentListeners.delete(callback);
        if (currentListeners.size === 0) {
          get().listeners.delete(event);
        }
      }

      const currentChannel = get().activeChannels.get(channelName);
      if (currentChannel) {
        currentChannel.refCount -= 1;
        if (currentChannel.refCount <= 0) {
          get().activeChannels.delete(channelName);
        }
      }
    };
  }
}));
