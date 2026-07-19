"use client";

import React, {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
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
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
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

// Small helper to render the correct sort icon per column
function SortIcon({
  column,
  activeColumn,
  order,
}: {
  column: string;
  activeColumn: string | null;
  order: string | null;
}) {
  if (activeColumn !== column) {
    return (
      <ArrowUpDown className="h-3 w-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
    );
  }
  return order === "asc" ? (
    <ArrowUp className="h-3 w-3 text-gray-900" />
  ) : (
    <ArrowDown className="h-3 w-3 text-gray-900" />
  );
}

// Memoized table row component to prevent rerendering all rows
const StockTableRow = React.memo(function StockTableRow({
  item,
  pendingChanges,
  onStockChange,
}: {
  item: StockItem;
  pendingChanges: Record<string, number>;
  onStockChange: (variantId: string, value: string) => void;
}) {
  const isChanged = pendingChanges[item.variantId] !== undefined;
  const displayValue = isChanged
    ? pendingChanges[item.variantId]
    : item.currentStock === 0
      ? ""
      : item.currentStock;

  const delta = isChanged
    ? pendingChanges[item.variantId] - item.currentStock
    : 0;

  return (
    <TableRow
      className={cn(
        "group transition-colors",
        isChanged ? "bg-blue-50/40 hover:bg-blue-50/60" : "hover:bg-gray-50/70",
      )}>
      <TableCell className="py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-[13.5px] text-[#1D1D1F] leading-snug">
            {item.name}
            {item.variantName !== "Default" && (
              <span className="text-gray-400 font-normal">
                {" "}
                · {item.variantName}
              </span>
            )}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">
          {item.sku}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-medium text-gray-700 tabular-nums">
          {item.currentStock}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {isChanged && delta !== 0 && (
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                delta > 0 ? "text-emerald-600" : "text-red-500",
              )}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <Input
            type="number"
            placeholder="0"
            className={cn(
              "h-8 w-24 text-right font-medium tabular-nums transition-all",
              isChanged
                ? "border-blue-400 bg-white ring-1 ring-blue-400/40 shadow-sm"
                : "border-gray-200",
            )}
            value={displayValue}
            onChange={e => onStockChange(item.variantId, e.target.value)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
});

export function LocationStockTable({
  locationId,
  initialData,
  totalCount,
}: LocationStockTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentSortBy = searchParams.get("sortBy");
  const currentSortOrder = searchParams.get("sortOrder");

  const [search, setSearch] = useState(currentSearch);
  const [debouncedSearch] = useDebounce(search, 500);

  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateURL = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      const queryString = newParams.toString();
      const newURL = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.push(newURL, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === currentSearch) return;

    updateURL({
      search: debouncedSearch || null,
      page: debouncedSearch ? "1" : null,
    });
  }, [debouncedSearch, currentSearch, updateURL]);

  const handleStockChange = useCallback((variantId: string, value: string) => {
    if (value === "") {
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setPendingChanges(prev => ({
      ...prev,
      [variantId]: numValue,
    }));
  }, []);

  const handleSort = useCallback(
    (column: string) => {
      const newOrder =
        currentSortBy === column && currentSortOrder === "asc" ? "desc" : "asc";

      updateURL({
        sortBy: column,
        sortOrder: newOrder,
      });
    },
    [currentSortBy, currentSortOrder, updateURL],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateURL({ page: page.toString() });
    },
    [updateURL],
  );

  const hasChanges = useMemo(
    () => Object.keys(pendingChanges).length > 0,
    [pendingChanges],
  );
  const changeCount = Object.keys(pendingChanges).length;

  const handleSave = useCallback(async () => {
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
  }, [hasChanges, pendingChanges, locationId]);

  const handleReset = useCallback(() => {
    setPendingChanges({});
  }, []);

  const totalPages = Math.ceil(totalCount / 50);

  const tableRows = useMemo(
    () =>
      initialData.length === 0 ? (
        <TableRow>
          <TableCell colSpan={4} className="h-56">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <PackageSearch
                className="h-8 w-8 text-gray-300"
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium text-gray-500">
                No products found
              </p>
              <p className="text-xs text-gray-400">
                Try adjusting your search or clearing filters.
              </p>
            </div>
          </TableCell>
        </TableRow>
      ) : (
        initialData.map(item => (
          <StockTableRow
            key={item.variantId}
            item={item}
            pendingChanges={pendingChanges}
            onStockChange={handleStockChange}
          />
        ))
      ),
    [initialData, pendingChanges, handleStockChange],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white border-gray-200 shadow-sm focus-visible:ring-2 focus-visible:ring-gray-900/10"
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs font-medium text-gray-500 tabular-nums">
              {changeCount} unsaved {changeCount === 1 ? "change" : "changes"}
            </span>
          )}
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSubmitting}
              className="border-gray-200">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
            className="bg-[#1D1D1F] hover:bg-black text-white shadow-sm disabled:opacity-40">
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save all changes
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60 hover:bg-gray-50/60 border-b border-gray-200/80">
              <TableHead
                className="group cursor-pointer select-none h-10 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                onClick={() => handleSort("product.name")}>
                <div className="flex items-center gap-1.5">
                  Product
                  <SortIcon
                    column="product.name"
                    activeColumn={currentSortBy}
                    order={currentSortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                className="group cursor-pointer select-none h-10 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                onClick={() => handleSort("sku")}>
                <div className="flex items-center gap-1.5">
                  SKU
                  <SortIcon
                    column="sku"
                    activeColumn={currentSortBy}
                    order={currentSortOrder}
                  />
                </div>
              </TableHead>
              <TableHead className="h-10 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Current stock
              </TableHead>
              <TableHead className="h-10 text-right w-[180px] text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                New total stock
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {tableRows}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-gray-400 tabular-nums">
            Showing{" "}
            <span className="font-medium text-gray-600">
              {initialData.length}
            </span>{" "}
            of <span className="font-medium text-gray-600">{totalCount}</span>{" "}
            items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="border-gray-200">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-xs font-medium text-gray-500 px-2 tabular-nums">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
              className="border-gray-200">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
