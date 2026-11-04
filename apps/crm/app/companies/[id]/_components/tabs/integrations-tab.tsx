"use client";

import React, { useState } from "react";
import { KeyRound, Plus, Trash2, Check, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
import {
  createB2BConnectionAction,
  revokeB2BConnectionAction,
} from "@/app/actions/company-enterprise";

export function CompanyIntegrationsTab({ company }: { company: any }) {
  const [connections, setConnections] = useState<any[]>(company.b2bConnections || []);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    try {
      setIsCreating(true);
      const res = await createB2BConnectionAction(company.id);
      if (res.success && res.data) {
        toast.success("New B2B API Key generated");
        setConnections([res.data, ...connections]);
      } else {
        toast.error(res.error || "Failed to generate connection key");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate connection key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await revokeB2BConnectionAction(id, company.id);
      if (res.success) {
        toast.success("B2B API Connection revoked");
        setConnections(connections.filter((c) => c.id !== id));
      } else {
        toast.error(res.error || "Failed to revoke connection");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke connection");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success("API Key copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            B2B Connections & External API Sync
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage direct automated inventory, order dispatch, and webhook synchronization keys for {company.name}.
          </p>
        </div>

        <Button
          onClick={handleGenerateKey}
          disabled={isCreating}
          size="sm"
          className="text-xs h-8 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Generate New B2B Key
        </Button>
      </div>

      <div className="space-y-3">
        {connections.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-xl text-center bg-card">
            <KeyRound className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-foreground">No active B2B connection keys</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Generating an API key enables this enterprise client or external ERP system to query product catalogs, sync wholesale orders, and retrieve invoice balances.
            </p>
          </div>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.id}
              className="p-4 border border-border rounded-xl bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded border border-border">
                    {conn.apiKey}
                  </span>
                  <button
                    onClick={() => copyToClipboard(conn.apiKey)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedKey === conn.apiKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Created on {new Date(conn.createdAt).toLocaleDateString()}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeKey(conn.id)}
                className="text-xs text-destructive hover:bg-destructive/10 h-8 gap-1 self-end md:self-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Revoke Key
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
