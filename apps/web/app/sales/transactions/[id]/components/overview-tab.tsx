"use client";

import React from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";
import { PaymentProgress } from "./payment-progress";
import { ActionsCard } from "./actions-card";
import { CustomerCard } from "./customer-card";
import { LocationCard } from "./location-card";
import { PreorderCard } from "./preorder-card";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface OverviewTabProps {
  transaction: any;
  formatCurrency: (amount: number) => string;
  onStatusUpdate: (status: string) => Promise<void>;
  onRecordPaymentClick: () => void;
  onNotesUpdated: () => void;
  onTabChange?: (tab: string) => void;
}

export function OverviewTab({
  transaction,
  formatCurrency,
  onStatusUpdate,
  onRecordPaymentClick,
  onNotesUpdated,
  onTabChange,
}: OverviewTabProps) {
  const itemsCount = transaction.items?.length || 0;

  return (
    <div className="space-y-6 rounded-none">
      {/* Payment Progress Summary */}
      <PaymentProgress
        transaction={transaction}
        formatCurrency={formatCurrency}
        onRecordPaymentClick={onRecordPaymentClick}
      />

      {/* Grid Layout for Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column in Overview: Customer & Order Actions */}
        <div className="space-y-6">
          <CustomerCard transaction={transaction} />
          <ActionsCard
            transaction={transaction}
            onStatusUpdate={onStatusUpdate}
            onRecordPaymentClick={onRecordPaymentClick}
          />
        </div>

        {/* Right Column in Overview: Location & Preorder/Notes */}
        <div className="space-y-6">
          <LocationCard transaction={transaction} />
          <PreorderCard
            transaction={transaction}
            onNotesUpdated={onNotesUpdated}
            formatCurrency={formatCurrency}
            onRecordPaymentClick={onRecordPaymentClick}
          />
        </div>
      </div>
    </div>
  );
}
