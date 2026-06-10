"use client";

import React, { useCallback } from 'react';
import { Search, Filter, LayoutGrid } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

interface StockingListFiltersProps {
  categories: { id: string, name: string }[];
  suppliers: { id: string, name: string }[];
  locations: { id: string, name: string }[];
}

export function StockingListFilters({ categories, suppliers, locations }: StockingListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "none" || !value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = useDebouncedCallback((term: string) => {
    router.push(`${pathname}?${createQueryString('search', term)}`);
  }, 300);

  const handleFilterChange = (name: string, value: string) => {
    router.push(`${pathname}?${createQueryString(name, value)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 border-b w-fit pb-1">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-black -mb-[6px]">All products</button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={14} />
          <span>View Settings</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products or SKU..."
            className="pl-9 bg-white"
            defaultValue={searchParams.get('search') || ""}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <Select
          defaultValue={searchParams.get('locationId') || "all"}
          onValueChange={(v) => handleFilterChange('locationId', v)}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get('categoryId') || "all"}
          onValueChange={(v) => handleFilterChange('categoryId', v)}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get('supplierId') || "all"}
          onValueChange={(v) => handleFilterChange('supplierId', v)}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium text-gray-500">Group by:</span>
          <Select
            defaultValue={searchParams.get('groupBy') || "none"}
            onValueChange={(v) => handleFilterChange('groupBy', v)}
          >
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="location">Location</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter size={14} />
            Manage Table
          </Button>
        </div>
      </div>
    </div>
  );
}
