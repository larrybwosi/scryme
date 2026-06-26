import { useEffect } from 'react';
import { useAuthStore } from '@/store/pos-auth-store';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const IdleTimer = () => {
  const currentMember = useAuthStore(state => state.currentMember);
  const sessionUpdatedAt = useAuthStore(state => state.sessionUpdatedAt);
  const clearMemberSession = useAuthStore(state => state.clearMemberSession);

  useEffect(() => {
    if (!currentMember) return;

    const checkIdle = () => {
      const now = Date.now();
      if (sessionUpdatedAt && now - sessionUpdatedAt > IDLE_TIMEOUT_MS) {
        console.log('User idle for too long, logging out of UI');
        clearMemberSession();
      }
    };

    const interval = setInterval(checkIdle, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentMember, sessionUpdatedAt, clearMemberSession]);

  return null;
};
