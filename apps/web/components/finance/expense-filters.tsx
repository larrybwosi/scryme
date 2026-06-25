"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { Calendar } from "@repo/ui/components/ui/calendar";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
} from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@repo/ui/lib/utils";

interface ExpenseFiltersProps {
  categories: any[];
  locations: any[];
}

export function ExpenseFilters({ categories, locations }: ExpenseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || "all",
  );
  const [locationId, setLocationId] = useState(
    searchParams.get("locationId") || "all",
  );
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
  });

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: search });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setCategoryId("all");
    setLocationId("all");
    setDateRange({});
    router.push(pathname);
  };

  const applyDatePreset = (preset: string) => {
    let from: Date | undefined;
    let to = endOfDay(new Date());

    switch (preset) {
      case "today":
        from = startOfDay(new Date());
        break;
      case "yesterday":
        from = startOfDay(subDays(new Date(), 1));
        to = endOfDay(subDays(new Date(), 1));
        break;
      case "this_week":
        from = startOfWeek(new Date());
        break;
      case "this_month":
        from = startOfMonth(new Date());
        break;
      case "last_7_days":
        from = startOfDay(subDays(new Date(), 7));
        break;
      case "last_30_days":
        from = startOfDay(subDays(new Date(), 30));
        break;
    }

    if (from) {
      setDateRange({ from, to });
      updateFilters({
        from: from.toISOString(),
        to: to.toISOString(),
      });
    }
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search expenses..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={val => {
              setStatus(val);
              updateFilters({ status: val });
            }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryId}
            onValueChange={val => {
              setCategoryId(val);
              updateFilters({ categoryId: val });
            }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={locationId}
            onValueChange={val => {
              setLocationId(val);
              updateFilters({ locationId: val });
            }}>
            <SelectTrigger className="w-[180px]">
              <MapPin className="mr-2 h-4 w-4 opacity-50" />
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground",
                )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col sm:flex-row">
                <div className="border-r p-2 space-y-2 flex flex-col min-w-[140px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyDatePreset("today")}>
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyDatePreset("yesterday")}>
                    Yesterday
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyDatePreset("this_week")}>
                    This Week
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyDatePreset("this_month")}>
                    This Month
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyDatePreset("last_7_days")}>
                    Last 7 Days
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyDatePreset("last_30_days")}>
                    Last 30 Days
                  </Button>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range: any) => {
                    setDateRange(range || {});
                    if (range?.from && range?.to) {
                      updateFilters({
                        from: range.from.toISOString(),
                        to: range.to.toISOString(),
                      });
                    }
                  }}
                  numberOfMonths={2}
                />
              </div>
            </PopoverContent>
          </Popover>

          {(search ||
            status !== "all" ||
            categoryId !== "all" ||
            locationId !== "all" ||
            dateRange.from) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-zinc-500">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
