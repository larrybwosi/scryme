import { renderHook, waitFor } from '@testing-library/react';
import { useProcessSale } from '../sales';
import { mockInvoke } from '@/test/setup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Auth Store
vi.mock('@/store/pos-auth-store', () => ({
  useAuthStore: () => ({
    currentLocation: { id: 'loc_1' },
    currentMember: { id: 'mem_1' },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useProcessSale Hook', () => {
  beforeEach(() => {
    queryClient.clear();
    mockInvoke.mockReset();
  });

  it('should call process_sale_command with memberId and return success', async () => {
    mockInvoke.mockImplementation(async (cmd, args) => {
      if (cmd === 'process_sale_command') {
        if (args.payload.memberId === 'mem_1') {
          return {
            success: true,
            message: 'Sale Processed',
          };
        }
      }
    });

    const { result } = renderHook(() => useProcessSale(), { wrapper });

    result.current.mutate({
      cartItems: [],
      locationId: 'loc_1',
      payments: [],
      enableStockTracking: true,
    } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 });
    expect(result.current.data?.success).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith(
      'process_sale_command',
      expect.objectContaining({
        payload: expect.objectContaining({
          memberId: 'mem_1',
        }),
      })
    );
  });
});
