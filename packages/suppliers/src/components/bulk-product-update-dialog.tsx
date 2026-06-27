"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
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
import { useBulkUpdateSupplierProducts } from "../lib/api/suppliers";
import { toast } from "sonner";

const bulkUpdateSchema = z.object({
  action: z.enum(["price_increase", "price_decrease", "status_change"]),
  value: z.coerce.number().optional(),
  status: z.string().optional(),
});

type BulkUpdateValues = z.infer<typeof bulkUpdateSchema>;

interface BulkProductUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  selectedProductIds: string[];
}

export const BulkProductUpdateDialog: React.FC<
  BulkProductUpdateDialogProps
> = ({ open, onOpenChange, supplierId, selectedProductIds }) => {
  const mutation = useBulkUpdateSupplierProducts(supplierId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<BulkUpdateValues>({
    resolver: zodResolver(bulkUpdateSchema as any),
    defaultValues: {
      action: "price_increase",
    },
  });

  const action = watch("action");

  const onSubmit = async (data: BulkUpdateValues) => {
    try {
      await mutation.mutateAsync({
        productIds: selectedProductIds,
        ...data,
      });
      toast.success("Products updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update products");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update Products</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedProductIds.length} selected products.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Action</Label>
            <Select
              value={action}
              onValueChange={(v) => setValue("action", v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_increase">
                  Increase Price (%)
                </SelectItem>
                <SelectItem value="price_decrease">
                  Decrease Price (%)
                </SelectItem>
                <SelectItem value="status_change">Change Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === "price_increase" || action === "price_decrease") && (
            <div className="space-y-2">
              <Label>Percentage Value (%)</Label>
              <Input
                type="number"
                step="0.1"
                {...register("value")}
                placeholder="e.g. 5.0"
              />
            </div>
          )}

          {action === "status_change" && (
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              Apply Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
