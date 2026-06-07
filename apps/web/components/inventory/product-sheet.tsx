"use client";

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { createProduct, updateProduct, getProduct, checkProductUniqueness } from "../../app/actions/inventory";
import { toast } from "sonner";
import { Loader2, Plus, Package, Check, AlertCircle } from "lucide-react";
import { ImageUpload } from "../image-upload";
import { useDebounce } from "use-debounce";
import slugify from "slugify";
import { cn } from "@repo/ui/lib/utils";

interface ProductSheetProps {
  children?: React.ReactNode;
  productId?: string;
  categories: { id: string; name: string }[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductSheet({ children, productId, categories, isOpen: controlledOpen, onOpenChange }: ProductSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setIsOpen;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    slug: '',
    categoryId: '',
    buyingPrice: 0,
    retailPrice: 0,
    initialStock: 0,
    imageUrls: [] as string[],
  });

  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
  const [uniqueness, setUniqueness] = useState({ sku: true, slug: true });
  const [isManualSku, setIsManualSku] = useState(false);
  const [isManualSlug, setIsManualSlug] = useState(false);

  const [debouncedSku] = useDebounce(formData.sku, 500);
  const [debouncedSlug] = useDebounce(formData.slug, 500);

  // Generate SKU and Slug from Name
  useEffect(() => {
    if (!productId) {
      if (!isManualSku && formData.name) {
        const prefix = formData.name.substring(0, 3).toUpperCase();
        const random = Math.floor(10000 + Math.random() * 90000);
        setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
      }
      if (!isManualSlug && formData.name) {
        const slug = slugify(formData.name, { lower: true, strict: true });
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  }, [formData.name, isManualSku, isManualSlug, productId]);

  // Check uniqueness
  useEffect(() => {
    const check = async () => {
      if (!debouncedSku && !debouncedSlug) return;
      setIsCheckingUniqueness(true);
      try {
        const result = await checkProductUniqueness({
          sku: debouncedSku,
          slug: debouncedSlug,
          excludeId: productId
        });
        setUniqueness(result);
      } catch (error) {
        console.error("Uniqueness check failed", error);
      } finally {
        setIsCheckingUniqueness(false);
      }
    };
    check();
  }, [debouncedSku, debouncedSlug, productId]);

  useEffect(() => {
    if (productId && open) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const product = await getProduct(productId);
          if (product) {
            const variant = product.variants[0];
            setFormData({
              name: product.name,
              sku: product.sku,
              slug: product.slug || '',
              categoryId: product.categoryId,
              buyingPrice: variant?.buyingPrice ? Number(variant.buyingPrice) : 0,
              retailPrice: variant?.retailPrice ? Number(variant.retailPrice) : 0,
              initialStock: 0, // Not used for editing
              imageUrls: product.imageUrls,
            });
          }
        } catch (error) {
          toast.error("Failed to load product details");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    } else if (!productId) {
      setFormData({
        name: '',
        sku: '',
        slug: '',
        categoryId: '',
        buyingPrice: 0,
        retailPrice: 0,
        initialStock: 0,
        imageUrls: [],
      });
      setIsManualSku(false);
      setIsManualSlug(false);
    }
  }, [productId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uniqueness.sku) {
      toast.error("SKU must be unique");
      return;
    }
    if (!uniqueness.slug) {
      toast.error("Slug must be unique");
      return;
    }

    setIsSubmitting(true);

    try {
      if (productId) {
        await updateProduct(productId, {
          name: formData.name,
          sku: formData.sku,
          slug: formData.slug,
          categoryId: formData.categoryId,
          buyingPrice: formData.buyingPrice,
          retailPrice: formData.retailPrice,
          imageUrls: formData.imageUrls,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct(formData);
        toast.success("Product created successfully");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent className="sm:max-w-[550px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>{productId ? 'Edit Product' : 'Add New Product'}</SheetTitle>
              <SheetDescription>
                {productId ? 'Update your product information below.' : 'Fill in the details to add a new product to your inventory.'}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 py-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      placeholder="e.g., Artisan Sourdough Bread"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku" className="flex items-center gap-2">
                        SKU
                        {isCheckingUniqueness ? (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        ) : formData.sku ? (
                          uniqueness.sku ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )
                        ) : null}
                      </Label>
                      <Input
                        id="sku"
                        placeholder="e.g., BRD-001"
                        value={formData.sku}
                        onChange={(e) => {
                          setIsManualSku(true);
                          setFormData({ ...formData, sku: e.target.value });
                        }}
                        className={cn(!uniqueness.sku && formData.sku && "border-red-500 focus-visible:ring-red-500")}
                        required
                      />
                      {!uniqueness.sku && formData.sku && (
                        <p className="text-[10px] text-red-500 mt-1">SKU already exists</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug" className="flex items-center gap-2">
                        Slug
                        {isCheckingUniqueness ? (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        ) : formData.slug ? (
                          uniqueness.slug ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )
                        ) : null}
                      </Label>
                      <Input
                        id="slug"
                        placeholder="e.g., sourdough-bread"
                        value={formData.slug}
                        onChange={(e) => {
                          setIsManualSlug(true);
                          setFormData({ ...formData, slug: e.target.value });
                        }}
                        className={cn(!uniqueness.slug && formData.slug && "border-red-500 focus-visible:ring-red-500")}
                      />
                      {!uniqueness.slug && formData.slug && (
                        <p className="text-[10px] text-red-500 mt-1">Slug already exists</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        required
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Pricing & Stock</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buying-price">Buying Price ($)</Label>
                    <Input
                      id="buying-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.buyingPrice || ''}
                      onChange={(e) => setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retail-price">Retail Price ($)</Label>
                    <Input
                      id="retail-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.retailPrice || ''}
                      onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  {!productId && (
                    <div className="space-y-2">
                      <Label htmlFor="initial-stock">Initial Stock</Label>
                      <Input
                        id="initial-stock"
                        type="number"
                        placeholder="0"
                        value={formData.initialStock || ''}
                        onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Images</h3>
                <div className="space-y-2">
                  <ImageUpload
                    value={formData.imageUrls}
                    onChange={(urls) => setFormData({ ...formData, imageUrls: urls })}
                    maxImages={3}
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="pt-6 border-t mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {productId ? 'Update Product' : 'Create Product'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
