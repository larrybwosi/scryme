"use client";

import React, { useState } from "react";
import { Plus, MoreHorizontal, Truck, Loader2, ExternalLink, Pencil, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import Link from "next/link";
import { toast } from "sonner";
import {
  linkProductSupplier,
  updateProductSupplierLink,
  unlinkProductSupplier,
} from "../../../../actions/inventory";

interface SuppliersTabProps {
  product: any;
  setProduct: React.Dispatch<React.SetStateAction<any>>;
  suppliers: { id: string; name: string }[];
}

export function SuppliersTab({ product, setProduct, suppliers = [] }: SuppliersTabProps) {
  // Modal States
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingSupplierLink, setEditingSupplierLink] = useState<any | null>(null);
  const [unlinkingSupplierId, setUnlinkingSupplierId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link Form
  const [linkForm, setLinkForm] = useState({
    supplierId: "",
    variantId: product?.variants?.[0]?.id || "",
    supplierSku: "",
    costPrice: product?.variants?.[0]?.buyingPrice ? Number(product.variants[0].buyingPrice) : 0,
    leadTimeDays: 7,
    minimumOrderQuantity: 1,
    isPreferred: product?.suppliers?.length === 0,
  });

  // Edit Form
  const [editForm, setEditForm] = useState({
    supplierSku: "",
    costPrice: 0,
    leadTimeDays: 7,
    minimumOrderQuantity: 1,
    isPreferred: false,
  });

  const handleOpenLinkDialog = () => {
    setLinkForm({
      supplierId: suppliers[0]?.id || "",
      variantId: product?.variants?.[0]?.id || "",
      supplierSku: "",
      costPrice: product?.variants?.[0]?.buyingPrice ? Number(product.variants[0].buyingPrice) : 0,
      leadTimeDays: 7,
      minimumOrderQuantity: 1,
      isPreferred: !product?.suppliers || product.suppliers.length === 0,
    });
    setIsLinkDialogOpen(true);
  };

  const handleOpenEditDialog = (sLink: any) => {
    setEditingSupplierLink(sLink);
    setEditForm({
      supplierSku: sLink.supplierSku || "",
      costPrice: Number(sLink.costPrice || 0),
      leadTimeDays: Number(sLink.leadTimeDays || 7),
      minimumOrderQuantity: Number(sLink.minimumOrderQuantity || 1),
      isPreferred: Boolean(sLink.isPreferred),
    });
  };

  const handleLinkSupplier = async () => {
    if (!linkForm.supplierId) {
      return toast.error("Please select a supplier");
    }
    if (!linkForm.variantId) {
      return toast.error("Please select a product variant");
    }
    if (isNaN(linkForm.costPrice) || linkForm.costPrice < 0) {
      return toast.error("Please enter a valid cost price");
    }

    try {
      setIsSubmitting(true);
      const newSupplierLink = await linkProductSupplier({
        productId: product.id,
        variantId: linkForm.variantId,
        supplierId: linkForm.supplierId,
        supplierSku: linkForm.supplierSku.trim() || undefined,
        costPrice: Number(linkForm.costPrice),
        leadTimeDays: Number(linkForm.leadTimeDays),
        minimumOrderQuantity: Number(linkForm.minimumOrderQuantity),
        isPreferred: linkForm.isPreferred,
      });

      toast.success("Supplier linked successfully!");

      setProduct((prev: any) => {
        let updatedSuppliers = prev.suppliers || [];
        if (linkForm.isPreferred) {
          updatedSuppliers = updatedSuppliers.map((s: any) => ({
            ...s,
            isPreferred: false,
          }));
        }
        return {
          ...prev,
          suppliers: [...updatedSuppliers, newSupplierLink],
        };
      });

      setIsLinkDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to link supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSupplierLink = async () => {
    if (!editingSupplierLink) return;
    if (isNaN(editForm.costPrice) || editForm.costPrice < 0) {
      return toast.error("Please enter a valid cost price");
    }

    try {
      setIsSubmitting(true);
      const updatedLink = await updateProductSupplierLink(editingSupplierLink.id, {
        supplierSku: editForm.supplierSku.trim(),
        costPrice: Number(editForm.costPrice),
        leadTimeDays: Number(editForm.leadTimeDays),
        minimumOrderQuantity: Number(editForm.minimumOrderQuantity),
        isPreferred: editForm.isPreferred,
      });

      toast.success("Supplier link pricing & SKU updated!");

      setProduct((prev: any) => {
        const updatedSuppliers = (prev.suppliers || []).map((s: any) => {
          if (s.id === editingSupplierLink.id) {
            return { ...s, ...updatedLink };
          }
          if (editForm.isPreferred) {
            return { ...s, isPreferred: false };
          }
          return s;
        });
        return {
          ...prev,
          suppliers: updatedSuppliers,
        };
      });

      setEditingSupplierLink(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update supplier link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkSupplier = async () => {
    if (!unlinkingSupplierId) return;

    try {
      setIsSubmitting(true);
      await unlinkProductSupplier(unlinkingSupplierId);
      toast.success("Supplier unlinked successfully!");

      setProduct((prev: any) => ({
        ...prev,
        suppliers: (prev.suppliers || []).filter((s: any) => s.id !== unlinkingSupplierId),
      }));

      setUnlinkingSupplierId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to unlink supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assigned Suppliers</CardTitle>
            <CardDescription>
              Who you buy this product from, including cost pricing and lead times.
            </CardDescription>
          </div>
          <Button onClick={handleOpenLinkDialog} variant="outline" className="gap-2">
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
                <TableHead className="text-right">Min Order Qty</TableHead>
                <TableHead>Preferred</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.suppliers?.length > 0 ? (
                product.suppliers.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-bold text-foreground">
                      {s.supplier?.name || "Unknown Supplier"}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {s.supplierSku || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(s.costPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.leadTimeDays ? `${s.leadTimeDays} days` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.minimumOrderQuantity || "1"}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/supplier/${s.supplierId}`}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Supplier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(s)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Update Pricing & SKU
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setUnlinkingSupplierId(s.id)}
                            className="text-red-600 dark:text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Unlink Supplier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Truck className="w-8 h-8" />
                      <p className="text-sm font-medium">
                        No suppliers linked to this product.
                      </p>
                      <Button size="sm" variant="outline" onClick={handleOpenLinkDialog} className="mt-2 gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Link First Supplier
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Link Supplier Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Supplier to Product</DialogTitle>
            <DialogDescription>
              Assign a vendor supplier to this product, set cost price and lead times.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="link-supplier">Supplier</Label>
              <Select
                value={linkForm.supplierId}
                onValueChange={(val) => setLinkForm({ ...linkForm, supplierId: val })}>
                <SelectTrigger id="link-supplier">
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {product?.variants?.length > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="link-variant">Product Variant</Label>
                <Select
                  value={linkForm.variantId}
                  onValueChange={(val) => setLinkForm({ ...linkForm, variantId: val })}>
                  <SelectTrigger id="link-variant">
                    <SelectValue placeholder="Select variant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="link-sku">Supplier SKU</Label>
                <Input
                  id="link-sku"
                  placeholder="e.g. SUP-1002"
                  value={linkForm.supplierSku}
                  onChange={(e) => setLinkForm({ ...linkForm, supplierSku: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link-cost">Cost Price ($)</Label>
                <Input
                  id="link-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={linkForm.costPrice}
                  onChange={(e) => setLinkForm({ ...linkForm, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="link-lead">Lead Time (Days)</Label>
                <Input
                  id="link-lead"
                  type="number"
                  placeholder="7"
                  value={linkForm.leadTimeDays}
                  onChange={(e) => setLinkForm({ ...linkForm, leadTimeDays: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link-moq">Min Order Qty (MOQ)</Label>
                <Input
                  id="link-moq"
                  type="number"
                  placeholder="1"
                  value={linkForm.minimumOrderQuantity}
                  onChange={(e) => setLinkForm({ ...linkForm, minimumOrderQuantity: parseInt(e.target.value, 10) || 1 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="link-preferred"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={linkForm.isPreferred}
                onChange={(e) => setLinkForm({ ...linkForm, isPreferred: e.target.checked })}
              />
              <Label htmlFor="link-preferred" className="cursor-pointer text-sm font-medium">
                Set as Preferred Supplier
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleLinkSupplier} disabled={isSubmitting} className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Supplier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Link Dialog */}
      <Dialog open={Boolean(editingSupplierLink)} onOpenChange={(open) => !open && setEditingSupplierLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Supplier Pricing & Details</DialogTitle>
            <DialogDescription>
              Edit supplier SKU, cost price, and lead time for {editingSupplierLink?.supplier?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sku">Supplier SKU</Label>
                <Input
                  id="edit-sku"
                  placeholder="e.g. SUP-1002"
                  value={editForm.supplierSku}
                  onChange={(e) => setEditForm({ ...editForm, supplierSku: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-cost">Cost Price ($)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  value={editForm.costPrice}
                  onChange={(e) => setEditForm({ ...editForm, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-lead">Lead Time (Days)</Label>
                <Input
                  id="edit-lead"
                  type="number"
                  value={editForm.leadTimeDays}
                  onChange={(e) => setEditForm({ ...editForm, leadTimeDays: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-moq">Min Order Qty (MOQ)</Label>
                <Input
                  id="edit-moq"
                  type="number"
                  value={editForm.minimumOrderQuantity}
                  onChange={(e) => setEditForm({ ...editForm, minimumOrderQuantity: parseInt(e.target.value, 10) || 1 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="edit-preferred"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={editForm.isPreferred}
                onChange={(e) => setEditForm({ ...editForm, isPreferred: e.target.checked })}
              />
              <Label htmlFor="edit-preferred" className="cursor-pointer text-sm font-medium">
                Set as Preferred Supplier
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSupplierLink(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplierLink} disabled={isSubmitting} className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(unlinkingSupplierId)} onOpenChange={(open) => !open && setUnlinkingSupplierId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this supplier association from the product?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUnlinkSupplier();
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlinking...
                </>
              ) : (
                "Unlink"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
