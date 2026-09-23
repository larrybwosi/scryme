"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plug, Play, Loader2, Save, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Switch } from "@repo/ui/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from "@tanstack/react-query"
import {
  getIntegrationBySlug,
  updateSystemIntegrationSettings,
  testIntegrationConnectionBySlug,
  type SystemIntegrationSettings,
} from "@/app/actions/integrations"
import { OrganizationIntegrationsTable } from "./organization-integrations-table"
import { SystemIntegrationsPanel } from "./system-integrations-panel"

const queryClient = new QueryClient()

function IntegrationDetailContent({
  initialData,
  slug,
}: {
  initialData: {
    definition: any
    activeConnections: any[]
    systemSettings: SystemIntegrationSettings
  }
  slug: string
}) {
  const router = useRouter()
  const [testing, setTesting] = useState(false)

  const { data = initialData, refetch } = useQuery({
    queryKey: ["integration-detail", slug],
    queryFn: () => getIntegrationBySlug(slug),
    initialData,
    staleTime: 60 * 1000,
  })

  const { definition, activeConnections, systemSettings } = data
  const [formData, setFormData] = useState<SystemIntegrationSettings>(systemSettings)

  const updateMutation = useMutation({
    mutationFn: (newSettings: SystemIntegrationSettings) => updateSystemIntegrationSettings(newSettings),
    onSuccess: () => {
      toast.success(`${definition.name} settings updated successfully`)
      refetch()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update settings")
    },
  })

  async function handleTestConnection() {
    setTesting(true)
    try {
      const res = await testIntegrationConnectionBySlug(slug)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test connection")
    } finally {
      setTesting(false)
    }
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/integrations">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to Integrations</span>
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            {definition.logoUrl ? (
              <Image
                src={definition.logoUrl}
                alt={definition.name}
                width={36}
                height={36}
                className="size-10 rounded border object-contain p-1"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Plug className="size-5 text-primary" aria-hidden="true" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{definition.name}</h1>
                <Badge variant={definition.isActive ? "secondary" : "outline"} className={definition.isActive ? "text-emerald-600 bg-emerald-500/10" : ""}>
                  {definition.isActive ? "Active" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm font-mono text-muted-foreground">{definition.slug}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleTestConnection} disabled={testing}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 text-emerald-500" />}
            Test Connection
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{definition.description}</p>

      <Tabs defaultValue="configuration">
        <TabsList>
          <TabsTrigger value="configuration">Configuration Settings</TabsTrigger>
          <TabsTrigger value="connections">
            Active Connections ({activeConnections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="mt-6">
          {slug === "scryme-chat" ? (
            <SystemIntegrationsPanel settings={systemSettings} />
          ) : slug === "resend" ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Resend Email Integration Configuration</CardTitle>
                <CardDescription>
                  Configure Resend API key, sender address, verified domain, and tracking capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Resend Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable Resend for transactional and system emails.
                      </p>
                    </div>
                    <Switch
                      checked={formData.resendEnabled ?? false}
                      onCheckedChange={(checked) => setFormData({ ...formData, resendEnabled: checked })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resendApiKey">Resend API Key</Label>
                      <Input
                        id="resendApiKey"
                        type="password"
                        placeholder="re_xxxxxxxxxxxx"
                        value={formData.resendApiKey || ""}
                        onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resendFromEmail">Default From Address</Label>
                      <Input
                        id="resendFromEmail"
                        placeholder="Scryme <no-reply@scryme.tech>"
                        value={formData.resendFromEmail || ""}
                        onChange={(e) => setFormData({ ...formData, resendFromEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resendDomain">Sending Domain</Label>
                      <Input
                        id="resendDomain"
                        placeholder="scryme.tech"
                        value={formData.resendDomain || ""}
                        onChange={(e) => setFormData({ ...formData, resendDomain: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resendRegion">Sending Region</Label>
                      <Input
                        id="resendRegion"
                        placeholder="us-east-1"
                        value={formData.resendRegion || ""}
                        onChange={(e) => setFormData({ ...formData, resendRegion: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label>Open Tracking</Label>
                        <p className="text-xs text-muted-foreground">Track when recipients open emails.</p>
                      </div>
                      <Switch
                        checked={formData.resendOpenTracking ?? true}
                        onCheckedChange={(checked) => setFormData({ ...formData, resendOpenTracking: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label>Click Tracking</Label>
                        <p className="text-xs text-muted-foreground">Track when recipients click links.</p>
                      </div>
                      <Switch
                        checked={formData.resendClickTracking ?? true}
                        onCheckedChange={(checked) => setFormData({ ...formData, resendClickTracking: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resendTrackingSubdomain">Tracking Subdomain</Label>
                    <Input
                      id="resendTrackingSubdomain"
                      placeholder="links"
                      value={formData.resendTrackingSubdomain || ""}
                      onChange={(e) => setFormData({ ...formData, resendTrackingSubdomain: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                      {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save Resend Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : slug === "sentry" ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Sentry Monitoring Configuration</CardTitle>
                <CardDescription>
                  Configure application exception tracking, Sentry Dsn, webhook secret, and sample rates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Sentry Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Capture uncaught errors and send alerts to the admin channel.
                      </p>
                    </div>
                    <Switch
                      checked={formData.sentryEnabled ?? false}
                      onCheckedChange={(checked) => setFormData({ ...formData, sentryEnabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sentryDsn">Sentry DSN</Label>
                    <Input
                      id="sentryDsn"
                      placeholder="https://xxxxxx@sentry.io/123456"
                      value={formData.sentryDsn || ""}
                      onChange={(e) => setFormData({ ...formData, sentryDsn: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sentryOrg">Sentry Organization</Label>
                      <Input
                        id="sentryOrg"
                        placeholder="scryme-tech"
                        value={formData.sentryOrg || ""}
                        onChange={(e) => setFormData({ ...formData, sentryOrg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sentryProject">Sentry Project</Label>
                      <Input
                        id="sentryProject"
                        placeholder="admin-portal"
                        value={formData.sentryProject || ""}
                        onChange={(e) => setFormData({ ...formData, sentryProject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sentryAuthToken">Auth Token / API Token</Label>
                      <Input
                        id="sentryAuthToken"
                        type="password"
                        placeholder="sntrys_xxxxxxxx"
                        value={formData.sentryAuthToken || ""}
                        onChange={(e) => setFormData({ ...formData, sentryAuthToken: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sentryWebhookSecret">Webhook Client Secret</Label>
                      <Input
                        id="sentryWebhookSecret"
                        type="password"
                        placeholder="sentry_whsec_xxxx"
                        value={formData.sentryWebhookSecret || ""}
                        onChange={(e) => setFormData({ ...formData, sentryWebhookSecret: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sentryEnvironment">Environment</Label>
                      <Input
                        id="sentryEnvironment"
                        placeholder="production"
                        value={formData.sentryEnvironment || ""}
                        onChange={(e) => setFormData({ ...formData, sentryEnvironment: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sentryTracesSampleRate">Traces Sample Rate</Label>
                      <Input
                        id="sentryTracesSampleRate"
                        placeholder="1.0"
                        value={formData.sentryTracesSampleRate || ""}
                        onChange={(e) => setFormData({ ...formData, sentryTracesSampleRate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                      {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save Sentry Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : slug === "openpanel" ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>OpenPanel Analytics Configuration</CardTitle>
                <CardDescription>
                  Configure Client ID, Secret, and Host endpoint for OpenPanel telemetry.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable OpenPanel Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Track product usage events and application metrics.
                      </p>
                    </div>
                    <Switch
                      checked={formData.openpanelEnabled ?? false}
                      onCheckedChange={(checked) => setFormData({ ...formData, openpanelEnabled: checked })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="openpanelClientId">Client ID</Label>
                      <Input
                        id="openpanelClientId"
                        placeholder="op_client_xxxx"
                        value={formData.openpanelClientId || ""}
                        onChange={(e) => setFormData({ ...formData, openpanelClientId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="openpanelClientSecret">Client Secret</Label>
                      <Input
                        id="openpanelClientSecret"
                        type="password"
                        placeholder="op_secret_xxxx"
                        value={formData.openpanelClientSecret || ""}
                        onChange={(e) => setFormData({ ...formData, openpanelClientSecret: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openpanelHost">API Host Endpoint</Label>
                    <Input
                      id="openpanelHost"
                      placeholder="https://api.openpanel.dev"
                      value={formData.openpanelHost || ""}
                      onChange={(e) => setFormData({ ...formData, openpanelHost: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                      {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save OpenPanel Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : slug === "posthog" ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>PostHog Analytics Configuration</CardTitle>
                <CardDescription>
                  Configure PostHog API Key / Project Token and Host endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable PostHog Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable session recording, feature flags, and product analytics.
                      </p>
                    </div>
                    <Switch
                      checked={formData.posthogEnabled ?? false}
                      onCheckedChange={(checked) => setFormData({ ...formData, posthogEnabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="posthogApiKey">PostHog API Key / Project Token</Label>
                    <Input
                      id="posthogApiKey"
                      type="password"
                      placeholder="phc_xxxxxxxxxxxx"
                      value={formData.posthogApiKey || ""}
                      onChange={(e) => setFormData({ ...formData, posthogApiKey: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="posthogHost">PostHog Host URL</Label>
                    <Input
                      id="posthogHost"
                      placeholder="https://us.i.posthog.com"
                      value={formData.posthogHost || ""}
                      onChange={(e) => setFormData({ ...formData, posthogHost: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                      {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save PostHog Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>{definition.name} Configuration</CardTitle>
                <CardDescription>
                  Generic configuration settings for {definition.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Authentication Type: <span className="font-mono font-medium text-foreground">{definition.authType}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Category: <span className="font-medium text-foreground">{definition.category}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This integration uses standard organization credentials. Individual organizations can configure their credentials on the organization settings page.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <OrganizationIntegrationsTable activeIntegrations={activeConnections} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function IntegrationDetailClientWrapper(props: {
  initialData: {
    definition: any
    activeConnections: any[]
    systemSettings: SystemIntegrationSettings
  }
  slug: string
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <IntegrationDetailContent {...props} />
    </QueryClientProvider>
  )
}
