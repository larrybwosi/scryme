"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { updateStockAlert } from "../../app/actions/inventory";

interface StockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    variantId: string;
    name: string;
    sku: string;
  };
}

export function StockAlertModal({
  isOpen,
  onClose,
  product,
}: StockAlertModalProps) {
  const [threshold, setThreshold] = useState("5");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    try {
      await updateStockAlert({
        variantId: product.variantId,
        reorderPoint: parseInt(threshold),
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Stock Alert</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Input value={product.name} readOnly className="bg-gray-50" />
          </div>
          <div className="space-y-2">
            <Label>Low Stock Threshold</Label>
            <div className="relative">
              <Input
                type="number"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="pr-12"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                Unit
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              You will be notified when the stock level falls below this value.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
