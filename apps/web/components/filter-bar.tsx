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

  const [localSearch, setLocalSearch] = useState(currentQ);

  // Sync local search input with URL search query
  useEffect(() => {
    setLocalSearch(currentQ);
  }, [currentQ]);

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

  const resetAllFilters = () => {
    setLocalSearch("");
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
    currentSortBy !== "createdAt_desc";

  // For pages other than transactions, render a simpler/default filter layout to prevent breaking them
  const isTransactionsPage = pathname === "/sales/transactions";

  if (!isTransactionsPage) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
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
              className="gap-1 text-xs h-9">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-4 mb-6 dark:bg-zinc-900/50 dark:border-zinc-800">
      {/* Single Line: Search Input + All Filters + Clear Button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search order number, customer or notes..."
            className="pl-10 h-9 border-zinc-200 focus-visible:ring-zinc-900/5 transition-all text-sm"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
          />
        </div>

        {/* Order Type */}
        <Select
          value={currentType}
          onValueChange={val => updateQueryParam("type", val)}>
          <SelectTrigger className="w-[140px] text-xs h-9 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 transition-colors">
            <ClipboardList className="w-3 h-3 mr-1.5" />
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
          <SelectTrigger className="w-[150px] text-xs h-9 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 transition-colors">
            <Filter className="w-3 h-3 mr-1.5" />
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
          <SelectTrigger className="w-[150px] text-xs h-9 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 transition-colors">
            <DollarSign className="w-3 h-3 mr-1.5" />
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
          <SelectTrigger className="w-[140px] text-xs h-9 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 transition-colors">
            <MapPin className="w-3 h-3 mr-1.5" />
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
          <SelectTrigger className="w-[160px] text-xs h-9 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 transition-colors">
            <ArrowUpDown className="w-3 h-3 mr-1.5" />
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
        <div className="flex items-center gap-2">
          {isPending && (
            <span className="text-xs text-zinc-400 animate-pulse whitespace-nowrap">
              Syncing...
            </span>
          )}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 h-9 whitespace-nowrap">
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
