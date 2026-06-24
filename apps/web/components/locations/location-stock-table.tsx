"use client";

import React, { useState, useEffect } from "react";
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
import {
  Search,
  Save,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { bulkUpdateLocationStock } from "../../app/actions/stock-management";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "usehooks-ts";

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
  totalItems: number;
  pageSize: number;
  currentPage: number;
}

export function LocationStockTable({
  locationId,
  initialData,
  totalItems,
  pageSize,
  currentPage,
}: LocationStockTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 500);

  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedSearch, pathname, router, searchParams]);

  const handleStockChange = (variantId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return;
    }

    setPendingChanges(prev => ({
      ...prev,
      [variantId]: numValue,
    }));
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

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

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="text-center font-semibold">
                Current Stock
              </TableHead>
              <TableHead className="text-right w-[150px] font-semibold">
                New Total Stock
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              initialData.map(item => {
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
                      <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase px-2 py-0.5 rounded bg-gray-100 border">
                        {item.sku}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {item.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className={cn(
                          "h-9 text-right font-bold transition-all",
                          isChanged
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 text-blue-700"
                            : "border-gray-200 focus:border-blue-400",
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4 border-t bg-white rounded-b-md">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{initialData.length}</span> of{" "}
          <span className="font-medium">{totalItems}</span> products
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isSubmitting}
            className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isSubmitting}
                  className="h-8 w-8 p-0">
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isSubmitting}
            className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
