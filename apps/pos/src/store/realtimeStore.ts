import { createWithEqualityFn as create } from 'zustand/traditional';
import { z } from 'zod';
import { invoke } from '@tauri-apps/api/core';
import { BaseRealtimeClient, RealtimeProviderType } from '@repo/shared';
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

interface RealtimeState {
  client: BaseRealtimeClient | null;
  provider: RealtimeProviderType;
  paymentChannel: string | null;
  isConnected: boolean;
  error: string | null;
  initialize: () => void;
  publish: (channel: string, event: string, data: any) => Promise<void>;
  subscribe: (channel: string, event: string, callback: (data: any) => void) => () => void;
  presenceEnter: (channel: string, data: any) => Promise<void>;
  presenceLeave: (channel: string) => Promise<void>;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  client: null,
  provider: (import.meta.env.VITE_REALTIME_PROVIDER as any) || 'ably',
  paymentChannel: null,
  isConnected: false,
  error: null,

  initialize: async () => {
    const { client, provider } = get();
    if (client) client.close();

    const newClient = new BaseRealtimeClient({
      provider,
      socketUrl: import.meta.env.VITE_SOCKET_URL,
      ablyAuthCallback: async (tokenParams, callback) => {
        try {
          const response = await invoke<unknown>('get_ably_auth_token_command', { params: tokenParams });
          const parsed = RealtimeConfigSchema.parse(response);
          set({ paymentChannel: parsed.data.metadata.paymentChannel });
          callback(null, parsed.data.tokenRequest.token);
        } catch (error: any) {
          callback(error, null);
        }
      },
      socketToken: await (async () => {
         if (provider !== 'socketio') return undefined;
         try {
            const response = await invoke<unknown>('get_ably_auth_token_command', { params: {} });
            const parsed = RealtimeConfigSchema.parse(response);
            set({ paymentChannel: parsed.data.metadata.paymentChannel });
            return parsed.data.tokenRequest.token;
         } catch (err) {
            return undefined;
         }
      })()
    });

    newClient.onConnectionChange((connected) => {
      set({ isConnected: connected });
      invoke('update_network_status_command', { isOnline: connected }).catch(console.error);

      if (connected) {
         const authStore = useAuthStore.getState();
         const locationId = authStore.currentLocation?.id;
         const member = authStore.currentMember;
         if (locationId && member) {
            newClient.presenceEnter(`presence:${locationId}`, {
               id: member.id,
               name: member.name,
               lastSeen: new Date().toISOString()
            });
         }
      }
    });

    set({ client: newClient });
  },

  publish: async (channel, event, data) => {
    const { client } = get();
    await client?.publish(channel, event, data);
  },

  subscribe: (channel, event, callback) => {
    const { client } = get();
    return client?.subscribe(channel, event, callback) || (() => {});
  },

  presenceEnter: async (channel, data) => {
    const { client } = get();
    await client?.presenceEnter(channel, data);
  },

  presenceLeave: async (channel) => {
    const { client } = get();
    await client?.presenceLeave(channel);
  }
}));
