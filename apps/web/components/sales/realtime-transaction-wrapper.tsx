"use client";

import React, { useState, useEffect } from "react";
import { Activity, Zap, ZapOff } from "lucide-react";
import { useRealtime } from "@repo/shared/realtime-client";
import { TransactionTable } from "./transaction-table";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";

export function RealtimeTransactionWrapper({
  initialTransactions,
  organizationId,
}: {
  initialTransactions: any[];
  organizationId?: string;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isRealtime, setIsRealtime] = useState(false);
  const { subscribe } = useRealtime();

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    if (!isRealtime || !organizationId) return;

    console.log(`Subscribing to org:${organizationId}:transactions`);

    const unsubscribe = subscribe(
      `org:${organizationId}:transactions`,
      "transaction:created",
      (newTrx) => {
        console.log("New transaction received:", newTrx);
        toast.info(`New Transaction: ${newTrx.number}`, {
          description: `${newTrx.customerName} - ${newTrx.finalTotal}`,
        });

        setTransactions((prev) => {
          // Prevent duplicates
          if (prev.find((t) => t.id === newTrx.id)) return prev;

          // Re-format slightly to match table expectations if needed
          // The table expects things like trx.customer.name, trx._count.items
          const formattedTrx = {
            ...newTrx,
            customer: { name: newTrx.customerName },
            _count: { items: 0 }, // We don't have item count in the payload
            location: { name: "..." },
          };

          return [formattedTrx, ...prev];
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [isRealtime, organizationId, subscribe]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRealtime(!isRealtime)}
          className={cn(
            "gap-2 transition-all",
            isRealtime
              ? "border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700"
              : "text-zinc-500",
          )}
        >
          {isRealtime ? (
            <>
              <Zap className="w-4 h-4 fill-current" />
              Real-time Active
            </>
          ) : (
            <>
              <ZapOff className="w-4 h-4" />
              View Real-time
            </>
          )}
        </Button>
      </div>

      <TransactionTable transactions={transactions} />
    </div>
  );
}
