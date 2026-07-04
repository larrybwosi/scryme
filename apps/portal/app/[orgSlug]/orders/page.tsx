import { requireSession } from "@/app/lib/session";
import { db } from "@repo/db";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead, Badge, Button } from "@repo/ui";
import { format } from "date-fns";
import Link from "next/link";
import { Eye } from "lucide-react";

export default async function OrdersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const session = await requireSession(orgSlug);
  const txs = await db.transaction.findMany({
    where: {
      customerId: session.customerId,
      organizationId: session.orgId,
      type: "SALES_ORDER"
    },
    orderBy: { createdAt: 'desc' }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "default";
      case "PENDING_CONFIRMATION": return "secondary";
      case "CANCELLED": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
        <p className="text-muted-foreground">Manage and track your previous orders.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txs.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.number}</TableCell>
                <TableCell>{format(t.createdAt, "dd MMM yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(t.status) as any}>
                    {t.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">${Number(t.finalTotal).toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/${orgSlug}/orders/${t.id}`}>
                      <Eye className="size-4 mr-2" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {txs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
