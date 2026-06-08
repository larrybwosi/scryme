import React from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { ShieldCheck, History, ArrowRight, User, MapPin } from "lucide-react";
import { AuditProductFilter } from "../../../components/stocking/audit-product-filter";

export default async function AuditTrailPage({
  searchParams
}: {
  searchParams: Promise<{ variantId?: string }>
}) {
  const params = await searchParams;
  const products = await getInventoryProducts({ stockLevel: "all" });
  const movements = await getStockMovementHistory({
    variantId: params.variantId,
    limit: 100
  });

  const getMovementBadge = (type: string, quantity: number) => {
    const isPositive = quantity > 0;
    switch (type) {
      case "SALE":
        return <Badge variant="secondary" className="bg-red-50 text-red-700">Sale</Badge>;
      case "PURCHASE_RECEIPT":
        return <Badge variant="secondary" className="bg-green-50 text-green-700">Purchase</Badge>;
      case "TRANSFER":
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Transfer</Badge>;
      case "ADJUSTMENT_IN":
      case "ADJUSTMENT_OUT":
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700">Adjustment</Badge>;
      case "INITIAL_STOCK":
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700">Initial Stock</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <PageHeader
        title="Inventory Audit Trail"
        description="Full history of stock movements and adjustments for enterprise compliance."
        icon={<ShieldCheck size={24} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Filter by Product</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <AuditProductFilter products={products} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History size={20} className="text-gray-400" />
              Movement History
            </CardTitle>
            <div className="text-sm text-gray-500">
              Showing last {movements.length} records
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Location(s)</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      No movement records found for this selection.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">{format(new Date(m.movementDate), "MMM dd, yyyy")}</div>
                        <div className="text-[10px] text-gray-400">{format(new Date(m.movementDate), "HH:mm:ss")}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{m.variant.product.name}</div>
                        <div className="text-[10px] text-gray-500">{m.variant.sku}</div>
                      </TableCell>
                      <TableCell>{getMovementBadge(m.movementType, m.quantity.toNumber())}</TableCell>
                      <TableCell className={`text-right font-bold ${m.quantity.toNumber() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity.toNumber() > 0 ? `+${m.quantity.toNumber()}` : m.quantity.toNumber()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          {m.fromLocation && (
                            <span className="text-gray-500">{m.fromLocation.name}</span>
                          )}
                          {m.fromLocation && m.toLocation && <ArrowRight size={10} className="text-gray-300" />}
                          {m.toLocation && (
                            <span className="text-gray-900 font-medium">{m.toLocation.name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                            {m.member.user.name?.[0]}
                          </div>
                          <span className="text-xs">{m.member.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs text-gray-500">
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
    </div>
  );
}
