"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Eye,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  Package,
  ClipboardCheck,
  Truck,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
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
import { cn } from "@repo/ui/lib/utils";
import {
  updateFulfillmentStatus,
  reconcileFulfillment,
} from "../../app/actions/sales";
import { toast } from "sonner";

export function DeliveryTable({ fulfillments }: { fulfillments: any[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleStatusUpdate = async (id: string, status: any) => {
    try {
      await updateFulfillmentStatus(id, status);
      toast.success("Fulfillment status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleReconcile = async (id: string) => {
    try {
      await reconcileFulfillment(id, { notes: "Reconciled from dashboard" });
      toast.success("Fulfillment reconciled");
    } catch (error) {
      toast.error("Failed to reconcile");
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/50">
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Fulfillment ID
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Transaction
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Driver / Carrier
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Destination
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Status
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">
                Reconciled
              </th>
              <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {fulfillments.map(ful => (
              <tr
                key={ful.id}
                className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-900">
                  {ful.id.slice(-8).toUpperCase()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-900">
                      {ful.transaction.number}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {ful.transaction.customer?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-zinc-500" />
                    </div>
                    <span className="text-zinc-600">
                      {ful.driver?.name || ful.carrier || "Not Assigned"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{ful.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <FulfillmentStatusBadge status={ful.status} />
                </td>
                <td className="px-6 py-4">
                  {ful.isReconciled ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Yes
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-400">
                      No
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Manage</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <a href={`/api/sales/documents/${ful.transaction.id}?type=waybill`} download>
                          <FileText className="mr-2 h-4 w-4" /> Download Waybill
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <a href={`/api/sales/documents/${ful.transaction.id}?type=delivery-note`} download>
                          <FileText className="mr-2 h-4 w-4" /> Download Delivery Note
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <a href={`/api/sales/documents/${ful.transaction.id}?type=packing-list`} download>
                          <FileText className="mr-2 h-4 w-4" /> Download Packing List
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(ful.id, "SHIPPED")}>
                        <Package className="mr-2 h-4 w-4" /> Mark as Shipped
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(ful.id, "DELIVERED")}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as
                        Delivered
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleReconcile(ful.id)}
                        disabled={ful.isReconciled}>
                        <ClipboardCheck className="mr-2 h-4 w-4" /> Reconcile
                        Delivery
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FulfillmentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    SHIPPED: "bg-blue-50 text-blue-700 border-blue-200",
    IN_TRANSIT: "bg-indigo-50 text-indigo-700 border-indigo-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    READY: "bg-zinc-50 text-zinc-700 border-zinc-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        styles[status] || "bg-zinc-50 text-zinc-700 border-zinc-200",
      )}>
      {status}
    </Badge>
  );
}
