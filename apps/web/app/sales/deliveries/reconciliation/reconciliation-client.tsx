"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  User,
  AlertCircle,
  FileText,
  Search,
  Loader2,
  RotateCcw,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { reconcileDeliveryFull } from "@/app/actions/deliveries";

export function ReconciliationClient({ fulfillments: initialFulfillments }: { fulfillments: any[] }) {
  const [fulfillments, setFulfillments] = useState(initialFulfillments);
  const [search, setSearch] = useState("");
  const [selectedFulfillment, setSelectedFulfillment] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isDelivered, setIsDelivered] = useState(true);
  const [codCollected, setCodCollected] = useState("");
  const [returnedItemState, setReturnedItemState] = useState<{ [key: string]: { returned: number; damaged: number; reason: string } }>({});

  const filtered = fulfillments.filter(
    (f) =>
      f.transaction?.number?.toLowerCase().includes(search.toLowerCase()) ||
      f.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.transaction?.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenReconcile = (f: any) => {
    setSelectedFulfillment(f);
    setReceivedBy(f.receivedBy || f.transaction?.customer?.name || "");
    setNotes(f.reconciliationNotes || "");
    setIsDelivered(f.status !== "CANCELLED" && f.status !== "FAILED");
    setCodCollected(f.codAmountCollected ? String(f.codAmountCollected) : "");

    const initialReturns: any = {};
    if (f.items) {
      f.items.forEach((item: any) => {
        initialReturns[item.id] = {
          returned: item.quantityReturned || 0,
          damaged: item.quantityDamaged || 0,
          reason: "",
        };
      });
    }
    setReturnedItemState(initialReturns);
    setDialogOpen(true);
  };

  const handleConfirmReconcile = async () => {
    if (!selectedFulfillment) return;
    setSubmitting(true);
    try {
      const returnedItemsPayload = Object.entries(returnedItemState)
        .filter(([_, val]) => val.returned > 0)
        .map(([itemId, val]) => ({
          fulfillmentItemId: itemId,
          quantityReturned: val.returned,
          quantityDamaged: val.damaged,
          reason: val.reason,
        }));

      const res = await reconcileDeliveryFull({
        fulfillmentId: selectedFulfillment.id,
        isDelivered,
        receivedBy: receivedBy.trim() || undefined,
        reconciliationNotes: notes.trim() || undefined,
        codAmountCollected: codCollected ? parseFloat(codCollected) : undefined,
        returnedItems: returnedItemsPayload.length > 0 ? returnedItemsPayload : undefined,
      });

      if (res.success) {
        toast.success("Delivery reconciled successfully");
        setFulfillments((prev) =>
          prev.map((item) =>
            item.id === selectedFulfillment.id
              ? {
                  ...item,
                  isReconciled: true,
                  receivedBy,
                  reconciledAt: new Date().toISOString(),
                  codAmountCollected: codCollected ? parseFloat(codCollected) : item.codAmountCollected,
                }
              : item
          )
        );
        setDialogOpen(false);
      } else {
        toast.error((res as any).error || "Failed to reconcile delivery");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during reconciliation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by Order #, Driver, or Customer..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Reconciliation List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ful) => (
          <Card key={ful.id} className="border-border/60 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base font-bold">
                  {ful.transaction?.number || `Order #${ful.transactionId.slice(-6)}`}
                </CardTitle>
                <CardDescription className="text-xs">
                  Customer: {ful.transaction?.customer?.name || "Walk-in Customer"}
                </CardDescription>
              </div>
              {ful.isReconciled ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none">
                  Reconciled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                  Pending Audit
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Truck className="w-3.5 h-3.5 text-primary" /> Driver:
                </span>
                <span>{ful.driver?.name || "Unassigned"}</span>
              </div>

              {ful.driver?.deliveryPartner && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Partner:</span>
                  <span>{ful.driver.deliveryPartner.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Total Order Amount:</span>
                <span className="font-semibold text-foreground">
                  ${Number(ful.transaction?.finalTotal || 0).toFixed(2)}
                </span>
              </div>

              {ful.codAmountCollected && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="font-medium">COD Collected:</span>
                  <span className="font-bold">${Number(ful.codAmountCollected).toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px]">
                  {ful.deliveredAt
                    ? `Delivered: ${new Date(ful.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Status: " + ful.status}
                </span>
                <Button
                  size="sm"
                  variant={ful.isReconciled ? "outline" : "default"}
                  onClick={() => handleOpenReconcile(ful)}
                >
                  {ful.isReconciled ? "Review Audit" : "Audit & Reconcile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center border rounded-xl border-dashed border-border/60">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-semibold text-sm">No Pending Reconciliations</h4>
            <p className="text-xs text-muted-foreground mt-1">All delivered orders have been fully verified and reconciled.</p>
          </div>
        )}
      </div>

      {/* Audit & Reconcile Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Enterprise Delivery Reconciliation
            </DialogTitle>
            <DialogDescription>
              Verify handover details, recipient signatures, Cash on Delivery payments, and restock returned batches.
            </DialogDescription>
          </DialogHeader>

          {selectedFulfillment && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-bold">{selectedFulfillment.transaction?.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Driver:</span>
                  <span className="font-semibold">{selectedFulfillment.driver?.name || "Unassigned"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-semibold">${Number(selectedFulfillment.transaction?.finalTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Outcome Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Delivery Outcome</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isDelivered ? "default" : "outline"}
                    onClick={() => setIsDelivered(true)}
                    className="flex-1"
                  >
                    Successful Delivery
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!isDelivered ? "destructive" : "outline"}
                    onClick={() => setIsDelivered(false)}
                    className="flex-1"
                  >
                    Failed / Returned
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Received By / Recipient Name</Label>
                <Input
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Recipient Name"
                />
              </div>

              {/* COD Recording */}
              <div className="space-y-1.5 p-3 rounded-lg border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Cash on Delivery (COD) Amount Received
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={codCollected}
                  onChange={(e) => setCodCollected(e.target.value)}
                  placeholder="Enter collected cash to create payment automatically"
                />
              </div>

              {/* Line Items & Returns Restocking */}
              {selectedFulfillment.items && selectedFulfillment.items.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" /> Returned Items & Batch Restocking
                  </Label>
                  <div className="space-y-2">
                    {selectedFulfillment.items.map((item: any) => {
                      const state = returnedItemState[item.id] || { returned: 0, damaged: 0, reason: "" };
                      return (
                        <div key={item.id} className="p-2.5 rounded border border-border/60 space-y-2">
                          <div className="flex justify-between font-medium">
                            <span>{item.transactionItem?.productName || "Product Line Item"}</span>
                            <span className="text-muted-foreground">Qty Handed Over: {item.quantity}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-muted-foreground">Qty Returned</span>
                              <Input
                                type="number"
                                min={0}
                                max={item.quantity}
                                value={state.returned}
                                onChange={(e) =>
                                  setReturnedItemState((prev) => ({
                                    ...prev,
                                    [item.id]: { ...state, returned: parseInt(e.target.value) || 0 },
                                  }))
                                }
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground">Qty Damaged (Waste)</span>
                              <Input
                                type="number"
                                min={0}
                                max={state.returned}
                                value={state.damaged}
                                onChange={(e) =>
                                  setReturnedItemState((prev) => ({
                                    ...prev,
                                    [item.id]: { ...state, damaged: parseInt(e.target.value) || 0 },
                                  }))
                                }
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Audit & Reconciliation Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record POD review, discrepancy notes, or cash handover..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReconcile} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Reconciliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
