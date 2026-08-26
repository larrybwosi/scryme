'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { scrymeClient } from '@/lib/scryme';

interface CustomerUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if customer session exists
    scrymeClient.customer.auth
      .getSession()
      .then((res) => {
        if (res && res.data && res.data.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      // Example OTP/Login sequence via SDK
      await scrymeClient.customer.auth.login({ email });
      const session = await scrymeClient.customer.auth.getSession();
      if (session?.data?.user) {
        setUser(session.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    scrymeClient.customer.auth.logout();
    setUser(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ user, isLoading, login, logout }}>
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
