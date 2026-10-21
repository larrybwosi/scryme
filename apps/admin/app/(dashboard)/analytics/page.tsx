import Link from "next/link"
import {
  Users,
  Building2,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Activity,
  Layers,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { getUserAnalyticsAndFunnel } from "@/app/actions/analytics"

export default async function AdminUserAnalyticsPage() {
  const analyticsData = await getUserAnalyticsAndFunnel()
  const { metrics, monthlyGrowth, churnBreakdown, posthogIntegration } = analyticsData

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            User Interaction & Funnel Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Track user journey from website landing to signup conversion, workspace activation, and churn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {posthogIntegration.isConfigured ? (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              PostHog Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs text-muted-foreground">
              PostHog Disconnected
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Registered Users</CardTitle>
            <Users className="size-4 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.totalSignups.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{metrics.thirtyDayNewUsers} new users in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">User Conversion Rate</CardTitle>
            <TrendingUp className="size-4 text-emerald-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.conversionRatePercent}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Signups converted into created workspace orgs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Workspaces</CardTitle>
            <Building2 className="size-4 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.activeOrganizations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.orgActivationRatePercent}% active workspace activation rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Workspace Churn Rate</CardTitle>
            <UserX className="size-4 text-rose-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {metrics.churnRatePercent}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {churnBreakdown.churnedOrganizationsCount} total suspended or churned accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel Section */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Landing to Active User Conversion Funnel
          </CardTitle>
          <CardDescription>
            Step-by-step progression from website landing visit to user account creation and active organization onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
            <div className="flex flex-col p-4 rounded-lg border border-border bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground">Step 1: Website Landing</span>
              <span className="text-xl font-bold text-foreground mt-1">
                ~{metrics.totalVisitors.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground mt-2">Estimated unique web visitors</span>
            </div>

            <div className="flex flex-col p-4 rounded-lg border border-border bg-muted/20 relative">
              <span className="text-xs font-medium text-muted-foreground">Step 2: Account Signups</span>
              <span className="text-xl font-bold text-foreground mt-1">
                {metrics.totalSignups.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-500 mt-2 font-medium">
                {metrics.totalVisitors > 0 ? ((metrics.totalSignups / metrics.totalVisitors) * 100).toFixed(1) : 0}% landing conversion
              </span>
            </div>

            <div className="flex flex-col p-4 rounded-lg border border-border bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground">Step 3: Created Workspaces</span>
              <span className="text-xl font-bold text-foreground mt-1">
                {metrics.totalOrganizations.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-500 mt-2 font-medium">
                {metrics.conversionRatePercent}% user to org rate
              </span>
            </div>

            <div className="flex flex-col p-4 rounded-lg border border-border bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground">Step 4: Active Workspaces</span>
              <span className="text-xl font-bold text-foreground mt-1">
                {metrics.activeOrganizations.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-500 mt-2 font-medium">
                {metrics.orgActivationRatePercent}% active retention
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Analytics / PostHog Dashboard Section */}
      {posthogIntegration.embedUrl ? (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Embedded Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Live external analytics dashboard from PostHog / OpenPanel.
                </CardDescription>
              </div>
              <Activity className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            <iframe
              src={posthogIntegration.embedUrl}
              className="w-full h-[500px] border-0"
              title="PostHog Embedded Dashboard"
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Cohort Growth Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Monthly Onboarding & Retention Cohorts
          </CardTitle>
          <CardDescription>
            Historical breakdown of organization creation and churn rates over recent months.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Estimated Signups</TableHead>
                <TableHead>Organizations Created</TableHead>
                <TableHead>Churned / Suspended</TableHead>
                <TableHead className="text-right">Activation Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyGrowth.map((point) => {
                const activeInCohort = point.organizations - point.churned
                const cohortActivation = point.organizations > 0
                  ? Math.round((activeInCohort / point.organizations) * 100)
                  : 100

                return (
                  <TableRow key={point.month}>
                    <TableCell className="font-medium text-foreground">{point.month}</TableCell>
                    <TableCell>{point.signups}</TableCell>
                    <TableCell>{point.organizations}</TableCell>
                    <TableCell>
                      {point.churned > 0 ? (
                        <span className="text-rose-500 font-medium">{point.churned}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {cohortActivation}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Churn Breakdown Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Churned & Suspended Workspaces
              </CardTitle>
              <CardDescription>
                List of suspended or deleted organizations requiring review or re-engagement.
              </CardDescription>
            </div>
            <ShieldAlert className="size-5 text-rose-500" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {churnBreakdown.recentChurnedOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    No churned or suspended organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                churnBreakdown.recentChurnedOrgs.map((org) => (
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
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(org.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{org.memberCount}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="gap-1">
                        Suspended
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/organizations/${org.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Review <ArrowRight className="size-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
