"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Copy, PlugZap, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import type { CustomermatesListKind } from "@repo/customermates";
import {
  connectCustomermates,
  disconnectCustomermates,
  getCustomermatesStatus,
  listCustomermatesFailed,
  refreshCustomermatesSchema,
  retryCustomermatesFailed,
  rotateCustomermatesSecret,
} from "@/app/actions/customermates";

type Status = {
  connected: boolean;
  syncStatus: string;
  syncMessage: string;
  lastSyncAt: string | null;
  schemaRevision: number;
  listKinds: Partial<Record<CustomermatesListKind, string>>;
  fieldIds: Record<string, string>;
  failedCount: number;
  webhookUrl: string;
};

type FailedItems = {
  events: Array<{ id: string; eventType: string; externalEventId: string | null; processingError: string | null; receivedAt: string }>;
  records: Array<{ id: string; typeId: string; recordId: string; lastError: string | null }>;
};

const KIND_LABELS: Array<[CustomermatesListKind, string]> = [
  ["contact", "Contact list id"],
  ["organization", "Organization list id"],
  ["deal", "Deal list id"],
  ["message", "Message list id"],
];

export default function CustomermatesSettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [failed, setFailed] = useState<FailedItems>({ events: [], records: [] });
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [listKinds, setListKinds] = useState<Partial<Record<CustomermatesListKind, string>>>({});
  const [newSecret, setNewSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const result = await getCustomermatesStatus();
    if (result.success && result.data) {
      setStatus(result.data as Status);
      setListKinds((result.data as Status).listKinds || {});
    } else {
      setError(result.error || "Could not load Customermates status");
    }
    const failedResult = await listCustomermatesFailed();
    if (failedResult.success && failedResult.data) {
      setFailed(failedResult.data as FailedItems);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action: () => Promise<{ success: boolean; error?: string }>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (!result.success) setError(result.error || message);
      else {
        setNotice(message);
        await load();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : message);
    } finally {
      setBusy(false);
    }
  }

  const syncBadgeVariant = status?.syncStatus === "ERROR"
    ? "destructive"
    : status?.syncStatus === "SYNCED"
      ? "default"
      : "secondary";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/communications">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Customermates</h1>
          <p className="text-xs text-muted-foreground">
            Two way sync for contacts, organizations, deals and messages
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PlugZap className="h-4 w-4 text-primary" />
              Connection
            </CardTitle>
            <Badge variant={syncBadgeVariant}>{status?.syncStatus || "LOADING"}</Badge>
          </div>
          <CardDescription className="text-xs">
            Connect one workspace per organization. Credentials are encrypted at rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.connected && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Webhook URL</label>
              <div className="flex items-center gap-2">
                <Input readOnly value={status.webhookUrl} className="font-mono text-xs bg-muted/30" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(status.webhookUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Schema revision {status.schemaRevision || "none"} · Failed items {status.failedCount}
                {status.lastSyncAt ? ` · Last sync ${new Date(status.lastSyncAt).toLocaleString()}` : ""}
              </p>
              {status.syncMessage ? (
                <p className="text-[11px] text-muted-foreground">{status.syncMessage}</p>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Base URL</label>
              <Input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://app.customermates.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">API key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Dedicated low privilege key"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Webhook secret</label>
              <Input
                type="password"
                value={webhookSecret}
                onChange={(event) => setWebhookSecret(event.target.value)}
                placeholder="At least 16 characters"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KIND_LABELS.map(([kind, label]) => (
              <div className="space-y-1.5" key={kind}>
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <Input
                  value={listKinds[kind] || ""}
                  onChange={(event) =>
                    setListKinds((current) => ({
                      ...current,
                      [kind]: event.target.value || undefined,
                    }))
                  }
                  placeholder={status?.listKinds[kind] || "Inferred"}
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !baseUrl || !apiKey || !webhookSecret}
              onClick={() =>
                run(
                  () => connectCustomermates({ baseUrl, apiKey, webhookSecret, listKinds }),
                  "Customermates connected",
                )
              }
            >
              {status?.connected ? "Reconnect" : "Connect"}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !status?.connected}
              onClick={() => run(refreshCustomermatesSchema, "Schema refreshed")}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh schema
            </Button>
            <Button
              variant="outline"
              disabled={busy || !status?.connected}
              onClick={() => run(disconnectCustomermates, "Customermates disconnected")}
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Webhook secret rotation
          </CardTitle>
          <CardDescription className="text-xs">
            The previous secret keeps working for 24 hours after rotation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            value={newSecret}
            onChange={(event) => setNewSecret(event.target.value)}
            placeholder="New webhook secret"
          />
          <Button
            variant="outline"
            disabled={busy || newSecret.length < 16 || !status?.connected}
            onClick={() => {
              const secret = newSecret;
              setNewSecret("");
              return run(
                () => rotateCustomermatesSecret(secret),
                "Webhook secret rotated",
              );
            }}
          >
            Rotate secret
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Failed items
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              disabled={busy || !status?.connected || (failed.events.length === 0 && failed.records.length === 0)}
              onClick={() => run(() => retryCustomermatesFailed(), "Failed items requeued")}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Retry all
            </Button>
          </div>
          <CardDescription className="text-xs">
            Failed events and records stay in the dedupe ledger until a retry succeeds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {failed.events.length === 0 && failed.records.length === 0 ? (
            <p className="text-xs text-muted-foreground">No failed items.</p>
          ) : (
            <>
              {failed.events.map((event) => (
                <div key={event.id} className="rounded-md border px-3 py-2 text-xs">
                  <p className="font-medium">{event.eventType || event.externalEventId || event.id}</p>
                  <p className="text-muted-foreground">{event.processingError || "Unknown event error"}</p>
                </div>
              ))}
              {failed.records.map((record) => (
                <div key={record.id} className="rounded-md border px-3 py-2 text-xs">
                  <p className="font-medium">{record.recordId}</p>
                  <p className="text-muted-foreground">{record.lastError || "Unknown record error"}</p>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-500">{notice}</p> : null}
    </div>
  );
}
