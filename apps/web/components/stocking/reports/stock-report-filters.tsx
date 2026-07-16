"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DateRangePicker } from "@repo/ui/components/date-range-picker";
import { Button } from "@repo/ui/components/ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

interface Location {
  id: string;
  name: string;
}

interface StockReportFiltersProps {
  locations: Location[];
  initialLocationId?: string;
  initialStartDate: Date;
  initialEndDate: Date;
}

export function StockReportFilters({
  locations,
  initialLocationId = "",
  initialStartDate,
  initialEndDate,
}: StockReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [locationId, setLocationId] = useState(initialLocationId);
  const [reportType, setReportType] = useState("Stock Movement Report");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialStartDate,
    to: initialEndDate,
  });

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (locationId) {
      params.set("locationId", locationId);
    } else {
      params.delete("locationId");
    }

    if (dateRange?.from) {
      params.set("startDate", format(dateRange.from, "yyyy-MM-dd"));
    } else {
      params.delete("startDate");
    }

    if (dateRange?.to) {
      params.set("endDate", format(dateRange.to, "yyyy-MM-dd"));
    } else {
      params.delete("endDate");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocationId("");
    setReportType("Stock Movement Report");
    setDateRange({
      from: initialStartDate,
      to: initialEndDate,
    });
    router.push(pathname);
  };

  return (
    <form onSubmit={handleApplyFilters} className="space-y-5">
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
          Report Type
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
        >
          <option>Stock Movement Report</option>
          <option>Inventory Valuation</option>
          <option>Slow Moving Inventory</option>
          <option>Expiry Analysis</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
          Location
        </label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
          Date Range
        </label>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
          className="w-full bg-white"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleResetFilters}
          className="flex-1 gap-2 h-10 text-gray-600 border-gray-200"
        >
          <RotateCcw size={15} /> Reset
        </Button>
        <Button type="submit" className="flex-1 gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium">
          <Filter size={15} /> Apply
        </Button>
      </div>
    </form>
  );
}
