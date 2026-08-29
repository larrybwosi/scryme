"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  createApiKey: (name: string, environment: "LIVE" | "TEST") => Promise<ApiKeyItem>;
  toggleApiKey: (id: string) => void;
  deleteApiKey: (id: string) => void;
  createOAuthClient: (data: { name: string; redirectUris: string[]; scopes: string[]; corsOrigins?: string[] }) => Promise<OAuthClientItem>;
  rotateOAuthSecret: (id: string) => Promise<string>;
  toggleOAuthClient: (id: string) => void;
  deleteOAuthClient: (id: string) => void;
}

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

const DEV_KEYS_STORAGE_KEY = "scryme_dev_api_keys";
const DEV_OAUTH_STORAGE_KEY = "scryme_dev_oauth_clients";

export function DeveloperAuthProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [oauthClients, setOauthClients] = useState<OAuthClientItem[]>([]);

  const user: DeveloperUser | null = session?.data?.user
    ? {
        id: session.data.user.id,
        name: session.data.user.name || session.data.user.email.split("@")[0],
        email: session.data.user.email,
        organizationName: (session.data.user as any).organizationName || "Developer Workspace",
        role: (session.data.user as any).role || "Developer",
      }
    : null;

  const isLoading = session.isPending;

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem(DEV_KEYS_STORAGE_KEY);
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      }

      const storedOAuth = localStorage.getItem(DEV_OAUTH_STORAGE_KEY);
      if (storedOAuth) {
        setOauthClients(JSON.parse(storedOAuth));
      }
    } catch (err) {
      console.error("Failed loading developer credentials from storage:", err);
    }
  }, []);

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

    const updated = [newKey, ...apiKeys];
    setApiKeys(updated);
    localStorage.setItem(DEV_KEYS_STORAGE_KEY, JSON.stringify(updated));
    return newKey;
  };

  const toggleApiKey = (id: string) => {
    const updated = apiKeys.map((k) => (k.id === id ? { ...k, isActive: !k.isActive } : k));
    setApiKeys(updated);
    localStorage.setItem(DEV_KEYS_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteApiKey = (id: string) => {
    const updated = apiKeys.filter((k) => k.id !== id);
    setApiKeys(updated);
    localStorage.setItem(DEV_KEYS_STORAGE_KEY, JSON.stringify(updated));
  };

  const createOAuthClient = async (data: {
    name: string;
    redirectUris: string[];
    scopes: string[];
    corsOrigins?: string[];
  }): Promise<OAuthClientItem> => {
    const clientId = `v3_${Math.random().toString(36).substring(2, 12)}`;
    const clientSecret = `scryme_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const newClient: OAuthClientItem = {
      id: `oauth_${Date.now()}`,
      name: data.name,
      clientId,
      clientSecret,
      redirectUris: data.redirectUris,
      scopes: data.scopes.length > 0 ? data.scopes : ["user.profile", "user.email"],
      corsOrigins: data.corsOrigins || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newClient, ...oauthClients];
    setOauthClients(updated);
    localStorage.setItem(DEV_OAUTH_STORAGE_KEY, JSON.stringify(updated));
    return newClient;
  };

  const rotateOAuthSecret = async (id: string): Promise<string> => {
    const newSecret = `scryme_sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const updated = oauthClients.map((c) => (c.id === id ? { ...c, clientSecret: newSecret } : c));
    setOauthClients(updated);
    localStorage.setItem(DEV_OAUTH_STORAGE_KEY, JSON.stringify(updated));
    return newSecret;
  };

  const toggleOAuthClient = (id: string) => {
    const updated = oauthClients.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    setOauthClients(updated);
    localStorage.setItem(DEV_OAUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteOAuthClient = (id: string) => {
    const updated = oauthClients.filter((c) => c.id !== id);
    setOauthClients(updated);
    localStorage.setItem(DEV_OAUTH_STORAGE_KEY, JSON.stringify(updated));
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
