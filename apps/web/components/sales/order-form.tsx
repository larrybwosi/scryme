"use client";

import { useState } from "react";
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
  Building2,
  Truck,
  Paperclip,
  Loader2,
  Upload,
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
import { createOrderAction, uploadFileAction } from "@/app/actions/sales";

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
  businessAccountId: z.string().optional(),
  locationId: z.string().min(1, "Location is required"),
  type: z.enum(["SALES_ORDER", "QUOTE", "POS_SALE"]),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  shippingFee: z.number().nonnegative().default(0),
  deliveryPartnerId: z.string().optional(),
  shippingAddressId: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

// ── Helpers ─────────────────────────────────────────────────────────────────────

const ORDER_TYPE_META = {
  SALES_ORDER: {
    label: "Sales Order",
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  QUOTE: {
    label: "Quote",
    color:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  POS_SALE: {
    label: "POS Sale",
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
} as const;

const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

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
      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 shrink-0 dark:bg-emerald-950 dark:border-emerald-800">
        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground leading-none">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1">
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
        muted && "text-muted-foreground",
      )}>
      <span
        className={cn(
          "text-sm",
          highlight ? "font-semibold text-foreground" : "",
        )}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm tabular-nums",
          highlight
            ? "text-lg font-bold text-emerald-600 dark:text-emerald-400"
            : "",
        )}>
        {value}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function OrderForm({
  customers,
  businessAccounts = [],
  deliveryPartners = [],
  locations,
  variants,
  currency = "USD",
}: {
  customers: any[];
  businessAccounts?: any[];
  deliveryPartners?: any[];
  locations: any[];
  variants: any[];
  currency?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
  const watchAttachments = watch("attachments") || [];

  const watchShippingFee = watch("shippingFee") || 0;

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
  const finalTotal = subtotal + taxTotal - discountTotal + watchShippingFee;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadFileAction(formData);
      const currentAttachments = watch("attachments") || [];
      setValue("attachments", [...currentAttachments, result]);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    const currentAttachments = watch("attachments") || [];
    setValue(
      "attachments",
      currentAttachments.filter((_: any, i: number) => i !== index),
    );
  };

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createOrderAction(data);
      if (result.success) {
        setCreatedOrder(result.data);
        setShowSuccessModal(true);
        toast.success("Order created successfully");
      } else {
        toast.error(
          (result as any).error ||
            (result as any).message ||
            "Failed to create order",
        );
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
      <div className="min-h-screen bg-muted/50 dark:bg-background">
        {/* ── Page Header ── */}
        <div className="bg-card border-b border-border dark:border-zinc-800">
          <div className="w-full px-6 lg:px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Sales</span>
                <ChevronRight className="w-3 h-3" />
                <span>Transactions</span>
                <ChevronRight className="w-3 h-3" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">
                New Order
              </h1>
              {watchType && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    ORDER_TYPE_META[watchType]?.color,
                  )}>
                  {ORDER_TYPE_META[watchType]?.label}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                form="order-form"
                type="submit"
                size="sm"
                className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 gap-2"
                disabled={isSubmitting}>
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
          className="w-full px-6 lg:px-10 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="space-y-6">
              {/* Order Details Card */}
              <Card className="shadow-none border-border dark:border-zinc-800">
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
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Customer
                      </Label>
                      <Controller
                        name="customerId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(c => (
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
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Location
                      </Label>
                      <Controller
                        name="locationId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map(l => (
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
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <ReceiptText className="w-3 h-3" /> Order Type
                      </Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}>
                            <SelectTrigger className="bg-background">
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
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="w-3 h-3" /> Expected Delivery
                      </Label>
                      <Input
                        type="date"
                        {...register("expectedDeliveryDate")}
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <Separator className="my-6 dark:bg-zinc-800" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Business Account */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" /> Business Account
                        (Enterprise)
                      </Label>
                      <Controller
                        name="businessAccountId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select business account" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessAccounts.map(b => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Delivery Partner */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <Truck className="w-3 h-3" /> Delivery Partner
                      </Label>
                      <Controller
                        name="deliveryPartnerId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select partner" />
                            </SelectTrigger>
                            <SelectContent>
                              {deliveryPartners.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Shipping Address
                      </Label>
                      <Controller
                        name="shippingAddressId"
                        control={control}
                        render={({ field }) => {
                          const selectedCustomerId = watch("customerId");
                          const selectedBusinessId = watch("businessAccountId");
                          const customer = customers.find(
                            c => c.id === selectedCustomerId,
                          );
                          const business = businessAccounts.find(
                            b => b.id === selectedBusinessId,
                          );
                          const addresses = [
                            ...(customer?.addresses || []),
                            ...(business?.addresses || []),
                          ];

                          return (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={
                                !selectedCustomerId && !selectedBusinessId
                              }>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select shipping address" />
                              </SelectTrigger>
                              <SelectContent>
                                {addresses.map(a => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.street1}, {a.city} (
                                    {a.label || "Address"})
                                  </SelectItem>
                                ))}
                                {addresses.length === 0 && (
                                  <SelectItem value="none" disabled>
                                    No addresses found
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items Card */}
              <Card className="shadow-none border-border dark:border-zinc-800">
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
                          "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                          i === 0
                            ? "col-span-4"
                            : i === 5
                              ? "col-span-2 text-right"
                              : i === 6
                                ? "col-span-1"
                                : "col-span-1",
                        )}>
                        {h}
                      </div>
                    ))}
                  </div>
                  <Separator className="mb-4 dark:bg-zinc-800" />

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
                          className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-muted border border-border hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group">
                          {/* Product */}
                          <div className="col-span-12 sm:col-span-4">
                            <Controller
                              name={`items.${index}.variantId`}
                              control={control}
                              render={({ field: variantField }) => (
                                <ProductVariantSelect
                                  variants={variants}
                                  value={variantField.value}
                                  onValueChange={val => {
                                    variantField.onChange(val);
                                    const variant = variants.find(
                                      v => v.id === val,
                                    );
                                    if (variant) {
                                      setValue(
                                        `items.${index}.unitPrice`,
                                        variant.retailPrice,
                                      );
                                      setValue(
                                        `items.${index}.unitCost`,
                                        variant.buyingPrice,
                                      );
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
                              className="bg-background text-sm text-center"
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
                              className="bg-background text-sm"
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
                              className="bg-background text-sm"
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
                              className="bg-background text-sm"
                              {...register(`items.${index}.discountAmount`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>

                          {/* Line Total */}
                          <div className="col-span-6 sm:col-span-2 text-right">
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                              {fmt(lineTotal, currency)}
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
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                                  onClick={() => remove(index)}
                                  disabled={fields.length === 1}>
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
                    className="w-full mt-4 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-zinc-400 dark:hover:border-zinc-500"
                    onClick={() =>
                      append({
                        variantId: "",
                        quantity: 1,
                        unitPrice: 0,
                        unitCost: 0,
                        taxAmount: 0,
                        discountAmount: 0,
                      })
                    }>
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Add Line Item
                  </Button>
                </CardContent>
              </Card>

              {/* Notes & Terms Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-none border-border dark:border-zinc-800">
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
                      className="bg-background resize-none text-sm"
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-none border-border dark:border-zinc-800">
                  <CardHeader className="pb-0">
                    <SectionHeader
                      icon={FileText}
                      title="Billing Terms & Conditions"
                      description="Terms visible to the customer (Enterprise)"
                    />
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      {...register("termsAndConditions")}
                      rows={4}
                      placeholder="Enter billing terms, payment deadlines, or legal conditions…"
                      className="bg-background resize-none text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Attachments Card */}
              <Card className="shadow-none border-border dark:border-zinc-800">
                <CardHeader className="pb-0">
                  <SectionHeader
                    icon={Paperclip}
                    title="Order Attachments"
                    description="Upload relevant documents, images, or POs (Enterprise)"
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full border-dashed"
                        disabled={isUploading}
                        onClick={() =>
                          document.getElementById("order-file-upload")?.click()
                        }>
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {isUploading ? "Uploading..." : "Upload Attachment"}
                      </Button>
                      <input
                        id="order-file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    {watchAttachments.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {watchAttachments.map((file: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-card border border-border rounded-lg shadow-sm dark:border-zinc-700">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-xs truncate font-medium text-foreground">
                                {file.fileName}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
                              onClick={() => removeAttachment(idx)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-4">
              {/* Order Summary */}
              <Card className="shadow-none border-border dark:border-zinc-800 sticky top-6">
                <CardHeader className="pb-0">
                  <SectionHeader icon={Package} title="Order Summary" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item count */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border dark:border-zinc-700">
                    <span className="text-xs text-muted-foreground font-medium">
                      {fields.length} line item{fields.length !== 1 ? "s" : ""}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {watchType ? ORDER_TYPE_META[watchType]?.label : "—"}
                    </Badge>
                  </div>

                  <Separator className="dark:bg-zinc-800" />

                  {/* Pricing breakdown */}
                  <div className="space-y-2.5">
                    <SummaryRow
                      label="Subtotal"
                      value={fmt(subtotal, currency)}
                    />
                    <SummaryRow
                      label="Tax"
                      value={fmt(taxTotal, currency)}
                      muted
                    />
                    <SummaryRow
                      label="Discount"
                      value={`− ${fmt(discountTotal, currency)}`}
                      muted
                    />
                    <div className="pt-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">
                        Transport / Shipping Fee
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="pl-7 h-9 text-sm font-semibold bg-background border-border dark:border-zinc-700"
                          {...register("shippingFee", { valueAsNumber: true })}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="dark:bg-zinc-800" />

                  <SummaryRow
                    label="Total"
                    value={fmt(finalTotal, currency)}
                    highlight
                  />

                  <Button
                    form="order-form"
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 mt-2 gap-2 h-11"
                    disabled={isSubmitting}>
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Creating Order…" : "Create Order"}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground">
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
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">
                Order Created!
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Order{" "}
                <span className="font-semibold text-foreground">
                  {createdOrder?.number}
                </span>{" "}
                has been successfully generated.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-4">
            <div className="rounded-lg border border-border bg-muted p-4 space-y-3 dark:border-zinc-700">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Due</span>
                <span className="font-bold text-foreground">
                  {fmt(createdOrder?.finalTotal || 0, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium text-foreground">
                  {createdOrder?.customer?.name || "Walk-in Customer"}
                </span>
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
              }}>
              Close
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800 gap-2"
              onClick={handleDownloadInvoice}>
              <Download className="w-4 h-4" />
              Download Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
