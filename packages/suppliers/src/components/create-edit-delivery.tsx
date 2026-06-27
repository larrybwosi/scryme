"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Calendar } from "@repo/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { cn } from "../lib/utils";
import {
  Truck,
  Package,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Building2,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { SupplierSelect } from "./supplier-select";
import { createPurchaseSchema, type CreatePurchaseInput } from "../lib";
import { format } from "date-fns";
import { useCreatePurchase } from "../lib";
import Image from "next/image";
import { ProductVariantsSelect } from "./product-variant-select";
import { toast } from "sonner";

interface DeliveryModalProps {
  delivery: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (delivery: any) => void;
}

export default function SheduleDeliveryModal({
  delivery,
  isOpen,
  onClose,
  onSave,
}: DeliveryModalProps) {
  const createPurchaseMutation = useCreatePurchase();
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentPreviews, setAttachmentPreviews] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);

  const form = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema as any),
    defaultValues: {
      supplierId: "",
      expectedDate: null,
      notes: "",
      items: [],
      attachments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");

  useEffect(() => {
    if (isOpen) {
      if (delivery) {
        // If editing existing delivery, populate form
        const expectedDate = delivery.expectedDate
          ? new Date(delivery.expectedDate)
          : null;

        form.reset({
          supplierId: delivery.supplierId || "",
          expectedDate: expectedDate ? expectedDate.toISOString() : null,
          notes: delivery.notes || "",
          items:
            // eslint-disable-next-line
            delivery.items?.map((item: any) => ({
              variantId: item.variantId || "",
              orderedQuantity: item.orderedQuantity || 1,
              orderedUnitId: item.orderedUnitId || "",
            })) || [],
          attachments: delivery.attachments || [],
        });

        // Handle existing attachments for editing
        if (delivery.attachments?.length > 0) {
          // For existing attachments, you might want to show them differently
          // since they're already uploaded. This depends on your API structure.
          console.log("Existing attachments:", delivery.attachments);
        }
      } else {
        // Reset form for new delivery
        form.reset({
          supplierId: "",
          expectedDate: null,
          notes: "",
          items: [],
          attachments: [],
        });
        setAttachmentPreviews([]);
      }
    }
  }, [delivery, isOpen, form]);

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload?file=true", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setAttachmentPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAttachmentPreview = (index: number) => {
    setAttachmentPreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].previewUrl);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const onSubmit = async (data: CreatePurchaseInput) => {
    try {
      setIsUploading(true);
      const uploadedAttachments = await Promise.all(
        attachmentPreviews.map(async (preview) => {
          const url = await handleFileUpload(preview.file);
          return {
            fileUrl: url,
            fileName: preview.file.name,
            mimeType: preview.file.type,
            sizeBytes: preview.file.size,
          };
        }),
      );

      const finalData = {
        ...data,
        attachments: [...(data.attachments || []), ...uploadedAttachments],
      };

      createPurchaseMutation.mutate(finalData, {
        onSuccess: (newPurchase) => {
          onSave(newPurchase);
          onClose();
          toast.success("Purchase order created successfully");
        },
        onError: (error) => {
          toast.error("Failed to create purchase order: " + error.message);
        },
      });
    } catch (error) {
      toast.error("Failed to upload attachments");
    } finally {
      setIsUploading(false);
    }
  };

  const addProductItem = () => {
    append({
      variantId: "",
      orderedQuantity: 1,
      orderedUnitId: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {delivery ? "Edit Purchase Order" : "Create New Purchase Order"}
          </DialogTitle>
          <DialogDescription>
            {delivery
              ? "Update the details for this purchase order."
              : "Fill in the details to create a new purchase order for a supplier."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 overflow-y-auto pr-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Supplier and Dates */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Supplier *
                      </FormLabel>
                      <FormControl>
                        <SupplierSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a supplier"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Expected Delivery Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(date ? date.toISOString() : null)
                            }
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions or comments for this purchase order..."
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Attachments
                  </Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload supporting documents. Files will be uploaded when
                      you submit the form.
                    </p>

                    {/* Attachment Previews */}
                    <div className="space-y-2">
                      {attachmentPreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            {preview.file.type.startsWith("image/") ? (
                              <Image
                                src={preview.previewUrl}
                                alt={preview.file.name}
                                width={40}
                                height={40}
                                className="h-8 w-8 object-cover rounded"
                              />
                            ) : (
                              <FileText className="h-8 w-8 text-gray-400" />
                            )}
                            <span className="text-sm truncate max-w-[200px]">
                              {preview.file.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachmentPreview(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total Value Summary - Updated to show quantity summary instead */}
                {items.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Items:</span>
                          <span>{items.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Quantity:</span>
                          <span>
                            {items.reduce(
                              (sum, item) => sum + (item.orderedQuantity || 0),
                              0,
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Product Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Purchase Items ({items.length})
                  </Label>
                  <Button type="button" onClick={addProductItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <ScrollArea className="max-h-[400px] border rounded-md p-4">
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const quantity =
                        form.watch(`items.${index}.orderedQuantity`) || 0;

                      return (
                        <div
                          key={field.id}
                          className="space-y-3 p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {/* Product Variant Selection */}
                            <FormField
                              control={form.control}
                              name={`items.${index}.variantId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    Product Variant *
                                  </FormLabel>
                                  <FormControl>
                                    <ProductVariantsSelect
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select product variant"
                                      productType="ALL"
                                      includeLocation={false}
                                      showLocationInfo={false}
                                      required
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              {/* Quantity */}
                              <FormField
                                control={form.control}
                                name={`items.${index}.orderedQuantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Quantity *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={field.value || ""}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseInt(e.target.value) || 1,
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Unit Selection */}
                              <FormField
                                control={form.control}
                                name={`items.${index}.orderedUnitId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Unit *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Unit (e.g. KG)"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Item Quantity Display */}
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              Quantity: {quantity}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {fields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No items added yet</p>
                        <p className="text-sm">
                          Click "Add Item" to start building your purchase order
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createPurchaseMutation.isPending ||
                  isUploading ||
                  items.length === 0
                }
              >
                {createPurchaseMutation.isPending || isUploading
                  ? "Saving..."
                  : delivery
                    ? "Update Purchase Order"
                    : "Create Purchase Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
