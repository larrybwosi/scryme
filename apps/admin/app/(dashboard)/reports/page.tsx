import Link from "next/link"
import {
  BarChart3,
  HardDrive,
  Users,
  Building2,
  Receipt,
  FileText,
  Ban,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { getSystemReportsAndAnalytics } from "@/app/actions/reports"

export default async function AdminReportsPage() {
  const reports = await getSystemReportsAndAnalytics()
  const { overview, topStorageOrganizations, recentOrganizations } = reports

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          System Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Global platform insights, aggregate RustFS storage usage, system activity metrics, and organization limits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total RustFS Storage Used</CardTitle>
            <HardDrive className="size-4 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.totalStorageGB > 1
                ? `${overview.totalStorageGB} GB`
                : `${overview.totalStorageMB} MB`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalAttachments.toLocaleString()} total uploaded files
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Organizations & Users</CardTitle>
            <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.totalOrganizations} Orgs / {overview.totalUsers} Users
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.activeUsers} active users · {overview.suspendedOrganizations} suspended orgs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Platform Members</CardTitle>
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.totalMembers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active workspace memberships across system
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">System Sales Volume</CardTitle>
            <Receipt className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${overview.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {overview.totalTransactions.toLocaleString()} total processed transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Organization Storage Usage & Limits (RustFS)
              </CardTitle>
              <CardDescription>
                Breakdown of physical file storage usage, file count, limits, and storage access status per tenant.
              </CardDescription>
            </div>
            <HardDrive className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Storage Used</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Storage Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topStorageOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                topStorageOrganizations.map((org) => {
                  const limitStr = org.limitMB != null ? `${org.limitMB} MB` : "Unlimited"
                  const isOverLimit = org.limitMB != null && org.usedMB >= org.limitMB

                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{org.name}</span>
                          <span className="text-xs text-muted-foreground">/{org.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">
                          {org.usedMB > 1024
                            ? `${(org.usedMB / 1024).toFixed(2)} GB`
                            : `${org.usedMB} MB`}
                        </span>
                      </TableCell>
                      <TableCell>{org.fileCount.toLocaleString()}</TableCell>
                      <TableCell>{limitStr}</TableCell>
                      <TableCell>
                        {org.isStorageDisabled ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="size-3" /> Disabled
                          </Badge>
                        ) : isOverLimit ? (
                          <Badge variant="destructive" className="gap-1">
                            Limit Exceeded
                          </Badge>
                        ) : org.isSuspended ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                            Org Suspended
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-muted-foreground">
                            <CheckCircle2 className="size-3 text-emerald-500" /> Normal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/organizations/${org.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Manage <ArrowUpRight className="size-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Recent Organizations Activity & Scale
          </CardTitle>
          <CardDescription>
            Activity counts (members, products, transactions) across recently onboarded organization accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{org.name}</span>
                      <span className="text-xs text-muted-foreground">/{org.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{org._count.members}</TableCell>
                  <TableCell>{org._count.products}</TableCell>
                  <TableCell>{org._count.transactions}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/organizations/${org.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      View Details <ArrowUpRight className="size-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
