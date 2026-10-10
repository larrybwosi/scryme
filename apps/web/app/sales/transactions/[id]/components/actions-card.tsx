"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";
import { updateFulfillmentStatus } from "@/app/actions/sales";
import { toast } from "sonner";

interface ActionsCardProps {
  transaction: any;
  onStatusUpdate: (status: string) => Promise<void>;
  onRecordPaymentClick?: () => void;
}

export function ActionsCard({ transaction, onStatusUpdate, onRecordPaymentClick }: ActionsCardProps) {
  const isPosSale = transaction.type === "POS_SALE";
  const currentStatus = transaction.status;
  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);

  const pendingPickup = transaction.fulfillments?.find(
    (f: any) => f.type === "PICKUP" && f.status !== "COMPLETED" && f.status !== "DELIVERED"
  );

  const handleMarkPickedUp = async () => {
    if (!pendingPickup) return;
    setIsUpdatingPickup(true);
    try {
      await updateFulfillmentStatus(pendingPickup.id, "COMPLETED" as any);
      toast.success("Order marked as picked up!");
      await onStatusUpdate("COMPLETED");
    } catch (err) {
      toast.error("Failed to mark order as picked up");
      console.error(err);
    } finally {
      setIsUpdatingPickup(false);
    }
  };

  return (
    <Card className="border-border bg-card rounded-none shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader className="bg-muted px-5 py-4 border-b border-border">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          Order actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="text-xs text-muted-foreground leading-relaxed">
          {isPosSale
            ? "This is an over-the-counter POS sale. Transactions are finalized and completed instantly."
            : "Move this order to the next stage, or cancel it. Only the actions available for the current status are shown."}
        </div>

        {pendingPickup && (
          <Button
            className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow flex items-center justify-center gap-2"
            onClick={handleMarkPickedUp}
            disabled={isUpdatingPickup}
          >
            {isUpdatingPickup ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Mark Order as Picked Up
          </Button>
        )}

        {(currentStatus === "PREORDER" || !isPosSale) && (
          <div className="space-y-2 pt-2">
            {currentStatus === "PREORDER" && (
              <>
                {!pendingPickup && (
                  <Button
                    className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow mb-2"
                    onClick={() => onStatusUpdate("COMPLETED")}
                  >
                    Convert Preorder to Completed Order
                  </Button>
                )}
                {transaction.paymentStatus !== "PAID" && onRecordPaymentClick && (
                  <Button
                    variant="outline"
                    className="w-full h-10 text-xs font-bold uppercase tracking-wider border-border hover:bg-muted rounded-none mb-2"
                    onClick={onRecordPaymentClick}
                  >
                    Record Payment
                  </Button>
                )}
              </>
            )}
            {currentStatus === "PENDING_CONFIRMATION" && (
              <Button
                className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow"
                onClick={() => onStatusUpdate("CONFIRMED")}
              >
                Confirm order
              </Button>
            )}
            {currentStatus === "CONFIRMED" && (
              <Button
                className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow"
                onClick={() => onStatusUpdate("PROCESSING")}
              >
                Start processing
              </Button>
            )}
            {currentStatus === "PROCESSING" && !pendingPickup && (
              <Button
                className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow"
                onClick={() => onStatusUpdate("COMPLETED")}
              >
                Mark as delivered
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full h-10 text-xs font-bold uppercase tracking-wider text-red-600 border-border hover:bg-red-500/10 hover:border-red-500/30 dark:hover:bg-red-950/20 rounded-none transition-colors"
              onClick={() => onStatusUpdate("CANCELLED")}
              disabled={["COMPLETED", "CANCELLED"].includes(currentStatus)}
            >
              Cancel order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
