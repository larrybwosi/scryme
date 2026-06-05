import { createWithEqualityFn as create } from 'zustand/traditional';
import { z } from 'zod';
import { invoke } from '@tauri-apps/api/core';
import { isAxiosError } from 'axios';
import { AuthOptions, ErrorInfo, Realtime } from 'ably';
import { io, Socket } from 'socket.io-client';
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

const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MAX_RETRIES = 5;

function jitteredBackoff(attempt: number): number {
  const exp = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
  return exp + Math.random() * 1_000;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'suspended' | 'failed' | 'closed';

interface RealtimeState {
  provider: 'ably' | 'socketio';
  ablyClient: Realtime | null;
  socketClient: Socket | null;
  paymentChannel: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  connectionState: RealtimeConnectionState;
  authRetryCount: number;
  error: string | null;
  initialize: () => void;
  publish: (channel: string, event: string, data: any) => Promise<void>;
  subscribe: (channel: string, event: string, callback: (data: any) => void) => () => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  provider: (import.meta.env.VITE_REALTIME_PROVIDER as any) || 'ably',
  ablyClient: null,
  socketClient: null,
  paymentChannel: null,
  status: 'idle',
  connectionState: 'idle',
  authRetryCount: 0,
  error: null,

  initialize: () => {
    const { ablyClient, socketClient, connectionState, provider } = get();

    if ((ablyClient || socketClient) && !['closed', 'failed', 'idle'].includes(connectionState)) {
      return;
    }

    if (ablyClient) ablyClient.close();
    if (socketClient) socketClient.disconnect();

    set({ status: 'loading', error: null, ablyClient: null, socketClient: null, authRetryCount: 0 });

    if (provider === 'socketio') {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

      const socket = io(socketUrl, {
        transports: ['websocket'],
        autoConnect: false,
      });

      socket.on('connect', () => {
        set({ connectionState: 'connected', status: 'success' });
        invoke('update_network_status_command', { isOnline: true }).catch(console.error);

        const authStore = useAuthStore.getState();
        const locationId = authStore.currentLocation?.id;
        const member = authStore.currentMember;
        if (locationId && member) {
            socket.emit('join', { channel: `presence:${locationId}` });
        }
      });

      socket.on('disconnect', () => {
        set({ connectionState: 'disconnected' });
        invoke('update_network_status_command', { isOnline: false }).catch(console.error);
      });

      socket.on('connect_error', (error) => {
        set({ connectionState: 'failed', status: 'error', error: error.message });
      });

      const fetchToken = async () => {
          try {
              const response = await invoke<unknown>('get_ably_auth_token_command', { params: {} });
              const parsed = RealtimeConfigSchema.parse(response);
              set({ paymentChannel: parsed.data.metadata.paymentChannel });

              socket.auth = { token: parsed.data.tokenRequest.token };
              socket.connect();
          } catch (error) {
              set({ status: 'error', error: 'Failed to fetch auth token' });
          }
      };

      fetchToken();
      set({ socketClient: socket });

    } else {
      let authAttempt = 0;
      const authCallback: AuthOptions['authCallback'] = async (tokenParams, callback) => {
        while (authAttempt < BACKOFF_MAX_RETRIES) {
          try {
            const response = await invoke<unknown>('get_ably_auth_token_command', { params: tokenParams });
            const parsed = RealtimeConfigSchema.parse(response);
            const { data } = parsed;

            authAttempt = 0;
            set({
              paymentChannel: data.metadata.paymentChannel,
              status: 'success',
              authRetryCount: 0,
              error: null,
            });

            callback(null, data.tokenRequest.token);
            return;
          } catch (error) {
            authAttempt += 1;
            set({ authRetryCount: authAttempt });
            const errorMessage = isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : 'Failed to fetch Ably auth token';

            if (authAttempt >= BACKOFF_MAX_RETRIES) {
              set({ status: 'error', error: errorMessage });
              callback(new ErrorInfo(errorMessage, 40_001, 401), null);
              return;
            }
            await sleep(jitteredBackoff(authAttempt));
          }
        }
      };

      const client = new Realtime({
        authCallback,
        autoConnect: true,
      });

      client.connection.on(stateChange => {
        const state = stateChange.current as RealtimeConnectionState;
        set({ connectionState: state });

        if (state === 'connected') {
          invoke('update_network_status_command', { isOnline: true }).catch(console.error);
          const authStore = useAuthStore.getState();
          const locationId = authStore.currentLocation?.id;
          const member = authStore.currentMember;

          if (locationId && member) {
            const presenceChannel = client.channels.get(`presence:${locationId}`);
            presenceChannel.presence.enter({ id: member.id, name: member.name, lastSeen: new Date().toISOString() });
          }
        } else if (['disconnected', 'suspended', 'failed', 'closed'].includes(state)) {
          invoke('update_network_status_command', { isOnline: false }).catch(console.error);
        }
        window.dispatchEvent(new CustomEvent('realtime-connection-change', { detail: { state, reason: stateChange.reason } }));
      });

      set({ ablyClient: client });
    }
  },

  publish: async (channelName, event, data) => {
    const { provider, ablyClient, socketClient } = get();
    if (provider === 'ably' && ablyClient) {
      await ablyClient.channels.get(channelName).publish(event, data);
    } else if (provider === 'socketio' && socketClient) {
      socketClient.emit('publish', { channel: channelName, event, data });
    }
  },

  subscribe: (channelName, event, callback) => {
    const { provider, ablyClient, socketClient } = get();
    if (provider === 'ably' && ablyClient) {
      const channel = ablyClient.channels.get(channelName);
      const internalCallback = (message: any) => callback(message.data);
      channel.subscribe(event, internalCallback);
      return () => channel.unsubscribe(event, internalCallback);
    } else if (provider === 'socketio' && socketClient) {
      socketClient.emit('join', { channel: channelName });
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
