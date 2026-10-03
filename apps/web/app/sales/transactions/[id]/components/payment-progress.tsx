"use client";

import React from "react";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";

interface PaymentProgressProps {
  transaction: any;
  formatCurrency: (amount: number) => string;
  onRecordPaymentClick?: () => void;
}

export function PaymentProgress({
  transaction,
  formatCurrency,
  onRecordPaymentClick,
}: PaymentProgressProps) {
  const total = Number(transaction.finalTotal || 0);
  const totalPaid = Number(transaction.totalPaid || 0);
  const remaining = Math.max(0, total - totalPaid);
  const percentPaid = total > 0 ? Math.min(100, Math.round((totalPaid / total) * 100)) : 0;
  const isPaid = transaction.paymentStatus === "PAID" || remaining === 0;

  return (
    <Card className="p-5 border-border bg-card rounded-none shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
            Payment Progress
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              isPaid
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider rounded-none"
                : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider rounded-none"
            }
          >
            {isPaid ? "Fully Paid" : `${percentPaid}% Paid`}
          </Badge>
          {!isPaid && onRecordPaymentClick && (
            <Button
              size="sm"
              onClick={onRecordPaymentClick}
              className="h-7 px-2.5 text-[11px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 rounded-none gap-1"
            >
              <Plus className="w-3 h-3" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-3 w-full bg-muted rounded-none overflow-hidden relative border border-border">
          <div
            className={`h-full transition-all duration-500 ${
              isPaid ? "bg-emerald-500" : percentPaid > 0 ? "bg-amber-500" : "bg-muted-foreground/30"
            }`}
            style={{ width: `${percentPaid}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
          <span>Paid: {formatCurrency(totalPaid)}</span>
          <span>Total: {formatCurrency(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">Total</span>
          <span className="font-bold font-mono text-foreground">{formatCurrency(total)}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">Paid</span>
          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalPaid)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">Remaining</span>
          <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>
    </Card>
  );
}
