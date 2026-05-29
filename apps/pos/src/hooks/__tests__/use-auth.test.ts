import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../use-auth';
import { wrapper } from '@/test/utils';
import { useAuthStore } from '@/store/pos-auth-store';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockInvoke } from '@/test/mocks/tauri';

// Mock axios
vi.mock('@/lib/axios', () => ({
  apiClient: {
    post: vi.fn(),
  },
  API_ENDPOINT: 'http://localhost:3000',
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    useAuthStore.getState().resetAll();
    vi.clearAllMocks();
  });

  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.currentMember).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should verify authentication when store has data', () => {
    const member = { id: '1', name: 'Test' } as any;

    act(() => {
      useAuthStore.getState().setMemberSession(member);
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.currentMember).toEqual(member);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle check-in success', async () => {
    const mockMember = { id: '1', name: 'Test User', role: 'staff' };
    const mockResponse = {
      member: mockMember,
      restoredSession: false,
    };

    mockInvoke.mockImplementation(async cmd => {
      if (cmd === 'login_member') return mockResponse;
      if (cmd === 'restore_member_session') return undefined;
      return undefined;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.checkIn({ cardId: '123' });
    });

    expect(mockInvoke).toHaveBeenCalledWith('login_member', expect.objectContaining({ cardId: '123' }));
    expect(result.current.currentMember).toEqual(mockMember);
  });

  it('should handle check-out', async () => {
    // Setup initial state
    const member = { id: '1', name: 'Test' } as any;
    act(() => {
      useAuthStore.getState().setMemberSession(member);
    });

    mockInvoke.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.checkOut();
    });

    expect(mockInvoke).toHaveBeenCalledWith('logout_member', expect.anything());
    expect(result.current.currentMember).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
