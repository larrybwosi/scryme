"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { getStockAdjustmentHistory } from "../../app/actions/inventory";
import { format } from "date-fns";
import { Package, User } from "lucide-react";

interface StockHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    variantId: string;
    name: string;
  };
}

export function StockHistoryDrawer({
  isOpen,
  onClose,
  product,
}: StockHistoryDrawerProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStockAdjustmentHistory(product.variantId);
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [product.variantId]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Stock History - {product.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-6">
          {isLoading ? (
            <div className="text-center py-10">Loading history...</div>
          ) : history.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-200">
              {history.map(item => (
                <div key={item.id} className="relative pl-8">
                  <div className="absolute left-0 top-1 w-4 h-4 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    {format(
                      new Date(item.adjustmentDate),
                      "dd MMM yyyy, HH:mm",
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Adjusted{" "}
                    <span className="text-gray-900 font-medium">
                      {item.quantity.toString()} Units
                    </span>{" "}
                    ({item.reason})
                  </div>
                  {item.notes && (
                    <div className="text-xs text-gray-400 mt-1 italic">
                      &quot;{item.notes}&quot;
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                      {item.member?.user?.image ? (
                        <Image
                          src={item.member.user.image}
                          alt={item.member?.user?.name || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {item.member?.user?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No stock history found for this product.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
