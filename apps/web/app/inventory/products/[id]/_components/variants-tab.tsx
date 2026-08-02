"use client";

import React from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

interface VariantsTabProps {
  product: any;
  setProduct: (v: any) => void;
  selectedVariants: string[];
  setSelectedVariants: (v: string[]) => void;
  setIsVariantDialogOpen: (v: boolean) => void;
  setEditingVariant: (v: any) => void;
  setVariantForm: (v: any) => void;
  setVariantsToDelete: (v: string[] | null) => void;
  handleBulkStatusUpdate: (isActive: boolean) => void;
}

export function VariantsTab({
  product,
  selectedVariants,
  setSelectedVariants,
  setIsVariantDialogOpen,
  setEditingVariant,
  setVariantForm,
  setVariantsToDelete,
  handleBulkStatusUpdate,
}: VariantsTabProps) {
  return (
    <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Manage different sizes, colors, or materials.
          </CardDescription>
        </div>
        <Button
          className="gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={() => {
            setEditingVariant(null);
            setVariantForm({
              name: "",
              sku: `${product.sku}-${(product.variants?.length || 0) + 1}`,
              buyingPrice: Number(
                product.variants?.[0]?.buyingPrice || 0,
              ),
              retailPrice: Number(
                product.variants?.[0]?.retailPrice || 0,
              ),
              initialStock: 0,
              isActive: true,
              attributes: {},
              pointsOnPurchase: 0,
              loyaltyPointsOverride: 0,
              requiresExpiryTracking: true,
              expiryWarningDays: 2,
              defaultShelfLifeDays: 0,
              requiresSerialNumber: false,
              wholesalePrice: 0,
              promotionalPrice: 0,
              isPopular: false,
              isNew: false,
            });
            setIsVariantDialogOpen(true);
          }}>
          <Plus className="w-4 h-4" /> Add Variant
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Variant Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants?.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedVariants.includes(v.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedVariants([
                            ...selectedVariants,
                            v.id,
                          ]);
                        } else {
                          setSelectedVariants(
                            selectedVariants.filter(
                              id => id !== v.id,
                            ),
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {v.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.sku}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.barcode || "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${Number(v.retailPrice || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-bold">
                      {v.variantStocks?.reduce(
                        (acc: number, s: any) =>
                          acc + Number(s.currentStock),
                        0,
                      ) || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {v.isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[10px] uppercase font-bold">
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-bold">
                        Inactive
                      </Badge>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingVariant(v);
                            setVariantForm({
                              name: v.name,
                              sku: v.sku,
                              barcode: v.barcode || "",
                              buyingPrice: Number(v.buyingPrice),
                              retailPrice: Number(v.retailPrice),
                              initialStock: 0,
                              isActive: v.isActive,
                              attributes: v.attributes || {},
                              pointsOnPurchase:
                                v.pointsOnPurchase || 0,
                              loyaltyPointsOverride:
                                v.loyaltyPointsOverride || 0,
                              requiresExpiryTracking:
                                v.requiresExpiryTracking ?? true,
                              expiryWarningDays:
                                v.expiryWarningDays || 2,
                              defaultShelfLifeDays:
                                v.defaultShelfLifeDays || 0,
                              requiresSerialNumber:
                                v.requiresSerialNumber ?? false,
                              wholesalePrice: Number(
                                v.wholesalePrice || 0,
                              ),
                              promotionalPrice: Number(
                                v.promotionalPrice || 0,
                              ),
                              isPopular: v.isPopular ?? false,
                              isNew: v.isNew ?? false,
                            });
                            setIsVariantDialogOpen(true);
                          }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ImageIcon className="w-4 h-4 mr-2" />{" "}
                          Manage Media
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400"
                          disabled={product.variants?.length <= 1}
                          onClick={() => setVariantsToDelete([v.id])}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Bulk Actions ({selectedVariants.length}):
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedVariants.length === 0}
            onClick={() => handleBulkStatusUpdate(true)}>
            Mark Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400"
            disabled={
              selectedVariants.length === 0 ||
              selectedVariants.length >=
                (product.variants?.length || 0)
            }
            onClick={() => setVariantsToDelete(selectedVariants)}>
            Delete Selected
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
