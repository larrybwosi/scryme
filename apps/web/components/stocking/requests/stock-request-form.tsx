"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Label } from "@repo/ui/components/ui/label";
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
import { Plus, Trash2, Save, ShoppingCart } from "lucide-react";
import { ProductVariantSelect } from "@/components/product-variant-select";
import { createStockRequest } from "@/app/actions/stock-management";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
}

interface SelectedItem {
  variantId: string;
  variantName: string;
  productName: string;
  sku: string;
  quantity: number;
}

export function StockRequestForm({
  locations,
  variants,
}: {
  locations: Location[];
  variants: any[];
}) {
  const [toLocationId, setToLocationId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [justification, setJustification] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [currentVariantId, setCurrentVariantId] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleAddItem = () => {
    if (!currentVariantId) return;

    const variant = variants.find(v => v.variantId === currentVariantId);
    if (!variant) return;

    const newItem: SelectedItem = {
      variantId: currentVariantId,
      variantName: variant.variantName,
      productName: variant.name,
      sku: variant.sku,
      quantity: currentQuantity,
    };

    setSelectedItems([...selectedItems, newItem]);
    setCurrentVariantId("");
    setCurrentQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!toLocationId || selectedItems.length === 0) {
      toast.error("Please select a location and add at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStockRequest({
        toLocationId,
        priority: priority as any,
        justification,
        items: selectedItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      toast.success("Stock request created successfully.");
      router.push("/stocking/requests");
    } catch (error) {
      toast.error("Failed to create stock request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Request Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Search Product
                </Label>
                <ProductVariantSelect
                  variants={variants.map(v => ({
                    id: v.variantId,
                    name: v.variantName,
                    productName: v.name,
                    sku: v.sku,
                  }))}
                  value={currentVariantId}
                  onValueChange={setCurrentVariantId}
                />
              </div>
              <div className="w-24">
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Qty
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={currentQuantity}
                  onChange={e => setCurrentQuantity(parseInt(e.target.value))}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddItem}
                variant="outline"
                className="gap-2 border-dashed">
                <Plus size={16} /> Add
              </Button>
            </div>

            <div className="mt-6 border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-center">Quantity</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-gray-400">
                        No items added yet.
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-gray-400">
                            {item.variantName} • {item.sku}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-600">
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Justification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Why is this stock needed? (e.g., Upcoming event, low inventory...)"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Request Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Target Location
              </Label>
              <Select value={toLocationId} onValueChange={setToLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <Button
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmit}
                disabled={isSubmitting}>
                <Save size={18} />
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
