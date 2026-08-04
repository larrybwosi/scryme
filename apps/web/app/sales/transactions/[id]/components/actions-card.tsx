"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";

interface ActionsCardProps {
  transaction: any;
  onStatusUpdate: (status: string) => Promise<void>;
}

export function ActionsCard({ transaction, onStatusUpdate }: ActionsCardProps) {
  // POS_SALE might not need regular status flows, or we can handle them gracefully.
  const isPosSale = transaction.type === "POS_SALE";
  const currentStatus = transaction.status;

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

        {!isPosSale && (
          <div className="space-y-2 pt-2">
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
            {currentStatus === "PROCESSING" && (
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
