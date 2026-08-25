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

interface SubscriptionRow {
  id: string
  dodoPriceId: string | null
  dodoSubscriptionId: string | null
  dodoCurrentPeriodEnd: Date | null
  organization: { id: string; name: string; slug: string }
}

export function SubscriptionsPanel({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Provider subscription</TableHead>
            <TableHead>Renews</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No paid subscriptions recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <Link href={`/organizations/${sub.organization.id}`} className="font-medium text-foreground hover:underline">
                    {sub.organization.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs capitalize">
                    {sub.dodoPriceId || "free"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.dodoSubscriptionId || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.dodoCurrentPeriodEnd
                    ? new Date(sub.dodoCurrentPeriodEnd).toLocaleDateString()
                    : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
