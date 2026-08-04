"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRealtime } from "@repo/shared/realtime/client";
import { TransactionTable } from "./transaction-table";
import { toast } from "sonner";

export function RealtimeTransactionWrapper({
  initialTransactions,
  organizationId,
  invoiceConfigUpdatedAt,
  receiptConfigUpdatedAt,
}: {
  initialTransactions: any[];
  organizationId?: string;
  invoiceConfigUpdatedAt?: string;
  receiptConfigUpdatedAt?: string;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const searchParams = useSearchParams();
  const isRealtime = searchParams.get("realtime") === "true";
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
      newTrx => {
        console.log("New transaction received:", newTrx);
        toast.info(`New Transaction: ${newTrx.number}`, {
          description: `${newTrx.customerName} - ${newTrx.finalTotal}`,
        });

        setTransactions(prev => {
          // Prevent duplicates
          if (prev.find(t => t.id === newTrx.id)) return prev;

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
      <TransactionTable
        transactions={transactions}
        invoiceConfigUpdatedAt={invoiceConfigUpdatedAt}
        receiptConfigUpdatedAt={receiptConfigUpdatedAt}
      />
    </div>
  );
}
