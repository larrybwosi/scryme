"use client";

import React from "react";
import { DollarSign, ShoppingCart, ReceiptText, BarChart3 } from "lucide-react";

interface TransactionInsightsGridProps {
  transactions: any[];
}

export function TransactionInsightsGrid({ transactions }: TransactionInsightsGridProps) {
  const numTransactions = transactions.length;

  const totalAmountSold = transactions.reduce(
    (sum, t) => sum + Number(t.finalTotal || 0),
    0,
  );

  const totalProductsSold = transactions.reduce((sum, t) => {
    const itemsCount =
      t.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0;
    const serviceItemsCount =
      t.serviceItems?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0;
    return sum + itemsCount + serviceItemsCount;
  }, 0);

  const avgOrderValue = numTransactions > 0 ? totalAmountSold / numTransactions : 0;

  // Detect currency from the first transaction, fallback to KES
  const currencyCode = transactions[0]?.currencyCode || "KES";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-US").format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Amount Card */}
      <div className="bg-card text-foreground border border-border p-5 rounded-none flex flex-col gap-2 shadow-sm transition-all hover:border-border/85">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Amount Sold
          </span>
          <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-2xl font-bold tracking-tight">
            {formatCurrency(totalAmountSold)}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Accumulated order volume
          </span>
        </div>
      </div>

      {/* Total Products/Items Sold Card */}
      <div className="bg-card text-foreground border border-border p-5 rounded-none flex flex-col gap-2 shadow-sm transition-all hover:border-border/85">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Products Sold
          </span>
          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-2xl font-bold tracking-tight">
            {formatNumber(totalProductsSold)}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Units of products & services
          </span>
        </div>
      </div>

      {/* Number of Transactions Card */}
      <div className="bg-card text-foreground border border-border p-5 rounded-none flex flex-col gap-2 shadow-sm transition-all hover:border-border/85">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transactions Count
          </span>
          <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ReceiptText className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-2xl font-bold tracking-tight">
            {formatNumber(numTransactions)}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Total processed transactions
          </span>
        </div>
      </div>

      {/* Average Order Value Card */}
      <div className="bg-card text-foreground border border-border p-5 rounded-none flex flex-col gap-2 shadow-sm transition-all hover:border-border/85">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Avg Transaction Value
          </span>
          <div className="p-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-2xl font-bold tracking-tight">
            {formatCurrency(avgOrderValue)}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Average basket order size
          </span>
        </div>
      </div>
    </div>
  );
}
