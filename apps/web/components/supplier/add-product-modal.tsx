"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { toast } from "sonner";
import { addVariantsToSupplier } from "../../app/actions/supplier";
import { getInventoryProducts, getProduct } from "../../app/actions/inventory";
import { Loader2 } from "lucide-react";
import { ProductSelect } from "../product-select";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Badge } from "@repo/ui/components/ui/badge";

const variantSchema = z.object({
  variantId: z.string(),
  name: z.string(),
  sku: z.string(),
  retailPrice: z.number(),
  selected: z.boolean(),
  costPrice: z.string().min(1, "Cost price is required"),
  supplierSku: z.string().optional(),
});

const formSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  variants: z
    .array(variantSchema)
    .min(1, "At least one variant must be selected"),
});

interface AddProductModalProps {
  supplierId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductToCatalogModal({
  supplierId,
  isOpen,
  onOpenChange,
}: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      variants: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  useEffect(() => {
    if (isOpen) {
      setIsLoadingProducts(true);
      getInventoryProducts({ groupByProduct: true }).then(data => {
        setProducts(data);
        setIsLoadingProducts(false);
      });
    }
  }, [isOpen]);

  const onProductChange = async (productId: string) => {
    form.setValue("productId", productId);
    if (!productId) {
      replace([]);
      return;
    }

    setIsLoadingDetails(true);
    try {
      const productDetails = await getProduct(productId);
      if (productDetails?.variants) {
        const variantsData = productDetails.variants.map((v: any) => ({
          variantId: v.id,
          name: v.name,
          sku: v.sku,
          retailPrice: Number(v.retailPrice) || 0,
          selected: true,
          costPrice: v.buyingPrice?.toString() || "0",
          supplierSku: "",
        }));
        replace(variantsData);
      }
    } catch (error) {
      toast.error("Failed to fetch product details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedVariants = values.variants.filter(v => v.selected);
    if (selectedVariants.length === 0) {
      toast.error("Please select at least one variant");
      return;
    }

    setIsSubmitting(true);
    try {
      await addVariantsToSupplier({
        supplierId,
        productId: values.productId,
        variants: selectedVariants.map(v => ({
          variantId: v.variantId,
          costPrice: parseFloat(v.costPrice),
          supplierSku: v.supplierSku,
        })),
      });
      toast.success("Products added to catalog");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to add products to catalog");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            Add Product to Catalog
          </DialogTitle>
          <DialogDescription>
            Select a product and variants from your inventory to add to this
            supplier&apos;s catalog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Select Product
                    </FormLabel>
                    <FormControl>
                      <ProductSelect
                        products={products}
                        value={field.value}
                        onValueChange={onProductChange}
                        placeholder={
                          isLoadingProducts
                            ? "Loading products..."
                            : "Select a product"
                        }
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : fields.length > 0 ? (
                <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Product Variants
                    </h4>
                    <Badge variant="outline" className="rounded-md">
                      {fields.length} Variant{fields.length !== 1 ? "s" : ""}{" "}
                      Found
                    </Badge>
                  </div>

                  <ScrollArea className="flex-1 border rounded-xl bg-gray-50/30">
                    <div className="p-4 space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className={`p-4 rounded-xl border bg-white transition-all ${
                            form.watch(`variants.${index}.selected`)
                              ? "border-primary/20 shadow-sm"
                              : "opacity-60 border-transparent grayscale-[0.5]"
                          }`}>
                          <div className="flex items-start gap-4">
                            <FormField
                              control={form.control}
                              name={`variants.${index}.selected`}
                              render={({ field }) => (
                                <FormItem className="mt-1">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-sm">
                                    {field.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {field.sku}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                                    Retail Price
                                  </p>
                                  <p className="font-bold text-sm text-green-600">
                                    KES {field.retailPrice.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.costPrice`}
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                                        Buying Cost
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...inputField}
                                          type="number"
                                          step="0.01"
                                          disabled={
                                            !form.watch(
                                              `variants.${index}.selected`,
                                            )
                                          }
                                          className="h-9 text-sm rounded-lg"
                                          placeholder="0.00"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.supplierSku`}
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                                        Supplier SKU
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...inputField}
                                          disabled={
                                            !form.watch(
                                              `variants.${index}.selected`,
                                            )
                                          }
                                          className="h-9 text-sm rounded-lg"
                                          placeholder="Optional"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}
            </div>

            <DialogFooter className="p-6 pt-0 mt-auto bg-white border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-11 px-6">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || fields.length === 0}
                className="rounded-xl h-11 px-8 font-bold shadow-sm">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add to Catalog
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
