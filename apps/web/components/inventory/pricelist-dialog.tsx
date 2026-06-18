"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
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
import { createPriceList, updatePriceList } from "../../app/actions/pricing";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
import { X } from "lucide-react";

interface PriceListDialogProps {
  priceList?: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableTags: string[];
}

export function PriceListDialog({
  priceList,
  isOpen,
  onOpenChange,
  availableTags,
}: PriceListDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: priceList?.name || "",
    description: priceList?.description || "",
    code: priceList?.code || "",
    currency: priceList?.currency || "USD",
    isGlobal: priceList?.isGlobal ?? false,
    priority: priceList?.priority || 0,
    validFrom: priceList?.validFrom ? new Date(priceList.validFrom).toISOString().split('T')[0] : "",
    validTo: priceList?.validTo ? new Date(priceList.validTo).toISOString().split('T')[0] : "",
    customerTags: priceList?.customerTags || [] as string[],
  });

  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        priority: parseInt(formData.priority.toString()),
        validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
        validTo: formData.validTo ? new Date(formData.validTo) : null,
      };

      if (priceList) {
        await updatePriceList(priceList.id, data);
        toast.success("Price list updated successfully");
      } else {
        await createPriceList(data);
        toast.success("Price list created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.customerTags.includes(trimmed)) {
      setFormData({
        ...formData,
        customerTags: [...formData.customerTags, trimmed],
      });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      customerTags: formData.customerTags.filter((t: string) => t !== tag),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {priceList ? "Edit Price List" : "Create Price List"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Summer Sale"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                placeholder="e.g. SUMMER_2024"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the purpose of this price list"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={v => setFormData({ ...formData, currency: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validTo">Valid To</Label>
              <Input
                id="validTo"
                type="date"
                value={formData.validTo}
                onChange={e => setFormData({ ...formData, validTo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGlobal"
              checked={formData.isGlobal}
              onCheckedChange={checked => setFormData({ ...formData, isGlobal: !!checked })}
            />
            <Label htmlFor="isGlobal" className="font-normal cursor-pointer">
              Set as Global (Base Price)
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Customer Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.customerTags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X size={12} className="cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addTag(tagInput)}>Add</Button>
            </div>
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-gray-500 mr-1">Suggested:</span>
                {availableTags.filter(t => !formData.customerTags.includes(t)).slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="text-xs text-blue-600 hover:underline">
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : priceList ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
