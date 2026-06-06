import { createWithEqualityFn as create } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { API_ENDPOINT } from '@/lib/axios';

type LocationType =
  | 'RETAIL_SHOP'
  | 'WAREHOUSE'
  | 'DISTRIBUTION'
  | 'PRODUCTION'
  | 'SUPPLIER'
  | 'CUSTOMER'
  | 'TEMPORARY'
  | 'OTHER';

type InventoryLocation = {
  name: string;
  id: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  locationType: LocationType;
  address: JSON | null;
  contact: JSON | null;
  capacity: JSON | null;
  settings: JSON | null;
  parentLocationId: string | null;
  customFields: JSON | null;
  createdAt: Date;
  updatedAt: Date;
  managerId: string | null;
  organizationId: string;
};

export type Member = {
  id: string;
  organizationId: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  phone: string | null;
  email: string | null;
  address: string | null;
  age: string | null;
  gender: string | null;
  tags: string | null;
  cardId: string | null;
  isCheckedIn: boolean;
  lastCheckInTime: Date | null;
  currentCheckInLocationId: string | null;
  currentAttendanceLogId: string | null;
  name: string;
  image: string;
};

interface PosAuthState {
  isConfigured: boolean;
  orgSlug: string | null;
  currentMember: Member | null;
  checkedInMembers: Member[];
  currentLocation: InventoryLocation | null;
  isRestoredSession: boolean;
  sessionUpdatedAt: number | null;
  isInitialized: boolean;
  allowNegativeStock: boolean;
  deviceType: 'MAIN_HUB' | 'KDS' | 'TABLET';
  hubIp: string | null;
}

interface PosAuthActions {
  setMemberSession: (member: Member, isRestored?: boolean) => void;
  clearMemberSession: () => void;
  switchMember: (memberId: string) => Promise<void>;
  setCurrentLocation: (location: InventoryLocation) => void;
  clearCurrentLocation: () => void;
  refreshSession: () => void;
  resetAll: () => void;
  resetDevice: () => void;
  completeSetup: (deviceType: 'MAIN_HUB' | 'KDS' | 'TABLET', hubIp?: string | null) => void;

  // Async initialization
  initializeFromBackend: () => Promise<void>;
  provisionDevice: (orgSlug: string, setupToken: string) => Promise<void>;
  registerDevice: (orgSlug: string, apiKey: string, location: InventoryLocation) => Promise<void>;
  switchLocation: (location: InventoryLocation) => Promise<void>;
  setAllowNegativeStock: (allow: boolean) => Promise<void>;
  setDeviceConfig: (deviceType: 'MAIN_HUB' | 'KDS' | 'TABLET', hubIp?: string | null) => void;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const STORAGE_KEY = 'pos-auth-storage-v3';

const initialState: PosAuthState = {
  isConfigured: false,
  orgSlug: null,
  currentMember: null,
  checkedInMembers: [],
  currentLocation: null,
  isRestoredSession: false,
  sessionUpdatedAt: null,
  isInitialized: false,
  allowNegativeStock: false,
  deviceType: 'MAIN_HUB',
  hubIp: null,
};

export const useAuthStore = create<PosAuthState & PosAuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDeviceConfig: (deviceType, hubIp = null) => {
        set({ deviceType, hubIp });
        localStorage.setItem('DEVICE_ROLE', deviceType);
        if (hubIp) {
          localStorage.setItem('HUB_IP_ADDRESS', hubIp);
        } else {
          localStorage.removeItem('HUB_IP_ADDRESS');
        }
      },

      setMemberSession: (member: Member, isRestored = false) => {
        set(state => {
          const alreadyCheckedIn = state.checkedInMembers.find(m => m.id === member.id);
          const newCheckedInMembers = alreadyCheckedIn
            ? state.checkedInMembers
            : [...state.checkedInMembers, member];

          return {
            currentMember: member,
            checkedInMembers: newCheckedInMembers,
            isRestoredSession: isRestored,
            sessionUpdatedAt: Date.now(),
          };
        });
      },

      clearMemberSession: () => {
        set(state => {
          const newCheckedInMembers = state.currentMember
            ? state.checkedInMembers.filter(m => m.id !== state.currentMember?.id)
            : state.checkedInMembers;

          return {
            currentMember: newCheckedInMembers.length > 0 ? newCheckedInMembers[0] : null,
            checkedInMembers: newCheckedInMembers,
            isRestoredSession: false,
            sessionUpdatedAt: newCheckedInMembers.length > 0 ? Date.now() : null,
          };
        });
      },

      switchMember: async (memberId: string) => {
        const { checkedInMembers, currentMember } = get();
        const member = checkedInMembers.find(m => m.id === memberId);
        if (member && member.id !== currentMember?.id) {
          const previousMemberId = currentMember?.id;
          await invoke('switch_active_member', { memberId });
          set({
            currentMember: member,
            sessionUpdatedAt: Date.now(),
          });

          // Trigger cart swap if configured (handled by usePosStore or a listener)
          window.dispatchEvent(
            new CustomEvent('member-switched', {
              detail: { memberId, previousMemberId },
            })
          );
        }
      },

      refreshSession: () => {
        const { currentMember } = get();
        if (currentMember) {
          set({ sessionUpdatedAt: Date.now() });
        }
      },

      setCurrentLocation: (location: InventoryLocation) => {
        set({ currentLocation: location });
      },

      clearCurrentLocation: () => {
        set({ currentLocation: null });
      },

