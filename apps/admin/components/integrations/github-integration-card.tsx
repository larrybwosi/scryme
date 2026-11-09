"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Loader2,
  Save,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  GitBranch,
  Github,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateSystemIntegrationSettings,
  testGitHubConnection,
  fetchGitHubAccessibleRepositories,
  triggerGitHubReleaseSyncAction,
  type SystemIntegrationSettings,
} from "@/app/actions/integrations";

interface GitHubIntegrationCardProps {
  systemSettings: SystemIntegrationSettings;
}

export function GitHubIntegrationCard({
  systemSettings,
}: GitHubIntegrationCardProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SystemIntegrationSettings>(systemSettings);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [customTag, setCustomTag] = useState("");

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(":3007", ":3000")}/v3/webhooks/github`
      : "https://api.scryme.tech/v3/webhooks/github";

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/integrations/github/callback`
      : "https://admin.scryme.tech/api/integrations/github/callback";

  // Query accessible repos if connected
  const {
    data: reposData,
    isLoading: isLoadingRepos,
    refetch: refetchRepos,
  } = useQuery({
    queryKey: ["github-accessible-repos"],
    queryFn: fetchGitHubAccessibleRepositories,
    enabled: Boolean(
      formData.githubToken ||
        (formData.githubAppId && formData.githubInstallationId),
    ),
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: updateSystemIntegrationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["system-integration-settings"],
      });
      toast.success("GitHub configuration saved successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testGitHubConnection();
      if (res.success) {
        toast.success(res.message);
        refetchRepos();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncRelease = async () => {
    setIsSyncing(true);
    try {
      const res = await triggerGitHubReleaseSyncAction(customTag || undefined);
      toast.success(
        res.processed
          ? `Synced release: ${res.releaseTag} (${res.savedCount || 0} binaries updated)`
          : "Release sync triggered",
      );
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectWithGitHub = () => {
    if (formData.githubAppSlug) {
      const installUrl = `https://github.com/apps/${formData.githubAppSlug}/installations/new`;
      window.open(installUrl, "_blank", "noopener,noreferrer");
    } else if (formData.githubClientId) {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${formData.githubClientId}&scope=repo,read:org&redirect_uri=${encodeURIComponent(
        callbackUrl,
      )}`;
      window.open(authUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Please enter a GitHub App Slug or Client ID first");
    }
  };

  const isConnected = Boolean(
    formData.githubInstallationId || formData.githubToken,
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Github className="size-5 text-purple-400" />
            GitHub App &amp; Webhooks Integration
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Connect your GitHub App to automate software releases, capture tag &amp; push webhooks, and sync POS release binaries to RustFS.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? "secondary" : "outline"}
            className={
              isConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""
            }
          >
            {isConnected ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-500" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="size-3 text-amber-500" /> Not Connected
              </span>
            )}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleConnectWithGitHub}
            className="gap-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 border-purple-500/30"
          >
            <ExternalLink className="size-3.5" />
            Connect with GitHub
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="flex flex-col gap-6"
        >
          {/* Main Activation Switch */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable GitHub App Integration</Label>
              <p className="text-xs text-muted-foreground">
                Activates automatic webhook ingestion for release tags and push updates.
              </p>
            </div>
            <Switch
              checked={formData.githubEnabled ?? false}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, githubEnabled: checked })
              }
            />
          </div>

          {/* Webhook & Callback URLs helper callouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 rounded-lg border p-3 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Webhook URL (V3 Webhooks)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedUrl(true);
                    toast.success("Webhook URL copied to clipboard");
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                >
                  {copiedUrl ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground break-all bg-background/50 p-1.5 rounded">
                {webhookUrl}
              </code>
              <span className="text-[10px] text-muted-foreground">
                Set this as Payload URL in your GitHub App or Repository settings (Content type: application/json).
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border p-3 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Setup &amp; Callback URL
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(callbackUrl);
                    setCopiedCallback(true);
                    toast.success("Callback URL copied to clipboard");
                    setTimeout(() => setCopiedCallback(false), 2000);
                  }}
                >
                  {copiedCallback ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground break-all bg-background/50 p-1.5 rounded">
                {callbackUrl}
              </code>
              <span className="text-[10px] text-muted-foreground">
                Configure as the Setup URL &amp; Callback URL in GitHub App Settings.
              </span>
            </div>
          </div>

          {/* Repository Selection */}
          <div className="flex flex-col gap-2 rounded-lg border p-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="size-4 text-purple-400" />
                Target Repository Selection
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => refetchRepos()}
                disabled={isLoadingRepos}
                className="h-7 text-xs gap-1.5"
              >
                {isLoadingRepos ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                Refresh Accessible Repos
              </Button>
            </div>

            {reposData?.repositories && reposData.repositories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="repo-select" className="text-xs">
                    Select from Accessible Repositories ({reposData.repositories.length})
                  </Label>
                  <Select
                    value={
                      formData.githubOwner && formData.githubRepo
                        ? `${formData.githubOwner}/${formData.githubRepo}`
                        : undefined
                    }
                    onValueChange={(val: string) => {
                      const [owner, repo] = val.split("/");
                      if (owner && repo) {
                        setFormData({
                          ...formData,
                          githubOwner: owner,
                          githubRepo: repo,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="repo-select">
                      <SelectValue placeholder="Choose repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {reposData.repositories.map((repo: any) => (
                        <SelectItem key={repo.id} value={repo.fullName}>
                          {repo.fullName} {repo.private ? "(Private)" : "(Public)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Selected Owner &amp; Repo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.githubOwner || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, githubOwner: e.target.value })
                      }
                      placeholder="Owner"
                    />
                    <span className="text-muted-foreground font-mono">/</span>
                    <Input
                      value={formData.githubRepo || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, githubRepo: e.target.value })
                      }
                      placeholder="Repository"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="manual-owner" className="text-xs">GitHub Owner / Org</Label>
                  <Input
                    id="manual-owner"
                    value={formData.githubOwner || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, githubOwner: e.target.value })
                    }
                    placeholder="e.g. dealio-org"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-repo" className="text-xs">GitHub Repository</Label>
                  <Input
                    id="manual-repo"
                    value={formData.githubRepo || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, githubRepo: e.target.value })
                    }
                    placeholder="e.g. scryme"
                  />
                </div>
              </div>
            )}
          </div>

          {/* GitHub App & OAuth Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gh-app-id">GitHub App ID</Label>
              <Input
                id="gh-app-id"
                value={formData.githubAppId || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, githubAppId: e.target.value })
                }
                placeholder="e.g. 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gh-app-slug">GitHub App Slug</Label>
              <Input
                id="gh-app-slug"
                value={formData.githubAppSlug || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, githubAppSlug: e.target.value })
                }
                placeholder="e.g. scryme-pos-bot"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gh-installation-id">Installation ID</Label>
              <Input
                id="gh-installation-id"
                value={formData.githubInstallationId || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    githubInstallationId: e.target.value,
                  })
                }
                placeholder="Auto-captured or manual e.g. 987654"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gh-client-id">OAuth Client ID</Label>
              <Input
                id="gh-client-id"
                value={formData.githubClientId || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, githubClientId: e.target.value })
                }
                placeholder="Iv1.xxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gh-client-secret">OAuth Client Secret</Label>
              <Input
                id="gh-client-secret"
                type="password"
                value={formData.githubClientSecret || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    githubClientSecret: e.target.value,
                  })
                }
                placeholder="GitHub OAuth / App Client Secret"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gh-webhook-secret">Webhook Secret</Label>
              <Input
                id="gh-webhook-secret"
                type="password"
                value={formData.githubWebhookSecret || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    githubWebhookSecret: e.target.value,
                  })
                }
                placeholder="HMAC secret used to verify webhook signatures"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gh-pat-token">
                Personal Access Token (PAT) / Fallback Token
              </Label>
              <Input
                id="gh-pat-token"
                type="password"
                value={formData.githubToken || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, githubToken: e.target.value })
                }
                placeholder="ghp_... or ghs_..."
              />
            </div>
          </div>

          {/* GitHub App Private Key */}
          <div className="space-y-2">
            <Label htmlFor="gh-private-key">
              GitHub App Private Key (.pem format)
            </Label>
            <textarea
              id="gh-private-key"
              rows={4}
              value={formData.githubPrivateKey || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, githubPrivateKey: e.target.value })
              }
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Optional tag (e.g. v1.2.0)"
                value={customTag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTag(e.target.value)}
                className="w-48 h-9 text-xs font-mono"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isSyncing}
                onClick={handleSyncRelease}
                className="gap-2 h-9 text-xs"
              >
                {isSyncing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5 text-primary" />
                )}
                Sync Release Now
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="gap-2 h-9 text-xs"
              >
                {isTesting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5 text-purple-400" />
                )}
                Test Authorization
              </Button>

              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="gap-2 h-9 text-xs"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save Settings
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
