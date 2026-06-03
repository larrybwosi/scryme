'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import sdk, { isTauri, isOfflineMode } from '@/lib/sdk';
import { tauriInvoke } from '@/lib/tauri-bridge';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { cardId: string; pin: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      if (isTauri() || isOfflineMode()) {
        const savedUser = localStorage.getItem('bakery_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } else {
        const status = await sdk.bakery.getAuthStatus();
        if (status.hasMemberToken) {
          // Attempt to get member info if online
          // For now, we'll use the status or a separate call if available
          setUser({
            id: 'remote-user',
            name: 'Remote Baker',
            email: 'remote@bakery.com'
          });
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('bakery_user');
    };

    window.addEventListener('bakery-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bakery-unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: { cardId: string; pin: string }) => {
    if (isTauri() || isOfflineMode()) {
      const result = await tauriInvoke<User>('validate_baker_credentials', {
        cardId: credentials.cardId,
        pin: credentials.pin
      });
      setUser(result);
      localStorage.setItem('bakery_user', JSON.stringify(result));
    } else {
      // Online login logic
      // This would normally call sdk.bakery.login or similar
      // For now, let's assume BakeryAuthGuard handles the initial token swap
    }
  };

  const logout = async () => {
    if (isTauri() || isOfflineMode()) {
      setUser(null);
      localStorage.removeItem('bakery_user');
    } else {
      await sdk.bakery.logout();
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
