import { createWithEqualityFn as create } from 'zustand/traditional';
import { z } from 'zod';
import { invoke } from '@tauri-apps/api/core';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from './pos-auth-store';

const RealtimeConfigSchema = z.object({
  data: z.object({
    tokenRequest: z
      .object({
        token: z.string(),
      })
      .loose(),
    metadata: z.object({
      paymentChannel: z.string(),
      organizationId: z.string().optional(),
    }),
  }),
});

type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'suspended' | 'failed' | 'closed';

interface RealtimeState {
  provider: 'socketio';
  socketClient: Socket | null;
  paymentChannel: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  connectionState: RealtimeConnectionState;
  authRetryCount: number;
  error: string | null;
  initialize: () => void;
  publish: (channel: string, event: string, data: any) => Promise<void>;
  subscribe: (channel: string, event: string, callback: (data: any) => void, options?: { rewind?: number }) => () => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  provider: 'socketio',
  socketClient: null,
  paymentChannel: null,
  status: 'idle',
  connectionState: 'idle',
  authRetryCount: 0,
  error: null,

  initialize: () => {
    const { socketClient, connectionState } = get();

    if (socketClient && !['closed', 'failed', 'idle'].includes(connectionState)) {
      return;
    }

    if (socketClient) socketClient.disconnect();

    set({ status: 'loading', error: null, socketClient: null, authRetryCount: 0 });

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

    const initSocket = async () => {
      const { io } = await import('socket.io-client');
      const cleanUrl = socketUrl.replace(/\/+$/, '');
      const socket = io(`${cleanUrl}/v3`, {
        transports: ['websocket'],
        autoConnect: false,
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

      const fetchToken = async () => {
          try {
              const response = await invoke<unknown>('get_ably_auth_token_command', { params: {} });
              const parsed = RealtimeConfigSchema.parse(response);
              if (parsed.data?.metadata?.paymentChannel) {
                set({ paymentChannel: parsed.data.metadata.paymentChannel });
              }
              if (parsed.data?.tokenRequest?.token) {
                socket.auth = { token: parsed.data.tokenRequest.token };
              }
              socket.connect();
          } catch (error) {
              socket.connect();
          }
      };

      fetchToken();
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
    const { socketClient } = get();
    if (socketClient) {
      socketClient.emit('join', { channel: channelName, options });
      const internalCallback = (data: any) => {
          callback(data);
      };
      socketClient.on(event, internalCallback);
      return () => {
          socketClient.off(event, internalCallback);
      };
    }
    return () => {};
  }
}));
