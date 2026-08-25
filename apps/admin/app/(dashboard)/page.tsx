import Link from "next/link"
import { Building2, Users, UserCheck, ShieldOff, CreditCard, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { getSystemStats } from "@/app/actions/dashboard"

export default async function OverviewPage() {
  const stats = await getSystemStats()

  const cards = [
    { label: "Organizations", value: stats.totalOrganizations, icon: Building2 },
    { label: "Total users", value: stats.totalUsers, icon: Users },
    { label: "Active users", value: stats.activeUsers, icon: UserCheck },
    { label: "Suspended orgs", value: stats.suspendedOrganizations, icon: ShieldOff },
    { label: "Subscriptions", value: stats.totalSubscriptions, icon: CreditCard },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide metrics across every organization.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="border-border bg-card">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                  <span className="text-2xl font-semibold tabular-nums text-foreground">{card.value}</span>
                </div>
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Recently created organizations</CardTitle>
          <Link
            href="/organizations"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {stats.recentOrganizations.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No organizations yet.</p>
          ) : (
            stats.recentOrganizations.map((org) => (
              <Link
                key={org.id}
                href={`/organizations/${org.id}`}
                className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-secondary/40"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org._count.members} members</span>
                </div>
                {org.isSuspended ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground">
                    Active
                  </Badge>
                )}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
