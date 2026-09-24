'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { scrymeClient } from '@/lib/scryme';

export interface CustomerUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  [key: string]: any;
}

export interface RegisterCustomerData {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  isLoading: boolean;
  login: (credentials: { email: string; password?: string; otp?: string }) => Promise<void>;
  register: (data: RegisterCustomerData) => Promise<CustomerUser>;
  logout: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const session = await scrymeClient.customer.auth.getSession();
      if (session && session.user) {
        setUser(session.user as CustomerUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    const authSub = scrymeClient.customer.auth.onAuthStateChange(() => {
      fetchSession();
    });

    return () => {
      if (authSub && typeof authSub.unsubscribe === 'function') {
        authSub.unsubscribe();
      }
    };
  }, []);

  const login = async (credentials: { email: string; password?: string; otp?: string }) => {
    setIsLoading(true);
    try {
      if (typeof scrymeClient.customer.auth.login === 'function') {
        await scrymeClient.customer.auth.login(credentials as any);
      }
      await fetchSession();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCustomerData): Promise<CustomerUser> => {
    setIsLoading(true);
    try {
      let createdUser: CustomerUser | null = null;
      if (typeof scrymeClient.customer.auth.signUp === 'function') {
        const res = await scrymeClient.customer.auth.signUp(data as any);
        createdUser = (res?.user || res) as CustomerUser;
      } else if (typeof scrymeClient.customer.auth.register === 'function') {
        const res = await scrymeClient.customer.auth.register(data as any);
        createdUser = (res?.user || res) as CustomerUser;
      } else {
        // Fallback using catalog/admin customer API if direct auth signup isn't present
        const res = await scrymeClient.admin.createCustomer(data as any);
        createdUser = (res?.data || res) as CustomerUser;
      }
      await fetchSession();
      return createdUser || { email: data.email, firstName: data.firstName, lastName: data.lastName };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (typeof scrymeClient.customer.auth.signOut === 'function') {
        await scrymeClient.customer.auth.signOut();
      } else if (typeof scrymeClient.customer.auth.logout === 'function') {
        await scrymeClient.customer.auth.logout();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refetchSession: fetchSession,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return context;
};
