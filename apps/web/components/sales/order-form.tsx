"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Save,
  ChevronRight,
  Package,
  FileText,
  ReceiptText,
  StickyNote,
  AlertCircle,
  Download,
  CheckCircle2,
  X,
} from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { ProductVariantSelect } from "../product-variant-select";
import { createOrderAction } from "@/app/actions/sales";

// ── Schema ─────────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  variantId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Qty must be ≥ 1"),
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
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

// ── Helpers ─────────────────────────────────────────────────────────────────────

const ORDER_TYPE_META = {
  SALES_ORDER: {
    label: "Sales Order",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  QUOTE: {
    label: "Quote",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  POS_SALE: {
    label: "POS Sale",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
} as const;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

// ── Sub-components ──────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 shrink-0">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 leading-none">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-zinc-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center",
        muted && "text-zinc-500",
      )}
    >
      <span
        className={cn(
          "text-sm",
          highlight ? "font-semibold text-zinc-900" : "",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm tabular-nums",
          highlight ? "text-lg font-bold text-emerald-600" : "",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function OrderForm({
  customers,
  locations,
  variants,
}: {
  customers: any[];
  locations: any[];
  variants: any[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      type: "SALES_ORDER",
      items: [
        {
          variantId: "",
          quantity: 1,
          unitPrice: 0,
          unitCost: 0,
          taxAmount: 0,
          discountAmount: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchItems = watch("items") || [];
  const watchType = watch("type") as keyof typeof ORDER_TYPE_META;

  const subtotal = watchItems.reduce(
    (acc: number, item: any) => acc + (item.unitPrice * item.quantity || 0),
    0,
  );
  const taxTotal = watchItems.reduce(
    (acc: number, item: any) => acc + (item.taxAmount || 0),
    0,
  );
  const discountTotal = watchItems.reduce(
    (acc: number, item: any) => acc + (item.discountAmount || 0),
    0,
  );
  const finalTotal = subtotal + taxTotal - discountTotal;

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createOrderAction(data);
      if (result.success) {
        setCreatedOrder(result.data);
        setShowSuccessModal(true);
        toast.success("Order created successfully");
      } else {
        toast.error(result.message || "Failed to create order");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!createdOrder) return;
    const url = `/api/sales/documents/${createdOrder.id}?type=invoice`;
    window.open(url, "_blank");
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-50/60">
        {/* ── Page Header ── */}
        <div className="bg-white border-b border-zinc-200">
          <div className="w-full px-6 lg:px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <span>Sales</span>
                <ChevronRight className="w-3 h-3" />
                <span>Transactions</span>
                <ChevronRight className="w-3 h-3" />
              </div>
              <h1 className="text-lg font-semibold text-zinc-900">New Order</h1>
              {watchType && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    ORDER_TYPE_META[watchType]?.color,
                  )}
                >
                  {ORDER_TYPE_META[watchType]?.label}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-zinc-600"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                form="order-form"
                type="submit"
                size="sm"
                className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2"
                disabled={isSubmitting}
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <form
          id="order-form"
          onSubmit={handleSubmit(onSubmit)}
          className="w-full px-6 lg:px-10 py-8"
        >
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="space-y-6">
              {/* Order Details Card */}
              <Card className="shadow-none border-zinc-200">
                <CardHeader className="pb-0">
                  <SectionHeader
                    icon={FileText}
                    title="Order Details"
                    description="Set the customer, location and order classification"
                  />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Customer */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Customer
                      </Label>
                      <Controller
                        name="customerId"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldError
                        message={errors.customerId?.message as string}
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Location
                      </Label>
                      <Controller
                        name="locationId"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((l) => (
                                <SelectItem key={l.id} value={l.id}>
                                  {l.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldError
                        message={errors.locationId?.message as string}
                      />
                    </div>

                    {/* Order Type */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
                        <ReceiptText className="w-3 h-3" /> Order Type
                      </Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SALES_ORDER">
                                Sales Order
                              </SelectItem>
                              <SelectItem value="QUOTE">Quote</SelectItem>
                              <SelectItem value="POS_SALE">POS Sale</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Expected Delivery */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
                        <CalendarIcon className="w-3 h-3" /> Expected Delivery
                      </Label>
                      <Input
                        type="date"
                        {...register("expectedDeliveryDate")}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items Card */}
              <Card className="shadow-none border-zinc-200">
                <CardHeader className="pb-0">
                  <SectionHeader
                    icon={ShoppingCart}
                    title="Order Items"
                    description="Add products, quantities and pricing"
                  />
                </CardHeader>
                <CardContent>
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 pb-2 mb-1">
                    {[
                      "Product Variant",
                      "Qty",
                      "Unit Price",
                      "Tax",
                      "Discount",
                      "Total",
                      "",
                    ].map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide text-zinc-400",
                          i === 0
                            ? "col-span-4"
                            : i === 5
                              ? "col-span-2 text-right"
                              : i === 6
                                ? "col-span-1"
                                : "col-span-1",
                        )}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  <Separator className="mb-4" />

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const lineTotal =
                        (watchItems[index]?.unitPrice || 0) *
                          (watchItems[index]?.quantity || 0) +
                        (watchItems[index]?.taxAmount || 0) -
                        (watchItems[index]?.discountAmount || 0);

                      return (
                        <div
                          key={field.id}
                          className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors group"
                        >
                          {/* Product */}
                          <div className="col-span-12 sm:col-span-4">
                            <Controller
                              name={`items.${index}.variantId`}
                              control={control}
                              render={({ field: variantField }) => (
                                <ProductVariantSelect
                                  variants={variants}
                                  value={variantField.value}
                                  onValueChange={(val) => {
                                    variantField.onChange(val);
                                    const variant = variants.find(v => v.id === val);
                                    if (variant) {
                                      setValue(`items.${index}.unitPrice`, variant.retailPrice);
                                      setValue(`items.${index}.unitCost`, variant.buyingPrice);
                                    }
                                  }}
                                  placeholder="Search product…"
                                />
                              )}
                            />
                            <FieldError
                              message={
                                (errors.items as any)?.[index]?.variantId
                                  ?.message
                              }
                            />
                          </div>

                          {/* Qty */}
                          <div className="col-span-4 sm:col-span-1">
                            <Input
                              type="number"
                              min={1}
                              className="bg-white text-sm text-center"
                              {...register(`items.${index}.quantity`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="col-span-4 sm:col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="bg-white text-sm"
                              {...register(`items.${index}.unitPrice`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>

                          {/* Tax */}
                          <div className="col-span-4 sm:col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="bg-white text-sm"
                              {...register(`items.${index}.taxAmount`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>

                          {/* Discount */}
                          <div className="col-span-4 sm:col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="bg-white text-sm"
                              {...register(`items.${index}.discountAmount`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>

                          {/* Line Total */}
                          <div className="col-span-6 sm:col-span-2 text-right">
                            <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                              {fmt(lineTotal)}
                            </span>
                          </div>

                          {/* Delete */}
                          <div className="col-span-2 sm:col-span-1 flex justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                  onClick={() => remove(index)}
                                  disabled={fields.length === 1}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove item</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-700 hover:border-zinc-400"
                    onClick={() =>
                      append({
                        variantId: "",
                        quantity: 1,
                        unitPrice: 0,
                        unitCost: 0,
                        taxAmount: 0,
                        discountAmount: 0,
                      })
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Add Line Item
                  </Button>
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card className="shadow-none border-zinc-200">
                <CardHeader className="pb-0">
                  <SectionHeader
                    icon={StickyNote}
                    title="Internal Notes"
                    description="Optional notes visible only to your team"
                  />
                </CardHeader>
                <CardContent>
                  <Textarea
                    {...register("notes")}
                    rows={4}
                    placeholder="Add instructions, references, or delivery notes…"
                    className="bg-white resize-none text-sm"
                  />
                </CardContent>
              </Card>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-4">
              {/* Order Summary */}
              <Card className="shadow-none border-zinc-200 sticky top-6">
                <CardHeader className="pb-0">
                  <SectionHeader icon={Package} title="Order Summary" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item count */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-xs text-zinc-500 font-medium">
                      {fields.length} line item{fields.length !== 1 ? "s" : ""}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {watchType ? ORDER_TYPE_META[watchType]?.label : "—"}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Pricing breakdown */}
                  <div className="space-y-2.5">
                    <SummaryRow label="Subtotal" value={fmt(subtotal)} />
                    <SummaryRow label="Tax" value={fmt(taxTotal)} muted />
                    <SummaryRow
                      label="Discount"
                      value={`− ${fmt(discountTotal)}`}
                      muted
                    />
                  </div>

                  <Separator />

                  <SummaryRow label="Total" value={fmt(finalTotal)} highlight />

                  <Button
                    form="order-form"
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white mt-2 gap-2 h-11"
                    disabled={isSubmitting}
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Creating Order…" : "Create Order"}
                  </Button>

                  <p className="text-[11px] text-center text-zinc-400">
                    This order will be saved and can be edited later.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-3 pt-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">Order Created!</DialogTitle>
              <DialogDescription className="text-zinc-500">
                Order <span className="font-semibold text-zinc-900">{createdOrder?.number}</span> has been successfully generated.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount Due</span>
                <span className="font-bold text-zinc-900">{fmt(createdOrder?.finalTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Customer</span>
                <span className="font-medium text-zinc-900">{createdOrder?.customer?.name || "Walk-in Customer"}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/sales/transactions");
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={handleDownloadInvoice}
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
