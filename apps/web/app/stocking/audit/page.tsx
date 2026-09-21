import { Metadata } from "next";
import React from "react";
import { PageHeader } from "../../../components/page-header";
import { getStockMovementHistory } from "../../actions/stock-management";
import { getInventoryProducts } from "../../actions/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { ShieldCheck, History, ArrowRight } from "lucide-react";
import { AuditProductFilter } from "../../../components/stocking/audit-product-filter";

export const metadata: Metadata = {
  title: "Stock Audit & Physical Count",
  description: "Conduct inventory stocktakes, record variances, and post stock adjustments.",
};

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: Promise<{ variantId?: string }>;
}) {
  const params = await searchParams;

  // OPTIMIZATION (Bolt ⚡): Parallelized independent product catalog and stock movement history database queries using Promise.all.
  const [products, movements] = await Promise.all([
    getInventoryProducts({ stockLevel: "all" }),
    getStockMovementHistory({
      variantId: params.variantId,
      limit: 100,
    }),
  ]);

  const getMovementBadge = (type: string, quantity: number) => {
    switch (type) {
      case "SALE":
        return (
          <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 border-transparent dark:border">
            Sale
          </Badge>
        );
      case "PURCHASE_RECEIPT":
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800 border-transparent dark:border">
            Purchase
          </Badge>
        );
      case "TRANSFER":
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 border-transparent dark:border">
            Transfer
          </Badge>
        );
      case "ADJUSTMENT_IN":
      case "ADJUSTMENT_OUT":
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 border-transparent dark:border">
            Adjustment
          </Badge>
        );
      case "INITIAL_STOCK":
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground border-transparent">
            Initial Stock
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 bg-background text-foreground min-h-screen">
      <PageHeader
        title="Inventory Audit Trail"
        description="Full history of stock movements and adjustments for enterprise compliance."
        icon={<ShieldCheck size={24} />}
      />

      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <History size={20} className="text-muted-foreground" />
              Movement History
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing last {movements.length} records
            </div>
          </div>
          <div className="w-full sm:w-80">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Filter by Product
            </div>
            <AuditProductFilter products={products} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Date & Time</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Product</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Type</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Qty</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Location(s)</TableHead>
                <TableHead className="font-semibold text-muted-foreground">User</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground font-medium">
                    No movement records found for this selection.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map(m => (
                  <TableRow key={m.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {format(new Date(m.movementDate), "MMM dd, yyyy")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(m.movementDate), "HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm text-foreground">
                        {m.variant.product.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.variant.sku}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMovementBadge(
                        m.movementType,
                        m.quantity.toNumber(),
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        m.quantity.toNumber() > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {m.quantity.toNumber() > 0
                        ? `+${m.quantity.toNumber()}`
                        : m.quantity.toNumber()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        {m.fromLocation && (
                          <span className="text-muted-foreground">
                            {m.fromLocation.name}
                          </span>
                        )}
                        {m.fromLocation && m.toLocation && (
                          <ArrowRight size={10} className="text-muted-foreground/60" />
                        )}
                        {m.toLocation && (
                          <span className="text-foreground font-medium">
                            {m.toLocation.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">
                          {m.member.user.name?.[0]}
                        </div>
                        <span className="text-xs text-foreground">{m.member.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                      {m.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
