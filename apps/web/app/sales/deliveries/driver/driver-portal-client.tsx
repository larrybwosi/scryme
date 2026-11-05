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
  MapPin,
  Phone,
  Package,
  ShieldCheck,
  Truck,
  Loader2,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { completeDriverDelivery } from "@/app/actions/deliveries";

export function DriverPortalClient({ deliveries: initialDeliveries }: { deliveries: any[] }) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [selectedFul, setSelectedFul] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [otpCode, setOtpCode] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [codCollected, setCodCollected] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenHandover = (ful: any) => {
    setSelectedFul(ful);
    setOtpCode("");
    setRecipientName(ful.transaction?.customer?.name || "");
    const remainingToPay =
      Number(ful.transaction?.finalTotal || 0) - Number(ful.transaction?.totalPaid || 0);
    setCodCollected(remainingToPay > 0 ? remainingToPay.toFixed(2) : "");
    setNotes("");
    setDialogOpen(true);
  };

  const handleConfirmHandover = async () => {
    if (!selectedFul) return;
    setSubmitting(true);
    try {
      const res = await completeDriverDelivery({
        fulfillmentId: selectedFul.id,
        otpCode: otpCode.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        codAmountCollected: codCollected ? parseFloat(codCollected) : undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success("Delivery handover completed successfully!");
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === selectedFul.id ? { ...d, status: "DELIVERED", deliveredAt: new Date().toISOString() } : d
          )
        );
        setDialogOpen(false);
      } else {
        toast.error((res as any).error || "Failed to complete delivery handover");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {deliveries.length === 0 && (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-sm">No Active Deliveries Assigned</p>
          <p className="text-xs mt-1">Check back when dispatches are assigned to your driver profile.</p>
        </Card>
      )}

      {deliveries.map((ful) => {
        const isCompleted = ful.status === "DELIVERED" || ful.status === "COMPLETED";
        const customer = ful.transaction?.customer;
        const address =
          ful.shippingAddress || (customer?.addresses && customer.addresses[0]);
        const addressText = address
          ? `${address.street1 || ""}, ${address.city || ""}`.trim().replace(/^,|,$/g, "")
          : "Standard delivery";

        return (
          <Card key={ful.id} className="border-border/60 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>{ful.transaction?.number || `Order #${ful.transactionId.slice(-6)}`}</span>
                  <Badge variant={isCompleted ? "secondary" : "default"} className="text-xs">
                    {ful.status.toLowerCase().replace("_", " ")}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Recipient: <span className="font-medium text-foreground">{customer?.name || "Customer"}</span>
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  ${Number(ful.transaction?.finalTotal || 0).toFixed(2)}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {ful.transaction?.paymentStatus === "PAID" ? "Pre-Paid" : "Cash on Delivery"}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{addressText}</span>
              </div>

              {customer?.phone && (
                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> {customer.phone}
                  </span>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-primary hover:underline font-semibold text-xs"
                  >
                    Call Customer
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> {ful.items?.length || 0} Line Items
                </span>
                <Button
                  size="sm"
                  disabled={isCompleted}
                  onClick={() => handleOpenHandover(ful)}
                  className="font-semibold text-xs"
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Handed Over
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verify & Handover
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Handover Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Delivery Handover Verification
            </DialogTitle>
            <DialogDescription>
              Verify the recipient OTP, record any Cash on Delivery, and complete the drop-off.
            </DialogDescription>
          </DialogHeader>

          {selectedFul && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order:</span>
                  <span className="font-semibold">{selectedFul.transaction?.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge variant="outline" className="text-[11px]">
                    {selectedFul.transaction?.paymentStatus || "UNPAID"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Recipient OTP / Verification PIN</span>
                  <span className="text-[11px] text-muted-foreground">Ask recipient for their 6-digit code</span>
                </Label>
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 583921"
                  className="tracking-widest font-mono text-center text-base"
                  maxLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Recipient Name / Signed By</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Full name of person receiving the order"
                />
              </div>

              {selectedFul.transaction?.paymentStatus !== "PAID" && (
                <div className="space-y-1.5 p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-950 dark:bg-amber-950/20">
                  <Label className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Cash on Delivery (COD) Collected ($)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={codCollected}
                    onChange={(e) => setCodCollected(e.target.value)}
                    placeholder="Amount collected in cash"
                    className="bg-background"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Handover Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Left with reception, front door, etc."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmHandover} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Handover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
