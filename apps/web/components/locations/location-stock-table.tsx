"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Search, Save, Loader2, RotateCcw } from "lucide-react";
import { bulkUpdateLocationStock } from "../../app/actions/stock-management";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";

interface StockItem {
  variantId: string;
  name: string;
  variantName: string;
  sku: string;
  currentStock: number;
}

interface LocationStockTableProps {
  locationId: string;
  initialData: StockItem[];
}

export function LocationStockTable({
  locationId,
  initialData,
}: LocationStockTableProps) {
  const [search, setSearch] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    return initialData.filter(
      item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()),
    );
  }, [initialData, search]);

  const handleStockChange = (variantId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        // If it's empty or invalid, we can choose to remove it from pending or keep it
        // For now let's just ignore invalid numbers
        return;
    }

    setPendingChanges(prev => ({
      ...prev,
      [variantId]: numValue,
    }));
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      const updates = Object.entries(pendingChanges).map(
        ([variantId, newTotalStock]) => ({
          variantId,
          newTotalStock,
        }),
      );

      const result = await bulkUpdateLocationStock(locationId, updates);
      if (result.success) {
        toast.success(result.message);
        setPendingChanges({});
      } else {
        toast.error("Failed to update stock");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPendingChanges({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="text-right w-[150px]">
                New Total Stock
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map(item => {
                const isChanged = pendingChanges[item.variantId] !== undefined;
                const displayValue = isChanged
                  ? pendingChanges[item.variantId]
                  : item.currentStock;

                return (
                  <TableRow key={item.variantId} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-[#1D1D1F]">
                          {item.name}
                          {item.variantName !== "Default" &&
                            ` - ${item.variantName}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
                        {item.sku}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">
                        {item.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className={cn(
                          "h-8 text-right font-medium",
                          isChanged &&
                            "border-blue-500 bg-blue-50 ring-1 ring-blue-500",
                        )}
                        value={displayValue}
                        onChange={e =>
                          handleStockChange(item.variantId, e.target.value)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
