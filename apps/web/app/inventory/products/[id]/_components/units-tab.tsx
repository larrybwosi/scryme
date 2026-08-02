"use client";

import React from "react";
import { PlusCircle, Trash2 } from "lucide-react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { toast } from "sonner";
import { updateVariantUnits } from "../../../../actions/inventory";

interface UnitsTabProps {
  product: any;
  setProduct: (v: any) => void;
  systemUnits: any[];
  organizationUnits: any[];
}

export function UnitsTab({
  product,
  setProduct,
  systemUnits,
  organizationUnits,
}: UnitsTabProps) {
  return (
    <div className="space-y-6 mt-0">
      {product.variants?.map((variant: any) => (
        <Card
          key={variant.id}
          className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader>
            <CardTitle>Units for Variant: {variant.name}</CardTitle>
            <CardDescription>
              Configure primary and selling units.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Base Unit (Primary Inventory Unit)</Label>
                <Select
                  value={
                    variant.baseUnitId || variant.baseOrgUnitId || ""
                  }
                  onValueChange={async val => {
                    const isOrg = organizationUnits.some(
                      (u: any) => u.id === val,
                    );
                    const updatedVariant = {
                      ...variant,
                      baseUnitId: isOrg ? null : val,
                      baseOrgUnitId: isOrg ? val : null,
                    };
                    await updateVariantUnits(
                      variant.id,
                      updatedVariant,
                    );
                    setProduct({
                      ...product,
                      variants: product.variants.map((v: any) =>
                        v.id === variant.id ? updatedVariant : v,
                      ),
                    });
                    toast.success("Units updated");
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>System Units</SelectLabel>
                      {systemUnits.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.symbol})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Organization Units</SelectLabel>
                      {organizationUnits.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.symbol})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label>Stocking Unit (Purchasing Unit)</Label>
                <Select
                  value={
                    variant.stockingUnitId ||
                    variant.stockingOrgUnitId ||
                    ""
                  }
                  onValueChange={async val => {
                    const isOrg = organizationUnits.some(
                      (u: any) => u.id === val,
                    );
                    const updatedVariant = {
                      ...variant,
                      stockingUnitId: isOrg ? null : val,
                      stockingOrgUnitId: isOrg ? val : null,
                    };
                    await updateVariantUnits(
                      variant.id,
                      updatedVariant,
                    );
                    setProduct({
                      ...product,
                      variants: product.variants.map((v: any) =>
                        v.id === variant.id ? updatedVariant : v,
                      ),
                    });
                    toast.success("Units updated");
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>System Units</SelectLabel>
                      {systemUnits.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.symbol})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Organization Units</SelectLabel>
                      {organizationUnits.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.symbol})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">
                  Selling Units
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    const newSellingUnits = [
                      ...(variant.sellingUnits || []),
                      {
                        systemUnitId: null,
                        orgUnitId: null,
                        retailPrice: Number(variant.retailPrice),
                        conversionMultiplier: 1,
                        isActive: true,
                      },
                    ];
                    await updateVariantUnits(variant.id, {
                      ...variant,
                      sellingUnits: newSellingUnits,
                    });
                    setProduct({
                      ...product,
                      variants: product.variants.map((v: any) =>
                        v.id === variant.id
                          ? { ...v, sellingUnits: newSellingUnits }
                          : v,
                      ),
                    });
                    toast.success("Selling unit added");
                  }}>
                  <PlusCircle className="w-4 h-4" /> Add Selling Unit
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Conversion Multiplier</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Wholesale Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variant.sellingUnits?.map((su: any, idx: number) => (
                    <TableRow key={su.id || idx}>
                      <TableCell>
                        <Select
                          value={su.systemUnitId || su.orgUnitId || ""}
                          onValueChange={async val => {
                            const isOrg = organizationUnits.some(
                              (u: any) => u.id === val,
                            );
                            const updated = [...variant.sellingUnits];
                            updated[idx] = {
                              ...su,
                              systemUnitId: isOrg ? null : val,
                              orgUnitId: isOrg ? val : null,
                            };
                            await updateVariantUnits(variant.id, {
                              ...variant,
                              sellingUnits: updated,
                            });
                            setProduct({
                              ...product,
                              variants: product.variants.map(
                                (v: any) =>
                                  v.id === variant.id
                                    ? { ...v, sellingUnits: updated }
                                    : v,
                              ),
                            });
                          }}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>System Units</SelectLabel>
                              {systemUnits.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.symbol}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>
                                Organization Units
                              </SelectLabel>
                              {organizationUnits.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.symbol}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-9"
                          value={su.conversionMultiplier}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updated = [...variant.sellingUnits];
                            updated[idx] = {
                              ...su,
                              conversionMultiplier: val,
                            };
                            setProduct({
                              ...product,
                              variants: product.variants.map(
                                (v: any) =>
                                  v.id === variant.id
                                    ? { ...v, sellingUnits: updated }
                                    : v,
                              ),
                            });
                          }}
                          onBlur={() => {
                            updateVariantUnits(variant.id, {
                              ...variant,
                              sellingUnits: variant.sellingUnits,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-9"
                          value={su.wholesalePrice || ""}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updated = [...variant.sellingUnits];
                            updated[idx] = {
                              ...su,
                              wholesalePrice: val,
                            };
                            setProduct({
                              ...product,
                              variants: product.variants.map(
                                (v: any) =>
                                  v.id === variant.id
                                    ? { ...v, sellingUnits: updated }
                                    : v,
                              ),
                            });
                          }}
                          onBlur={() => {
                            updateVariantUnits(variant.id, {
                              ...variant,
                              sellingUnits: variant.sellingUnits,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-9"
                          value={su.retailPrice}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updated = [...variant.sellingUnits];
                            updated[idx] = { ...su, retailPrice: val };
                            setProduct({
                              ...product,
                              variants: product.variants.map(
                                (v: any) =>
                                  v.id === variant.id
                                    ? { ...v, sellingUnits: updated }
                                    : v,
                              ),
                            });
                          }}
                          onBlur={() => {
                            updateVariantUnits(variant.id, {
                              ...variant,
                              sellingUnits: variant.sellingUnits,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            su.isActive ? "default" : "secondary"
                          }>
                          {su.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            const updated = variant.sellingUnits.filter(
                              (_: any, i: number) => i !== idx,
                            );
                            await updateVariantUnits(variant.id, {
                              ...variant,
                              sellingUnits: updated,
                            });
                            setProduct({
                              ...product,
                              variants: product.variants.map(
                                (v: any) =>
                                  v.id === variant.id
                                    ? { ...v, sellingUnits: updated }
                                    : v,
                              ),
                            });
                            toast.success("Selling unit removed");
                          }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
