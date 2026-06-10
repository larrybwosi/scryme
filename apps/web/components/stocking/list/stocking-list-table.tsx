"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  ArrowLeftRight,
  PackageSearch,
  Package,
  ArrowUpDown,
} from "lucide-react";
import { AuditStockModal } from "../../inventory/audit-stock-modal";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface StockLevel {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  sku: string;
  categoryName: string;
  supplierName: string;
  locationName?: string;
  locationId?: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  incomingStock: number;
}

interface StockingListTableProps {
  data: StockLevel[];
}

export function StockingListTable({ data }: StockingListTableProps) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groupBy = searchParams.get("groupBy") || "none";

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get('sortBy');
    const currentOrder = params.get('sortOrder');

    if (currentSort === column) {
      params.set('sortOrder', currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const SortableHeader = ({ title, column, className }: { title: string, column: string, className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {title}
        <ArrowUpDown size={12} className="text-gray-400" />
      </div>
    </TableHead>
  );

  // Grouping logic
  const groupedData: Record<string, StockLevel[]> = {};
  if (groupBy !== "none") {
    data.forEach(item => {
      let key = "Other";
      if (groupBy === "category") key = item.categoryName;
      if (groupBy === "supplier") key = item.supplierName;
      if (groupBy === "location") key = item.locationName || "No Location";

      if (!groupedData[key]) groupedData[key] = [];
      groupedData[key].push(item);
    });
  }

  const renderRows = (items: StockLevel[]) => (
    items.map((item, index) => (
      <TableRow key={`${item.variantId}-${item.locationId || index}`} className="hover:bg-gray-50/50">
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-[#1D1D1F]">
              {item.name} {item.variantName !== "Default" && ` - ${item.variantName}`}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
            {item.sku}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <span className="font-semibold text-sm">{item.currentStock}</span>
        </TableCell>
        <TableCell className="text-center">
           <Badge variant={item.availableStock > 0 ? "secondary" : "destructive"} className="px-2 py-0 h-5 text-[10px]">
            {item.availableStock}
           </Badge>
        </TableCell>
        <TableCell className="text-center text-gray-500 text-sm">
          {item.reservedStock}
        </TableCell>
        <TableCell className="text-center">
          {item.incomingStock > 0 ? (
            <div className="flex items-center justify-center gap-1 text-blue-600 font-medium text-sm">
              <Package size={12} />
              {item.incomingStock}
            </div>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setSelectedItem({
                  ...item,
                  unitPrice: 0,
                });
                setIsAuditModalOpen(true);
              }}>
                <PackageSearch className="mr-2 h-4 w-4" />
                <span>Adjust Stock</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                window.location.href = `/stocking/transfers/new?variantId=${item.variantId}`;
              }}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                <span>Transfer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <SortableHeader title="Product" column="name" />
            <SortableHeader title="SKU" column="sku" />
            <TableHead className="font-bold text-center">Current</TableHead>
            <TableHead className="font-bold text-center">Available</TableHead>
            <TableHead className="font-bold text-center">Committed</TableHead>
            <TableHead className="font-bold text-center">Incoming</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                No stock data found.
              </TableCell>
            </TableRow>
          ) : (
            groupBy === "none" ? (
              renderRows(data)
            ) : (
              Object.entries(groupedData).map(([group, items]) => (
                <React.Fragment key={group}>
                  <TableRow className="bg-gray-100/50">
                    <TableCell colSpan={7} className="py-2 font-bold text-sm sticky top-0 bg-gray-100/50 z-10">
                      {group} ({items.length})
                    </TableCell>
                  </TableRow>
                  {renderRows(items)}
                </React.Fragment>
              ))
            )
          )}
        </TableBody>
      </Table>

      {selectedItem && (
        <AuditStockModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          product={selectedItem as any}
        />
      )}
    </div>
  );
}
