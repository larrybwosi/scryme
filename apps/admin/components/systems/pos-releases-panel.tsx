"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Github,
  Key,
  Loader2,
  RefreshCw,
  Save,
  Server,
  Trash2,
  HardDrive,
  Copy,
  Check,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  updatePosReleaseSettings,
  deletePosReleaseBinary,
  triggerGithubReleaseSync,
} from "@/app/actions/pos-releases";

interface PosReleasesPanelProps {
  settings: {
    webhookSecret: string;
    owner: string;
    repo: string;
    token: string;
  };
  binaries: Array<{
    id: string;
    version: string;
    platform: string;
    variant: string;
    fileName: string;
    fileUrl: string;
    sizeBytes: number | null;
    releaseTag: string;
    isLatest: boolean;
    createdAt: string;
  }>;
}

export function PosReleasesPanel({
  settings: initialSettings,
  binaries: initialBinaries,
}: PosReleasesPanelProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech"}/public/github-webhook`;

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updatePosReleaseSettings(settings);
      toast.success("POS Release & GitHub Webhook configuration updated");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update configuration");
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleSyncFromGithub() {
    setIsSyncing(true);
    try {
      await triggerGithubReleaseSync();
      toast.success("GitHub release binary sync completed successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to sync release binaries from GitHub");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDeleteBinary(id: string) {
    setDeletingId(id);
    try {
      await deletePosReleaseBinary(id);
      toast.success("POS release binary deleted from RustFS storage");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete binary");
    } finally {
      setDeletingId(null);
    }
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    toast.success("Webhook endpoint URL copied to clipboard");
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Webhook Endpoint Banner */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Server className="size-4 text-primary" /> GitHub Webhook Integration Endpoint
          </CardTitle>
          <CardDescription>
            Configure this webhook URL in your GitHub repository settings under Settings &gt; Webhooks. Set Content type to <code>application/json</code> and trigger on <code>Release</code> events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-md border border-border">
            <code className="text-xs sm:text-sm font-mono text-foreground flex-1 truncate">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyWebhookUrl}
              className="gap-1.5 shrink-0"
            >
              {copiedWebhookUrl ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedWebhookUrl ? "Copied" : "Copy URL"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Repository & Webhook Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Github className="size-4 text-purple-500" /> GitHub Repository & Webhook Secret Configuration
          </CardTitle>
          <CardDescription>
            Provide your GitHub repository details and webhook secret to authenticate release events and automatically download built POS binaries to RustFS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="github-owner">GitHub Owner / Org</Label>
              <Input
                id="github-owner"
                value={settings.owner}
                onChange={(e) => setSettings({ ...settings, owner: e.target.value })}
                placeholder="e.g. dealio-org"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="github-repo">GitHub Repository</Label>
              <Input
                id="github-repo"
                value={settings.repo}
                onChange={(e) => setSettings({ ...settings, repo: e.target.value })}
                placeholder="e.g. scryme"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="github-secret">GitHub Webhook Secret</Label>
              <Input
                id="github-secret"
                type="password"
                value={settings.webhookSecret}
                onChange={(e) => setSettings({ ...settings, webhookSecret: e.target.value })}
                placeholder="HMAC secret used to verify webhook signatures"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="github-token">GitHub Personal Access Token (Optional)</Label>
              <Input
                id="github-token"
                type="password"
                value={settings.token}
                onChange={(e) => setSettings({ ...settings, token: e.target.value })}
                placeholder="ghp_... for private release downloads"
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSyncing}
                onClick={handleSyncFromGithub}
                className="gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4 text-primary" />
                )}
                Sync Release Binaries Now
              </Button>

              <Button type="submit" disabled={isSavingSettings} className="gap-2">
                {isSavingSettings ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* RustFS Stored POS App Binaries Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HardDrive className="size-4 text-emerald-500" /> Stored POS App Release Binaries (RustFS)
            </span>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
              {initialBinaries.length} Binaries Stored
            </Badge>
          </CardTitle>
          <CardDescription>
            These binaries are stored in RustFS and served directly to site users when they select POS app variants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Variant</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialBinaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No release binaries stored in RustFS yet. Webhook events or manual syncs will auto-populate this list.
                    </td>
                  </tr>
                ) : (
                  initialBinaries.map((bin) => (
                    <tr key={bin.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold capitalize text-foreground">
                        {bin.platform}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize font-mono text-xs">
                          {bin.variant}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-xs text-foreground">
                        {bin.version}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {bin.fileName}
                      </td>
                      <td className="p-3 text-xs tabular-nums text-muted-foreground">
                        {formatBytes(bin.sizeBytes)}
                      </td>
                      <td className="p-3">
                        {bin.isLatest ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            Latest
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Archived
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                          >
                            <a href={bin.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="size-3 text-primary" />
                              Download
                            </a>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === bin.id}
                            onClick={() => handleDeleteBinary(bin.id)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === bin.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
