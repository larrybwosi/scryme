import { renderHook, waitFor, act } from '@testing-library/react';
import { usePosProducts } from '../products';
import { wrapper } from '@/test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockInvoke } from '@/test/mocks/tauri';
import { useAuthStore } from '@/store/pos-auth-store';

describe('usePosProducts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().resetAll();
  });

  it('should fetch products from local DB', async () => {
    const mockProducts = [
      { productId: 'p1', productName: 'Product 1', totalStock: 10, sellableUnits: [], variants: [] },
      { productId: 'p2', productName: 'Product 2', totalStock: 5, sellableUnits: [], variants: [] },
    ];

    mockInvoke.mockImplementation(async cmd => {
      if (cmd === 'search_products_command') {
        return { products: mockProducts, totalCount: 2 };
      }
      return undefined;
    });

    const { result } = renderHook(() => usePosProducts({ search: '', category: 'all' }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.products).toHaveLength(2);
    expect(result.current.products[0].productName).toBe('Product 1');
    expect(mockInvoke).toHaveBeenCalledWith('search_products_command', expect.anything());
  });

  it('should handle search with debouncing', async () => {
    mockInvoke.mockResolvedValue({ products: [], totalCount: 0 });

    const { rerender } = renderHook(({ search }) => usePosProducts({ search, category: 'all' }), {
      wrapper,
      initialProps: { search: '' },
    });

    // Initial call
    expect(mockInvoke).toHaveBeenCalledTimes(1);

    // Update search
    rerender({ search: 'apple' });

    // Should not call immediately due to debounce
    expect(mockInvoke).toHaveBeenCalledTimes(1);

    // Wait for debounce (500ms)
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(2), { timeout: 1000 });

    expect(mockInvoke).toHaveBeenLastCalledWith(
      'search_products_command',
      expect.objectContaining({
        query: 'apple',
      })
    );
  });

  it('should trigger sync command', async () => {
    // Set location first
    act(() => {
      useAuthStore.getState().setCurrentLocation({
        id: 'loc1',
        name: 'Test Store',
      } as any);
    });

    mockInvoke.mockResolvedValue({ products: [], totalCount: 0 });

    const { result } = renderHook(() => usePosProducts({ search: '', category: 'all' }), { wrapper });

    // Wait for initial search call to finish
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.triggerSync();
    });

    await waitFor(
      () => {
        const calls = mockInvoke.mock.calls;
        const hasSyncCall = calls.some(call => call[0] === 'sync_products_command');
        expect(hasSyncCall).toBe(true);
      },
      { timeout: 2000 }
    );
  });
});
