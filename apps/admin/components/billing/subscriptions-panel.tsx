import Link from "next/link"
import { Badge } from "@repo/ui/components/ui/badge"
import { Sparkles } from "lucide-react"
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
  isCustomPrice?: boolean
  customMonthlyPrice?: number | null
  customYearlyPrice?: number | null
  customCurrency?: string | null
  billingInterval?: string | null
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
            <TableHead>Pricing Model</TableHead>
            <TableHead>Provider subscription</TableHead>
            <TableHead>Renews</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No paid subscriptions recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => {
              const currency = sub.customCurrency || "$"
              const formattedRate =
                sub.billingInterval === "yearly" && sub.customYearlyPrice != null
                  ? `${currency} ${sub.customYearlyPrice}/yr`
                  : sub.customMonthlyPrice != null
                  ? `${currency} ${sub.customMonthlyPrice}/mo`
                  : sub.customYearlyPrice != null
                  ? `${currency} ${sub.customYearlyPrice}/yr`
                  : null

              return (
                <TableRow key={sub.id}>
                  <TableCell>
                    <Link
                      href={`/organizations/${sub.organization.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {sub.organization.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs capitalize">
                      {sub.dodoPriceId || "free"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sub.isCustomPrice ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 text-xs font-normal gap-1"
                        >
                          <Sparkles className="size-3" /> Custom Price
                        </Badge>
                        {formattedRate && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            ({formattedRate})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Standard</span>
                    )}
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
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
