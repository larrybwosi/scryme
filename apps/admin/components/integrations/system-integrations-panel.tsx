"use client"

import { useState, useEffect } from "react"
import { Loader2, MessageSquare, ShieldAlert, Save, Sparkles, Bot, Hash, Lock, Users, Plus, Trash2, UserPlus, RefreshCw, Copy, Check, ExternalLink, Activity, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateSystemIntegrationSettings,
  provisionAdminChatWorkspace,
  getAdminChatWorkspaceDetails,
  createAdminChatChannel,
  addAdminChatWorkspaceMember,
  removeAdminChatWorkspaceMember,
  testHermesConnection,
  testScrymeChatConnection,
  testSentryWebhookConnection,
  testOpenPanelConnection,
  testPostHogConnection,
  type SystemIntegrationSettings,
} from "@/app/actions/integrations"

export function SystemIntegrationsPanel({
  settings,
  isLoading,
}: {
  settings: SystemIntegrationSettings
  isLoading?: boolean
}) {
  const queryClient = useQueryClient()
  const [isTestingHermes, setIsTestingHermes] = useState(false)
  const [isTestingChat, setIsTestingChat] = useState(false)

  // Scryme Chat Credentials
  const [scrymeChatClientId, setScrymeChatClientId] = useState(settings.scrymeChatClientId ?? "")
  const [scrymeChatClientSecret, setScrymeChatClientSecret] = useState(settings.scrymeChatClientSecret ?? "")
  const [scrymeChatBaseUrl, setScrymeChatBaseUrl] = useState(settings.scrymeChatBaseUrl ?? "https://api.chat.scryme.tech")

  // Hermes Agent Credentials & Configurations
  const [hermesApiKey, setHermesApiKey] = useState(settings.hermesApiKey ?? "")
  const [hermesBaseUrl, setHermesBaseUrl] = useState(settings.hermesBaseUrl ?? "http://hermes:8080")
  const [hermesModel, setHermesModel] = useState(settings.hermesModel ?? "hermes-3-llama-3.1-8b")
  const [hermesEnabled, setHermesEnabled] = useState(settings.hermesEnabled ?? false)

  // System Admin Chat Workspace
  const [adminWorkspaceName, setAdminWorkspaceName] = useState(settings.adminWorkspaceName ?? "System Admin Workspace")
  const [adminWorkspaceSlug, setAdminWorkspaceSlug] = useState(settings.adminWorkspaceSlug ?? "system-admins")
  const [adminChannelSlug, setAdminChannelSlug] = useState(settings.adminChannelSlug ?? "system-alerts")
  const [adminWorkspaceStatus, setAdminWorkspaceStatus] = useState(settings.adminWorkspaceStatus ?? "Not Configured")

  // Sentry SDK & Webhook Configuration
  const [sentryDsn, setSentryDsn] = useState(settings.sentryDsn ?? "")
  const [sentryOrg, setSentryOrg] = useState(settings.sentryOrg ?? "")
  const [sentryProject, setSentryProject] = useState(settings.sentryProject ?? "")
  const [sentryAuthToken, setSentryAuthToken] = useState(settings.sentryAuthToken ?? "")
  const [sentryWebhookSecret, setSentryWebhookSecret] = useState(settings.sentryWebhookSecret ?? "")
  const [sentryEnvironment, setSentryEnvironment] = useState(settings.sentryEnvironment ?? "production")
  const [sentryTracesSampleRate, setSentryTracesSampleRate] = useState(settings.sentryTracesSampleRate ?? "1.0")
  const [sentryEnabled, setSentryEnabled] = useState(settings.sentryEnabled ?? true)

  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [isTestingSentry, setIsTestingSentry] = useState(false)

  // OpenPanel Settings
  const [openpanelClientId, setOpenpanelClientId] = useState(settings.openpanelClientId ?? "")
  const [openpanelClientSecret, setOpenpanelClientSecret] = useState(settings.openpanelClientSecret ?? "")
  const [openpanelHost, setOpenpanelHost] = useState(settings.openpanelHost ?? "https://api.openpanel.dev")
  const [openpanelEnabled, setOpenpanelEnabled] = useState(settings.openpanelEnabled ?? false)
  const [isTestingOpenPanel, setIsTestingOpenPanel] = useState(false)

  // PostHog Settings
  const [posthogApiKey, setPosthogApiKey] = useState(settings.posthogApiKey ?? "")
  const [posthogHost, setPosthogHost] = useState(settings.posthogHost ?? "https://us.i.posthog.com")
  const [posthogEnabled, setPosthogEnabled] = useState(settings.posthogEnabled ?? false)
  const [isTestingPostHog, setIsTestingPostHog] = useState(false)

  // Error Alerts in Scryme Chat & Sentry
  const [errorAlertsEnabled, setErrorAlertsEnabled] = useState(settings.errorAlertsEnabled ?? true)
  const [errorAlertsMinStatus, setErrorAlertsMinStatus] = useState(settings.errorAlertsMinStatus ?? 500)

  // System Admin Workspace Channels & Members Customization
  const [workspaceDetails, setWorkspaceDetails] = useState<{ channels: any[]; members: any[] } | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<"public" | "private">("public")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("admin")

  useEffect(() => {
    setScrymeChatClientId(settings.scrymeChatClientId ?? "")
    setScrymeChatClientSecret(settings.scrymeChatClientSecret ?? "")
    setScrymeChatBaseUrl(settings.scrymeChatBaseUrl ?? "https://api.chat.scryme.tech")
    setHermesApiKey(settings.hermesApiKey ?? "")
    setHermesBaseUrl(settings.hermesBaseUrl ?? "http://hermes:8080")
    setHermesModel(settings.hermesModel ?? "hermes-3-llama-3.1-8b")
    setHermesEnabled(settings.hermesEnabled ?? false)
    setAdminWorkspaceName(settings.adminWorkspaceName ?? "System Admin Workspace")
    setAdminWorkspaceSlug(settings.adminWorkspaceSlug ?? "system-admins")
    setAdminChannelSlug(settings.adminChannelSlug ?? "system-alerts")
    setAdminWorkspaceStatus(settings.adminWorkspaceStatus ?? "Not Configured")
    setErrorAlertsEnabled(settings.errorAlertsEnabled ?? true)
    setErrorAlertsMinStatus(settings.errorAlertsMinStatus ?? 500)
    setSentryDsn(settings.sentryDsn ?? "")
    setSentryOrg(settings.sentryOrg ?? "")
    setSentryProject(settings.sentryProject ?? "")
    setSentryAuthToken(settings.sentryAuthToken ?? "")
    setSentryWebhookSecret(settings.sentryWebhookSecret ?? "")
    setSentryEnvironment(settings.sentryEnvironment ?? "production")
    setSentryTracesSampleRate(settings.sentryTracesSampleRate ?? "1.0")
    setSentryEnabled(settings.sentryEnabled ?? true)
    setOpenpanelClientId(settings.openpanelClientId ?? "")
    setOpenpanelClientSecret(settings.openpanelClientSecret ?? "")
    setOpenpanelHost(settings.openpanelHost ?? "https://api.openpanel.dev")
    setOpenpanelEnabled(settings.openpanelEnabled ?? false)
    setPosthogApiKey(settings.posthogApiKey ?? "")
    setPosthogHost(settings.posthogHost ?? "https://us.i.posthog.com")
    setPosthogEnabled(settings.posthogEnabled ?? false)
  }, [settings])

  const loadAdminWorkspaceDetails = async () => {
    setIsLoadingDetails(true)
    try {
      const details = await getAdminChatWorkspaceDetails()
      setWorkspaceDetails(details)
    } catch {
      // ignore
    } finally {
      setIsLoadingDetails(false)
    }
  }

  useEffect(() => {
    loadAdminWorkspaceDetails()
  }, [])

  const saveSettingsMutation = useMutation({
    mutationFn: updateSystemIntegrationSettings,
    onSuccess: () => {
      toast.success("System integration credentials saved successfully")
      queryClient.invalidateQueries({ queryKey: ["system-integration-settings"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    },
  })

  const provisionWorkspaceMutation = useMutation({
    mutationFn: provisionAdminChatWorkspace,
    onSuccess: (res) => {
      if (res.message) {
        toast.info(res.message)
      } else {
        toast.success(`Admin Chat Workspace "${adminWorkspaceName}" provisioned`)
      }
      setAdminWorkspaceStatus("PROVISIONED")
      queryClient.invalidateQueries({ queryKey: ["system-integration-settings"] })
      loadAdminWorkspaceDetails()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to provision workspace")
    },
  })

  const createChannelMutation = useMutation({
    mutationFn: createAdminChatChannel,
    onSuccess: (res) => {
      if (res.message) toast.info(res.message)
      else toast.success(`Channel #${newChannelName} created`)
      setNewChannelName("")
      loadAdminWorkspaceDetails()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create channel")
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: addAdminChatWorkspaceMember,
    onSuccess: (res) => {
      if (res.message) toast.info(res.message)
      else toast.success(`Granted ${newMemberEmail} admin chat access`)
      setNewMemberEmail("")
      loadAdminWorkspaceDetails()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add member")
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (emailOrId: string) => removeAdminChatWorkspaceMember(emailOrId),
    onSuccess: (res) => {
      if (res.message) toast.info(res.message)
      else toast.success("Access revoked")
      loadAdminWorkspaceDetails()
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove member")
    },
  })

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    saveSettingsMutation.mutate({
      scrymeChatClientId,
      scrymeChatClientSecret,
      scrymeChatBaseUrl,
      hermesApiKey,
      hermesBaseUrl,
      hermesModel,
      hermesEnabled,
      adminWorkspaceName,
      adminWorkspaceSlug,
      adminChannelSlug,
      errorAlertsEnabled,
      errorAlertsMinStatus,
      sentryDsn,
      sentryOrg,
      sentryProject,
      sentryAuthToken,
      sentryWebhookSecret,
      sentryEnvironment,
      sentryTracesSampleRate,
      sentryEnabled,
      openpanelClientId,
      openpanelClientSecret,
      openpanelHost,
      openpanelEnabled,
      posthogApiKey,
      posthogHost,
      posthogEnabled,
    })
  }

  async function handleTestSentry() {
    setIsTestingSentry(true)
    try {
      const res = await testSentryWebhookConnection()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test Sentry webhook connection")
    } finally {
      setIsTestingSentry(false)
    }
  }

  async function handleTestOpenPanel() {
    setIsTestingOpenPanel(true)
    try {
      const res = await testOpenPanelConnection()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test OpenPanel connection")
    } finally {
      setIsTestingOpenPanel(false)
    }
  }

  async function handleTestPostHog() {
    setIsTestingPostHog(true)
    try {
      const res = await testPostHogConnection()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test PostHog connection")
    } finally {
      setIsTestingPostHog(false)
    }
  }

  async function handleTestChat() {
    setIsTestingChat(true)
    try {
      const res = await testScrymeChatConnection()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test Scryme Chat connection")
    } finally {
      setIsTestingChat(false)
    }
  }

  async function handleTestHermes() {
    setIsTestingHermes(true)
    try {
      const res = await testHermesConnection()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test Hermes connection")
    } finally {
      setIsTestingHermes(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-card border border-border rounded-xl p-6" />
        <div className="h-48 bg-card border border-border rounded-xl p-6" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
      {/* Scryme Chat Credentials Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Scryme Chat Credentials</CardTitle>
              <CardDescription>
                System-wide credentials used to provision organization team workspaces and send notifications.
              </CardDescription>
            </div>
          </div>
          <Badge variant={scrymeChatClientId && scrymeChatClientSecret ? "secondary" : "outline"} className={scrymeChatClientId && scrymeChatClientSecret ? "bg-emerald-500/10 text-emerald-600" : ""}>
            {scrymeChatClientId && scrymeChatClientSecret ? "Configured" : "Missing Credentials"}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="scryme-client-id">Client ID</Label>
            <Input
              id="scryme-client-id"
              value={scrymeChatClientId}
              onChange={(e) => setScrymeChatClientId(e.target.value)}
              placeholder="e.g. scryme_chat_client_123"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="scryme-client-secret">Client Secret</Label>
            <Input
              id="scryme-client-secret"
              type="password"
              value={scrymeChatClientSecret}
              onChange={(e) => setScrymeChatClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="scryme-base-url">Scryme Chat Base API URL</Label>
            <Input
              id="scryme-base-url"
              value={scrymeChatBaseUrl}
              onChange={(e) => setScrymeChatBaseUrl(e.target.value)}
              placeholder="https://api.chat.scryme.tech"
            />
          </div>
          <div className="flex justify-end pt-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              disabled={isTestingChat}
              onClick={handleTestChat}
              className="gap-2"
            >
              {isTestingChat ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4 text-blue-500" />}
              Test Connection & Channel Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hermes Agent Credentials Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Bot className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Hermes Agent Integration</CardTitle>
              <CardDescription>
                System-wide credentials and configuration for Hermes autonomous agent execution and automated task orchestration.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={hermesApiKey ? "secondary" : "outline"}
            className={hermesApiKey ? "bg-emerald-500/10 text-emerald-600" : ""}
          >
            {hermesApiKey ? "Configured" : "Missing API Key"}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="hermes-base-url">Hermes Agent Base URL</Label>
            <Input
              id="hermes-base-url"
              value={hermesBaseUrl}
              onChange={(e) => setHermesBaseUrl(e.target.value)}
              placeholder="http://hermes:8080"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hermes-api-key">API Key</Label>
            <Input
              id="hermes-api-key"
              type="password"
              value={hermesApiKey}
              onChange={(e) => setHermesApiKey(e.target.value)}
              placeholder="••••••••••••••••"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="hermes-model">Default LLM Model / Agent Engine</Label>
            <Input
              id="hermes-model"
              value={hermesModel}
              onChange={(e) => setHermesModel(e.target.value)}
              placeholder="hermes-3-llama-3.1-8b"
            />
          </div>
          <div className="flex items-center justify-between pt-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hermes-enabled"
                checked={hermesEnabled}
                onChange={(e) => setHermesEnabled(e.target.checked)}
                className="size-4 rounded border-input bg-background text-primary focus:ring-ring"
              />
              <Label htmlFor="hermes-enabled" className="cursor-pointer font-medium">
                Enable Hermes Agent for Automated Background Tasks
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isTestingHermes}
              onClick={handleTestHermes}
              className="gap-2"
            >
              {isTestingHermes ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4 text-amber-500" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Chat Workspace Configuration Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">System Admin Chat Workspace</CardTitle>
              <CardDescription>
                Dedicated Scryme Chat workspace for platform system administrators and urgent system notifications.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={adminWorkspaceStatus === "PROVISIONED" ? "secondary" : "outline"}
            className={adminWorkspaceStatus === "PROVISIONED" ? "bg-emerald-500/10 text-emerald-600" : ""}
          >
            {adminWorkspaceStatus}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-ws-name">Workspace Name</Label>
              <Input
                id="admin-ws-name"
                value={adminWorkspaceName}
                onChange={(e) => setAdminWorkspaceName(e.target.value)}
                placeholder="System Admin Workspace"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-ws-slug">Workspace Slug</Label>
              <Input
                id="admin-ws-slug"
                value={adminWorkspaceSlug}
                onChange={(e) => setAdminWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="system-admins"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-ch-slug">Default Alerts Channel</Label>
              <Input
                id="admin-ch-slug"
                value={adminChannelSlug}
                onChange={(e) => setAdminChannelSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="system-alerts"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={provisionWorkspaceMutation.isPending}
              onClick={() => provisionWorkspaceMutation.mutate({
                workspaceSlug: adminWorkspaceSlug,
                workspaceName: adminWorkspaceName,
                channelSlug: adminChannelSlug,
              })}
              className="gap-2"
            >
              {provisionWorkspaceMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-emerald-500" />}
              Provision Admin Chat Workspace
            </Button>
          </div>

          {/* Workspace Channels & Members Customization Section */}
          <div className="border-t border-border pt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Workspace Channels & Member Customization</h4>
                <p className="text-xs text-muted-foreground">Manage channels, assign alert destinations, and control admin access.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingDetails}
                onClick={loadAdminWorkspaceDetails}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`size-3.5 ${isLoadingDetails ? "animate-spin" : ""}`} />
                Sync Details
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channels Customization Card */}
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Hash className="size-4 text-primary" /> Active Channels ({workspaceDetails?.channels?.length || 0})
                  </span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!newChannelName.trim()) return
                    createChannelMutation.mutate({
                      name: newChannelName.trim(),
                      type: newChannelType,
                    })
                  }}
                  className="flex gap-2 items-end"
                >
                  <div className="flex-1 flex flex-col gap-1">
                    <Label className="text-[11px]">New Channel</Label>
                    <Input
                      placeholder="e.g. security-alerts"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-24">
                    <Label className="text-[11px]">Type</Label>
                    <select
                      value={newChannelType}
                      onChange={(e) => setNewChannelType(e.target.value as any)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="h-8 gap-1 text-xs" disabled={createChannelMutation.isPending}>
                    {createChannelMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />} Add
                  </Button>
                </form>

                <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
                  {workspaceDetails?.channels?.length ? (
                    workspaceDetails.channels.map((ch: any) => (
                      <div key={ch.id || ch.slug} className="flex items-center justify-between p-2 rounded-md bg-card border border-border text-xs">
                        <div className="flex items-center gap-2">
                          {ch.type === "private" ? <Lock className="size-3.5 text-amber-500" /> : <Hash className="size-3.5 text-primary" />}
                          <span className="font-semibold text-foreground">{ch.name || ch.slug}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {ch.type || "public"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground text-center py-2">No channels found.</span>
                  )}
                </div>
              </div>

              {/* Members Access Customization Card */}
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="size-4 text-emerald-600" /> Admin Access Members ({workspaceDetails?.members?.length || 0})
                  </span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!newMemberEmail.trim()) return
                    addMemberMutation.mutate({
                      email: newMemberEmail.trim(),
                      role: newMemberRole,
                    })
                  }}
                  className="flex gap-2 items-end"
                >
                  <div className="flex-1 flex flex-col gap-1">
                    <Label className="text-[11px]">Admin Email</Label>
                    <Input
                      placeholder="admin@scryme.tech"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-20">
                    <Label className="text-[11px]">Role</Label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as any)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="h-8 gap-1 text-xs" disabled={addMemberMutation.isPending}>
                    {addMemberMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <UserPlus className="size-3" />} Add
                  </Button>
                </form>

                <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
                  {workspaceDetails?.members?.length ? (
                    workspaceDetails.members.map((m: any) => (
                      <div key={m.id || m.email} className="flex items-center justify-between p-2 rounded-md bg-card border border-border text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{m.name || m.email}</span>
                          <span className="text-[10px] text-muted-foreground">{m.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            {m.role || "admin"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 text-destructive hover:bg-destructive/10"
                            onClick={() => removeMemberMutation.mutate(m.id || m.email)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground text-center py-2">No admin members configured.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Realtime Scryme Chat Error Alert Controls */}
          <div className="border-t border-border pt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="error-alerts-enabled"
                  checked={errorAlertsEnabled}
                  onChange={(e) => setErrorAlertsEnabled(e.target.checked)}
                  className="size-4 rounded border-input bg-background text-primary focus:ring-ring"
                />
                <Label htmlFor="error-alerts-enabled" className="cursor-pointer font-medium">
                  Dispatch System Exception Alerts to Scryme Chat Channel
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="error-min-status">Minimum Status Code Threshold</Label>
                <select
                  id="error-min-status"
                  value={errorAlertsMinStatus}
                  onChange={(e) => setErrorAlertsMinStatus(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={500}>500+ (Internal Server Errors Only)</option>
                  <option value={400}>400+ (All Client & Server Errors)</option>
                  <option value={503}>503+ (Service Unavailable & Critical Only)</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentry Integration & Webhook Receiver Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Sentry Integration & Webhooks</CardTitle>
              <CardDescription>
                Configure Sentry crash reporting SDK settings and Sentry Webhook ingestion to dispatch real-time error notifications to Scryme Chat admins.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={sentryEnabled ? "secondary" : "outline"}
              className={sentryEnabled ? "bg-emerald-500/10 text-emerald-600" : ""}
            >
              {sentryEnabled ? "Active" : "Disabled"}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestSentry}
              disabled={isTestingSentry || !sentryEnabled}
              className="gap-2"
            >
              {isTestingSentry ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Test Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Main SDK Configuration Settings */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="sentry-dsn">Sentry DSN (Data Source Name)</Label>
              <Input
                id="sentry-dsn"
                type="text"
                value={sentryDsn}
                onChange={(e) => setSentryDsn(e.target.value)}
                placeholder="https://key@o0.ingest.sentry.io/0 (or NEXT_PUBLIC_SENTRY_DSN)"
              />
              <p className="text-xs text-muted-foreground">
                Used by client apps and NestJS API server for error tracking and performance profiling.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sentry-org">Sentry Organization Slug</Label>
              <Input
                id="sentry-org"
                type="text"
                value={sentryOrg}
                onChange={(e) => setSentryOrg(e.target.value)}
                placeholder="e.g. scryme-tech"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sentry-project">Sentry Project Slug</Label>
              <Input
                id="sentry-project"
                type="text"
                value={sentryProject}
                onChange={(e) => setSentryProject(e.target.value)}
                placeholder="e.g. scryme-api / scryme-admin"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sentry-auth-token">Sentry Auth / Internal Integration Token</Label>
              <Input
                id="sentry-auth-token"
                type="password"
                value={sentryAuthToken}
                onChange={(e) => setSentryAuthToken(e.target.value)}
                placeholder="sntrys_..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sentry-webhook-secret">Sentry Webhook Secret / Client Secret</Label>
              <Input
                id="sentry-webhook-secret"
                type="password"
                value={sentryWebhookSecret}
                onChange={(e) => setSentryWebhookSecret(e.target.value)}
                placeholder="Secret key for HMAC signature verification"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sentry-environment">Environment Tag</Label>
              <Input
                id="sentry-environment"
                type="text"
                value={sentryEnvironment}
                onChange={(e) => setSentryEnvironment(e.target.value)}
                placeholder="production, staging, development"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sentry-traces-sample-rate">Traces Sample Rate (0.0 to 1.0)</Label>
              <Input
                id="sentry-traces-sample-rate"
                type="text"
                value={sentryTracesSampleRate}
                onChange={(e) => setSentryTracesSampleRate(e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>

          {/* Webhook Dashboard Integration Instructions */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <Activity className="size-4 text-primary" />
                Sentry Dashboard Webhook Configuration Guide
              </div>
              <a
                href="https://sentry.io/settings/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open Sentry Dashboard <ExternalLink className="size-3" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Follow these steps in your Sentry organization dashboard to automatically dispatch real-time exception alerts to Scryme Chat:
            </p>

            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-background p-3">
                <span className="font-semibold text-foreground">1. Target Webhook Endpoint URL</span>
                <div className="flex items-center justify-between rounded bg-muted px-2 py-1 font-mono text-[11px] text-primary">
                  <span className="truncate">/v3/webhooks/sentry</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() => {
                      const fullUrl = `${window.location.origin.replace("admin.", "api.")}/v3/webhooks/sentry`
                      navigator.clipboard.writeText(fullUrl)
                      setCopiedUrl(true)
                      toast.success("Webhook URL copied to clipboard")
                      setTimeout(() => setCopiedUrl(false), 2000)
                    }}
                  >
                    {copiedUrl ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Enter this URL under <strong>Developer Settings &gt; Internal Integrations &gt; Webhook URL</strong>.
                </span>
              </div>

              <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-background p-3">
                <span className="font-semibold text-foreground">2. Client Secret / Signature Verification</span>
                <div className="flex items-center justify-between rounded bg-muted px-2 py-1 font-mono text-[11px] text-primary">
                  <span className="truncate">{sentryWebhookSecret ? "••••••••••••" : "Not Set"}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    disabled={!sentryWebhookSecret}
                    onClick={() => {
                      if (sentryWebhookSecret) {
                        navigator.clipboard.writeText(sentryWebhookSecret)
                        setCopiedSecret(true)
                        toast.success("Client Secret copied to clipboard")
                        setTimeout(() => setCopiedSecret(false), 2000)
                      }
                    }}
                  >
                    {copiedSecret ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Paste the <strong>Client Secret</strong> generated by Sentry into the secret field above for HMAC verification.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-background p-3 text-xs">
              <span className="font-semibold text-foreground">3. Recommended Webhook Events & Permissions</span>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Set <strong>Issue Permissions</strong> to <i>Read &amp; Write</i> or <i>Admin</i>.</li>
                <li>Check <strong>Webhook Events</strong>: Enable <code>issue</code> (created, resolved, assigned) and <code>error</code> alert events.</li>
                <li>Under <strong>Alerts &gt; Create Alert Rule</strong>, select <i>Send a notification via Integration</i> and target your internal integration.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="sentry-enabled"
              checked={sentryEnabled}
              onChange={(e) => setSentryEnabled(e.target.checked)}
              className="size-4 rounded border-input bg-background text-primary focus:ring-ring"
            />
            <Label htmlFor="sentry-enabled" className="cursor-pointer font-medium">
              Enable Sentry Integration &amp; Webhook Event Ingestion
            </Label>
          </div>
        </CardContent>
      </Card>


      {/* OpenPanel Analytics Integration Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-semibold text-foreground">OpenPanel Product Analytics</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configure OpenPanel analytics tracking for client applications, user events, and session telemetry.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={openpanelEnabled ? "secondary" : "outline"}
              className={openpanelEnabled ? "bg-emerald-500/10 text-emerald-600" : ""}
            >
              {openpanelEnabled ? "Active" : "Disabled"}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestOpenPanel}
              disabled={isTestingOpenPanel || !openpanelEnabled}
              className="gap-2"
            >
              {isTestingOpenPanel ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Test Connection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openpanel-client-id">OpenPanel Client ID</Label>
              <Input
                id="openpanel-client-id"
                type="text"
                value={openpanelClientId}
                onChange={(e) => setOpenpanelClientId(e.target.value)}
                placeholder="op_client_..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="openpanel-client-secret">OpenPanel Client Secret</Label>
              <Input
                id="openpanel-client-secret"
                type="password"
                value={openpanelClientSecret}
                onChange={(e) => setOpenpanelClientSecret(e.target.value)}
                placeholder="op_secret_..."
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="openpanel-host">OpenPanel API Host URL</Label>
              <Input
                id="openpanel-host"
                type="text"
                value={openpanelHost}
                onChange={(e) => setOpenpanelHost(e.target.value)}
                placeholder="https://api.openpanel.dev"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="openpanel-enabled"
              checked={openpanelEnabled}
              onChange={(e) => setOpenpanelEnabled(e.target.checked)}
              className="size-4 rounded border-input bg-background text-primary focus:ring-ring"
            />
            <Label htmlFor="openpanel-enabled" className="cursor-pointer font-medium">
              Enable OpenPanel Analytics Event Collection
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* PostHog Product Analytics Integration Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-semibold text-foreground">PostHog Analytics & Feature Flags</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configure PostHog product analytics, feature flags, and session recording for web and desktop applications.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={posthogEnabled ? "secondary" : "outline"}
              className={posthogEnabled ? "bg-emerald-500/10 text-emerald-600" : ""}
            >
              {posthogEnabled ? "Active" : "Disabled"}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestPostHog}
              disabled={isTestingPostHog || !posthogEnabled}
              className="gap-2"
            >
              {isTestingPostHog ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Test Connection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="posthog-api-key">PostHog API Key / Project Token</Label>
              <Input
                id="posthog-api-key"
                type="text"
                value={posthogApiKey}
                onChange={(e) => setPosthogApiKey(e.target.value)}
                placeholder="phc_..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="posthog-host">PostHog API Host URL</Label>
              <Input
                id="posthog-host"
                type="text"
                value={posthogHost}
                onChange={(e) => setPosthogHost(e.target.value)}
                placeholder="https://us.i.posthog.com or https://eu.i.posthog.com"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="posthog-enabled"
              checked={posthogEnabled}
              onChange={(e) => setPosthogEnabled(e.target.checked)}
              className="size-4 rounded border-input bg-background text-primary focus:ring-ring"
            />
            <Label htmlFor="posthog-enabled" className="cursor-pointer font-medium">
              Enable PostHog Product Analytics &amp; Feature Flags
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saveSettingsMutation.isPending} size="lg" className="gap-2">
          {saveSettingsMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save System Settings
        </Button>
      </div>
    </form>
  )
}
