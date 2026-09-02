import {
  listIntegrationDefinitions,
  listActiveOrganizationIntegrations,
  getSystemIntegrationSettings,
} from "@/app/actions/integrations"
import { IntegrationsClientWrapper } from "@/components/integrations/integrations-client"

export default async function IntegrationsPage() {
  const [definitions, activeIntegrations, systemSettings] = await Promise.all([
    listIntegrationDefinitions(),
    listActiveOrganizationIntegrations(),
    getSystemIntegrationSettings(),
  ])

  return (
    <IntegrationsClientWrapper
      initialDefinitions={definitions}
      initialActiveIntegrations={activeIntegrations}
      initialSystemSettings={systemSettings}
    />
  )
}
