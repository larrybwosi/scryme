"use client";

import { useState } from "react";
import { ProductVariantSelect } from "../product-variant-select";
import { Button } from "@repo/ui/components/ui/button";
import { Save, Plus, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";

interface Product {
  variantId: string;
  name: string;
  sku: string;
  currentStock: number;
}

interface Location {
  id: string;
  name: string;
}

export function NewTransferForm({
  products,
  locations,
  onSave,
}: {
  products: Product[];
  locations: Location[];
  onSave: (formData: FormData) => Promise<void>;
}) {
  const [variantId, setVariantId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");

  const variants = products.map(p => ({
    id: p.variantId,
    name: "Default",
    productName: p.name,
    sku: p.sku,
  }));

  return (
    <form
      action={async formData => {
        formData.set("variantId", variantId);
        formData.set("fromLocationId", fromLocationId);
        formData.set("toLocationId", toLocationId);
        await onSave(formData);
      }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-7">
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Product
                </Label>
                <ProductVariantSelect
                  variants={variants}
                  value={variantId}
                  onValueChange={setVariantId}
                  placeholder="Select a product..."
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Quantity
                </Label>
                <Input
                  type="number"
                  name="quantity"
                  min="1"
                  className="bg-white"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-dashed">
                  <Plus size={14} /> Add
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                In a production app, added items would appear here.
                <br />
                <span className="text-xs font-medium">
                  For this demo, use the fields above.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              className="bg-white min-h-[100px]"
              placeholder="Reason for transfer, handling instructions, etc."
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Source Location
              </Label>
              <Select value={fromLocationId} onValueChange={setFromLocationId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Destination Location
              </Label>
              <Select value={toLocationId} onValueChange={setToLocationId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select destination..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full gap-2">
                <Save size={16} />
                Create Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
