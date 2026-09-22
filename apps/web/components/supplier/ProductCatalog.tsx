"use client";

import React, { useState } from "react";
import { Search, ShoppingCart, Plus, Trash2 } from "lucide-react";
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
import { removeProductFromSupplier } from "../../app/actions/supplier";
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
              <TableHead className="text-right font-semibold pr-6 text-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
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
              filteredProducts.map(item => (
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
                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md inline-block">
                      {item.supplierSku || item.variant?.sku || item.product.sku}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    KES {Number(item.costPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-md gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-medium">
                        <ShoppingCart size={15} />
                        Order
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setProductToDelete(item)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
