"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, ArrowRight } from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"

interface OrganizationRow {
  id: string
  name: string
  slug: string
  isSuspended: boolean
  createdAt: Date
  _count: { members: number; products: number }
}

export function OrganizationsTable({ organizations }: { organizations: OrganizationRow[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return organizations
    return organizations.filter(
      (org) => org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q),
    )
  }, [organizations, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search organizations..."
          className="pl-9"
          aria-label="Search organizations"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No organizations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org) => (
                <TableRow key={org.id} className="group">
                  <TableCell>
                    <Link href={`/organizations/${org.id}`} className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground group-hover:underline">{org.name}</span>
                      <span className="text-xs text-muted-foreground">{org.slug}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{org._count.members}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{org._count.products}</TableCell>
                  <TableCell>
                    {org.isSuspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/organizations/${org.id}`} aria-label={`View ${org.name}`}>
                      <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
