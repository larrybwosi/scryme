"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Play } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"
import { useQueryClient } from "@tanstack/react-query"
import { testOrganizationIntegrationConnection } from "@/app/actions/integrations"

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
  isLoading,
}: {
  activeIntegrations: ActiveOrgIntegrationRow[]
  isLoading?: boolean
}) {
  const queryClient = useQueryClient()
  const [testingId, setTestingId] = useState<string | null>(null)

  async function handleTestConnection(id: string) {
    setTestingId(id)
    try {
      const res = await testOrganizationIntegrationConnection(id)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
      queryClient.invalidateQueries({ queryKey: ["active-organization-integrations"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test connection")
    } finally {
      setTestingId(null)
    }
  }

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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground mb-2" />
                Loading active integration connections...
              </TableCell>
            </TableRow>
          ) : activeIntegrations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
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
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={testingId === item.id}
                    onClick={() => handleTestConnection(item.id)}
                  >
                    {testingId === item.id ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Play className="size-3.5 text-emerald-500" aria-hidden="true" />
                    )}
                    Test Connection
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
