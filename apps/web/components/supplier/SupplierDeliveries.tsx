"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { format } from "date-fns";
import { Eye, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface SupplierDeliveriesProps {
  purchases: any[];
}

export function SupplierDeliveries({ purchases }: SupplierDeliveriesProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle2 size={12} className="mr-1" /> RECEIVED</Badge>;
      case "ORDERED":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"><Clock size={12} className="mr-1" /> IN TRANSIT</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"><AlertCircle size={12} className="mr-1" /> CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-semibold text-lg">Transaction History</h3>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText size={16} />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Delivery ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No delivery history found
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-bold uppercase">
                    {purchase.purchaseNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(purchase.orderDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {purchase.expectedDate ? format(new Date(purchase.expectedDate), "MMM dd, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                      8 Items
                    </span>
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    KES {Number(purchase.totalAmount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(purchase.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye size={16} className="text-muted-foreground" />
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
