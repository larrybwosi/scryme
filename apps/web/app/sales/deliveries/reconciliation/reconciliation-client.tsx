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
} from "lucide-react";
import { toast } from "sonner";
import { reconcileDelivery } from "../../../actions/sales";

export function ReconciliationClient({ fulfillments: initialFulfillments }: { fulfillments: any[] }) {
  const [fulfillments, setFulfillments] = useState(initialFulfillments);
  const [search, setSearch] = useState("");
  const [selectedFulfillment, setSelectedFulfillment] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = fulfillments.filter(
    (f) =>
      f.transaction?.number?.toLowerCase().includes(search.toLowerCase()) ||
      f.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.transaction?.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenReconcile = (f: any) => {
    setSelectedFulfillment(f);
    setReceivedBy(f.receivedBy || f.transaction?.customer?.name || "");
    setNotes("");
    setDialogOpen(true);
  };

  const handleConfirmReconcile = async () => {
    if (!selectedFulfillment) return;
    setSubmitting(true);
    try {
      const res = await reconcileDelivery({
        fulfillmentId: selectedFulfillment.id,
        isReconciled: true,
        receivedBy,
        reconciliationNotes: notes,
      });

      if (res.success) {
        toast.success("Delivery reconciled successfully");
        setFulfillments((prev) =>
          prev.map((item) =>
            item.id === selectedFulfillment.id
              ? { ...item, isReconciled: true, receivedBy, reconciledAt: new Date().toISOString() }
              : item
          )
        );
        setDialogOpen(false);
      } else {
        toast.error(res.error || "Failed to reconcile delivery");
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
                <span className="font-medium text-foreground">Items Delivered:</span>
                <span>{ful.items?.length || 0} Line Items</span>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px]">
                  {ful.deliveredAt
                    ? `Delivered: ${new Date(ful.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Status: In-Transit"}
                </span>
                <Button
                  size="sm"
                  variant={ful.isReconciled ? "outline" : "default"}
                  onClick={() => handleOpenReconcile(ful)}
                  disabled={ful.isReconciled}
                >
                  {ful.isReconciled ? "View Record" : "Audit & Reconcile"}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Reconcile Delivery
            </DialogTitle>
            <DialogDescription>
              Verify handover details, recipient signatures, and trigger driver/partner wallet adjustments.
            </DialogDescription>
          </DialogHeader>

          {selectedFulfillment && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">Order Number:</span>
                  <span>{selectedFulfillment.transaction?.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Assigned Driver:</span>
                  <span>{selectedFulfillment.driver?.name || "Unassigned"}</span>
                </div>
                {selectedFulfillment.driver?.deliveryPartner && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Partner Fixed Payout:</span>
                    <span>${selectedFulfillment.driver.deliveryPartner.fixedFee || "0.00"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Received By / Recipient Name</Label>
                <Input
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Recipient Name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Reconciliation Notes & Verification</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note any cash collected, POD status, returned items, or delivery discrepancies..."
                  rows={3}
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
              Confirm & Complete Reconciliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
