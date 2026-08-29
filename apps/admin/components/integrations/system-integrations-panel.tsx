"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageSquare, Workflow, ShieldAlert, CheckCircle2, Save, Sparkles, Bot } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  updateSystemIntegrationSettings,
  provisionAdminChatWorkspace,
  testHermesConnection,
  type SystemIntegrationSettings,
} from "@/app/actions/integrations"

export function SystemIntegrationsPanel({
  settings,
}: {
  settings: SystemIntegrationSettings
}) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [isTestingHermes, setIsTestingHermes] = useState(false)

  // Scryme Chat Credentials
  const [scrymeChatClientId, setScrymeChatClientId] = useState(settings.scrymeChatClientId ?? "")
  const [scrymeChatClientSecret, setScrymeChatClientSecret] = useState(settings.scrymeChatClientSecret ?? "")
  const [scrymeChatBaseUrl, setScrymeChatBaseUrl] = useState(settings.scrymeChatBaseUrl ?? "https://api.chat.scryme.tech")

  // Windmill Credentials
  const [windmillBaseUrl, setWindmillBaseUrl] = useState(settings.windmillBaseUrl ?? "http://windmill:8000")
  const [windmillAdminApiKey, setWindmillAdminApiKey] = useState(settings.windmillAdminApiKey ?? "")
  const [windmillWebhookSecret, setWindmillWebhookSecret] = useState(settings.windmillWebhookSecret ?? "")

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

  // Error Alerts in Scryme Chat & Sentry
  const [errorAlertsEnabled, setErrorAlertsEnabled] = useState(settings.errorAlertsEnabled ?? true)
  const [errorAlertsMinStatus, setErrorAlertsMinStatus] = useState(settings.errorAlertsMinStatus ?? 500)

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateSystemIntegrationSettings({
        scrymeChatClientId,
        scrymeChatClientSecret,
        scrymeChatBaseUrl,
        windmillBaseUrl,
        windmillAdminApiKey,
        windmillWebhookSecret,
        hermesApiKey,
        hermesBaseUrl,
        hermesModel,
        hermesEnabled,
        adminWorkspaceName,
        adminWorkspaceSlug,
        adminChannelSlug,
        errorAlertsEnabled,
        errorAlertsMinStatus,
      })
      toast.success("System integration credentials saved successfully")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
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

  async function handleProvisionWorkspace() {
    setIsProvisioning(true)
    try {
      const res = await provisionAdminChatWorkspace({
        workspaceSlug: adminWorkspaceSlug,
        workspaceName: adminWorkspaceName,
        channelSlug: adminChannelSlug,
      })
      if (res.message) {
        toast.info(res.message)
      } else {
        toast.success(`Admin Chat Workspace "${adminWorkspaceName}" provisioned`)
      }
      setAdminWorkspaceStatus("PROVISIONED")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to provision workspace")
    } finally {
      setIsProvisioning(false)
    }
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
        </CardContent>
      </Card>

      {/* Windmill Credentials Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Workflow className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Windmill Orchestration Credentials</CardTitle>
              <CardDescription>
                System-wide configuration for the Windmill automation engine and script deployment.
              </CardDescription>
            </div>
          </div>
          <Badge variant={windmillAdminApiKey ? "secondary" : "outline"} className={windmillAdminApiKey ? "bg-emerald-500/10 text-emerald-600" : ""}>
            {windmillAdminApiKey ? "Configured" : "Missing API Key"}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="windmill-base-url">Windmill Base URL</Label>
            <Input
              id="windmill-base-url"
              value={windmillBaseUrl}
              onChange={(e) => setWindmillBaseUrl(e.target.value)}
              placeholder="http://windmill:8000"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="windmill-admin-api-key">Admin API Key</Label>
            <Input
              id="windmill-admin-api-key"
              type="password"
              value={windmillAdminApiKey}
              onChange={(e) => setWindmillAdminApiKey(e.target.value)}
              placeholder="••••••••••••••••"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="windmill-webhook-secret">Webhook Verification Secret (Optional)</Label>
            <Input
              id="windmill-webhook-secret"
              type="password"
              value={windmillWebhookSecret}
              onChange={(e) => setWindmillWebhookSecret(e.target.value)}
              placeholder="••••••••••••••••"
            />
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
              disabled={isProvisioning}
              onClick={handleProvisionWorkspace}
              className="gap-2"
            >
              {isProvisioning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-emerald-500" />}
              Provision Admin Chat Workspace
            </Button>
          </div>

          {/* Realtime Scryme Chat Error Alert Controls */}
          <div className="border-t border-border pt-4 mt-2 flex flex-col gap-4">
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

      {/* Save Button Bar */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save System Settings
        </Button>
      </div>
    </form>
  )
}
