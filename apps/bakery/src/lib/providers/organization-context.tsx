'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import sdk, { isTauri, isOfflineMode } from '@/lib/sdk';
import { BakerySettings } from '@/types/bakery';
import { tauriInvoke } from '@/lib/tauri-bridge';

interface OrganizationContextType {
  currency: string;
  isLoading: boolean;
  settings: BakerySettings | any | undefined;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['bakerySettings'],
    queryFn: async () => {
      if (isTauri() || isOfflineMode()) {
        return tauriInvoke<BakerySettings>('get_settings', { org_id: 'local-org' });
      }
      return sdk.bakery.getSettings();
    },
  });

  // Since we don't have currency in BakerySettings yet, we'll default to USD
  // In a real scenario, this might come from the organization settings
  const value = {
    currency: 'USD',
    isLoading,
    settings,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
