"use client";

import React from "react";
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
  Eye,
  Edit,
  Trash2,
  Building2,
  Star,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Supplier } from "../../types/supplier";
import { useRouter } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";
import Image from "next/image";

interface SupplierTableProps {
  data: Supplier[];
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
}

export function SupplierTable({ data, onEdit, onDelete }: SupplierTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">
              Supplier Name
            </TableHead>
            <TableHead className="font-semibold text-gray-700">Code</TableHead>
            <TableHead className="font-semibold text-gray-700">
              Products
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Total Purchases
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Risk Level
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground">
                No suppliers found.
              </TableCell>
            </TableRow>
          ) : (
            data.map(supplier => (
              <TableRow
                key={supplier.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  router.push(`/inventory/supplier/${supplier.id}`)
                }>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-sm border bg-gray-50 flex items-center justify-center text-gray-500 font-semibold relative overflow-hidden">
                      {supplier.logo ? (
                        <Image
                          src={supplier.logo}
                          alt={supplier.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Building2 size={18} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-[#1D1D1F]">
                        {supplier.name}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Star
                          size={10}
                          className="text-amber-500 fill-amber-500"
                        />
                        <span>
                          {supplier.avgRating} ({supplier.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="rounded-sm font-mono text-[11px] bg-muted/30">
                    {supplier.code}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {supplier._count?.products || 0}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {supplier._count?.purchases || 0}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-sm text-[10px] px-2 py-0 h-5 font-semibold uppercase tracking-wide",
                      supplier.riskLevel === "low" &&
                        "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      supplier.riskLevel === "medium" &&
                        "bg-amber-50 text-amber-700 border border-amber-200",
                      supplier.riskLevel === "high" &&
                        "bg-red-50 text-red-700 border border-red-200",
                    )}>
                    {supplier.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 rounded-md">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/inventory/supplier/${supplier.id}`)
                        }>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(supplier)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Supplier</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDelete?.(supplier)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
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
