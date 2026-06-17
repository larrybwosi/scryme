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
import {
  MoreHorizontal,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DiscountType } from "@repo/db/client";
import { Badge } from "@repo/ui/components/ui/badge";

interface PricingRuleTableProps {
  priceListId: string;
  rules: any[];
}

export function PricingRuleTable({ priceListId, rules }: PricingRuleTableProps) {

  const getDiscountDisplay = (rule: any) => {
    if (rule.discountType === DiscountType.PERCENTAGE) return `${rule.discountValue}% Off`;
    if (rule.discountType === DiscountType.FIXED_AMOUNT) return `$${rule.discountValue} Off`;
    return `Fixed $${rule.discountValue}`;
  };

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead>Rule Name</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                No conditional rules defined for this price list.
              </TableCell>
            </TableRow>
          ) : (
            rules.map(rule => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900">{rule.name}</span>
                    <span className="text-xs text-gray-500">{rule.description || "No description"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {rule.variantId ? "Specific Product" : rule.categoryId ? "Specific Category" : "Entire Price List"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {getDiscountDisplay(rule)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{rule.priority}</span>
                </TableCell>
                <TableCell>
                  <Badge className={rule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Rule</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
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
