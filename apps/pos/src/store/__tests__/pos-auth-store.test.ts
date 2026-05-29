import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../pos-auth-store';
import { mockInvoke } from '@/test/mocks/tauri';

// Mock API_ENDPOINT
vi.mock('@/lib/axios', () => ({
  API_ENDPOINT: 'http://localhost:3000',
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
    await useAuthStore.getState().registerDevice('test-key', location);

    expect(mockInvoke).toHaveBeenCalledWith(
      'set_device_config',
      expect.objectContaining({
        deviceKey: 'test-key',
        locationId: 'loc-1',
      })
    );
    expect(useAuthStore.getState().isConfigured).toBe(true);
  });
});
