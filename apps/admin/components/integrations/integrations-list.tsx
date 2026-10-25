"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, Trash2, Plug, Loader2, Play, Settings, Key, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Switch } from "@repo/ui/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog"
import {
  deleteIntegrationDefinition,
  testIntegrationConnectionBySlug,
  updateSystemIntegrationSettings,
  type SystemIntegrationSettings,
} from "@/app/actions/integrations"
import {
  IntegrationDefinitionDialog,
  type IntegrationDefinitionRow,
} from "./integration-definition-dialog"

export function IntegrationsList({
  integrations,
  isLoading,
  systemSettings,
}: {
  integrations: IntegrationDefinitionRow[]
  isLoading?: boolean
  systemSettings?: SystemIntegrationSettings
}) {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IntegrationDefinitionRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IntegrationDefinitionRow | null>(null)
  const [testingSlug, setTestingSlug] = useState<string | null>(null)

  // System credentials modal state
  const [credentialsTarget, setCredentialsTarget] = useState<IntegrationDefinitionRow | null>(null)
  const [formData, setFormData] = useState<SystemIntegrationSettings>(systemSettings || {})

  const saveSettingsMutation = useMutation({
    mutationFn: updateSystemIntegrationSettings,
    onSuccess: () => {
      toast.success("System integration credentials saved successfully")
      setCredentialsTarget(null)
      queryClient.invalidateQueries({ queryKey: ["system-integration-settings"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIntegrationDefinition(id),
    onSuccess: () => {
      const name = deleteTarget?.name || "Integration"
      toast.success(`${name} deleted`)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ["integration-definitions"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete integration")
    },
  })

  async function handleTestDefinition(slug: string) {
    setTestingSlug(slug)
    try {
      const res = await testIntegrationConnectionBySlug(slug)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test integration definition")
    } finally {
      setTestingSlug(null)
    }
  }

  function handleOpenCredentials(item: IntegrationDefinitionRow) {
    if (systemSettings) {
      setFormData(systemSettings)
    }
    setCredentialsTarget(item)
  }

  function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault()
    saveSettingsMutation.mutate(formData)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add integration
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-muted rounded-md" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-muted rounded w-full" />
            </Card>
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No integration definitions created yet. Add one to allow organizations to connect external services.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <Card key={item.id} className="flex flex-col border-border bg-card transition-all hover:border-primary/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div className="flex items-center gap-3">
                  {item.logoUrl ? (
                    <Image src={item.logoUrl} alt={item.name} width={24} height={24} className="size-9 rounded border object-contain p-1" />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                      <Plug className="size-4 text-primary" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <Link href={`/integrations/${item.slug}`} className="hover:underline">
                      <CardTitle className="text-base font-semibold text-foreground">{item.name}</CardTitle>
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">{item.slug}</span>
                  </div>
                </div>
                {item.isActive ? (
                  <Badge variant="secondary" className="text-emerald-600 bg-emerald-500/10">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Disabled
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {item.category.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono">
                    {item.authType.replace("_", " ")}
                  </Badge>
                </div>
                {item.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 text-xs"
                      asChild
                    >
                      <Link href={`/integrations/${item.slug}`}>
                        <Settings className="size-3.5" />
                        Configure
                      </Link>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => handleOpenCredentials(item)}
                    >
                      <Key className="size-3.5 text-amber-500" />
                      Credentials
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={testingSlug === item.slug}
                      onClick={() => handleTestDefinition(item.slug)}
                    >
                      {testingSlug === item.slug ? (
                        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <Play className="size-3 text-emerald-500" aria-hidden="true" />
                      )}
                      Test
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingItem(item)} title="Edit Definition">
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete Definition"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* System Credentials Modal per Integration Card */}
      <Dialog open={!!credentialsTarget} onOpenChange={(open) => !open && setCredentialsTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="size-5 text-amber-500" />
              {credentialsTarget?.name} System Credentials
            </DialogTitle>
            <DialogDescription>
              Configure system-wide API credentials and options for {credentialsTarget?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCredentials} className="space-y-4 pt-2">
            {credentialsTarget?.slug === "scryme-chat" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scryme-client-id">Client ID</Label>
                    <Input
                      id="scryme-client-id"
                      value={formData.scrymeChatClientId || ""}
                      onChange={(e) => setFormData({ ...formData, scrymeChatClientId: e.target.value })}
                      placeholder="scryme_chat_client_123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scryme-client-secret">Client Secret</Label>
                    <Input
                      id="scryme-client-secret"
                      type="password"
                      value={formData.scrymeChatClientSecret || ""}
                      onChange={(e) => setFormData({ ...formData, scrymeChatClientSecret: e.target.value })}
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scryme-base-url">Base API URL</Label>
                  <Input
                    id="scryme-base-url"
                    value={formData.scrymeChatBaseUrl || ""}
                    onChange={(e) => setFormData({ ...formData, scrymeChatBaseUrl: e.target.value })}
                    placeholder="https://api.chat.scryme.tech"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="scryme-ws-slug">Admin Workspace Slug</Label>
                    <Input
                      id="scryme-ws-slug"
                      value={formData.adminWorkspaceSlug || ""}
                      onChange={(e) => setFormData({ ...formData, adminWorkspaceSlug: e.target.value })}
                      placeholder="system-admins"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scryme-ch-slug">Alerts Channel Slug</Label>
                    <Input
                      id="scryme-ch-slug"
                      value={formData.adminChannelSlug || ""}
                      onChange={(e) => setFormData({ ...formData, adminChannelSlug: e.target.value })}
                      placeholder="system-alerts"
                    />
                  </div>
                </div>
              </>
            ) : credentialsTarget?.slug === "hermes-agent" || credentialsTarget?.slug === "hermes" ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable Hermes Agent</Label>
                    <p className="text-xs text-muted-foreground">Automated background tasks and orchestration</p>
                  </div>
                  <Switch
                    checked={formData.hermesEnabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, hermesEnabled: checked })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hermes-url">Base API URL</Label>
                    <Input
                      id="hermes-url"
                      value={formData.hermesBaseUrl || ""}
                      onChange={(e) => setFormData({ ...formData, hermesBaseUrl: e.target.value })}
                      placeholder="http://hermes:8080"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hermes-key">API Key</Label>
                    <Input
                      id="hermes-key"
                      type="password"
                      value={formData.hermesApiKey || ""}
                      onChange={(e) => setFormData({ ...formData, hermesApiKey: e.target.value })}
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hermes-model">LLM Model / Agent Engine</Label>
                  <Input
                    id="hermes-model"
                    value={formData.hermesModel || ""}
                    onChange={(e) => setFormData({ ...formData, hermesModel: e.target.value })}
                    placeholder="hermes-3-llama-3.1-8b"
                  />
                </div>
              </>
            ) : credentialsTarget?.slug === "resend" ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable Resend Email Service</Label>
                    <p className="text-xs text-muted-foreground">Transactional and system email delivery</p>
                  </div>
                  <Switch
                    checked={formData.resendEnabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, resendEnabled: checked })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resend-api-key">API Key</Label>
                    <Input
                      id="resend-api-key"
                      type="password"
                      value={formData.resendApiKey || ""}
                      onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
                      placeholder="re_xxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resend-from">From Address</Label>
                    <Input
                      id="resend-from"
                      value={formData.resendFromEmail || ""}
                      onChange={(e) => setFormData({ ...formData, resendFromEmail: e.target.value })}
                      placeholder="Scryme <no-reply@scryme.tech>"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resend-domain">Domain</Label>
                    <Input
                      id="resend-domain"
                      value={formData.resendDomain || ""}
                      onChange={(e) => setFormData({ ...formData, resendDomain: e.target.value })}
                      placeholder="scryme.tech"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resend-region">Region</Label>
                    <Input
                      id="resend-region"
                      value={formData.resendRegion || ""}
                      onChange={(e) => setFormData({ ...formData, resendRegion: e.target.value })}
                      placeholder="us-east-1"
                    />
                  </div>
                </div>
              </>
            ) : credentialsTarget?.slug === "sentry" ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable Sentry Error Monitoring</Label>
                    <p className="text-xs text-muted-foreground">Exception tracking and alert dispatch</p>
                  </div>
                  <Switch
                    checked={formData.sentryEnabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, sentryEnabled: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sentry-dsn">Sentry DSN</Label>
                  <Input
                    id="sentry-dsn"
                    value={formData.sentryDsn || ""}
                    onChange={(e) => setFormData({ ...formData, sentryDsn: e.target.value })}
                    placeholder="https://key@o0.ingest.sentry.io/0"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sentry-org">Organization Slug</Label>
                    <Input
                      id="sentry-org"
                      value={formData.sentryOrg || ""}
                      onChange={(e) => setFormData({ ...formData, sentryOrg: e.target.value })}
                      placeholder="scryme-tech"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sentry-project">Project Slug</Label>
                    <Input
                      id="sentry-project"
                      value={formData.sentryProject || ""}
                      onChange={(e) => setFormData({ ...formData, sentryProject: e.target.value })}
                      placeholder="scryme-admin"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sentry-token">Auth Token</Label>
                    <Input
                      id="sentry-token"
                      type="password"
                      value={formData.sentryAuthToken || ""}
                      onChange={(e) => setFormData({ ...formData, sentryAuthToken: e.target.value })}
                      placeholder="sntrys_xxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sentry-secret">Webhook Secret</Label>
                    <Input
                      id="sentry-secret"
                      type="password"
                      value={formData.sentryWebhookSecret || ""}
                      onChange={(e) => setFormData({ ...formData, sentryWebhookSecret: e.target.value })}
                      placeholder="sentry_whsec_xxxx"
                    />
                  </div>
                </div>
              </>
            ) : credentialsTarget?.slug === "openpanel" ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable OpenPanel Analytics</Label>
                    <p className="text-xs text-muted-foreground">User telemetry and event collection</p>
                  </div>
                  <Switch
                    checked={formData.openpanelEnabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, openpanelEnabled: checked })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="op-client-id">Client ID</Label>
                    <Input
                      id="op-client-id"
                      value={formData.openpanelClientId || ""}
                      onChange={(e) => setFormData({ ...formData, openpanelClientId: e.target.value })}
                      placeholder="op_client_xxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="op-client-secret">Client Secret</Label>
                    <Input
                      id="op-client-secret"
                      type="password"
                      value={formData.openpanelClientSecret || ""}
                      onChange={(e) => setFormData({ ...formData, openpanelClientSecret: e.target.value })}
                      placeholder="op_secret_xxxx"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op-host">Host Endpoint</Label>
                  <Input
                    id="op-host"
                    value={formData.openpanelHost || ""}
                    onChange={(e) => setFormData({ ...formData, openpanelHost: e.target.value })}
                    placeholder="https://api.openpanel.dev"
                  />
                </div>
              </>
            ) : credentialsTarget?.slug === "posthog" ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable PostHog Analytics</Label>
                    <p className="text-xs text-muted-foreground">Product analytics and feature flags</p>
                  </div>
                  <Switch
                    checked={formData.posthogEnabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, posthogEnabled: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-key">API Key / Project Token</Label>
                  <Input
                    id="ph-key"
                    type="password"
                    value={formData.posthogApiKey || ""}
                    onChange={(e) => setFormData({ ...formData, posthogApiKey: e.target.value })}
                    placeholder="phc_xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-host">Host Endpoint</Label>
                  <Input
                    id="ph-host"
                    value={formData.posthogHost || ""}
                    onChange={(e) => setFormData({ ...formData, posthogHost: e.target.value })}
                    placeholder="https://us.i.posthog.com"
                  />
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                <p>Authentication Type: <span className="font-mono font-medium text-foreground">{credentialsTarget?.authType}</span></p>
                <p className="mt-2 text-xs">Standard credentials are managed on the individual organization settings page.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setCredentialsTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveSettingsMutation.isPending} className="gap-2">
                {saveSettingsMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save Credentials
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <IntegrationDefinitionDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) queryClient.invalidateQueries({ queryKey: ["integration-definitions"] })
        }}
      />
      <IntegrationDefinitionDialog
        integration={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null)
            queryClient.invalidateQueries({ queryKey: ["integration-definitions"] })
          }
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name} definition?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the integration definition from the system. Organizations connected to this integration will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
