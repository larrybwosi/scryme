"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  RotateCcw,
  ArrowUpDown,
  DollarSign,
  MapPin,
  ClipboardList,
  Zap,
  ZapOff,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { DateRangePicker } from "@repo/ui/components/date-range-picker";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@repo/ui/lib/utils";

interface LocationOption {
  id: string;
  name: string;
}

interface FilterBarProps {
  locations?: LocationOption[];
}

export function FilterBar({ locations = [] }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams.get("q") || "";
  const currentType = searchParams.get("type") || "all";
  const currentStatus = searchParams.get("status") || "all";
  const currentPaymentStatus = searchParams.get("paymentStatus") || "all";
  const currentLocationId = searchParams.get("locationId") || "all";
  const currentSortBy = searchParams.get("sortBy") || "createdAt_desc";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";
  const currentRealtime = searchParams.get("realtime") === "true";

  const [localSearch, setLocalSearch] = useState(currentQ);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = currentStartDate ? new Date(currentStartDate) : undefined;
    const to = currentEndDate ? new Date(currentEndDate) : undefined;
    return { from, to };
  });

  // Sync local search input with URL search query
  useEffect(() => {
    setLocalSearch(currentQ);
  }, [currentQ]);

  // Sync date range with URL search queries
  useEffect(() => {
    const from = currentStartDate ? new Date(currentStartDate) : undefined;
    const to = currentEndDate ? new Date(currentEndDate) : undefined;
    setDateRange({ from, to });
  }, [currentStartDate, currentEndDate]);

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router],
  );

  // Debounced search update
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (localSearch !== currentQ) {
        updateQueryParam("q", localSearch);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [localSearch, currentQ, updateQueryParam]);

  const handleDateChange = useCallback(
    (range: DateRange | undefined) => {
      setDateRange(range);
      const params = new URLSearchParams(searchParams.toString());

      if (range?.from) {
        params.set("startDate", format(range.from, "yyyy-MM-dd"));
      } else {
        params.delete("startDate");
      }

      if (range?.to) {
        params.set("endDate", format(range.to, "yyyy-MM-dd"));
      } else {
        params.delete("endDate");
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router],
  );

  const toggleRealtime = () => {
    updateQueryParam("realtime", currentRealtime ? "" : "true");
  };

  const resetAllFilters = () => {
    setLocalSearch("");
    setDateRange(undefined);
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    currentQ !== "" ||
    currentType !== "all" ||
    currentStatus !== "all" ||
    currentPaymentStatus !== "all" ||
    currentLocationId !== "all" ||
    currentSortBy !== "createdAt_desc" ||
    currentStartDate !== "" ||
    currentEndDate !== "" ||
    currentRealtime;

  const isTransactionsPage = pathname === "/sales/transactions";

  if (!isTransactionsPage) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card text-foreground p-4 rounded-xl border border-border shadow-sm mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-accent/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/5 transition-all text-foreground"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="gap-1 text-xs h-9 text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card text-foreground p-5 rounded-xl border border-border shadow-sm space-y-4 mb-6 transition-all">
      {/* Top Row: Search Input + Date Range Picker + Realtime Button */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search order number, customer or notes..."
            className="pl-10 h-9 border-border bg-background text-foreground focus-visible:ring-ring transition-all text-sm w-full"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
          />
        </div>

        {/* Date Range Picker */}
        <div className="w-full md:w-auto min-w-[240px]">
          <DateRangePicker
            date={dateRange}
            onDateChange={handleDateChange}
            className="bg-background text-foreground h-9 border-border rounded-md text-xs sm:text-sm shadow-none focus:outline-none focus:ring-0 [&_button]:h-9 [&_button]:border-border [&_button]:bg-background [&_button]:hover:bg-accent [&_button]:text-xs [&_button]:font-medium [&_button]:shadow-none [&_button]:w-full"
          />
        </div>

        {/* Real-time Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleRealtime}
          className={cn(
            "gap-2 text-xs h-9 transition-all shrink-0 w-full md:w-auto",
            currentRealtime
              ? "border-emerald-500/50 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/50 hover:text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30"
              : "text-muted-foreground border-border bg-background hover:bg-accent hover:text-foreground",
          )}>
          {currentRealtime ? (
            <>
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-emerald-500" />
              Real-time Active
            </>
          ) : (
            <>
              <ZapOff className="w-3.5 h-3.5" />
              View Real-time
            </>
          )}
        </Button>
      </div>

      {/* Bottom Row: Filter Dropdowns + Clear/Reset Filters */}
      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/40">
        {/* Order Type */}
        <Select
          value={currentType}
          onValueChange={val => updateQueryParam("type", val)}>
          <SelectTrigger className="w-[140px] text-xs h-9 bg-background border-border text-foreground hover:bg-accent transition-colors">
            <ClipboardList className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="QUOTE">Quote</SelectItem>
            <SelectItem value="SALES_ORDER">Sales Order</SelectItem>
            <SelectItem value="POS_SALE">POS Sale</SelectItem>
          </SelectContent>
        </Select>

        {/* Order Status */}
        <Select
          value={currentStatus}
          onValueChange={val => updateQueryParam("status", val)}>
          <SelectTrigger className="w-[150px] text-xs h-9 bg-background border-border text-foreground hover:bg-accent transition-colors">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_CONFIRMATION">
              Pending Confirmation
            </SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Status */}
        <Select
          value={currentPaymentStatus}
          onValueChange={val => updateQueryParam("paymentStatus", val)}>
          <SelectTrigger className="w-[150px] text-xs h-9 bg-background border-border text-foreground hover:bg-accent transition-colors">
            <DollarSign className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
          </SelectContent>
        </Select>

        {/* Location Select */}
        <Select
          value={currentLocationId}
          onValueChange={val => updateQueryParam("locationId", val)}>
          <SelectTrigger className="w-[140px] text-xs h-9 bg-background border-border text-foreground hover:bg-accent transition-colors">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sorting Dropdown */}
        <Select
          value={currentSortBy}
          onValueChange={val => updateQueryParam("sortBy", val)}>
          <SelectTrigger className="w-[160px] text-xs h-9 bg-background border-border text-foreground hover:bg-accent transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Newest First</SelectItem>
            <SelectItem value="createdAt_asc">Oldest First</SelectItem>
            <SelectItem value="finalTotal_desc">Amount: High to Low</SelectItem>
            <SelectItem value="finalTotal_asc">Amount: Low to High</SelectItem>
            <SelectItem value="number_asc">Order Number: A to Z</SelectItem>
            <SelectItem value="number_desc">Order Number: Z to A</SelectItem>
          </SelectContent>
        </Select>

        {/* Syncing indicator & Clear button */}
        <div className="flex items-center gap-2 ml-auto">
          {isPending && (
            <span className="text-xs text-muted-foreground animate-pulse whitespace-nowrap mr-2">
              Syncing...
            </span>
          )}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9 whitespace-nowrap bg-background border-border hover:bg-accent">
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
