"use client";

import React from "react";
import { PlusCircle, ChevronRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
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
import { toast } from "sonner";
import { updateReorderRule } from "../../../../actions/inventory";

interface InventoryTabProps {
  product: any;
  setProduct: (v: any) => void;
  locations: any[];
  suppliers: any[];
}

export function InventoryTab({
  product,
  setProduct,
  locations,
  suppliers,
}: InventoryTabProps) {
  return (
    <div className="space-y-6 mt-0">
      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Automated Reorder Rules</CardTitle>
            <CardDescription>
              Manage thresholds and auto-replenishment settings.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              const newRule = {
                productId: product.id,
                locationId: locations[0]?.id,
                minQuantity: 5,
                maxQuantity: 20,
                reorderQuantity: 15,
                isActive: true,
                autoGenerate: false,
              };
              const rule = await updateReorderRule(newRule);
              setProduct({
                ...product,
                reorderRules: [
                  ...(product.reorderRules || []),
                  { ...rule, location: locations[0] },
                ],
              });
              toast.success("Reorder rule added");
            }}>
            <PlusCircle className="w-4 h-4" /> Add Rule
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Threshold (Min/Max)</TableHead>
                <TableHead>Order Qty</TableHead>
                <TableHead>Preferred Supplier</TableHead>
                <TableHead>Auto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.reorderRules?.map((rule: any) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {rule.location?.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-16 h-8 text-xs"
                        value={Number(rule.minQuantity)}
                        onChange={async e => {
                          const val = Number(e.target.value);
                          await updateReorderRule({
                            ...rule,
                            minQuantity: val,
                          });
                          setProduct({
                            ...product,
                            reorderRules: product.reorderRules.map(
                              (r: any) =>
                                r.id === rule.id
                                  ? { ...r, minQuantity: val }
                                  : r,
                            ),
                          });
                        }}
                      />
                      <span className="text-muted-foreground">/</span>
                      <Input
                        type="number"
                        className="w-16 h-8 text-xs"
                        value={Number(rule.maxQuantity)}
                        onChange={async e => {
                          const val = Number(e.target.value);
                          await updateReorderRule({
                            ...rule,
                            maxQuantity: val,
                          });
                          setProduct({
                            ...product,
                            reorderRules: product.reorderRules.map(
                              (r: any) =>
                                r.id === rule.id
                                  ? { ...r, maxQuantity: val }
                                  : r,
                            ),
                          });
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-16 h-8 text-xs"
                      value={Number(rule.reorderQuantity)}
                      onChange={async e => {
                        const val = Number(e.target.value);
                        await updateReorderRule({
                          ...rule,
                          reorderQuantity: val,
                        });
                        setProduct({
                          ...product,
                          reorderRules: product.reorderRules.map(
                            (r: any) =>
                              r.id === rule.id
                                ? { ...r, reorderQuantity: val }
                                : r,
                          ),
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.preferredSupplierId || ""}
                      onValueChange={async val => {
                        await updateReorderRule({
                          ...rule,
                          preferredSupplierId: val || null,
                        });
                        setProduct({
                          ...product,
                          reorderRules: product.reorderRules.map(
                            (r: any) =>
                              r.id === rule.id
                                ? {
                                    ...r,
                                    preferredSupplierId: val || null,
                                  }
                                : r,
                          ),
                        });
                      }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {suppliers.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={rule.autoGenerate}
                      onChange={async e => {
                        const val = e.target.checked;
                        await updateReorderRule({
                          ...rule,
                          autoGenerate: val,
                        });
                        setProduct({
                          ...product,
                          reorderRules: product.reorderRules.map(
                            (r: any) =>
                              r.id === rule.id
                                ? { ...r, autoGenerate: val }
                                : r,
                          ),
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!product.reorderRules ||
                product.reorderRules.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground italic">
                    No reorder rules configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>Stock by Location</CardTitle>
          <CardDescription>
            Real-time inventory levels across your warehouses and
            stores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc: any) => {
                const variantStocks =
                  product.variants?.[0]?.variantStocks?.filter(
                    (s: any) => s.locationId === loc.id,
                  ) || [];
                return (
                  <TableRow key={loc.id}>
                    <TableCell className="font-bold">
                      {loc.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Default
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {variantStocks[0]?.availableStock
                        ? Number(variantStocks[0].availableStock)
                        : 0}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      0
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {variantStocks[0]?.currentStock
                        ? Number(variantStocks[0].currentStock)
                        : 0}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="View location details">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          View location details
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader>
          <CardTitle>Inventory Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">
                  Low Stock Threshold
                </Label>
                <p className="text-sm text-muted-foreground">
                  Global threshold for stock alerts.
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="threshold">Alert Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={product.lowStockThreshold || 0}
                onChange={e =>
                  setProduct({
                    ...product,
                    lowStockThreshold: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">
                  Product Rating & Visibility
                </Label>
                <p className="text-sm text-muted-foreground">
                  Manage featured status and ratings.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={product.isFeatured}
                  onChange={e =>
                    setProduct({
                      ...product,
                      isFeatured: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isNew"
                  checked={product.isNew}
                  onChange={e =>
                    setProduct({ ...product, isNew: e.target.checked })
                  }
                />
                <Label htmlFor="isNew">New Arrival</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
