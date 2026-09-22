import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { format } from "date-fns";
import {
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface SupplierDeliveriesProps {
  purchases: any[];
}

export function SupplierDeliveries({ purchases }: SupplierDeliveriesProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
      case "COMPLETED":
      case "BILLED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[10px] py-0.5 px-2">
            <CheckCircle2 size={12} className="mr-1" /> RECEIVED
          </Badge>
        );
      case "ORDERED":
      case "PARTIALLY_RECEIVED":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-semibold text-[10px] py-0.5 px-2">
            <Clock size={12} className="mr-1" /> IN TRANSIT
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold text-[10px] py-0.5 px-2">
            <AlertCircle size={12} className="mr-1" /> CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="font-semibold text-[10px] py-0.5 px-2 uppercase border-border text-foreground">
            {status}
          </Badge>
        );
    }
  };

  const getRepaymentIndicator = (purchase: any) => {
    if (purchase.paymentStatus === "PAID") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[10px] py-0.5 px-2">
          PAID
        </Badge>
      );
    }

    if (!purchase.dueDate) {
      return (
        <span className="text-xs text-muted-foreground">—</span>
      );
    }

    const now = new Date();
    const due = new Date(purchase.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold text-[10px] py-0.5 px-2">
          OVERDUE ({Math.abs(diffDays)}d)
        </Badge>
      );
    } else if (diffDays <= 5) {
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold text-[10px] py-0.5 px-2">
          DUE SOON ({diffDays}d)
        </Badge>
      );
    } else {
      return (
        <span className="text-xs font-medium text-foreground">
          Due {format(due, "MMM dd, yyyy")}
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="flex gap-8">
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Total Orders
            </div>
            <div className="text-2xl font-bold text-foreground">
              {purchases.length}
            </div>
          </div>
          <div className="w-px h-10 bg-border self-center" />
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Total Spent
            </div>
            <div className="text-2xl font-bold text-foreground">
              KES{" "}
              {purchases
                .reduce((acc, p) => acc + Number(p.totalAmount), 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-lg h-10 border-border font-semibold text-sm text-foreground">
          <FileText size={16} />
          Export History
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="font-semibold py-3 pl-6 text-foreground">Order ID</TableHead>
              <TableHead className="font-semibold text-foreground">Order Date</TableHead>
              <TableHead className="font-semibold text-foreground">Repayment Due</TableHead>
              <TableHead className="font-semibold text-foreground">Items</TableHead>
              <TableHead className="font-semibold text-foreground">Total Amount</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold pr-6 text-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-muted rounded-full">
                      <TrendingUp size={24} className="opacity-40" />
                    </div>
                    <p>No purchase history found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              purchases.map(purchase => (
                <TableRow
                  key={purchase.id}
                  className="hover:bg-muted/50 border-b border-border last:border-0 transition-colors">
                  <TableCell className="py-3.5 pl-6">
                    <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {purchase.purchaseNumber}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {format(new Date(purchase.orderDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {getRepaymentIndicator(purchase)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-semibold text-[10px] bg-muted border-border text-foreground">
                      {purchase.items?.length || 1} ITEMS
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    KES {Number(purchase.totalAmount).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary">
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
