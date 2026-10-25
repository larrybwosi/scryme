"use client"

import {
  useQuery,
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system integration definitions, credentials, admin chat workspace, and active organization connections.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Integration Definitions & System Credentials
            </h2>
          </div>
          <IntegrationsList
            integrations={definitions}
            isLoading={isLoadingDefs}
            systemSettings={systemSettings}
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Active Organization Connections ({activeIntegrations.length})
            </h2>
          </div>
          <OrganizationIntegrationsTable
            activeIntegrations={activeIntegrations}
            isLoading={isLoadingActive}
          />
        </section>
      </div>
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
