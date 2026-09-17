"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { createPurchase } from "@/app/actions/purchases";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ShoppingBag } from "lucide-react";

const poSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, "Product is required"),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        unitCost: z.coerce.number().min(0.01, "Cost must be greater than 0"),
      }),
    )
    .min(1, "At least one item is required"),
});

type POFormValues = z.infer<typeof poSchema>;

interface CreateSupplierPODialogProps {
  supplierId: string;
  supplierName: string;
  supplierProducts: any[];
  allProducts?: any[];
  children?: React.ReactNode;
}

export function CreateSupplierPODialog({
  supplierId,
  supplierName,
  supplierProducts = [],
  allProducts = [],
  children,
}: CreateSupplierPODialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Combine products supplied by this supplier or fallback to all products
  const availableVariants = (() => {
    if (supplierProducts.length > 0) {
      return supplierProducts.map((sp: any) => ({
        id: sp.variantId || sp.variant?.id,
        name: `${sp.product?.name || "Product"} ${
          sp.variant?.name && sp.variant?.name !== "Default"
            ? `(${sp.variant.name})`
            : ""
        }`,
        unitCost: Number(sp.costPrice || sp.variant?.unitPrice || 0),
      })).filter(v => Boolean(v.id));
    }
    return allProducts.map((p: any) => ({
      id: p.variantId || p.id,
      name: `${p.name} ${
        p.variantName && p.variantName !== "Default" ? `(${p.variantName})` : ""
      }`,
      unitCost: Number(p.costPrice || p.unitPrice || 0),
    })).filter(v => Boolean(v.id));
  })();

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema) as any,
    defaultValues: {
      supplierId: supplierId,
      items: [
        {
          variantId: availableVariants[0]?.id || "",
          quantity: 1,
          unitCost: availableVariants[0]?.unitCost || 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: POFormValues) {
    startTransition(async () => {
      try {
        await createPurchase({
          supplierId: values.supplierId,
          items: values.items,
        });
        toast.success(`Purchase order created for ${supplierName}`);
        setOpen(false);
        form.reset({
          supplierId,
          items: [
            {
              variantId: availableVariants[0]?.id || "",
              quantity: 1,
              unitCost: availableVariants[0]?.unitCost || 0,
            },
          ],
        });
      } catch (error: any) {
        toast.error(error.message || "Failed to create purchase order");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium border border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <ShoppingBag className="w-4 h-4" />
            New Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase Order — {supplierName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Order Items
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    variantId: availableVariants[0]?.id || "",
                    quantity: 1,
                    unitCost: availableVariants[0]?.unitCost || 0,
                  })
                }>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Item
              </Button>
            </div>

            {availableVariants.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                No product variants available. Please ensure products are configured in the supplier catalog or inventory.
              </div>
            ) : (
              fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-3 items-end border p-3 rounded-lg relative bg-card">
                  <div className="col-span-6">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Product Variant
                    </label>
                    <Select
                      value={form.watch(`items.${index}.variantId`)}
                      onValueChange={val => {
                        form.setValue(`items.${index}.variantId`, val, {
                          shouldValidate: true,
                        });
                        const variant = availableVariants.find(v => v.id === val);
                        if (variant) {
                          form.setValue(
                            `items.${index}.unitCost`,
                            variant.unitCost,
                            { shouldValidate: true },
                          );
                        }
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVariants.map(variant => (
                          <SelectItem key={variant.id} value={variant.id}>
                            {variant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.items?.[index]?.variantId && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.items[index]?.variantId?.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min={1}
                      {...form.register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {form.formState.errors.items?.[index]?.quantity && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Unit Cost
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0.01}
                      {...form.register(`items.${index}.unitCost`, {
                        valueAsNumber: true,
                      })}
                    />
                    {form.formState.errors.items?.[index]?.unitCost && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.items[index]?.unitCost?.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 h-9 w-9 p-0"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            {form.formState.errors.items?.root && (
              <p className="text-xs text-red-500">
                {form.formState.errors.items.root.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || availableVariants.length === 0}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Purchase Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
