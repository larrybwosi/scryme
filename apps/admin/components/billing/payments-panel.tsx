"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Plus } from "lucide-react"
import { RecordPaymentDialog } from "./record-payment-dialog"
import type { Tier } from "@/app/actions/billing"

interface Payment {
  id: string
  amount: any
  status: string
  reference: string
  phoneNumber: string
  createdAt: Date | string
  organization: { id: string; name: string; slug: string } | null
  member: { user: { name: string | null; email: string } } | null
}

interface Organization {
  id: string
  name: string
}

export function PaymentsPanel({
  payments,
  organizations,
  tiers = [],
}: {
  payments: Payment[]
  organizations: Organization[]
  tiers?: Tier[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-foreground">Custom payments</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Record payment
        </Button>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No custom payments recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Reference / Phone</TableHead>
                <TableHead>Recorded by</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const numericAmount = Number(payment.amount) || 0
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.organization?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col text-xs">
                        <span className="font-mono text-foreground">{payment.reference}</span>
                        <span>{payment.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.member?.user.name ?? payment.member?.user.email ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      ${numericAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === "SUCCESS" ? "secondary" : "outline"}
                        className={payment.status === "SUCCESS" ? "text-emerald-600 bg-emerald-500/10" : ""}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <RecordPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organizations={organizations}
        tiers={tiers}
      />
    </Card>
  )
}
