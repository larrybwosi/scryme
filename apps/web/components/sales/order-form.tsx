'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Search,
  ShoppingCart,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Save
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { toast } from 'sonner';
import { createTransaction } from '../../app/actions/sales';
import { ProductVariantsSelect } from "@repo/ui/components/product-variant-select";

const itemSchema = z.object({
  variantId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be positive"),
  unitCost: z.number().min(0),
  taxAmount: z.number().default(0),
  discountAmount: z.number().default(0),
  productName: z.string().optional(),
  variantName: z.string().optional(),
});

const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  locationId: z.string().min(1, "Location is required"),
  type: z.enum(["SALES_ORDER", "QUOTE", "POS_SALE"]),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required")
});

type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderForm({ customers, locations }: { customers: any[], locations: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      type: 'SALES_ORDER',
      items: [{ variantId: '', quantity: 1, unitPrice: 0, unitCost: 0, taxAmount: 0, discountAmount: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items") || [];
  const subtotal = watchItems.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);
  const taxTotal = watchItems.reduce((acc: number, item: any) => acc + (item.taxAmount || 0), 0);
  const discountTotal = watchItems.reduce((acc: number, item: any) => acc + (item.discountAmount || 0), 0);
  const finalTotal = subtotal + taxTotal - discountTotal;

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      await createTransaction({
        ...data,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      });
      toast.success('Order created successfully');
      router.push('/sales/transactions');
    } catch (error) {
      toast.error('Failed to create order');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#34A853]" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-end border-b pb-4 last:border-0 last:pb-0">
                    <div className="col-span-5 space-y-2">
                      <Label className="text-xs uppercase font-bold text-zinc-500">Product Variant</Label>
                      <ProductVariantsSelect
                        variants={[]} // You'll need to fetch variants or pass them in
                        value={watch(`items.${index}.variantId`)}
                        onValueChange={(val: string, variant: any) => {
                          setValue(`items.${index}.variantId`, val);
                          if (variant) {
                            setValue(`items.${index}.unitPrice`, Number(variant.retailPrice));
                            setValue(`items.${index}.unitCost`, Number(variant.wholesalePrice || 0));
                            setValue(`items.${index}.productName`, variant.name);
                            setValue(`items.${index}.variantName`, variant.name);
                          }
                        }}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs uppercase font-bold text-zinc-500">Qty</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs uppercase font-bold text-zinc-500">Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2 text-right">
                      <Label className="text-xs uppercase font-bold text-zinc-500">Total</Label>
                      <div className="h-10 flex items-center justify-end font-bold text-zinc-900">
                        ${((watchItems[index]?.unitPrice || 0) * (watchItems[index]?.quantity || 0)).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center pb-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-red-500"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => append({ variantId: '', quantity: 1, unitPrice: 0, unitCost: 0, taxAmount: 0, discountAmount: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Another Item
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
               <textarea
                  {...register("notes")}
                  className="w-full min-h-[100px] p-3 rounded-md border border-zinc-200 text-sm focus:ring-[#34A853] focus:border-[#34A853] outline-none transition-all"
                  placeholder="Internal notes or customer instructions..."
               />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-3 h-3" /> Customer
                </Label>
                <Select onValueChange={(v) => setValue("customerId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Location
                </Label>
                <Select onValueChange={(v) => setValue("locationId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.locationId && <p className="text-xs text-red-500">{errors.locationId.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select defaultValue="SALES_ORDER" onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES_ORDER">Sales Order</SelectItem>
                    <SelectItem value="QUOTE">Quote</SelectItem>
                    <SelectItem value="POS_SALE">POS Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3" /> Expected Delivery
                </Label>
                <Input type="date" {...register("expectedDeliveryDate")} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 border-zinc-200">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-600">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Tax</span>
                <span>${taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500 border-b pb-2">
                <span>Discount</span>
                <span>-${discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-zinc-900">Total</span>
                <span className="text-xl font-bold text-[#34A853]">
                   ${finalTotal.toFixed(2)}
                </span>
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-[#1D1D1F] hover:bg-black"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
