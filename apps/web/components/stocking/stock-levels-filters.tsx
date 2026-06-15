"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Input } from "@repo/ui/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface StockLevelsFiltersProps {
  locations: { id: string; name: string }[];
}

export function StockLevelsFilters({ locations }: StockLevelsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products or SKU..."
          className="pl-9 h-10"
          defaultValue={searchParams.get("search") || ""}
          onKeyDown={e => {
            if (e.key === "Enter") {
              const value = (e.target as HTMLInputElement).value;
              handleFilterChange("search", value);
            }
          }}
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
          Location:
        </span>
        <Select
          defaultValue={searchParams.get("locationId") || "all"}
          onValueChange={value => handleFilterChange("locationId", value)}>
          <SelectTrigger className="w-full md:w-48 h-10">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
