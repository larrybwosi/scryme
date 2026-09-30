"use client";

import React, { useState } from "react";
import { Search, ShoppingCart, Plus, Trash2, Edit2, Check, X, TrendingDown, Sparkles } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { removeProductFromSupplier, updateSupplierProductPrice } from "../../app/actions/supplier";
import { AddProductToCatalogModal } from "./add-product-modal";
import { toast } from "sonner";
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

interface ProductCatalogProps {
  products: any[];
  supplierId: string;
}

export function ProductCatalog({ products, supplierId }: ProductCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCostPrice, setEditCostPrice] = useState<string>("");
  const [editSupplierSku, setEditSupplierSku] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredProducts = products.filter(
    item =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.variant?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.supplierSku || item.product.sku)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditCostPrice(String(item.costPrice));
    setEditSupplierSku(item.supplierSku || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditCostPrice("");
    setEditSupplierSku("");
  };

  const saveEditing = async (item: any) => {
    const cost = parseFloat(editCostPrice);
    if (isNaN(cost) || cost < 0) {
      toast.error("Please enter a valid cost price");
      return;
    }

    setIsSaving(true);
    try {
      await updateSupplierProductPrice({
        productSupplierId: item.id,
        supplierId,
        costPrice: cost,
        supplierSku: editSupplierSku.trim() || undefined,
      });
      toast.success("Supplier pricing updated");
      setEditingId(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update pricing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await removeProductFromSupplier(productToDelete.id, supplierId);
      toast.success("Product removed from catalog");
      setProductToDelete(null);
    } catch (error) {
      toast.error("Failed to remove product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search catalog..."
            className="pl-9 h-10 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-lg h-10 px-5 border-border text-foreground">
            Categories
          </Button>
          <Button
            className="gap-2 rounded-lg h-10 px-5"
            onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            Add to Catalog
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="font-semibold py-3 text-foreground">Product Name</TableHead>
              <TableHead className="font-semibold text-foreground">Category</TableHead>
              <TableHead className="font-semibold text-foreground">Supplier SKU</TableHead>
              <TableHead className="font-semibold text-foreground">Unit Cost</TableHead>
              <TableHead className="font-semibold text-foreground">Price Analysis</TableHead>
              <TableHead className="text-right font-semibold pr-6 text-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-muted rounded-full">
                      <ShoppingCart size={24} className="opacity-40" />
                    </div>
                    <p>No products found in catalog</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(item => {
                const isEditingThis = editingId === item.id;
                const currentCost = Number(item.costPrice);

                // Analyze supplier costs for this variant across all suppliers
                const allSupplierLinks = item.variant?.suppliers || [];
                const otherSupplierCosts = allSupplierLinks
                  .map((s: any) => Number(s.costPrice))
                  .filter((c: number) => !isNaN(c) && c > 0);

                const totalSuppliersCount = otherSupplierCosts.length;
                const minSupplierCost =
                  totalSuppliersCount > 0 ? Math.min(...otherSupplierCosts) : currentCost;

                const isCheapest =
                  totalSuppliersCount > 0 && currentCost <= minSupplierCost;

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/50 border-b border-border last:border-0 transition-colors">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="font-semibold text-foreground">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {item.variant?.name || "Standard Variant"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-semibold text-[10px] uppercase bg-primary/10 text-primary border-none">
                        {item.product.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isEditingThis ? (
                        <Input
                          value={editSupplierSku}
                          onChange={e => setEditSupplierSku(e.target.value)}
                          placeholder="SKU"
                          className="h-8 w-28 text-xs bg-background border-border text-foreground rounded-md font-mono"
                        />
                      ) : (
                        <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md inline-block">
                          {item.supplierSku || item.variant?.sku || item.product.sku}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">KES</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editCostPrice}
                            onChange={e => setEditCostPrice(e.target.value)}
                            className="h-8 w-28 text-xs bg-background border-border text-foreground rounded-md font-semibold"
                          />
                        </div>
                      ) : (
                        <span>KES {currentCost.toLocaleString()}</span>
                      )}
                    </TableCell>

                    {/* Price Analysis & Cheapest Supplier Indicator */}
                    <TableCell>
                      {isCheapest ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 w-max">
                            <Sparkles size={12} className="text-emerald-500" />
                            Cheapest Option
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Lowest among {totalSuppliersCount} supplier{totalSuppliersCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      ) : totalSuppliersCount > 1 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <TrendingDown size={12} />
                            Lowest: KES {minSupplierCost.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {totalSuppliersCount} suppliers offer this
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/70">Sole supplier</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        {isEditingThis ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md text-emerald-600 hover:bg-emerald-500/10"
                              disabled={isSaving}
                              onClick={() => saveEditing(item)}>
                              <Check size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:bg-muted"
                              disabled={isSaving}
                              onClick={cancelEditing}>
                              <X size={16} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit Supplier Pricing"
                              onClick={() => startEditing(item)}>
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Remove Product"
                              onClick={() => setProductToDelete(item)}>
                              <Trash2 size={15} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddProductToCatalogModal
        supplierId={supplierId}
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={open => !open && setProductToDelete(null)}>
        <AlertDialogContent className="rounded-xl border border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove from Catalog?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will remove <strong>{productToDelete?.product.name}</strong>{" "}
              from this supplier&apos;s catalog. This action does not delete the
              product itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg">
              {isDeleting ? "Removing..." : "Remove Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
