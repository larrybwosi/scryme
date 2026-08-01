"use client";

import React from "react";
import { Plus, MoreHorizontal, Truck } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface SuppliersTabProps {
  product: any;
}

export function SuppliersTab({ product }: SuppliersTabProps) {
  return (
    <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assigned Suppliers</CardTitle>
          <CardDescription>
            Who you buy this product from.
          </CardDescription>
        </div>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Link Supplier
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Supplier SKU</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Lead Time</TableHead>
              <TableHead>Preferred</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.suppliers?.length > 0 ? (
              product.suppliers.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold text-foreground">
                    {s.supplier.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.supplierSku || "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(s.costPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.leadTimeDays || "7"} days
                  </TableCell>
                  <TableCell>
                    {s.isPreferred ? (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        YES
                      </Badge>
                    ) : (
                      <Badge variant="secondary">NO</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More options">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>More options</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          View Supplier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Update Pricing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                          Unlink Supplier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Truck className="w-8 h-8" />
                    <p className="text-sm font-medium">
                      No suppliers linked to this product.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
