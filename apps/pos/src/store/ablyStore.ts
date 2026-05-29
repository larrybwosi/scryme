import { createWithEqualityFn as create } from 'zustand/traditional';
import { z } from 'zod';
import { invoke } from '@tauri-apps/api/core';
import { isAxiosError } from 'axios';
import { AuthOptions, ErrorInfo, Realtime } from 'ably';
import { useAuthStore } from './pos-auth-store';

const AblyConfigSchema = z.object({
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

// ─── Backoff configuration ────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
type AblyConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'suspended' | 'failed' | 'closed';

interface AblyState {
  client: Realtime | null;
  paymentChannel: string | null;
  /** High-level lifecycle status for UI spinners */
  status: 'idle' | 'loading' | 'success' | 'error';
  /** Granular Ably SDK connection state */
  connectionState: AblyConnectionState;
  /** Number of token-auth retry attempts since last successful connect */
  authRetryCount: number;
  /** Human-readable description of the last error */
  error: string | null;
  initializeAbly: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAblyStore = create<AblyState>((set, get) => ({
  client: null,
  paymentChannel: null,
  status: 'idle',
  connectionState: 'idle',
  authRetryCount: 0,
  error: null,

  initializeAbly: () => {
    const { client: existingClient, connectionState } = get();

    // Allow initialization if no client exists OR if the existing client is closed/failed
    if (existingClient && !['closed', 'failed', 'idle'].includes(connectionState)) {
      return;
    }

    // Close old failed/closed client before starting fresh
    if (existingClient) {
      existingClient.close();
    }

    set({ status: 'loading', error: null, client: null, authRetryCount: 0 });

    // ── Auth callback with exponential-backoff retry ──────────────────────────
    let authAttempt = 0;
    const authCallback: AuthOptions['authCallback'] = async (tokenParams, callback) => {
      while (authAttempt < BACKOFF_MAX_RETRIES) {
        try {
          console.log(`[AblyStore] Fetching auth token (attempt ${authAttempt + 1}/${BACKOFF_MAX_RETRIES})…`);
          const response = await invoke<unknown>('get_ably_auth_token_command', { params: tokenParams });

          const parsed = AblyConfigSchema.parse(response);
          const { data } = parsed;

          // Reset retry counter on success
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

          const errorMessage = isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : 'Failed to fetch Ably auth token';

          console.error(`[AblyStore] Auth error (attempt ${authAttempt}):`, errorMessage);

          if (authAttempt >= BACKOFF_MAX_RETRIES) {
            console.error('[AblyStore] Max auth retries reached. Giving up.');
            set({ status: 'error', error: errorMessage });
            callback(new ErrorInfo(errorMessage, 40_001, 401), null);
            return;
          }

          const delay = jitteredBackoff(authAttempt);
          console.log(`[AblyStore] Retrying auth in ${Math.round(delay)}ms…`);
          await sleep(delay);
        }
      }
    };

    // ── Initialise Ably Realtime client ───────────────────────────────────────
    const client = new Realtime({
      authCallback,
      autoConnect: true,
      // Disconnected: retry every 15 s for 2 min before suspending
      disconnectedRetryTimeout: 15_000,
      // Suspended: retry every 30 s indefinitely
      suspendedRetryTimeout: 30_000,
    });

    // ── Connection state listener ─────────────────────────────────────────────
    client.connection.on(stateChange => {
      const state = stateChange.current as AblyConnectionState;
      console.log(`[AblyStore] Connection: ${stateChange.previous} → ${state}`, stateChange.reason?.message ?? '');
      set({ connectionState: state });

      // Notify backend about network reachability
      if (state === 'connected') {
        invoke('update_network_status_command', { isOnline: true }).catch(console.error);
        // Reset auth retry counter on a clean connect
        authAttempt = 0;
        set({ authRetryCount: 0, error: null });

        // Enter Presence
        const authStore = useAuthStore.getState();
        const locationId = authStore.currentLocation?.id;
        const member = authStore.currentMember;

        if (locationId && member) {
          const presenceChannel = client.channels.get(`presence:${locationId}`);
          presenceChannel.presence
            .enter({ id: member.id, name: member.name, lastSeen: new Date().toISOString() })
            .catch(err => console.error('[AblyStore] Presence enter error:', err));
        }
      } else if (['disconnected', 'suspended', 'failed', 'closed'].includes(state)) {
        invoke('update_network_status_command', { isOnline: false }).catch(console.error);
      }

      // Emit a window-level event so non-Zustand subscribers (e.g. banner) can react
      window.dispatchEvent(
        new CustomEvent('ably-connection-change', { detail: { state, reason: stateChange.reason } })
      );
    });

    set({ client });
  },
}));
