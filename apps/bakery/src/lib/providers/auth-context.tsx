'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import sdk, { isTauri, isOfflineMode } from '@/lib/sdk';
import { tauriInvoke } from '@/lib/tauri-bridge';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  memberId?: string;
  organizationId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { cardId: string; pin: string; locationId?: string }) => Promise<void>;
  loginLocal: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sso: () => Promise<void>;
  isAuthenticated: boolean;
  hasDeviceKey: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDeviceKey, setHasDeviceKey] = useState(false);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      if (isTauri()) {
        const deviceConfig = await tauriInvoke<any>('get_device_config').catch(() => null);
        if (deviceConfig?.orgSlug) {
          localStorage.setItem('bakery_org_slug', deviceConfig.orgSlug);
        }
        const provisionedKey = deviceConfig?.deviceKey || await tauriInvoke<string | null>('get_provisioned_api_key').catch(() => null);
        if (provisionedKey) {
          setHasDeviceKey(true);
          sdk.setApiKey(provisionedKey);
        }
      }

      if (isOfflineMode()) {
        const savedUser = localStorage.getItem('bakery_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } else {
        const memberToken = localStorage.getItem('bakery_member_token');
        if (memberToken) {
          sdk.setMemberToken(memberToken);
        }

        const status = await sdk.bakery.getAuthStatus();
        setHasDeviceKey(status.hasDeviceKey);

        if (status.hasMemberToken || (isTauri() && localStorage.getItem('bakery_user'))) {
          // Sync token to Rust if in Tauri
          if (isTauri() && memberToken) {
            const savedUser = localStorage.getItem('bakery_user');
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              tauriInvoke('sync_member_token_command', {
                token: memberToken,
                memberId: parsed.memberId || parsed.id,
              }).catch(console.error);
              tauriInvoke('restore_member_session', { member: parsed }).catch(console.error);
            }
          }

          const savedUser = localStorage.getItem('bakery_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser({
              id: 'remote-user',
              name: 'Remote Baker',
              email: 'remote@bakery.com',
            });
          }
        } else {
          // Token is invalid or expired
          setUser(null);
          localStorage.removeItem('bakery_user');
          localStorage.removeItem('bakery_member_token');
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
      localStorage.removeItem('bakery_member_token');
    };

    window.addEventListener('bakery-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bakery-unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: { cardId: string; pin: string; locationId?: string }) => {
    setIsLoading(true);
    try {
      let response: any;
      if (isTauri()) {
        response = await tauriInvoke<any>('login_cloud_command', {
          cardId: credentials.cardId,
          pin: credentials.pin,
          locationId: credentials.locationId,
        });
      } else {
        response = await sdk.auth.terminalLogin(credentials.cardId, credentials.pin, credentials.locationId);
      }

      const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
      if (token) {
        sdk.setMemberToken(token);
        localStorage.setItem('bakery_member_token', token);
      }

      const orgSlug = response.orgSlug || response.data?.orgSlug || response.organization?.slug || response.data?.organization?.slug;
      if (orgSlug) {
        localStorage.setItem('bakery_org_slug', orgSlug);
      } else if (isTauri()) {
        const deviceConfig = await tauriInvoke<any>('get_device_config').catch(() => null);
        if (deviceConfig?.orgSlug) {
          localStorage.setItem('bakery_org_slug', deviceConfig.orgSlug);
        }
      }

      const member = response.member || response.data?.member;
      if (!member) {
        throw new Error('Member profile missing from response');
      }

      const userObj = {
        id: member.id,
        name: member.name || member.user?.name || 'Baker',
        email: member.email || member.user?.email || 'baker@scryme.tech',
        role: member.role,
        memberId: member.id,
      };

      if (isTauri()) {
        localStorage.setItem('bakery_member_id', userObj.memberId);
      }

      setUser(userObj);
      localStorage.setItem('bakery_user', JSON.stringify(userObj));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginLocal = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await tauriInvoke<User>('login_local', { email, password });
      setUser(result);
      localStorage.setItem('bakery_user', JSON.stringify(result));
      sessionStorage.setItem('bakery_local_authenticated', 'true');
    } catch (error: any) {
      throw new Error(error || 'Local login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sso = async () => {
    setIsLoading(true);
    try {
      const response = await sdk.bakery.sso();
      if (response.token) {
        sdk.setMemberToken(response.token);
        localStorage.setItem('bakery_member_token', response.token);
      }

      const orgSlug = response.orgSlug || response.data?.orgSlug || response.organization?.slug || response.data?.organization?.slug;
      if (orgSlug) {
        localStorage.setItem('bakery_org_slug', orgSlug);
      } else if (isTauri()) {
        const deviceConfig = await tauriInvoke<any>('get_device_config').catch(() => null);
        if (deviceConfig?.orgSlug) {
          localStorage.setItem('bakery_org_slug', deviceConfig.orgSlug);
        }
      }

      const userObj = {
        id: response.member.user.id,
        name: response.member.user.name,
        email: response.member.user.email,
        role: response.member.role,
        memberId: response.member.id,
      };

      if (isTauri()) {
        localStorage.setItem('bakery_member_id', userObj.memberId);
      }

      setUser(userObj);
      localStorage.setItem('bakery_user', JSON.stringify(userObj));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'SSO failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (!isOfflineMode()) {
        if (isTauri()) {
          await tauriInvoke('logout_cloud_command').catch(() => {});
        } else {
          await sdk.bakery.logout().catch(() => {});
        }
      }
      setUser(null);
      localStorage.removeItem('bakery_user');
      localStorage.removeItem('bakery_member_token');
      sessionStorage.removeItem('bakery_local_authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    loginLocal,
    logout,
    sso,
    isAuthenticated: !!user,
    hasDeviceKey,
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
