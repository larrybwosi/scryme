import { useEffect, useMemo } from 'react';
import { tauriInvoke } from '@/lib/tauri-bridge';
import { isTauri } from '@/lib/sdk';
import { useAuth } from '@/lib/providers/auth-context';
import { toast } from 'sonner';
import throttle from 'lodash/throttle';

export const useSessionActivityListener = () => {
  const { user, logout, isAuthenticated } = useAuth();

  // Periodic session check (refresh mechanism)
  useEffect(() => {
    if (!isAuthenticated || !isTauri()) return;

    const checkSession = async () => {
      try {
        // We use authenticated_api_request to ping and verify token
        const response = await tauriInvoke<any>('authenticated_api_request', {
          method: 'GET',
          path: '/devices/me', // Using /devices/me as a stable health check for authenticated device + member
        });

        // If it returns successfully, the session is likely still valid
        if (response && response.organizationId) {
          // Session is valid
        } else {
          console.warn('Session invalid or expired according to server, clearing session');
          logout();
          toast.error('Session Expired', {
            description: 'Your session has expired. Please check in again.',
          });
        }
      } catch (error: any) {
        const errorMsg = error?.toString() || '';
        console.error('Failed to verify session:', errorMsg);

        if (
          errorMsg.includes('401') ||
          errorMsg.includes('403') ||
          errorMsg.toLowerCase().includes('unauthorized') ||
          errorMsg.toLowerCase().includes('forbidden')
        ) {
          console.error('Authentication failed, logging out...');
          logout();
          toast.error('Authentication Failed', {
            description: 'Please check in again to continue.',
          });
        }
      }
    };

    // Run check on mount
    checkSession();

    // Check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // Throttled function to handle activity if needed in the future for local timeouts
  const handleActivity = useMemo(
    () => throttle(() => {
      // In the future, update a local activity timestamp here
    }, 5000),
    []
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      handleActivity.cancel();
    };
  }, [isAuthenticated, handleActivity]);
};
