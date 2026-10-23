"use client";

import React, { useState } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Bot,
  Terminal,
  Server,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  createMcpApiKeyAction,
  revokeMcpApiKeyAction,
} from "@/app/actions/mcp";

interface McpKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: Date | string | null;
  expiresAt: Date | string | null;
  createdAt: Date | string;
}

interface Props {
  initialKeys: McpKey[];
}

export function McpSettingsClient({ initialKeys }: Props) {
  const [keys, setKeys] = useState<McpKey[]>(initialKeys);
  const [keyName, setKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setIsCreating(true);
    try {
      const res = await createMcpApiKeyAction({ name: keyName.trim() });
      setCreatedRawKey(res.rawKey);
      setKeys((prev) => [
        {
          id: res.id,
          name: res.name,
          keyPrefix: res.keyPrefix,
          scopes: res.scopes,
          isActive: true,
          lastUsedAt: null,
          expiresAt: null,
          createdAt: res.createdAt,
        },
        ...prev,
      ]);
      setKeyName("");
    } catch (err: any) {
      alert("Failed to create MCP key: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this MCP API Key? AI clients using it will immediately lose access.")) {
      return;
    }

    try {
      await revokeMcpApiKeyAction(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: any) {
      alert("Failed to revoke key: " + err.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const activeKeyForConfig = createdRawKey || (keys.length > 0 ? `${keys[0].keyPrefix}...` : "YOUR_SCRYME_MCP_KEY");

  const claudeConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        scryme: {
          command: "npx",
          args: ["-y", "@scryme/mcp-server"],
          env: {
            SCRYME_API_KEY: activeKeyForConfig,
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Model Context Protocol (MCP) Integrations</h2>
            <p className="text-slate-400 text-sm">
              Connect local and cloud AI assistants (Claude Desktop, Cursor, Custom LLMs) directly to your Scryme workspace data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-indigo-400 font-medium mb-1">
              <Zap className="w-4 h-4" /> Live Workspace Data
            </div>
            <p className="text-xs text-slate-400">
              Query inventory, orders, products, customers, and analytics in real time.
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-indigo-400 font-medium mb-1">
              <ShieldAlert className="w-4 h-4" /> Tenant Isolated
            </div>
            <p className="text-xs text-slate-400">
              All MCP tool executions are strictly isolated to your organization.
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-indigo-400 font-medium mb-1">
              <Server className="w-4 h-4" /> Dual Transport Support
            </div>
            <p className="text-xs text-slate-400">
              Supports both HTTP/SSE remote endpoints and lightweight Stdio CLI package.
            </p>
          </div>
        </div>
      </div>

      {/* Raw Key Modal Display */}
      {createdRawKey && (
        <div className="p-5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Key className="w-5 h-5" /> MCP Key Created Successfully!
            </div>
            <button
              onClick={() => setCreatedRawKey(null)}
              className="text-xs text-emerald-300 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Please copy this key now. For security, it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 text-sm font-mono break-all">
              {createdRawKey}
            </code>
            <button
              onClick={() => copyToClipboard(createdRawKey, "createdKey")}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedIndex === "createdKey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedIndex === "createdKey" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Key Creation & Active Keys */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-white">Active MCP Keys</h3>
            <p className="text-xs text-slate-400">Generate access tokens to authorize AI assistants.</p>
          </div>

          <form onSubmit={handleCreateKey} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Key Name (e.g. Claude Desktop)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
            />
            <button
              type="submit"
              disabled={isCreating || !keyName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Generate Key
            </button>
          </form>
        </div>

        {keys.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No MCP API keys created yet. Generate one above to connect Claude or Cursor.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {keys.map((k) => (
              <div key={k.id} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{k.name}</span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded-full font-mono">
                      {k.keyPrefix}...
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-full">
                      {k.scopes.join(", ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Created: {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt && ` • Last Used: ${new Date(k.lastUsedAt).toLocaleString()}`}
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeKey(k.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Revoke Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration Guide Snippets */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Connection Instructions</h3>
          <p className="text-xs text-slate-400">Copy these configurations into your preferred AI desktop tool.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claude Desktop */}
          <div className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Terminal className="w-4 h-4 text-indigo-400" /> Claude Desktop Setup
              </div>
              <button
                onClick={() => copyToClipboard(claudeConfigSnippet, "claudeConfig")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedIndex === "claudeConfig" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIndex === "claudeConfig" ? "Copied" : "Copy Config"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Add this to <code className="text-slate-300 font-mono">claude_desktop_config.json</code>:
            </p>
            <pre className="p-3 bg-slate-900 border border-slate-800 text-indigo-300 rounded text-xs font-mono overflow-x-auto">
              {claudeConfigSnippet}
            </pre>
          </div>

          {/* Remote SSE / Cursor Endpoint */}
          <div className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Server className="w-4 h-4 text-indigo-400" /> Remote HTTP / SSE Endpoint
              </div>
              <button
                onClick={() => copyToClipboard("https://api.scryme.tech/v3/mcp/sse", "sseUrl")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedIndex === "sseUrl" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIndex === "sseUrl" ? "Copied" : "Copy URL"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Use this SSE endpoint for remote AI agents and web integrations:
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 text-emerald-400 rounded text-xs font-mono break-all">
              https://api.scryme.tech/v3/mcp/sse
            </div>
            <div className="text-[11px] text-slate-500">
              Header required: <code className="text-slate-400">Authorization: Bearer &lt;YOUR_MCP_KEY&gt;</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
