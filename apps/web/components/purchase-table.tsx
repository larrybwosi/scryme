"use client";

import NextImage from "next/image";
import { format } from "date-fns";
import {
  MoreHorizontal,
  PackageCheck,
  FileText,
  CreditCard,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";

export function PurchaseTable({ purchases }: { purchases: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
      case "COMPLETED":
      case "RECEIVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "BILLED":
      case "PARTIALLY_RECEIVED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ORDERED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PENDING_APPROVAL":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 w-12 text-center font-bold text-muted-foreground uppercase tracking-wider text-xs">
                #
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                PO Number
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                Supplier
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                Details
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">
                Amount
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                Status
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-muted-foreground italic">
                  No purchase orders found
                </td>
              </tr>
            ) : (
              purchases.map((purchase, index) => (
                <tr
                  key={purchase.id}
                  className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-center text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {purchase.purchaseNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">
                      {purchase.supplierName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">
                        {purchase.product}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {purchase.itemCount} items •{" "}
                        {format(new Date(purchase.date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-foreground">
                    {new Intl.NumberFormat("en-KE", {
                      style: "currency",
                      currency: "KES",
                    }).format(purchase.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={getStatusColor(purchase.status)}>
                      {purchase.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {purchase.status === "ORDERED" ||
                        purchase.status === "PARTIALLY_RECEIVED" ? (
                          <DropdownMenuItem>
                            <PackageCheck className="mr-2 h-4 w-4" /> Receive
                            Items
                          </DropdownMenuItem>
                        ) : null}
                        {purchase.status === "RECEIVED" ? (
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Record Invoice
                          </DropdownMenuItem>
                        ) : null}
                        {purchase.status === "BILLED" ? (
                          <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4" /> Make Payment
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