      resetAll: () => {
        set({ ...initialState, isInitialized: false });
      },

      completeSetup: (deviceType, hubIp = null) => {
        set({ isConfigured: true, deviceType, hubIp });
        localStorage.setItem('DEVICE_ROLE', deviceType);

        let deviceId = localStorage.getItem('DEVICE_ID');
        if (!deviceId) {
          deviceId = `dev_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem('DEVICE_ID', deviceId);
        }

        if (hubIp) {
          localStorage.setItem('HUB_IP_ADDRESS', hubIp);
        } else {
          localStorage.removeItem('HUB_IP_ADDRESS');
        }
      },

      resetDevice: () => {
        set({
          isConfigured: false,
          currentLocation: null,
        });
      },

      initializeFromBackend: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        try {
          // rust struct: SanitizedDeviceConfig { org_slug, location_id, allow_negative_stock }
          const config = await invoke<{ org_slug: string; location_id: string; allow_negative_stock: boolean } | null>(
            'get_device_config'
          );
          if (config) {
            // If currentLocation is not already hydrated from localStorage, fetch it
            const { currentLocation } = get();
            if (!currentLocation?.id && config.location_id) {
              try {
                const data = await invoke<{ locations: InventoryLocation[] }>('get_locations_command');
                const location = data.locations?.find(loc => loc.id === config.location_id);
                if (location) {
                  set({ currentLocation: location });
                }
              } catch (fetchError) {
                // Failed to fetch location
              }
            }
            set({ isInitialized: true, isConfigured: true, orgSlug: config.org_slug });

            // Sync existing session to Rust if present
            const { currentMember } = get();
            if (currentMember) {
              invoke('restore_member_session', {
                member: {
                  id: currentMember.id,
                  name: currentMember.name,
                  role: (currentMember as any).role || 'staff',
                },
              }).catch(() => {});
            }
          } else {
            set({ isInitialized: true, isConfigured: false });
          }
        } catch (error) {
          set({ isInitialized: true, isConfigured: false });
        }
      },

      provisionDevice: async (orgSlug: string, setupToken: string) => {
        // V3 provision endpoint is POST /api/v3/:orgSlug/pos/provision
        const response = await invoke<any>('authenticated_api_request', {
          method: 'POST',
          path: `pos/provision`, // orgSlug will be injected by build_request in Rust
          body: { token: setupToken },
        });

        // V3 API response structure might be different.
        // Based on NestJS interceptor, it might be { data: { clientId, clientSecret } }
        if (response.data) {
          const { clientId, clientSecret } = response.data;

          await invoke('start_device_setup_command', {
            baseUrl: API_ENDPOINT,
            orgSlug: orgSlug,
            deviceKey: clientId, // Using clientId as deviceKey
          });

          // In V3, we might need to get locations to choose one, or it's assigned
          const data = await invoke<{ locations: InventoryLocation[] }>('get_locations_command');
          // For now assume first location or we'll need a step to select it
          const location = data.locations?.[0];

          if (location) {
             await invoke('set_device_config', {
                baseUrl: API_ENDPOINT,
                orgSlug: orgSlug,
                locationId: location.id,
                deviceKey: clientId,
             });
          }

          set({
            orgSlug,
            currentLocation: location || null,
          });
        } else {
          throw new Error(response.message || 'Provisioning failed');
        }
      },

      registerDevice: async (orgSlug: string, apiKey: string, location: InventoryLocation) => {
        await invoke('set_device_config', {
          baseUrl: API_ENDPOINT,
          orgSlug,
          locationId: location?.id || '',
          deviceKey: apiKey,
        });

        // Update local state
        set({ isConfigured: true, orgSlug, currentLocation: location });
      },

      switchLocation: async location => {
        const previousLocation = get().currentLocation;

        // 1. Update location in backend config
        try {
          await invoke('update_device_location', {
            locationId: location.id,
          });

          // 2. Update local state
          set({ currentLocation: location });

          // 3. Call switch_location command to load cached products and trigger sync
          const products = await invoke('switch_location', {
            newLocationId: location.id,
          });

          // 4. Update product store via event
          window.dispatchEvent(
            new CustomEvent('location-changed', {
              detail: {
                locationId: location.id,
                products,
                previousLocationId: previousLocation?.id,
              },
            })
          );
        } catch (error) {
          // Failed to switch location
        }
      },

      setAllowNegativeStock: async allow => {
        await invoke('set_negative_stock_command', { allowNegativeStock: allow });
        set({ allowNegativeStock: allow });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),

      partialize: state => ({
        // REMOVED deviceKey and memberToken from here for security
        isConfigured: state.isConfigured,
        orgSlug: state.orgSlug,
        currentLocation: state.currentLocation,
        currentMember: state.currentMember,
        checkedInMembers: state.checkedInMembers,
        isRestoredSession: state.isRestoredSession,
        sessionUpdatedAt: state.sessionUpdatedAt,
        allowNegativeStock: state.allowNegativeStock,
        deviceType: state.deviceType,
        hubIp: state.hubIp,
      }),

      onRehydrateStorage: () => state => {
        if (!state?.sessionUpdatedAt) return;

        const now = Date.now();
        const isExpired = now - state.sessionUpdatedAt > ONE_HOUR_MS;

        if (isExpired) {
          console.log('Session expired. Clearing member data.');
          state.sessionUpdatedAt = null;
        }
      },
    }
  )
);
