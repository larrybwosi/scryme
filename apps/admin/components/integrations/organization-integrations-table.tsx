import Link from "next/link"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"

export interface ActiveOrgIntegrationRow {
  id: string
  isActive: boolean
  syncStatus: string | null
  syncMessage: string | null
  lastSyncAt: Date | null
  updatedAt: Date
  organization: {
    id: string
    name: string
    slug: string
  }
  integrationDefinition: {
    id: string
    name: string
    slug: string
    category: string
  }
}

export function OrganizationIntegrationsTable({
  activeIntegrations,
}: {
  activeIntegrations: ActiveOrgIntegrationRow[]
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Integration</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Sync Status</TableHead>
            <TableHead>Last Sync</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeIntegrations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No active organization integration connections currently found.
              </TableCell>
            </TableRow>
          ) : (
            activeIntegrations.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`/organizations/${item.organization.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.organization.name}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{item.integrationDefinition.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.integrationDefinition.category.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.syncStatus === "ERROR" ? "destructive" : "secondary"}
                    className={
                      item.syncStatus === "SYNCED"
                        ? "text-emerald-600 bg-emerald-500/10"
                        : undefined
                    }
                  >
                    {item.syncStatus || "Connected"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleString() : "Never"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
