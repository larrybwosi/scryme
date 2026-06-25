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
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold">Supplier Name</TableHead>
            <TableHead className="font-bold">Code</TableHead>
            <TableHead className="font-bold">Products</TableHead>
            <TableHead className="font-bold">Total Purchases</TableHead>
            <TableHead className="font-bold">Risk Level</TableHead>
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
                className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() =>
                  router.push(`/inventory/supplier/${supplier.id}`)
                }>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold relative overflow-hidden">
                      {supplier.logo ? (
                        <Image
                          src={supplier.logo}
                          alt={supplier.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Building2 size={20} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#1D1D1F]">
                        {supplier.name}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Star
                          size={10}
                          className="text-yellow-500 fill-yellow-500"
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
                    className="font-mono text-[11px] bg-muted/30">
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
                      "text-[10px] px-2 py-0 h-5 font-bold uppercase",
                      supplier.riskLevel === "low" &&
                        "bg-green-100 text-green-700",
                      supplier.riskLevel === "medium" &&
                        "bg-amber-100 text-amber-700",
                      supplier.riskLevel === "high" &&
                        "bg-red-100 text-red-700",
                    )}>
                    {supplier.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
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
