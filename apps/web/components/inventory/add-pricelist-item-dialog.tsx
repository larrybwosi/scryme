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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { addPriceListItems } from "../../app/actions/pricing";
import { toast } from "sonner";
import { PricingMethod } from "@repo/db";
import { Search, Package } from "lucide-react";

interface AddItemDialogProps {
  priceListId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
}

export function AddPriceListItemDialog({
  priceListId,
  isOpen,
  onOpenChange,
  products,
}: AddItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  const [pricingConfig, setPricingConfig] = useState({
    method: PricingMethod.FIXED,
    percentageValue: 0,
    minQuantity: 1,
    basePrice: 0,
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVariant = (variantId: string) => {
    const next = new Set(selectedVariants);
    if (next.has(variantId)) next.delete(variantId);
    else next.add(variantId);
    setSelectedVariants(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVariants.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setLoading(true);
    try {
      const items = Array.from(selectedVariants).map(vId => {
        // Find variant to get its retail price if needed
        const variant = products.flatMap(p => p.variants).find(v => v.id === vId);
        return {
          variantId: vId,
          method: pricingConfig.method,
          percentageValue: pricingConfig.method !== PricingMethod.FIXED ? pricingConfig.percentageValue : null,
          price: pricingConfig.method === PricingMethod.FIXED
            ? pricingConfig.basePrice
            : calculatePrice(Number(variant?.buyingPrice || 0), pricingConfig.method, pricingConfig.percentageValue),
          minQuantity: pricingConfig.minQuantity,
        };
      });

      await addPriceListItems(priceListId, items);
      toast.success(`Added ${items.length} items to price list`);
      onOpenChange(false);
      setSelectedVariants(new Set());
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (cost: number, method: PricingMethod, value: number) => {
    if (method === PricingMethod.COST_MARKUP) return cost * (1 + value / 100);
    if (method === PricingMethod.COST_MARGIN) return cost / (1 - value / 100);
    return value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Items to Price List</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden py-4">
          <div className="flex-[1.5] flex flex-col gap-3 overflow-hidden border-r pr-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredProducts.map(product => (
                <div key={product.id} className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase px-2">{product.name}</div>
                  {product.variants.map((variant: any) => (
                    <div
                      key={variant.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer border ${selectedVariants.has(variant.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleVariant(variant.id)}>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selectedVariants.has(variant.id)} onCheckedChange={() => toggleVariant(variant.id)} />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{variant.name === "Default" ? product.name : variant.name}</span>
                          <span className="text-[10px] text-gray-500">{variant.sku} • Cost: ${variant.buyingPrice.toString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h3 className="font-semibold text-sm">Pricing Logic</h3>

            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={pricingConfig.method as any}
                onValueChange={(v: any) => setPricingConfig({ ...pricingConfig, method: v as PricingMethod })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PricingMethod.FIXED as string}>Fixed Price</SelectItem>
                  <SelectItem value={PricingMethod.COST_MARKUP as string}>Cost Markup (%)</SelectItem>
                  <SelectItem value={PricingMethod.COST_MARGIN as string}>Target Margin (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pricingConfig.method === PricingMethod.FIXED ? (
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={pricingConfig.basePrice}
                  onChange={e => setPricingConfig({ ...pricingConfig, basePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{pricingConfig.method === PricingMethod.COST_MARKUP ? "Markup %" : "Margin %"}</Label>
                <Input
                  type="number"
                  value={pricingConfig.percentageValue}
                  onChange={e => setPricingConfig({ ...pricingConfig, percentageValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Minimum Quantity</Label>
              <Input
                type="number"
                value={pricingConfig.minQuantity}
                onChange={e => setPricingConfig({ ...pricingConfig, minQuantity: parseInt(e.target.value) || 1 })}
              />
              <p className="text-[10px] text-gray-500">Use for tiered/volume pricing.</p>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500 mb-2">{selectedVariants.size} products selected</div>
              <Button className="w-full" onClick={handleSubmit} disabled={loading || selectedVariants.size === 0}>
                {loading ? "Adding..." : "Add to Price List"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
