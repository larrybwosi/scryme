import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Member, useAuthStore } from '@/store/pos-auth-store';
import { toast } from 'sonner';
import { useEffect, useMemo } from 'react';
// import { trackEvent } from "@aptabase/tauri";
import throttle from 'lodash/throttle';
import posthog from 'posthog-js';

// Types for API mutations
interface CheckInResponse {
  member: Member;
  restoredSession: boolean;
}

interface CheckInVariables {
  cardId: string;
  password?: string; // Optional depending on your auth flow
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Get state and actions directly from the Zustand store using individual selectors
  const currentMember = useAuthStore(state => state.currentMember);
  const currentLocation = useAuthStore(state => state.currentLocation);
  const isRestoredSession = useAuthStore(state => state.isRestoredSession);
  const setMemberSession = useAuthStore(state => state.setMemberSession);
  const clearMemberSession = useAuthStore(state => state.clearMemberSession);

  /**
   * Derived boolean to check if a member is currently authenticated (checked in).
   * Returns true if both the member object and token exist in the store.
   */
  const isAuthenticated = !!currentMember;

  /**
   * Mutation for a member checking IN (logging in)
   */
  const {
    mutateAsync: checkIn,
    isPending: isCheckingIn,
    error: checkInError,
  } = useMutation<CheckInResponse, Error, CheckInVariables>({
    mutationFn: variables =>
      invoke<CheckInResponse>('login_member', {
        cardId: variables.cardId,
        pin: variables.password,
        locationId: currentLocation?.id,
      }),
    onSuccess: data => {
      const assignedUserId = localStorage.getItem('ASSIGNED_USER_ID');
      if (assignedUserId && assignedUserId !== data.member.id) {
        toast.error('Access Denied', {
          description: `This device is assigned to ${localStorage.getItem('ASSIGNED_USER_NAME')}.`,
        });
        return;
      }

      setMemberSession(data.member, data.restoredSession);

      posthog.identify(data.member.id, {
        name: data.member.name,
        location_id: currentLocation?.id,
        location_name: currentLocation?.name,
      });
      posthog.capture('user_checked_in', {
        member_name: data.member.name,
        location_id: currentLocation?.id,
        restored_session: data.restoredSession,
      });

      // Provide context-aware feedback
      if (data.restoredSession) {
        toast.info('Session Restored', {
          description: `${data.member.name} was already checked in.`,
        });
      } else {
        toast.success('Checked in successfully', {
          description: `Welcome, ${data.member.name}`,
        });
      }

      // Invalidate any queries that depend on an active session
      queryClient.invalidateQueries({ queryKey: ['attendanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['active-sales'] });
    },
    onError: error => {
      // On error, clear any stale session
      console.error('Check-in failed:', error);
      toast.error('Failed to check in', {
        description: error.message,
      });
      clearMemberSession();
    },
  });

  /**
   * Mutation for a member checking OUT (logging out)
   */
  const {
    mutate: checkOut,
    isPending: isCheckingOut,
    error: checkOutError,
  } = useMutation<void, Error>({
    mutationFn: () => invoke('logout_member', { locationId: currentLocation?.id }),

    onSuccess: () => {
      // On success, clear the global store
      posthog.capture('user_checked_out', {
        member_name: currentMember?.name,
        location_id: currentLocation?.id,
      });
      posthog.reset();
      clearMemberSession();
      // trackEvent("user_logout");
      toast.success('Checked out successfully');

      // Invalidate any queries that depend on an active session
      queryClient.invalidateQueries({ queryKey: ['attendanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['active-sales'] });
    },
    onError: error => {
      console.error('Check-out failed:', error);
      toast.error('Failed to check out');
      // We usually force clear session even on error to prevent stuck states
      clearMemberSession();
    },
  });

  return {
    currentMember,
    memberToken: null,
    isRestoredSession,
    isAuthenticated,
    checkIn,
    isCheckingIn,
    checkInError,
    checkOut,
    isCheckingOut,
    checkOutError,
    currentLocation,
  };
}

export const useSessionActivityListener = () => {
  const refreshSession = useAuthStore(state => state.refreshSession);
  const currentMember = useAuthStore(state => state.currentMember);
  const clearMemberSession = useAuthStore(state => state.clearMemberSession);

  // Periodic session check (refresh mechanism)
  useEffect(() => {
    if (!currentMember) return;

    const checkSession = async () => {
      try {
        // We can use authenticated_api_request to ping and verify token
        const response = await invoke<any>('authenticated_api_request', {
          method: 'GET',
          path: 'members/attendance/me/status',
        });

        if (!response.success || !response.data?.isCheckedIn) {
          console.warn('Session invalid or expired, clearing session');
          clearMemberSession();
        }
      } catch (error) {
        console.error('Failed to verify session:', error);
        // If it's a network error, we might not want to log out immediately,
        // but if it's a 401/403, we should. Rust backend handles status codes.
      }
    };

    const interval = setInterval(checkSession, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [currentMember, clearMemberSession]);

  // Throttled function to prevent too many state updates.
  // It will only fire once every 5 seconds max, even if the user is typing furiously.
  const handleActivity = useMemo(
    () => throttle(() => {
      if (currentMember) {
        refreshSession();
      }
    }, 5000),
    [currentMember, refreshSession]
  );

  useEffect(() => {
    if (!currentMember) return;

    // Events that constitute "activity"
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];

    // Add listeners
    events.forEach(event => window.addEventListener(event, handleActivity));

    // Cleanup
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      handleActivity.cancel(); // If using lodash throttle
    };
  }, [currentMember, handleActivity]);
};
