"use client";

import { useState, useTransition, useEffect } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  createPurchase,
  createPurchaseDraft,
  updatePurchaseDraft,
  submitPurchaseOrder,
} from "../../app/actions/purchases";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, FileText, Send, AlertCircle } from "lucide-react";

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  notes: z.string().optional(),
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

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

interface PurchaseDialogProps {
  suppliers: any[];
  products: any[];
  initialData?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function PurchaseDialog({
  suppliers,
  products,
  initialData,
  open: controlledOpen,
  onOpenChange,
  children,
}: PurchaseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!isControlled) setInternalOpen(value);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues: {
      supplierId: initialData?.supplierId || "",
      notes: initialData?.notes || "",
      items: initialData?.items?.length
        ? initialData.items.map((i: any) => ({
            variantId: i.variantId,
            quantity: i.quantity || i.orderedQuantity,
            unitCost: i.unitCost,
          }))
        : [{ variantId: "", quantity: 1, unitCost: 0 }],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        supplierId: initialData.supplierId || "",
        notes: initialData.notes || "",
        items: initialData.items?.length
          ? initialData.items.map((i: any) => ({
              variantId: i.variantId,
              quantity: i.quantity || i.orderedQuantity,
              unitCost: i.unitCost,
            }))
          : [{ variantId: "", quantity: 1, unitCost: 0 }],
      });
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function handleSaveDraft(values: PurchaseFormValues) {
    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updatePurchaseDraft({ id: initialData.id, ...values });
          toast.success("Draft purchase order updated");
        } else {
          await createPurchaseDraft(values);
          toast.success("Purchase order saved as draft");
        }
        setOpen(false);
        form.reset();
      } catch (error: any) {
        toast.error(error.message || "Failed to save draft");
      }
    });
  }

  async function handleSubmitOrder(values: PurchaseFormValues) {
    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updatePurchaseDraft({ id: initialData.id, ...values });
          await submitPurchaseOrder(initialData.id);
          toast.success("Purchase order submitted successfully");
        } else {
          await createPurchase(values);
          toast.success("Purchase order created and submitted successfully");
        }
        setOpen(false);
        form.reset();
      } catch (error: any) {
        toast.error(error.message || "Failed to submit purchase order");
      }
    });
  }

  const variants = products.map((p: any) => ({
    id: p.variantId,
    name: `${p.name} ${p.variantName !== "Default" ? `(${p.variantName})` : ""}`,
    unitCost: Number(p.unitPrice || 0),
  }));

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Purchase Order Draft" : "New Purchase Order"}
          </DialogTitle>
        </DialogHeader>

        {initialData?.rejectionComment && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Reviewer Rejection Note: </span>
              {initialData.rejectionComment}
            </div>
          </div>
        )}

        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Items</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ variantId: "", quantity: 1, unitCost: 0 })
                  }>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-3 items-end border p-3 rounded-lg relative">
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name={`items.${index}.variantId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Product
                          </FormLabel>
                          <Select
                            onValueChange={val => {
                              field.onChange(val);
                              const variant = variants.find(v => v.id === val);
                              if (variant) {
                                form.setValue(
                                  `items.${index}.unitCost`,
                                  variant.unitCost,
                                );
                              }
                            }}
                            value={field.value}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {variants.map(variant => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Qty
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Unit Cost
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 h-10"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes & Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific delivery instructions or notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-between gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={form.handleSubmit(handleSaveDraft)}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>
              <Button
                type="button"
                className="bg-[#34A853] hover:bg-[#2d9147]"
                disabled={isPending}
                onClick={form.handleSubmit(handleSubmitOrder)}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Purchase Order
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
