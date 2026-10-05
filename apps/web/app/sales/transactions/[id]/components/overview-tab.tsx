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

      {/* Quick Items Banner / Call to Action */}
      <Card className="p-5 border-border bg-muted/40 rounded-none shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background border border-border flex items-center justify-center text-foreground rounded-none shrink-0">
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Order Items Breakdown ({itemsCount} {itemsCount === 1 ? "item" : "items"})
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              View line items, quantities, taxes, discounts, and itemized subtotal.
            </p>
          </div>
        </div>
        {onTabChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTabChange("items")}
            className="h-9 text-xs font-bold uppercase tracking-wider border-border bg-background hover:bg-muted rounded-none gap-2 shrink-0 w-full sm:w-auto justify-center"
          >
            View All Items <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </Card>
    </div>
  );
}
