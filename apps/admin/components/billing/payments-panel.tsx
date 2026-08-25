"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Plus } from "lucide-react"
import { RecordPaymentDialog } from "./record-payment-dialog"

interface Payment {
  id: string
  amount: number | string
  status: string
  createdAt: Date
  organization: { id: string; name: string } | null
  member: { user: { name: string | null; email: string } } | null
}

interface Organization {
  id: string
  name: string
}

export function PaymentsPanel({
  payments,
  organizations,
}: {
  payments: Payment[]
  organizations: Organization[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Custom payments</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
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
                <TableHead>Recorded by</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.organization?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.member?.user.name ?? payment.member?.user.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    {payment.currency} {payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <RecordPaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} organizations={organizations} />
    </Card>
  )
}
