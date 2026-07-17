import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../pos-auth-store';
import { mockInvoke } from '@/test/mocks/tauri';

// Mock API_ENDPOINT
vi.mock('@/lib/api-config', () => ({
  API_ENDPOINT: 'http://localhost:3000',
  API_ENDPOINT_DEFAULT: 'http://localhost:3000',
}));

describe('PosAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.getState().resetAll();
    vi.clearAllMocks();
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ locations: [{ id: 'loc-1', name: 'Test Location' }] }),
    });
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    expect((state as any).deviceKey).toBeUndefined();
    expect(state.isConfigured).toBe(false);
    expect(state.currentMember).toBeNull();
    expect(state.isInitialized).toBe(false);
  });

  it('should initialize from backend successfully', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        location_id: 'loc-1',
        org_slug: 'test-org',
        allow_negative_stock: false,
      })
      .mockResolvedValueOnce({
        locations: [{ id: 'loc-1', name: 'Test Location' }],
      });

    await useAuthStore.getState().initializeFromBackend();

    expect((useAuthStore.getState() as any).deviceKey).toBeUndefined();
    expect(useAuthStore.getState().isConfigured).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('get_device_config');
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('should handle backend initialization failure gracefully', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Failed'));

    await useAuthStore.getState().initializeFromBackend();

    expect(useAuthStore.getState().isInitialized).toBe(true); // Should still mark initialized
    expect(useAuthStore.getState().isConfigured).toBe(false);
  });

  it('should register device and set configured state', async () => {
    mockInvoke.mockResolvedValueOnce({});

    const location = { id: 'loc-1', name: 'Test' } as any;
    await useAuthStore.getState().registerDevice('test-key', location, 'test-org');

    expect(mockInvoke).toHaveBeenCalledWith(
      'set_device_config',
      expect.objectContaining({
        deviceKey: 'test-key',
        locationId: 'loc-1',
      })
    );
    expect(useAuthStore.getState().isConfigured).toBe(true);
  });

  it('should provision device with wrapped API response and matching location', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        success: true,
        data: {
          apiKey: 'test-api-key',
          device: {
            deviceName: 'Test Terminal',
            deviceType: 'MAIN_HUB',
            locationId: 'loc-1',
            location: { id: 'loc-1', name: 'Test Location matching' },
          },
          organization: {
            slug: 'test-org-slug',
          },
        },
      })
      .mockResolvedValueOnce({});

    await useAuthStore.getState().provisionDevice('valid-setup-token');

    expect(mockInvoke).toHaveBeenCalledWith('set_device_config', {
      baseUrl: 'http://localhost:3000',
      locationId: 'loc-1',
      deviceKey: 'test-api-key',
      orgSlug: 'test-org-slug',
    });

    const currentLocation = useAuthStore.getState().currentLocation;
    expect(currentLocation).toBeDefined();
    expect(currentLocation?.id).toBe('loc-1');
    expect(currentLocation?.name).toBe('Test Location matching');
  });

  it('should provision device with unwrapped API response and fallback location', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        apiKey: 'test-api-key-unwrapped',
        device: {
          deviceName: 'Unwrapped Terminal',
          deviceType: 'KDS',
          locationId: 'loc-2',
        },
        organization: {
          slug: 'unwrapped-org-slug',
        },
      })
      .mockResolvedValueOnce({});

    await useAuthStore.getState().provisionDevice('unwrapped-setup-token');

    expect(mockInvoke).toHaveBeenCalledWith('set_device_config', {
      baseUrl: 'http://localhost:3000',
      locationId: 'loc-2',
      deviceKey: 'test-api-key-unwrapped',
      orgSlug: 'unwrapped-org-slug',
    });

    const currentLocation = useAuthStore.getState().currentLocation;
    expect(currentLocation).toBeDefined();
    expect(currentLocation?.id).toBe('loc-2');
    expect(currentLocation?.name).toBe('Unwrapped Terminal');
  });
});
