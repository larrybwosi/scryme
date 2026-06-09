'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Shield, Globe, Key, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function WindmillConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [provisioning, setProvisioning] = useState(false);

  // Form state
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [environment, setEnvironment] = useState('production');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/windmill/config');
      const data = await res.json();

      if (data.configured) {
        setConfig(data);
        setBaseUrl(data.windmillBaseUrl || '');
        setEnvironment(data.environment || 'production');
        // API Key and Webhook Secret are masked on GET
      }
    } catch (err) {
      console.error('Failed to fetch Windmill config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/windmill/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          windmillBaseUrl: baseUrl,
          windmillApiKey: apiKey,
          webhookSecret,
          environment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSuccess('Configuration saved successfully');
      setApiKey(''); // Clear sensitive fields
      setWebhookSecret('');
      fetchConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProvisionScryme = async () => {
    setProvisioning(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/windmill/provision-scryme', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision Scryme Chat workspace');
      }

      setSuccess('Scryme Chat workspace provisioned successfully');
      fetchConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProvisioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-zinc-100">
                <Zap className="h-5 w-5 text-orange-400" />
                Connection Details
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Windmill Base URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://windmill.example.com"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Admin API Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={config?.windmillApiKeyMasked || "wm_sk_..."}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
                      required={!config?.configured}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Required for workspace provisioning and template deployment.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Webhook Secret
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder={config?.webhookSecretMasked || "••••••••••••••••"}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
                      required={!config?.configured}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-4 text-sm text-zinc-200 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all appearance-none"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {config?.configured ? 'Update Configuration' : 'Connect Windmill'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Status & Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Connection</span>
                {config?.healthStatus === 'healthy' ? (
                  <Badge variant="success">Healthy</Badge>
                ) : config?.configured ? (
                  <Badge variant="warning">Degraded</Badge>
                ) : (
                  <Badge variant="secondary">Not Connected</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Last Checked</span>
                <span className="text-xs text-zinc-300">
                  {config?.lastHealthCheck ? new Date(config.lastHealthCheck).toLocaleString() : 'Never'}
                </span>
              </div>
              {config?.healthMessage && (
                <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-[11px] text-zinc-500 font-mono">
                  {config.healthMessage}
                </div>
              )}
            </div>
          </div>

          {config?.configured && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                <Globe className="h-4 w-4 text-emerald-400" />
                Scryme Chat
              </h3>

              <div className="space-y-4">
                {config.scrymeChatWorkspaceId ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-zinc-500 uppercase">Workspace ID</p>
                      <p className="text-sm text-zinc-300 font-mono">{config.scrymeChatWorkspaceId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-zinc-500 uppercase">Slug</p>
                      <p className="text-sm text-zinc-300 font-mono">{config.scrymeChatWorkspaceSlug}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-emerald-400 font-medium">Provisioned</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Provision a dedicated Scryme Chat workspace for your organization's communications.
                    </p>
                    <button
                      onClick={handleProvisionScryme}
                      disabled={provisioning}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600/10 border border-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-600/20 disabled:opacity-50"
                    >
                      {provisioning ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      Provision Workspace
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
             <h3 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">About Windmill</h3>
             <p className="text-xs leading-relaxed text-zinc-500">
               Windmill is an open-source developer platform to turn scripts into workflows and internal apps.
               Dealio uses Windmill to orchestrate complex event-driven business logic.
             </p>
             <div className="mt-4">
               <a
                href="https://windmill.dev"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
               >
                 View Documentation
                 <ExternalLink className="h-3 w-3" />
               </a>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant = 'secondary' }: { children?: React.ReactNode, variant?: 'success' | 'warning' | 'secondary' }) {
  const variants = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    secondary: 'border-zinc-700 bg-zinc-800 text-zinc-400',
  };

  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight', variants[variant])}>
      {children}
    </span>
  );
}
