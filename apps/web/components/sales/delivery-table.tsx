"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Eye,
  MapPin,
  CheckCircle2,
  Package,
  ClipboardCheck,
  Truck,
  FileText,
  PackageCheck,
  Link2,
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
import { cn } from "@repo/ui/lib/utils";
import {
  updateFulfillmentStatus,
} from "../../app/actions/sales";
import { toast } from "sonner";
import { BatchLinkDialog } from "./batch-link-dialog";
import { ManageDeliveryModal } from "./manage-delivery-modal";

export function DeliveryTable({ fulfillments }: { fulfillments: any[] }) {
  const [selectedItemForBatch, setSelectedItemForBatch] = useState<any>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [manageFulfillment, setManageFulfillment] = useState<any>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  const handleStatusUpdate = async (id: string, status: any) => {
    try {
      await updateFulfillmentStatus(id, status);
      toast.success("Fulfillment status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <>
      <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                  Fulfillment ID
                </th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                  Transaction
                </th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                  Driver / Partner
                </th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                  Batch Tracing
                </th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                  Status
                </th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                  Reconciled
                </th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {fulfillments.map((ful) => {
                const linkedBatches = ful.items?.filter((i: any) => i.batch || i.stockBatch) || [];
                const totalItems = ful.items?.length || 0;

                return (
                  <tr key={ful.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      #{ful.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {ful.transaction?.number || `Order #${ful.transactionId.slice(-6)}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ful.transaction?.customer?.name || "Walk-in Customer"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {ful.driver?.name || ful.carrier || "Unassigned Driver"}
                          </span>
                          {ful.driver?.deliveryPartner && (
                            <span className="text-xs text-muted-foreground">
                              {ful.driver.deliveryPartner.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {linkedBatches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedBatches.map((item: any) => {
                              const batchNum = item.batch?.batchNumber || item.stockBatch?.batchNumber || "Batch";
                              return (
                                <Badge key={item.id} variant="secondary" className="text-[10px] gap-1 font-mono">
                                  <PackageCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  {batchNum}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No batch linked</span>
                        )}
                        {ful.items && ful.items.length > 0 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs justify-start text-primary"
                            onClick={() => {
                              setSelectedItemForBatch(ful.items[0]);
                              setBatchDialogOpen(true);
                            }}
                          >
                            <Link2 className="w-3 h-3 mr-1" /> Link Batch
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <FulfillmentStatusBadge status={ful.status} />
                    </td>
                    <td className="px-6 py-4">
                      {ful.isReconciled ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Reconciled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Pending
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
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Fulfillment Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setManageFulfillment(ful);
                              setManageModalOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Manage & Dispatch
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(ful.id, "IN_TRANSIT")}
                          >
                            <Truck className="mr-2 h-4 w-4" /> Mark In-Transit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(ful.id, "DELIVERED")}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Delivered
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <a href={`/api/sales/documents/${ful.transaction?.id}?type=waybill`} download>
                              <FileText className="mr-2 h-4 w-4" /> Waybill
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <a href={`/api/sales/documents/${ful.transaction?.id}?type=delivery-note`} download>
                              <FileText className="mr-2 h-4 w-4" /> Delivery Note
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {fulfillments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No delivery fulfillments found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BatchLinkDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        fulfillmentItem={selectedItemForBatch}
      />

      {manageFulfillment && (
        <ManageDeliveryModal
          isOpen={manageModalOpen}
          onClose={() => setManageModalOpen(false)}
          transaction={manageFulfillment?.transaction}
        />
      )}
    </>
  );
}

function FulfillmentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
    SHIPPED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
    IN_TRANSIT: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
    CANCELLED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        styles[status] || "bg-muted text-muted-foreground border-border"
      )}
    >
      {status.toLowerCase().replace("_", " ")}
    </Badge>
  );
}
