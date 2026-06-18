"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { createPricingRule } from "../../app/actions/pricing";
import { toast } from "sonner";
import { DiscountType } from "@repo/db/client";

interface PricingRuleDialogProps {
  priceListId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  categories: any[];
}

export function PricingRuleDialog({
  priceListId,
  isOpen,
  onOpenChange,
  products,
  categories,
}: PricingRuleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetType: "all" as "all" | "product" | "category",
    variantId: "" as string | null,
    categoryId: "" as string | null,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    priority: 0,
    stackable: false,
    validFrom: "",
    validTo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createPricingRule({
        priceListId,
        name: formData.name,
        description: formData.description,
        variantId: formData.targetType === "product" ? formData.variantId : null,
        categoryId: formData.targetType === "category" ? formData.categoryId : null,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        priority: formData.priority,
        stackable: formData.stackable,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
        validTo: formData.validTo ? new Date(formData.validTo) : null,
      });

      toast.success("Pricing rule created successfully");
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        targetType: "all",
        variantId: null,
        categoryId: null,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 0,
        priority: 0,
        stackable: false,
        validFrom: "",
        validTo: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Pricing Rule</SheetTitle>
          <SheetDescription>
            Add a conditional discount or price override to this price list.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input
              id="rule-name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Happy Hour Discount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-desc">Description</Label>
            <Textarea
              id="rule-desc"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when this rule applies"
            />
          </div>

          <div className="space-y-2">
            <Label>Apply To</Label>
            <Select
              value={formData.targetType}
              onValueChange={(v: any) => setFormData({ ...formData, targetType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Entire Price List</SelectItem>
                <SelectItem value="category">Specific Category</SelectItem>
                <SelectItem value="product">Specific Product</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.targetType === "category" && (
            <div className="space-y-2">
              <Label>Select Category</Label>
              <Select
                value={formData.categoryId || ""}
                onValueChange={v => setFormData({ ...formData, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.targetType === "product" && (
            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select
                value={formData.variantId || ""}
                onValueChange={v => setFormData({ ...formData, variantId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.flatMap(p => p.variants).map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.name === "Default" ? v.product.name : v.name} ({v.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={formData.discountType}
                onValueChange={(v: any) => setFormData({ ...formData, discountType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DiscountType.PERCENTAGE}>Percentage (%)</SelectItem>
                  <SelectItem value={DiscountType.FIXED_AMOUNT}>Fixed Amount ($)</SelectItem>
                  <SelectItem value={DiscountType.FIXED_PRICE}>Fixed Price Override ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={formData.discountValue}
                onChange={e => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule-priority">Priority</Label>
              <Input
                id="rule-priority"
                type="number"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="stackable"
                checked={formData.stackable}
                onCheckedChange={checked => setFormData({ ...formData, stackable: !!checked })}
              />
              <Label htmlFor="stackable" className="font-normal cursor-pointer">
                Stackable
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
