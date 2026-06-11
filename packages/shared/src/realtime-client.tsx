'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { BaseRealtimeClient, RealtimeProviderType } from './realtime/client';
import axios from 'axios';

interface RealtimeContextType {
  isConnected: boolean;
  provider: RealtimeProviderType;
  subscribe: (channel: string, event: string, callback: (data: any) => void) => () => void;
  publish: (channel: string, event: string, data: any) => Promise<void>;
  presenceEnter: (channel: string, data: any) => Promise<void>;
  presenceLeave: (channel: string) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  provider: 'ably',
  subscribe: () => () => {},
  publish: async () => {},
  presenceEnter: async () => {},
  presenceLeave: async () => {},
});

export const RealtimeContextProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<RealtimeProviderType>('ably');

  const client = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const providerType = (process.env.NEXT_PUBLIC_REALTIME_PROVIDER as any) || 'ably';
    setProvider(providerType);

    return new BaseRealtimeClient({
      provider: providerType,
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002',
      ablyAuthCallback: async (tokenParams, callback) => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
          const response = await axios.post(`${baseUrl}/api/auth/ably`, {}, { withCredentials: true });
          callback(null, response.data);
        } catch (err: any) {
          callback(err, null);
        }
      },
    });
  }, []);

  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
      client.close();
    };
  }, [client]);

  const subscribe = useCallback((channel: string, event: string, callback: (data: any) => void) => {
    return client?.subscribe(channel, event, callback) || (() => {});
  }, [client]);

  const publish = useCallback(async (channel: string, event: string, data: any) => {
    await client?.publish(channel, event, data);
  }, [client]);

  const presenceEnter = useCallback(async (channel: string, data: any) => {
    await client?.presenceEnter(channel, data);
  }, [client]);

  const presenceLeave = useCallback(async (channel: string) => {
    await client?.presenceLeave(channel);
  }, [client]);

  return (
    <RealtimeContext.Provider value={{ isConnected, provider, subscribe, publish, presenceEnter, presenceLeave }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
