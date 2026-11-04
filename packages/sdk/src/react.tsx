/**
 * Dedicated React Integrations & Hooks (@scryme/sdk/react)
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { ScrymeClientSDK } from "./client";
import type { CustomerResponseDto } from "./generated/model";
import type { CustomerSessionDto } from "./base";

export interface SessionContextValue<TU = CustomerResponseDto, TSess = CustomerSessionDto> {
  data: { session: TSess; user: TU } | null;
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  client: ScrymeClientSDK<any, any, any, any, TU, TSess>;
}

const ScrymeContext = createContext<ScrymeClientSDK<any, any, any, any, any, any> | null>(null);
const SessionContext = createContext<SessionContextValue<any, any> | null>(null);

export interface ScrymeProviderProps<
  TU = CustomerResponseDto,
  TSess = CustomerSessionDto
> {
  client: ScrymeClientSDK<any, any, any, any, TU, TSess>;
  children: React.ReactNode;
}

export function ScrymeProvider<
  TU = CustomerResponseDto,
  TSess = CustomerSessionDto
>({
  client,
  children,
}: ScrymeProviderProps<TU, TSess>) {
  const [data, setData] = useState<{ session: TSess; user: TU } | null>(
    client.auth.session.data as any
  );
  const [isPending, setIsPending] = useState<boolean>(client.auth.session.isPending);
  const [error, setError] = useState<Error | null>(client.auth.session.error);

  const syncState = () => {
    const s = client.auth.session;
    setData(s.data as any);
    setError(s.error);
    setIsPending(s.isPending);
  };

  const refetch = async () => {
    setIsPending(true);
    try {
      const res = (await client.customer.auth.getCurrentSession()) as any;
      if (res && (res.session || res.customer || res.user)) {
        setData({
          session: res.session,
          user: res.customer || res.user,
        });
      } else {
        const sessionState = await client.auth.getSession();
        setData({
          session: {
            id: (sessionState.user as any)?.id || (sessionState.user as any)?.userId || sessionState.token,
            userId: (sessionState.user as any)?.id || (sessionState.user as any)?.userId || "",
            expiresAt: sessionState.expiresAt ? new Date(sessionState.expiresAt) : null,
            token: sessionState.token,
          } as any,
          user: sessionState.user as any,
        });
      }
      setError(null);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    syncState();
    const { unsubscribe } = client.auth.onAuthStateChange(() => {
      syncState();
    });
    return () => unsubscribe();
  }, [client]);

  const value = useMemo(
    () => ({
      data,
      isPending,
      error,
      refetch,
      client,
    }),
    [data, isPending, error, client]
  );

  return (
    <ScrymeContext.Provider value={client}>
      <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
    </ScrymeContext.Provider>
  );
}

export function useScryme<
  TU = CustomerResponseDto,
  TSess = CustomerSessionDto
>(): ScrymeClientSDK<any, any, any, any, TU, TSess> {
  const context = useContext(ScrymeContext);
  if (!context) {
    throw new Error("useScryme must be used within a <ScrymeProvider>");
  }
  return context as ScrymeClientSDK<any, any, any, any, TU, TSess>;
}

export function useSession<
  TU = CustomerResponseDto,
  TSess = CustomerSessionDto
>(): SessionContextValue<TU, TSess> {
  const context = useContext(SessionContext);
  if (context) {
    return context as SessionContextValue<TU, TSess>;
  }

  return {
    data: null,
    isPending: false,
    error: new Error("No ScrymeProvider found in tree"),
    refetch: async () => {},
    client: undefined as any,
  };
}
