import { renderHook, act } from '@testing-library/react';
import { useSessionActivityListener } from '../use-auth';
import { useAuthStore } from '@/store/pos-auth-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useSessionActivityListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().resetAll();
    vi.useFakeTimers();
  });

  it('should clear session if me/status returns not checked in', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    useAuthStore.getState().setMemberSession(member);
    useAuthStore.setState({ isConfigured: true, deviceConfig: { orgSlug: 'test-org' } as any });

    vi.mocked(invoke).mockResolvedValue({ success: true, data: { isCheckedIn: false } });

    renderHook(() => useSessionActivityListener());

    // Fast-forward 5 minutes
    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(useAuthStore.getState().currentMember).toBeNull();
  });

  it('should keep session if me/status returns checked in in wrapped format', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    useAuthStore.getState().setMemberSession(member);
    useAuthStore.setState({ isConfigured: true, deviceConfig: { orgSlug: 'test-org' } as any });

    vi.mocked(invoke).mockResolvedValue({ success: true, data: { isCheckedIn: true } });

    renderHook(() => useSessionActivityListener());

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(useAuthStore.getState().currentMember).toEqual(member);
  });

  it('should keep session if me/status returns checked in in raw object format', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    useAuthStore.getState().setMemberSession(member);
    useAuthStore.setState({ isConfigured: true, deviceConfig: { orgSlug: 'test-org' } as any });

    vi.mocked(invoke).mockResolvedValue({ id: 'm1', isCheckedIn: true, status: 'ACTIVE' });

    renderHook(() => useSessionActivityListener());

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(useAuthStore.getState().currentMember).toEqual(member);
  });

  it('should clear session if me/status returns not checked in in raw object format', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    useAuthStore.getState().setMemberSession(member);
    useAuthStore.setState({ isConfigured: true, deviceConfig: { orgSlug: 'test-org' } as any });

    vi.mocked(invoke).mockResolvedValue({ id: 'm1', isCheckedIn: false, status: 'INACTIVE' });

    renderHook(() => useSessionActivityListener());

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(useAuthStore.getState().currentMember).toBeNull();
  });

  it('should keep session if me returns v3Context with memberId', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    useAuthStore.getState().setMemberSession(member);
    useAuthStore.setState({ isConfigured: true, deviceConfig: { orgSlug: 'test-org' } as any });

    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: { memberId: 'm1', clientId: 'c1', orgSlug: 'test-org' },
    });

    renderHook(() => useSessionActivityListener());

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(useAuthStore.getState().currentMember).toEqual(member);
  });

  it('should not call authenticated_api_request if app is not configured', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    useAuthStore.getState().setMemberSession(member);
    useAuthStore.setState({ isConfigured: false, deviceConfig: { orgSlug: 'test-org' } as any });

    renderHook(() => useSessionActivityListener());

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(invoke).not.toHaveBeenCalledWith('authenticated_api_request', expect.anything());
  });
});
