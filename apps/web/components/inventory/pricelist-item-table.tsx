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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  MoreHorizontal,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { removePriceListItem, addPriceListItems } from "../../app/actions/pricing";
import { toast } from "sonner";
import { PricingMethod } from "@repo/db";
import { Badge } from "@repo/ui/components/ui/badge";

interface PriceListItemTableProps {
  priceListId: string;
  items: any[];
}

export function PriceListItemTable({ priceListId, items }: PriceListItemTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const handleDelete = async (id: string) => {
    try {
      await removePriceListItem(id);
      toast.success("Item removed from price list");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove item");
    }
  };

  const handleUpdatePrice = async (item: any, newPrice: number) => {
    try {
      await addPriceListItems(priceListId, [{
        variantId: item.variantId,
        sellingUnitId: item.sellingUnitId,
        method: item.method,
        percentageValue: item.percentageValue ? Number(item.percentageValue) : null,
        price: newPrice,
        minQuantity: item.minQuantity,
      }]);
      toast.success("Price updated");
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update price");
    }
  };

  const getMethodIcon = (method: PricingMethod) => {
    switch (method) {
      case PricingMethod.COST_MARKUP: return <TrendingUp size={14} className="text-orange-500" />;
      case PricingMethod.COST_MARGIN: return <TrendingDown size={14} className="text-blue-500" />;
      default: return <DollarSign size={14} className="text-green-500" />;
    }
  };

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead>Product / Variant</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Min Qty</TableHead>
            <TableHead>Calculation</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                No items in this price list. Add some to get started.
              </TableCell>
            </TableRow>
          ) : (
            items.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900">
                      {item.variant.product.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.variant.name !== "Default" ? item.variant.name : item.variant.sku}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-600">
                    {item.sellingUnit ? (item.sellingUnit.systemUnit?.name || item.sellingUnit.orgUnit?.name) : "Base Unit"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{item.minQuantity}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(item.method)}
                    <span className="text-xs font-medium">
                      {item.method === PricingMethod.FIXED
                        ? "Fixed"
                        : `${item.percentageValue}% ${item.method === PricingMethod.COST_MARKUP ? "Markup" : "Margin"}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === item.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        className="w-24 h-8 text-right"
                        value={editValue}
                        onChange={e => setEditValue(parseFloat(e.target.value))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdatePrice(item, editValue);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      className="font-bold text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditValue(Number(item.price));
                      }}>
                      {item.price.toString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingId(item.id);
                        setEditValue(Number(item.price));
                      }}>
                        Edit Price
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(item.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Remove</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
