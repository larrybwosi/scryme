"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import {
  listIntegrationDefinitions,
  listActiveOrganizationIntegrations,
  getSystemIntegrationSettings,
} from "@/app/actions/integrations"
import { IntegrationsList } from "./integrations-list"
import { OrganizationIntegrationsTable } from "./organization-integrations-table"
import { SystemIntegrationsPanel } from "./system-integrations-panel"
import { Loader2, Plug, Shield, Table } from "lucide-react"

const queryClient = new QueryClient()

function IntegrationsClientContent({
  initialDefinitions,
  initialActiveIntegrations,
  initialSystemSettings,
}: {
  initialDefinitions: any[]
  initialActiveIntegrations: any[]
  initialSystemSettings: any
}) {
  const { data: definitions = initialDefinitions, isLoading: isLoadingDefs } = useQuery({
    queryKey: ["integration-definitions"],
    queryFn: listIntegrationDefinitions,
    initialData: initialDefinitions,
    staleTime: 60 * 1000,
  })

  const { data: activeIntegrations = initialActiveIntegrations, isLoading: isLoadingActive } = useQuery({
    queryKey: ["active-organization-integrations"],
    queryFn: listActiveOrganizationIntegrations,
    initialData: initialActiveIntegrations,
    staleTime: 60 * 1000,
  })

  const { data: systemSettings = initialSystemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["system-integration-settings"],
    queryFn: getSystemIntegrationSettings,
    initialData: initialSystemSettings,
    staleTime: 60 * 1000,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system integration definitions, credentials, admin chat workspace, and active organization connections.
        </p>
      </div>

      <Tabs defaultValue="definitions">
        <TabsList>
          <TabsTrigger value="definitions" className="gap-2">
            Integration Definitions ({definitions.length})
            {isLoadingDefs && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            System Credentials & Workspace
            {isLoadingSettings && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Active Connections ({activeIntegrations.length})
            {isLoadingActive && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="mt-6">
          <IntegrationsList integrations={definitions} isLoading={isLoadingDefs} />
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <SystemIntegrationsPanel settings={systemSettings} isLoading={isLoadingSettings} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <OrganizationIntegrationsTable activeIntegrations={activeIntegrations} isLoading={isLoadingActive} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function IntegrationsClientWrapper(props: {
  initialDefinitions: any[]
  initialActiveIntegrations: any[]
  initialSystemSettings: any
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <IntegrationsClientContent {...props} />
    </QueryClientProvider>
  )
}
