"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { MoreHorizontal, Package, AlertCircle, History, RotateCw } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { AuditStockModal } from "./audit-stock-modal";
import { StockAlertModal } from "./stock-alert-modal";
import { StockHistoryDrawer } from "./stock-history-drawer";
import { type InventoryProduct, reorderProduct } from "../../app/actions/inventory";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InventoryTableProps {
  data: InventoryProduct[];
}

import { cn } from "@repo/ui/lib/utils";

export function InventoryTable({ data }: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryProduct | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const SortableHeader = ({ title, column }: { title: string, column: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {title}
        <ArrowUpDown size={12} className="text-gray-400" />
      </div>
    </TableHead>
  );

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader title="Product name" column="name" />
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Supplier</TableHead>
            <SortableHeader title="Current Stock" column="currentStock" />
            <SortableHeader title="Unit Price" column="unitPrice" />
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.variantId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{item.sku}</TableCell>
                <TableCell className="text-sm text-gray-500">{item.category}</TableCell>
                <TableCell className="text-sm text-gray-500">{item.supplier}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.currentStock} unit</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4",
                          item.status === "Low" && "bg-orange-100 text-orange-700",
                          item.status === "Out of Stock" && "bg-red-100 text-red-700",
                          item.status === "High" && "bg-green-100 text-green-700",
                          item.status === "Normal" && "bg-blue-100 text-blue-700"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.status === "Low" && "bg-orange-500",
                          item.status === "Out of Stock" && "bg-red-500",
                          item.status === "High" && "bg-green-500 w-full",
                          item.status === "Normal" && "bg-blue-500 w-1/2"
                        )}
                        style={{ width: item.status === "Low" ? '20%' : undefined }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={reorderingId === item.variantId}
                        onClick={async () => {
                          setReorderingId(item.variantId);
                          try {
                            const res = await reorderProduct(item.variantId);
                            toast.success(res.message);
                          } catch (e) {
                            toast.error("Failed to reorder");
                          } finally {
                            setReorderingId(null);
                          }
                        }}
                      >
                        {reorderingId === item.variantId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCw className="mr-2 h-4 w-4" />
                        )}
                        <span>Reorder</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedItem(item);
                        setIsAuditModalOpen(true);
                      }}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Audit Stock</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedItem(item);
                        setIsAlertModalOpen(true);
                      }}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        <span>Create Stock Alert</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedItem(item);
                        setIsHistoryDrawerOpen(true);
                      }}>
                        <History className="mr-2 h-4 w-4" />
                        <span>Stock History</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedItem && (
        <>
          <AuditStockModal
            isOpen={isAuditModalOpen}
            onClose={() => setIsAuditModalOpen(false)}
            product={selectedItem}
          />
          <StockAlertModal
            isOpen={isAlertModalOpen}
            onClose={() => setIsAlertModalOpen(false)}
            product={selectedItem}
          />
          <StockHistoryDrawer
            isOpen={isHistoryDrawerOpen}
            onClose={() => setIsHistoryDrawerOpen(false)}
            product={selectedItem}
          />
        </>
      )}
    </div>
  );
}
