"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { authClient, signIn, signUp } from "./auth-client";

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  environment: "LIVE" | "TEST";
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface OAuthClientItem {
  id: string;
  name: string;
  clientId: string;
  clientSecret?: string;
  redirectUris: string[];
  scopes: string[];
  corsOrigins: string[];
  isActive: boolean;
  createdAt: string;
  iconUrl?: string;
  uri?: string;
  tos?: string;
  policy?: string;
  public?: boolean;
}

export interface DeveloperUser {
  id: string;
  name: string;
  email: string;
  organizationName?: string;
  role?: string;
}

interface DeveloperAuthContextType {
  user: DeveloperUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, orgName: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  apiKeys: ApiKeyItem[];
  oauthClients: OAuthClientItem[];
  fetchOAuthClients: () => Promise<void>;
  createApiKey: (name: string, environment: "LIVE" | "TEST") => Promise<ApiKeyItem>;
  toggleApiKey: (id: string) => void;
  deleteApiKey: (id: string) => void;
  createOAuthClient: (data: { name: string; redirectUris: string[]; scopes?: string[]; corsOrigins?: string[]; uri?: string; tos?: string; policy?: string; public?: boolean }) => Promise<OAuthClientItem>;
  rotateOAuthSecret: (id: string) => Promise<string>;
  toggleOAuthClient: (id: string) => Promise<void>;
  deleteOAuthClient: (id: string) => Promise<void>;
}

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";

export function DeveloperAuthProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [oauthClients, setOauthClients] = useState<OAuthClientItem[]>([]);

  const sessionUser = session?.data?.user;

  const user: DeveloperUser | null = useMemo(() => {
    if (!sessionUser) return null;
    return {
      id: sessionUser.id,
      name: sessionUser.name || sessionUser.email.split("@")[0],
      email: sessionUser.email,
      organizationName: (sessionUser as any).organizationName || "Developer Workspace",
      role: (sessionUser as any).role || "Developer",
    };
  }, [sessionUser]);

  const isLoading = session.isPending;

  const mapRawOAuthClient = (c: any): OAuthClientItem => {
    return {
      id: c.id,
      name: c.name || "OAuth Application",
      clientId: c.clientId,
      clientSecret: c.clientSecret,
      redirectUris: c.redirectUris || [],
      scopes: c.scopes || c.metadata?.scopes || ["user.profile", "user.email"],
      corsOrigins: c.corsOrigins || c.metadata?.corsOrigins || [],
      isActive: c.disabled !== undefined ? !c.disabled : (c.isActive !== undefined ? c.isActive : true),
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      iconUrl: c.icon || c.iconUrl,
      uri: c.uri,
      tos: c.tos,
      policy: c.policy,
      public: c.public,
    };
  };

  const fetchOAuthClients = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/v3/auth/oauth/clients`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (res.ok) {
        const body = await res.json();
        const data = body.data || body;
        if (Array.isArray(data)) {
          setOauthClients(data.map(mapRawOAuthClient));
        }
      } else {
        console.warn("Failed to fetch OAuth clients from API:", res.status);
      }
    } catch (err) {
      console.error("Failed fetching OAuth clients:", err);
    }
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      fetchOAuthClients();
    } else {
      setOauthClients([]);
    }
  }, [userId, fetchOAuthClients]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signIn.email({
        email,
        password: pass,
      });

      if (result.error) {
        return { success: false, error: result.error.message || "Invalid credentials." };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "An authentication error occurred." };
    }
  };

  const register = async (name: string, email: string, orgName: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signUp.email({
        name,
        email,
        password: pass,
      });

      if (result.error) {
        return { success: false, error: result.error.message || "Registration failed." };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "An error occurred during registration." };
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const createApiKey = async (name: string, environment: "LIVE" | "TEST"): Promise<ApiKeyItem> => {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const secretHex = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const prefix = `sk_${environment.toLowerCase()}_${randomHex}_`;
    const fullKey = `${prefix}${secretHex}`;

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name,
      keyPrefix: prefix,
      fullKey,
      environment,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: "Just now",
    };

    setApiKeys((prev) => [newKey, ...prev]);
    return newKey;
  };

  const toggleApiKey = (id: string) => {
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, isActive: !k.isActive } : k)));
  };

  const deleteApiKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const createOAuthClient = async (data: {
    name: string;
    redirectUris: string[];
    scopes?: string[];
    corsOrigins?: string[];
    uri?: string;
    tos?: string;
    policy?: string;
    public?: boolean;
  }): Promise<OAuthClientItem> => {
    const payload = {
      name: data.name,
      redirectUris: data.redirectUris,
      ...(data.uri ? { uri: data.uri } : {}),
      ...(data.tos ? { tos: data.tos } : {}),
      ...(data.policy ? { policy: data.policy } : {}),
      ...(data.public !== undefined ? { public: data.public } : {}),
    };

    const res = await fetch(`${API_BASE_URL}/v3/auth/oauth/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.error || `Failed to create OAuth client (${res.status})`);
    }

    const resBody = await res.json();
    const createdRaw = resBody.data || resBody;

    const mapped = mapRawOAuthClient(createdRaw);
    if (data.scopes && data.scopes.length > 0) {
      mapped.scopes = data.scopes;
    }
    if (data.corsOrigins && data.corsOrigins.length > 0) {
      mapped.corsOrigins = data.corsOrigins;
    }

    setOauthClients((prev) => [mapped, ...prev]);
    return mapped;
  };

  const rotateOAuthSecret = async (id: string): Promise<string> => {
    const existing = oauthClients.find((c) => c.id === id);
    if (!existing) {
      throw new Error("OAuth client not found");
    }

    const res = await fetch(`${API_BASE_URL}/v3/auth/oauth/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: existing.name,
        redirectUris: existing.redirectUris,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.error || "Failed to update OAuth client");
    }

    const resBody = await res.json();
    const updatedRaw = resBody.data || resBody;
    const newSecret = updatedRaw.clientSecret || `sec_${Math.random().toString(36).substring(2, 15)}`;

    setOauthClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, clientSecret: newSecret } : c))
    );

    return newSecret;
  };

  const toggleOAuthClient = async (id: string) => {
    const existing = oauthClients.find((c) => c.id === id);
    if (!existing) return;

    const newActiveState = !existing.isActive;

    setOauthClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: newActiveState } : c))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/v3/auth/oauth/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: existing.name,
          redirectUris: existing.redirectUris,
        }),
      });

      if (!res.ok) {
        setOauthClients((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !newActiveState } : c))
        );
      }
    } catch (err) {
      setOauthClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !newActiveState } : c))
      );
      console.error("Error toggling OAuth client active status:", err);
    }
  };

  const deleteOAuthClient = async (id: string) => {
    setOauthClients((prev) => prev.filter((c) => c.id !== id));

    try {
      const res = await fetch(`${API_BASE_URL}/v3/auth/oauth/clients/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        fetchOAuthClients();
      }
    } catch (err) {
      console.error("Error deleting OAuth client:", err);
      fetchOAuthClients();
    }
  };

  return (
    <DeveloperAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        apiKeys,
        oauthClients,
        fetchOAuthClients,
        createApiKey,
        toggleApiKey,
        deleteApiKey,
        createOAuthClient,
        rotateOAuthSecret,
        toggleOAuthClient,
        deleteOAuthClient,
      }}
    >
      {children}
    </DeveloperAuthContext.Provider>
  );
}

export function useDeveloperAuth() {
  const context = useContext(DeveloperAuthContext);
  if (!context) {
    throw new Error("useDeveloperAuth must be used within a DeveloperAuthProvider");
  }
  return context;
}
