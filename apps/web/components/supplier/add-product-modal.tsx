"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { toast } from "sonner";
import { addProductToSupplier } from "../../app/actions/supplier";
import { getInventoryProducts } from "../../app/actions/inventory";
import { Loader2, Search } from "lucide-react";

const formSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  costPrice: z.string().min(1, "Cost price is required"),
  supplierSku: z.string().optional(),
});

interface AddProductModalProps {
  supplierId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductToCatalogModal({ supplierId, isOpen, onOpenChange }: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      costPrice: "",
      supplierSku: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsLoadingProducts(true);
      getInventoryProducts({}).then((data) => {
        setProducts(data);
        setIsLoadingProducts(false);
      });
    }
  }, [isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const selectedProduct = products.find(p => p.id === values.productId);
      await addProductToSupplier({
        supplierId,
        productId: values.productId,
        variantId: selectedProduct?.variantId,
        costPrice: parseFloat(values.costPrice),
        supplierSku: values.supplierSku,
      });
      toast.success("Product added to catalog");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to add product to catalog");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Product to Catalog</DialogTitle>
          <DialogDescription>
            Select a product from your inventory to add to this supplier's catalog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Product</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buying Cost (KES)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-6">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Catalog
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
