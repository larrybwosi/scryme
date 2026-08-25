import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import {
  listIntegrationDefinitions,
  listActiveOrganizationIntegrations,
} from "@/app/actions/integrations"
import { IntegrationsList } from "@/components/integrations/integrations-list"
import { OrganizationIntegrationsTable } from "@/components/integrations/organization-integrations-table"

export default async function IntegrationsPage() {
  const [definitions, activeIntegrations] = await Promise.all([
    listIntegrationDefinitions(),
    listActiveOrganizationIntegrations(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system integration definitions and view active organization connections.
        </p>
      </div>

      <Tabs defaultValue="definitions">
        <TabsList>
          <TabsTrigger value="definitions">Integration Definitions ({definitions.length})</TabsTrigger>
          <TabsTrigger value="active">Active Connections ({activeIntegrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="mt-6">
          <IntegrationsList integrations={definitions} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <OrganizationIntegrationsTable activeIntegrations={activeIntegrations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
