"use client";

import { useState } from "react";
import { ProductSelect } from "../product-select";
import { Button } from "@repo/ui/components/ui/button";
import { Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import { Input } from "@repo/ui/components/ui/input";

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface Location {
  id: string;
  name: string;
}

export function ReorderRuleForm({
  products,
  locations,
  onSave,
}: {
  products: Product[];
  locations: Location[];
  onSave: (formData: FormData) => Promise<void>;
}) {
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");

  return (
    <form
      action={async (formData) => {
        formData.set("productId", productId);
        formData.set("locationId", locationId);
        await onSave(formData);
        setProductId("");
        setLocationId("");
      }}
      className="space-y-4"
    >
      <div>
        <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
          Product
        </Label>
        <ProductSelect
          products={products}
          value={productId}
          onValueChange={setProductId}
        />
        <input type="hidden" name="productId" value={productId} />
      </div>
      <div>
        <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
          Location
        </Label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select location..." />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="locationId" value={locationId} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
            Min (Trigger)
          </Label>
          <Input
            type="number"
            name="minQuantity"
            required
            className="bg-white"
            placeholder="0"
          />
        </div>
        <div>
          <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
            Max (Target)
          </Label>
          <Input
            type="number"
            name="maxQuantity"
            required
            className="bg-white"
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
          Reorder Amount
        </Label>
        <Input
          type="number"
          name="reorderQuantity"
          required
          className="bg-white"
          placeholder="0"
        />
      </div>
      <Button type="submit" className="w-full gap-2">
        <Save size={16} /> Save Rule
      </Button>
    </form>
  );
}
