import { render, act } from '@testing-library/react';
import { IdleTimer } from '../idle-timer';
import { useAuthStore } from '@/store/pos-auth-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('IdleTimer', () => {
  beforeEach(() => {
    useAuthStore.getState().resetAll();
    vi.useFakeTimers();
  });

  it('should clear session after 30 minutes of inactivity', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    await act(async () => {
      useAuthStore.getState().setMemberSession(member);
    });

    // Set initial session update time
    const initialTime = Date.now();
    await act(async () => {
      useAuthStore.setState({ sessionUpdatedAt: initialTime });
    });

    render(<IdleTimer />);

    // Fast-forward 31 minutes
    await act(async () => {
      vi.advanceTimersByTime(31 * 60 * 1000);
    });

    expect(useAuthStore.getState().currentMember).toBeNull();
  });

  it('should not clear session if active', async () => {
    const member = { id: 'm1', name: 'Member 1' } as any;
    await act(async () => {
      useAuthStore.getState().setMemberSession(member);
    });

    render(<IdleTimer />);

    // Fast-forward 20 minutes
    await act(async () => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    // Simulate activity
    await act(async () => {
      useAuthStore.getState().refreshSession();
    });

    // Fast-forward another 20 minutes
    await act(async () => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(useAuthStore.getState().currentMember).toEqual(member);
  });
});
