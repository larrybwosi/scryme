"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  organizationName: string;
  role: string;
}

interface DeveloperAuthContextType {
  user: DeveloperUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, orgName: string, pass: string) => Promise<boolean>;
  logout: () => void;
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

const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: "key_1",
    name: "Production Storefront API",
    keyPrefix: "sk_live_8f3a_",
    fullKey: "sk_live_8f3a_94b02e7a18f4d9c3e21067ab54f10a8d",
    environment: "LIVE",
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastUsedAt: "2 mins ago",
  },
  {
    id: "key_2",
    name: "Staging Testing Key",
    keyPrefix: "sk_test_1c9b_",
    fullKey: "sk_test_1c9b_4490f11a8b910e5d42187a2234e90812",
    environment: "TEST",
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    lastUsedAt: "1 hour ago",
  },
];

const INITIAL_OAUTH_CLIENTS: OAuthClientItem[] = [
  {
    id: "oauth_1",
    name: "Customer Loyalty Mobile App",
    clientId: "v3_app_84920a1f9e83b21c",
    clientSecret: "scryme_sec_994a20b9c3e7d8f1e0a92b3c4d5e6f7a",
    redirectUris: ["https://loyalty.app.com/oauth/callback", "http://localhost:3000/callback"],
    scopes: ["user.profile", "user.email", "loyalty.read"],
    corsOrigins: ["https://loyalty.app.com", "http://localhost:3000"],
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "oauth_2",
    name: "Enterprise ERP Portal Integration",
    clientId: "v3_erp_184729013cba72e1",
    clientSecret: "scryme_sec_110293847566543210fedcba98765432",
    redirectUris: ["https://erp.internal.org/auth/scryme/callback"],
    scopes: ["user.profile", "user.email", "inventory.read", "orders.read", "finance.read"],
    corsOrigins: ["https://erp.internal.org"],
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

const DEV_USER_STORAGE_KEY = "scryme_dev_user";
const DEV_KEYS_STORAGE_KEY = "scryme_dev_api_keys";
const DEV_OAUTH_STORAGE_KEY = "scryme_dev_oauth_clients";

export function DeveloperAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DeveloperUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [oauthClients, setOauthClients] = useState<OAuthClientItem[]>(INITIAL_OAUTH_CLIENTS);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(DEV_USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Default guest user session for smooth developer exploration
        const defaultUser: DeveloperUser = {
          id: "dev_usr_default",
          name: "Alex Dev",
          email: "alex@developer.scryme.tech",
          organizationName: "Scryme Innovations Lab",
          role: "Lead Platform Architect",
        };
        setUser(defaultUser);
        localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(defaultUser));
      }

      const storedKeys = localStorage.getItem(DEV_KEYS_STORAGE_KEY);
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      }

      const storedOAuth = localStorage.getItem(DEV_OAUTH_STORAGE_KEY);
      if (storedOAuth) {
        setOauthClients(JSON.parse(storedOAuth));
      }
    } catch (err) {
      console.error("Failed loading developer auth session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const loggedUser: DeveloperUser = {
      id: `dev_${Date.now()}`,
      name: email.split("@")[0].toUpperCase(),
      email,
      organizationName: `${email.split("@")[0].toUpperCase()} Tech Org`,
      role: "Application Developer",
    };

    setUser(loggedUser);
    localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(loggedUser));
    setIsLoading(false);
    return true;
  };

  const register = async (name: string, email: string, orgName: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));

    const newUser: DeveloperUser = {
      id: `dev_${Date.now()}`,
      name,
      email,
      organizationName: orgName || `${name}'s Workspace`,
      role: "Platform Developer",
    };

    setUser(newUser);
    localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(DEV_USER_STORAGE_KEY);
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
