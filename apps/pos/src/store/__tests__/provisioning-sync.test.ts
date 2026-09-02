import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../pos-auth-store';
import { useSyncEngineStore } from '../syncEngineStore';
import { mockInvoke } from '@/test/mocks/tauri';

describe('POS Provisioning, Auth & Sync Engine Core Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isConfigured: false,
      apiUrl: 'http://localhost:3002',
      rawApiUrl: 'http://localhost:3002',
      currentMember: null,
      checkedInMembers: [],
      currentLocation: null,
      isInitialized: false,
      deviceType: 'MAIN_HUB',
      hubIp: null,
      deviceConfig: null,
    });

    useSyncEngineStore.setState({
      isOnline: true,
      isSyncing: false,
      products: { status: 'idle', lastSyncedAt: null, error: null },
      customers: { status: 'idle', lastSyncedAt: null, error: null },
      pricing: { status: 'idle', lastSyncedAt: null, error: null },
    });
  });

  describe('Device Provisioning & Pairing Payload Authorization', () => {
    it('provisions a device via token successfully', async () => {
      mockInvoke.mockImplementation(async (cmd, _args: any) => {
        if (cmd === 'update_base_url') return;
        if (cmd === 'authenticated_api_request') {
          return {
            apiKey: 'test-device-key-123',
            device: {
              id: 'dev_1',
              name: 'Front Register',
              locationId: 'loc_main',
              location: { id: 'loc_main', name: 'Main Store' },
            },
            organization: { slug: 'acme-org' },
          };
        }
        if (cmd === 'set_device_config') return;
        return null;
      });

      await useAuthStore.getState().provisionDevice('valid_setup_token_99');

      const state = useAuthStore.getState();
      expect(state.currentLocation?.id).toBe('loc_main');
      expect(state.currentLocation?.name).toBe('Main Store');
      expect(mockInvoke).toHaveBeenCalledWith('set_device_config', {
        baseUrl: 'http://localhost:3002',
        locationId: 'loc_main',
        deviceKey: 'test-device-key-123',
        orgSlug: 'acme-org',
      });
    });

    it('authorizes pairing payload from socket or polling response', async () => {
      mockInvoke.mockResolvedValue(null);

      const pairingPayload = {
        apiKey: 'pair_key_abc',
        device: {
          locationId: 'loc_restaurant',
          name: 'Dining Room Hub',
          location: { id: 'loc_restaurant', name: 'Downtown Bistro' },
        },
        organization: { orgSlug: 'bistro-group' },
      };

      await useAuthStore.getState().authorizeFromPairingPayload(pairingPayload);

      const state = useAuthStore.getState();
      expect(state.currentLocation?.id).toBe('loc_restaurant');
      expect(state.currentLocation?.name).toBe('Downtown Bistro');
      expect(mockInvoke).toHaveBeenCalledWith('set_device_config', {
        baseUrl: 'http://localhost:3002',
        locationId: 'loc_restaurant',
        deviceKey: 'pair_key_abc',
        orgSlug: 'bistro-group',
      });
    });
  });

  describe('Sync Engine Operation', () => {
    it('executes syncAll successfully across products, customers, and pricing', async () => {
      mockInvoke.mockImplementation(async (cmd) => {
        if (cmd === 'sync_products_command') return 'Products synced: 15 items';
        if (cmd === 'sync_customers_command') return 'Customers synced: 40 items';
        if (cmd === 'sync_pricing_command') return 'Pricing synced: 15 items';
        return null;
      });

      await useSyncEngineStore.getState().syncAll();

      const state = useSyncEngineStore.getState();
      expect(state.products.status).toBe('success');
      expect(state.customers.status).toBe('success');
      expect(state.pricing.status).toBe('success');
      expect(state.products.message).toBe('Products synced: 15 items');
    });

    it('handles sync errors gracefully when offline or command fails', async () => {
      useSyncEngineStore.setState({ isOnline: false });
      const synced = await useSyncEngineStore.getState().syncProducts();
      expect(synced).toBe(false);

      useSyncEngineStore.setState({ isOnline: true });
      mockInvoke.mockRejectedValue('Network timeout during sync');

      await useSyncEngineStore.getState().syncProducts();

      const state = useSyncEngineStore.getState();
      expect(state.products.status).toBe('error');
      expect(state.products.error).toBe('Network timeout during sync');
    });
  });
});
