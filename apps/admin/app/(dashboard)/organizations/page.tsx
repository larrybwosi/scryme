import { listOrganizations } from "@/app/actions/organizations"
import { OrganizationsTable } from "@/components/organizations/organizations-table"
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog"

export default async function OrganizationsPage() {
  const organizations = await listOrganizations()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {organizations.length} organization{organizations.length === 1 ? "" : "s"} on the platform.
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      <OrganizationsTable organizations={organizations} />
    </div>
  )
}
