"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { AuditStockModal } from "../inventory/audit-stock-modal";
// Assuming we might need a transfer modal or similar, but for now we'll use AuditStockModal for adjustments

interface StockLevel {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  sku: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  incomingStock: number;
}

interface StockLevelsTableProps {
  data: StockLevel[];
}

export function StockLevelsTable({ data }: StockLevelsTableProps) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-bold">Product</TableHead>
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
              <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                No stock data found for the selected branch.
              </TableCell>
            </TableRow>
          ) : (
            data.map(item => (
              <TableRow key={item.variantId} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-[#1D1D1F]">
                      {item.name}{" "}
                      {item.variantName !== "Default" &&
                        ` - ${item.variantName}`}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
                      {item.sku}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-sm">
                    {item.currentStock}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      item.availableStock > 0 ? "secondary" : "destructive"
                    }
                    className="px-2 py-0 h-5 text-[10px]">
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
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedItem({
                            ...item,
                            unitPrice: 0, // Placeholder as we don't need it for audit usually or it's not in the type
                          });
                          setIsAuditModalOpen(true);
                        }}>
                        <PackageSearch className="mr-2 h-4 w-4" />
                        <span>Adjust Stock</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          // Logic to initiate transfer
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
