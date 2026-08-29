"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Key,
  Lock,
  Plus,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Shield,
  Activity,
  Code2,
  Webhook,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Zap,
  Layers,
  Sparkles,
  Terminal,
  LogOut,
  User,
  Building,
} from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { useDeveloperAuth, ApiKeyItem, OAuthClientItem } from "@/lib/developer-auth";

export default function DeveloperDashboardPage() {
  const {
    user,
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
  } = useDeveloperAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "apikeys" | "oauth" | "webhooks" | "quickstart">("overview");

  // API Key creation modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState<"LIVE" | "TEST">("LIVE");
  const [generatedKey, setGeneratedKey] = useState<ApiKeyItem | null>(null);

  // OAuth Client creation modal state
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newRedirectUris, setNewRedirectUris] = useState("https://yourapp.com/oauth/callback");
  const [newCorsOrigins, setNewCorsOrigins] = useState("https://yourapp.com");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["user.profile", "user.email"]);
  const [isSubmittingOAuth, setIsSubmittingOAuth] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [generatedOAuth, setGeneratedOAuth] = useState<OAuthClientItem | null>(null);

  // Copy helper state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const created = await createApiKey(newKeyName.trim(), newKeyEnv);
    setGeneratedKey(created);
    setNewKeyName("");
  };

  const handleCreateOAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    setOauthError(null);
    setIsSubmittingOAuth(true);

    try {
      const uris = newRedirectUris
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      const origins = newCorsOrigins
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);

      const created = await createOAuthClient({
        name: newAppName.trim(),
        redirectUris: uris,
        corsOrigins: origins,
        scopes: selectedScopes,
      });

      setGeneratedOAuth(created);
      setNewAppName("");
    } catch (err: any) {
      setOauthError(err?.message || "Failed to create OAuth application.");
    } finally {
      setIsSubmittingOAuth(false);
    }
  };

  const scopeOptions = [
    { id: "user.profile", label: "User Profile", desc: "Access user's full name, role, and avatar" },
    { id: "user.email", label: "User Email", desc: "Access verified email address" },
    { id: "inventory.read", label: "Read Inventory", desc: "View product stock balances and locations" },
    { id: "orders.read", label: "Read Orders", desc: "View sales transactions and order status" },
    { id: "finance.read", label: "Read Ledger", desc: "View enterprise ledger summaries" },
  ];

  return (
    <div
      className="min-h-screen pt-20 pb-20 text-[#F1E9D8]"
      style={{
        background: `radial-gradient(circle at 50% 0%, rgba(200, 154, 75, 0.05) 0%, ${colors.inkBg} 60%)`,
        fontFamily: fonts.body,
      }}
    >
      {/* Top Console Bar */}
      <div className="border-b border-[rgba(241,233,216,0.1)] bg-[#0B1220]/80 backdrop-blur-md sticky top-16 z-30">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.12)] border border-[rgba(200,154,75,0.3)] flex items-center justify-center text-[#C89A4B]">
              <Code2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#F1E9D8]" style={{ fontFamily: fonts.display }}>
                  Developer Console
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SANDBOX ACTIVE
                </span>
              </div>
              <p className="text-xs text-[rgba(241,233,216,0.6)]">
                {user ? `${user.organizationName || "Developer Workspace"} (${user.name})` : "Developer Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGeneratedKey(null);
                setShowKeyModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#162238] border border-[rgba(241,233,216,0.15)] text-[#F1E9D8] hover:border-[#C89A4B] transition-all"
            >
              <Plus size={14} className="text-[#C89A4B]" />
              <span>Create API Key</span>
            </button>

            <button
              onClick={() => {
                setGeneratedOAuth(null);
                setOauthError(null);
                setShowOAuthModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Register OAuth App</span>
            </button>

            {user && (
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-md border border-[rgba(241,233,216,0.1)] text-[rgba(241,233,216,0.6)] hover:text-rose-400 hover:border-rose-500/30 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="container mx-auto px-4 lg:px-8 flex items-center gap-6 overflow-x-auto text-xs font-medium border-t border-[rgba(241,233,216,0.06)]">
          {[
            { id: "overview", label: "Overview & Analytics", icon: Activity },
            { id: "oauth", label: "Sign in with Scryme (OAuth Apps)", icon: Lock, count: oauthClients.length },
            { id: "apikeys", label: "V3 API Keys", icon: Key, count: apiKeys.length },
            { id: "webhooks", label: "Webhooks & Events", icon: Webhook },
            { id: "quickstart", label: "Docs & Integration Guide", icon: FileText },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-[#C89A4B] text-[#C89A4B] font-semibold"
                    : "border-transparent text-[rgba(241,233,216,0.6)] hover:text-[#F1E9D8]"
                }`}
              >
                <IconComp size={15} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-[rgba(200,154,75,0.2)] text-[#C89A4B]" : "bg-[#162238] text-[rgba(241,233,216,0.5)]"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)]">
                <div className="flex items-center justify-between text-[rgba(241,233,216,0.6)] text-xs mb-2">
                  <span>Registered OAuth Apps</span>
                  <Lock size={16} className="text-[#C89A4B]" />
                </div>
                <div className="text-2xl font-bold text-[#F1E9D8]" style={{ fontFamily: fonts.display }}>
                  {oauthClients.length} Apps
                </div>
                <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>&quot;Sign in with Scryme&quot; Ready</span>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)]">
                <div className="flex items-center justify-between text-[rgba(241,233,216,0.6)] text-xs mb-2">
                  <span>Active API Credentials</span>
                  <Key size={16} className="text-[#C89A4B]" />
                </div>
                <div className="text-2xl font-bold text-[#F1E9D8]" style={{ fontFamily: fonts.display }}>
                  {apiKeys.filter((k) => k.isActive).length} Keys
                </div>
                <div className="text-[11px] text-[rgba(241,233,216,0.5)] mt-2">
                  {apiKeys.filter((k) => k.environment === "LIVE").length} Production / {apiKeys.filter((k) => k.environment === "TEST").length} Sandbox
                </div>
              </div>

              <div className="p-5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)]">
                <div className="flex items-center justify-between text-[rgba(241,233,216,0.6)] text-xs mb-2">
                  <span>API Request Volume (24h)</span>
                  <Activity size={16} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-[#F1E9D8]" style={{ fontFamily: fonts.display }}>
                  142,890
                </div>
                <div className="text-[11px] text-emerald-400 mt-2">
                  99.98% Success Rate
                </div>
              </div>

              <div className="p-5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)]">
                <div className="flex items-center justify-between text-[rgba(241,233,216,0.6)] text-xs mb-2">
                  <span>Avg Latency (v3 API)</span>
                  <Zap size={16} className="text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-[#F1E9D8]" style={{ fontFamily: fonts.display }}>
                  18ms
                </div>
                <div className="text-[11px] text-[rgba(241,233,216,0.5)] mt-2">
                  Edge Global Cache Enabled
                </div>
              </div>
            </div>

            {/* Quickstart Integration CTA Card */}
            <div className="p-6 rounded-lg bg-gradient-to-r from-[#162238] to-[#0D1627] border border-[rgba(200,154,75,0.3)] flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-[#C89A4B] text-xs font-mono font-semibold uppercase mb-1">
                  <Sparkles size={14} />
                  <span>Integration Spotlight</span>
                </div>
                <h3 className="text-xl font-bold mb-1.5" style={{ fontFamily: fonts.display }}>
                  Add &quot;Sign in with Scryme&quot; to your web or mobile app
                </h3>
                <p className="text-xs text-[rgba(241,233,216,0.7)] leading-relaxed">
                  Allow your business users to authorize into your external app using their unified Scryme identity with standard OAuth 2.0 PKCE.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("oauth")}
                className="px-4 py-2 rounded-md font-semibold text-xs bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-colors"
              >
                Setup OAuth Application
              </button>
            </div>

            {/* Application List Snippet */}
            <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#F1E9D8]">OAuth 2.0 Applications</h3>
                <button
                  onClick={() => setActiveTab("oauth")}
                  className="text-xs text-[#C89A4B] hover:underline"
                >
                  Manage All ({oauthClients.length})
                </button>
              </div>

              {oauthClients.length === 0 ? (
                <div className="p-8 text-center text-xs text-[rgba(241,233,216,0.5)] bg-[#0B1220] rounded-md border border-[rgba(241,233,216,0.08)]">
                  No OAuth applications registered yet. Click &quot;Setup OAuth Application&quot; to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {oauthClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-4 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.2)] flex items-center justify-center text-[#C89A4B]">
                          <Lock size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#F1E9D8]">{client.name}</div>
                          <div className="text-[11px] font-mono text-[rgba(241,233,216,0.5)] mt-0.5">
                            ID: {client.clientId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-wrap gap-1">
                          {client.scopes.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#162238] text-[rgba(241,233,216,0.7)]">
                              {s}
                            </span>
                          ))}
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${client.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                          {client.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OAUTH APPLICATIONS TAB */}
        {activeTab === "oauth" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)]">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ fontFamily: fonts.display }}>
                  &quot;Sign in with Scryme&quot; OAuth 2.0 Applications
                </h2>
                <p className="text-xs text-[rgba(241,233,216,0.65)] max-w-2xl">
                  Register third-party apps to request access to user accounts. Users will see a consent prompt granting access to requested scopes.
                </p>
              </div>

              <button
                onClick={() => {
                  setGeneratedOAuth(null);
                  setOauthError(null);
                  setShowOAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-all"
              >
                <Plus size={15} />
                <span>New OAuth Application</span>
              </button>
            </div>

            {/* List of OAuth Apps */}
            {oauthClients.length === 0 ? (
              <div className="p-12 text-center text-xs text-[rgba(241,233,216,0.5)] bg-[#121B2E] rounded-lg border border-[rgba(241,233,216,0.1)]">
                No OAuth applications registered yet. Click &quot;New OAuth Application&quot; above.
              </div>
            ) : (
              <div className="space-y-4">
                {oauthClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.12)] space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B] shrink-0">
                          <Lock size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#F1E9D8]">{client.name}</h3>
                          <p className="text-[11px] text-[rgba(241,233,216,0.5)] mt-0.5">
                            Created {new Date(client.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleOAuthClient(client.id)}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                            client.isActive
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {client.isActive ? "Enabled" : "Disabled"}
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const sec = await rotateOAuthSecret(client.id);
                              alert(`New Client Secret generated for ${client.name}:\n\n${sec}\n\nPlease save this immediately.`);
                            } catch (err: any) {
                              alert(`Failed to rotate secret: ${err?.message || "Error"}`);
                            }
                          }}
                          className="px-2.5 py-1 rounded text-xs font-medium border border-[rgba(241,233,216,0.15)] text-[rgba(241,233,216,0.8)] hover:text-[#C89A4B] hover:border-[#C89A4B] transition-colors flex items-center gap-1.5"
                        >
                          <RotateCw size={13} />
                          <span>Rotate Secret</span>
                        </button>

                        <button
                          onClick={() => deleteOAuthClient(client.id)}
                          className="p-1 rounded text-[rgba(241,233,216,0.4)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete application"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Credentials & Configuration Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)] text-xs">
                      <div>
                        <span className="text-[rgba(241,233,216,0.5)] block mb-1">Client ID</span>
                        <div className="flex items-center gap-2 font-mono text-[#F1E9D8]">
                          <span className="truncate">{client.clientId}</span>
                          <button
                            onClick={() => copyToClipboard(client.clientId, `cid_${client.id}`)}
                            className="text-[rgba(241,233,216,0.4)] hover:text-[#C89A4B]"
                          >
                            {copiedId === `cid_${client.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[rgba(241,233,216,0.5)] block mb-1">Client Secret</span>
                        <div className="flex items-center gap-2 font-mono text-[#F1E9D8]">
                          <span className="truncate">{client.clientSecret ? `${client.clientSecret.substring(0, 14)}••••••••` : "••••••••••••••••"}</span>
                          {client.clientSecret && (
                            <button
                              onClick={() => copyToClipboard(client.clientSecret!, `sec_${client.id}`)}
                              className="text-[rgba(241,233,216,0.4)] hover:text-[#C89A4B]"
                            >
                              {copiedId === `sec_${client.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 pt-2 border-t border-[rgba(241,233,216,0.06)]">
                        <span className="text-[rgba(241,233,216,0.5)] block mb-1">Allowed Redirect URIs</span>
                        <div className="flex flex-wrap gap-2">
                          {client.redirectUris.map((uri) => (
                            <span key={uri} className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#162238] text-[rgba(241,233,216,0.8)] border border-[rgba(241,233,216,0.08)]">
                              {uri}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 pt-2 border-t border-[rgba(241,233,216,0.06)]">
                        <span className="text-[rgba(241,233,216,0.5)] block mb-1">Authorized Scopes</span>
                        <div className="flex flex-wrap gap-1.5">
                          {client.scopes.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(200,154,75,0.1)] text-[#C89A4B] border border-[rgba(200,154,75,0.2)]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* API KEYS TAB */}
        {activeTab === "apikeys" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)]">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ fontFamily: fonts.display }}>
                  V3 API Secret Keys
                </h2>
                <p className="text-xs text-[rgba(241,233,216,0.65)] max-w-2xl">
                  API secret keys allow your backend servers to make administrative requests directly to Scryme V3 endpoints.
                </p>
              </div>

              <button
                onClick={() => {
                  setGeneratedKey(null);
                  setShowKeyModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-all"
              >
                <Plus size={15} />
                <span>Create Secret Key</span>
              </button>
            </div>

            {/* Keys Table / Card List */}
            {apiKeys.length === 0 ? (
              <div className="p-12 text-center text-xs text-[rgba(241,233,216,0.5)] bg-[#121B2E] rounded-lg border border-[rgba(241,233,216,0.1)]">
                No API secret keys created yet. Click &quot;Create Secret Key&quot; above.
              </div>
            ) : (
              <div className="p-5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)] flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-[rgba(200,154,75,0.1)] border border-[rgba(200,154,75,0.2)] flex items-center justify-center text-[#C89A4B]">
                        <Key size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F1E9D8]">{key.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${key.environment === "LIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                            {key.environment}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-mono text-[rgba(241,233,216,0.6)]">
                            {key.fullKey ? `${key.keyPrefix}••••••••••••••••` : key.keyPrefix}
                          </span>
                          {key.fullKey && (
                            <button
                              onClick={() => copyToClipboard(key.fullKey!, key.id)}
                              className="text-[rgba(241,233,216,0.4)] hover:text-[#C89A4B]"
                            >
                              {copiedId === key.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[rgba(241,233,216,0.5)]">
                        Last used: {key.lastUsedAt || "Never"}
                      </span>

                      <button
                        onClick={() => toggleApiKey(key.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          key.isActive
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        }`}
                      >
                        {key.isActive ? "Active" : "Revoked"}
                      </button>

                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="p-1 rounded text-[rgba(241,233,216,0.4)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Revoke and delete key"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WEBHOOKS TAB */}
        {activeTab === "webhooks" && (
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: fonts.display }}>
                Webhook Endpoint Subscriptions
              </h2>
              <p className="text-xs text-[rgba(241,233,216,0.65)]">
                Receive HTTP POST callbacks whenever authentication or retail events occur in your organization.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Webhook size={18} className="text-[#C89A4B]" />
                <div>
                  <div className="text-xs font-bold text-[#F1E9D8]">https://yourapp.com/api/webhooks/scryme</div>
                  <div className="text-[11px] text-[rgba(241,233,216,0.5)]">Events: user.authenticated, order.created</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
          </div>
        )}

        {/* QUICKSTART & DOCS TAB */}
        {activeTab === "quickstart" && (
          <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: fonts.display }}>
                &quot;Sign in with Scryme&quot; Integration Guide
              </h2>
              <p className="text-xs text-[rgba(241,233,216,0.65)]">
                Follow these steps to integrate OAuth 2.0 PKCE authentication in your client application.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)]">
                <h4 className="font-bold text-[#C89A4B] mb-1">Step 1: Register an OAuth Application</h4>
                <p className="text-[rgba(241,233,216,0.7)]">
                  Use the &quot;Sign in with Scryme&quot; tab above to create an application and receive your <code className="text-[#C89A4B] font-mono">clientId</code> and <code className="text-[#C89A4B] font-mono">clientSecret</code>.
                </p>
              </div>

              <div className="p-4 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)]">
                <h4 className="font-bold text-[#C89A4B] mb-1">Step 2: Redirect User to Scryme Auth Endpoint</h4>
                <pre className="p-3 rounded-md bg-[#090E1A] font-mono text-[11px] text-[rgba(241,233,216,0.9)] overflow-x-auto mt-2">
                  <code>
{`GET https://api.scryme.tech/v3/auth/oauth2/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://yourapp.com/oauth/callback&
  scope=user.profile%20user.email`}
                  </code>
                </pre>
              </div>

              <div className="p-4 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)]">
                <h4 className="font-bold text-[#C89A4B] mb-1">Step 3: Exchange Authorization Code for Token</h4>
                <pre className="p-3 rounded-md bg-[#090E1A] font-mono text-[11px] text-[rgba(241,233,216,0.9)] overflow-x-auto mt-2">
                  <code>
{`POST https://api.scryme.tech/v3/auth/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
code=AUTH_CODE_RECEIVED`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE API KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.15)] shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(241,233,216,0.1)]">
              <h3 className="text-sm font-bold text-[#F1E9D8]">Create V3 API Secret Key</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-[rgba(241,233,216,0.5)] hover:text-[#F1E9D8]">
                ✕
              </button>
            </div>

            {generatedKey ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-md border bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                  <span className="font-bold block mb-1">API Key Provisioned Successfully!</span>
                  <span>Save this key now. It will not be shown in full again for security reasons.</span>
                </div>

                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.6)] mb-1">Secret Key</label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] font-mono text-[#C89A4B]">
                    <span className="truncate flex-1">{generatedKey.fullKey}</span>
                    <button
                      onClick={() => copyToClipboard(generatedKey.fullKey!, "new_key")}
                      className="px-2 py-1 rounded bg-[#C89A4B] text-[#0B1220] font-semibold hover:bg-[#d4a859]"
                    >
                      {copiedId === "new_key" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowKeyModal(false)}
                  className="w-full py-2 rounded-md font-semibold bg-[#162238] border border-[rgba(241,233,216,0.1)] text-[#F1E9D8] hover:border-[#C89A4B]"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKeySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.8)] mb-1">Key Name / Description</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production Mobile Backend"
                    required
                    className="w-full px-3 py-2 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-[#F1E9D8] focus:outline-none focus:border-[#C89A4B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.8)] mb-1">Environment</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv("LIVE")}
                      className={`p-2.5 rounded-md border text-center font-semibold transition-all ${
                        newKeyEnv === "LIVE"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-[#0B1220] border-[rgba(241,233,216,0.1)] text-[rgba(241,233,216,0.6)]"
                      }`}
                    >
                      LIVE (Production)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv("TEST")}
                      className={`p-2.5 rounded-md border text-center font-semibold transition-all ${
                        newKeyEnv === "TEST"
                          ? "bg-amber-500/10 border-amber-500 text-amber-400"
                          : "bg-[#0B1220] border-[rgba(241,233,216,0.1)] text-[rgba(241,233,216,0.6)]"
                      }`}
                    >
                      TEST (Sandbox)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-md font-semibold bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-colors"
                >
                  Generate Secret Key
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE OAUTH APP MODAL */}
      {showOAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.15)] shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(241,233,216,0.1)]">
              <h3 className="text-sm font-bold text-[#F1E9D8]">Register &quot;Sign in with Scryme&quot; Application</h3>
              <button onClick={() => setShowOAuthModal(false)} className="text-[rgba(241,233,216,0.5)] hover:text-[#F1E9D8]">
                ✕
              </button>
            </div>

            {oauthError && (
              <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {oauthError}
              </div>
            )}

            {generatedOAuth ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-md border bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                  <span className="font-bold block mb-1">OAuth Application Registered!</span>
                  <span>Credentials are ready for authenticating your users. Save the secret key securely.</span>
                </div>

                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.6)] mb-1">Client ID</label>
                  <div className="p-2.5 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] font-mono text-[#F1E9D8]">
                    {generatedOAuth.clientId}
                  </div>
                </div>

                {generatedOAuth.clientSecret && (
                  <div>
                    <label className="block font-medium text-[rgba(241,233,216,0.6)] mb-1">Client Secret</label>
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] font-mono text-[#C89A4B]">
                      <span className="truncate flex-1">{generatedOAuth.clientSecret}</span>
                      <button
                        onClick={() => copyToClipboard(generatedOAuth.clientSecret!, "new_oauth_sec")}
                        className="px-2 py-1 rounded bg-[#C89A4B] text-[#0B1220] font-semibold hover:bg-[#d4a859]"
                      >
                        {copiedId === "new_oauth_sec" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowOAuthModal(false)}
                  className="w-full py-2 rounded-md font-semibold bg-[#162238] border border-[rgba(241,233,216,0.1)] text-[#F1E9D8] hover:border-[#C89A4B]"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateOAuthSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.8)] mb-1">Application Name *</label>
                  <input
                    type="text"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="e.g. Acme Customer Loyalty Mobile App"
                    required
                    className="w-full px-3 py-2 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-[#F1E9D8] focus:outline-none focus:border-[#C89A4B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.8)] mb-1">
                    Allowed Redirect URIs (one per line) *
                  </label>
                  <textarea
                    rows={3}
                    value={newRedirectUris}
                    onChange={(e) => setNewRedirectUris(e.target.value)}
                    placeholder="https://yourapp.com/oauth/callback"
                    required
                    className="w-full px-3 py-2 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-[#F1E9D8] font-mono text-xs focus:outline-none focus:border-[#C89A4B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.8)] mb-1">
                    Allowed CORS Origins (optional, one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={newCorsOrigins}
                    onChange={(e) => setNewCorsOrigins(e.target.value)}
                    placeholder="https://yourapp.com"
                    className="w-full px-3 py-2 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-[#F1E9D8] font-mono text-xs focus:outline-none focus:border-[#C89A4B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[rgba(241,233,216,0.8)] mb-2">Requested Scopes</label>
                  <div className="space-y-2">
                    {scopeOptions.map((scope) => {
                      const isChecked = selectedScopes.includes(scope.id);
                      return (
                        <label
                          key={scope.id}
                          className="flex items-start gap-2.5 p-2 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.08)] cursor-pointer hover:border-[rgba(200,154,75,0.3)] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScopes([...selectedScopes, scope.id]);
                              } else {
                                setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                              }
                            }}
                            className="mt-0.5 accent-[#C89A4B]"
                          />
                          <div>
                            <div className="font-semibold text-[#F1E9D8] flex items-center gap-2">
                              <span>{scope.label}</span>
                              <code className="text-[10px] text-[#C89A4B] font-mono">{scope.id}</code>
                            </div>
                            <div className="text-[11px] text-[rgba(241,233,216,0.5)]">{scope.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOAuth}
                  className="w-full py-2.5 rounded-md font-semibold bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-colors disabled:opacity-50"
                >
                  {isSubmittingOAuth ? "Registering..." : "Register Application & Generate Keys"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
