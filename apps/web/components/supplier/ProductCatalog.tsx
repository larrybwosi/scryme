"use client";

import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Trash2, Loader2 } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
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

  const filteredProducts = products.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.variant?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.supplierSku || item.product.sku).toLowerCase().includes(searchTerm.toLowerCase())
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
      setIsDeleting(true);
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
            className="pl-9 h-11 rounded-xl bg-white border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 border-gray-200">
            Categories
          </Button>
          <Button className="gap-2 rounded-xl h-11 px-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            Add to Catalog
          </Button>
        </div>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="font-bold py-4">Product Name</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Supplier SKU</TableHead>
              <TableHead className="font-bold">Unit Cost</TableHead>
              <TableHead className="text-right font-bold pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-muted rounded-full">
                       <ShoppingCart size={24} className="opacity-20" />
                    </div>
                    <p>No products found in catalog</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/30 border-b last:border-0 transition-colors">
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-bold text-[#1D1D1F]">{item.product.name}</div>
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{item.variant?.name || "Standard Variant"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold text-[10px] uppercase bg-blue-50 text-blue-700 border-none">
                      {item.product.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-muted-foreground bg-muted/30 w-fit px-2 py-1 rounded">
                    {item.supplierSku || item.variant?.sku || item.product.sku}
                  </TableCell>
                  <TableCell className="font-bold text-[#1D1D1F]">
                    KES {Number(item.costPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg gap-2 text-primary hover:text-primary hover:bg-primary/5 font-bold">
                        <ShoppingCart size={16} />
                        Order
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setProductToDelete(item)}
                      >
                        <Trash2 size={16} />
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

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Catalog?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{productToDelete?.product.name}</strong> from this supplier's catalog. This action does not delete the product itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Removing..." : "Remove Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
