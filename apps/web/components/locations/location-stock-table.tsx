"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { bulkUpdateLocationStock } from "../../app/actions/stock-management";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

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
  totalCount: number;
}

export function LocationStockTable({
  locationId,
  initialData,
  totalCount,
}: LocationStockTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(search, 500);

  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
      params.set("page", "1");
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [debouncedSearch]);

  const handleStockChange = (variantId: string, value: string) => {
    if (value === "") {
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return;
    }

    setPendingChanges(prev => ({
      ...prev,
      [variantId]: numValue,
    }));
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sortBy");
    const currentOrder = params.get("sortOrder");

    if (currentSort === column) {
      params.set("sortOrder", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", column);
      params.set("sortOrder", "asc");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
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

  const currentPage = parseInt(searchParams.get("page") || "1");
  const totalPages = Math.ceil(totalCount / 50);

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
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
            </div>
          )}
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
              <TableHead
                className="cursor-pointer hover:bg-gray-100/50"
                onClick={() => handleSort("product.name")}>
                <div className="flex items-center gap-2">
                  Product
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100/50"
                onClick={() => handleSort("sku")}>
                <div className="flex items-center gap-2">
                  SKU
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="text-right w-[150px]">
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
                  : item.currentStock === 0
                    ? ""
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
                        placeholder="0"
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground">
            Showing {initialData.length} of {totalCount} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-xs font-medium px-2">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
