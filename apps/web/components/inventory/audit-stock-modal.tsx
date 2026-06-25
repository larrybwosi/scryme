"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Package,
  X,
  Info,
  Clock,
  AlertTriangle,
  ShieldAlert,
  User,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  adjustStock,
  updateValue,
  getStockAdjustmentHistory,
  getInventoryLocations,
  getVariantStockByLocation,
  type InventoryProduct,
} from "../../app/actions/inventory";
import { type StockAdjustmentReason } from "@repo/db/client";
import { format } from "date-fns";

interface AuditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InventoryProduct;
}

export function AuditStockModal({
  isOpen,
  onClose,
  product,
}: AuditStockModalProps) {
  const [activeTab, setActiveTab] = useState("quantity");
  const [physicalCount, setPhysicalCount] = useState<string>(
    product.currentStock.toString(),
  );
  const [reason, setReason] = useState<StockAdjustmentReason>(
    "INVENTORY_COUNT" as StockAdjustmentReason,
  );
  const [notes, setNotes] = useState("");
  const [newValue, setNewValue] = useState<string>(
    product.unitPrice.toString(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [availableAtLocation, setAvailableAtLocation] = useState<number>(0);

  const discrepancy = (parseInt(physicalCount) || 0) - availableAtLocation;

  const updateLocationStock = useCallback(
    async (locId: string) => {
      const stock = await getVariantStockByLocation(product.variantId, locId);
      setAvailableAtLocation(stock);
      setPhysicalCount(stock.toString());
    },
    [product.variantId],
  );

  const loadLocations = useCallback(async () => {
    const data = await getInventoryLocations();
    setLocations(data);
    if (data.length > 0 && !selectedLocation) {
      setSelectedLocation(data[0].id);
    }
  }, [selectedLocation]);

  const loadHistory = useCallback(async () => {
    const data = await getStockAdjustmentHistory(product.variantId);
    setHistory(data);
  }, [product.variantId]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadLocations();
    }
  }, [isOpen, loadHistory, loadLocations]);

  useEffect(() => {
    if (selectedLocation) {
      updateLocationStock(selectedLocation);
    }
  }, [selectedLocation, updateLocationStock]);

  async function handleSave() {
    setIsSubmitting(true);
    try {
      if (activeTab === "quantity") {
        if (!selectedLocation) {
          alert("Please select a location");
          return;
        }
        await adjustStock({
          variantId: product.variantId,
          locationId: selectedLocation,
          quantity: discrepancy,
          reason,
          notes,
        });
      } else {
        await updateValue({
          variantId: product.variantId,
          retailPrice: parseFloat(newValue),
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const reasons: { label: string; value: StockAdjustmentReason; icon: any }[] =
    [
      {
        label: "Damage",
        value: "DAMAGED" as StockAdjustmentReason,
        icon: AlertTriangle,
      },
      {
        label: "Expire",
        value: "EXPIRED" as StockAdjustmentReason,
        icon: Clock,
      },
      {
        label: "Misplacement",
        value: "LOST" as StockAdjustmentReason,
        icon: Info,
      },
      {
        label: "Thief",
        value: "STOLEN" as StockAdjustmentReason,
        icon: ShieldAlert,
      },
      {
        label: "Stocktake Variance",
        value: "INVENTORY_COUNT" as StockAdjustmentReason,
        icon: Tag,
      },
      {
        label: "Custom",
        value: "OTHER" as StockAdjustmentReason,
        icon: Package,
      },
    ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-4xl max-w-5xl p-0 overflow-y-auto">
        <div className="flex h-full flex-col">
          {/* Main Content */}
          <div className="flex-1 p-6">
            <SheetHeader className="mb-6 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <SheetTitle className="text-xl">Audit Stock</SheetTitle>
                  <p className="text-sm text-gray-500">
                    Effortlessly import products and update your inventory.
                  </p>
                </div>
              </div>
            </SheetHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1">
                <TabsTrigger
                  value="quantity"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Quantity Adjustment
                </TabsTrigger>
                <TabsTrigger
                  value="value"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Value Adjustment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quantity" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-white text-sm"
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}>
                    <option value="" disabled>
                      Select Location
                    </option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">
                      Physical Count
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={physicalCount}
                        onChange={e => setPhysicalCount(e.target.value)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                        Unit
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Available</Label>
                    <div className="relative">
                      <Input
                        value={availableAtLocation}
                        readOnly
                        className="bg-gray-50 pr-12"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                        Unit
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Discrepancy</Label>
                    <div className="relative">
                      <Input
                        value={discrepancy}
                        readOnly
                        className="bg-gray-50 pr-12 font-medium text-orange-600"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                        Unit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Adjustment Reason
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {reasons.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setReason(r.value)}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg transition-all",
                          reason === r.value
                            ? "border-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-300",
                        )}>
                        <div className="flex items-center gap-2">
                          <r.icon className="w-4 h-4" />
                          <span className="text-sm">{r.label}</span>
                        </div>
                        {reason === r.value && (
                          <div className="w-2 h-2 rounded-full bg-black" />
                        )}
                        {reason !== r.value && (
                          <div className="w-2 h-2 rounded-full border border-gray-300" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Note</Label>
                  <Textarea
                    placeholder="Evaluate if the damage is repairable or if the item needs to be written off."
                    className="min-h-[100px] resize-none"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="value" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">
                    New Unit Price
                  </Label>
                  <div className="relative">
                    <Input
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-2.5 text-sm text-gray-400">
                      $
                    </span>
                  </div>
                </div>
                {/* Value adjustment logic would go here */}
              </TabsContent>
            </Tabs>

            <SheetFooter className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between w-full">
                <a href="#" className="text-xs text-blue-600 hover:underline">
                  Learn more about Audit Stock
                </a>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white min-w-[80px]"
                    onClick={handleSave}
                    disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </div>

          {/* Sidebar */}
          <div className="border-t bg-gray-50/50 p-6">
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-4">Product detail</h3>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-white border flex items-center justify-center p-1 relative overflow-hidden shrink-0">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">
                    {product.name}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <span className="text-orange-500">★</span>
                    <span>4.8 (886)</span>
                    <span className="mx-1">•</span>
                    <span>SKU: {product.sku}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-4">
                Stock adjustment history
              </h3>
              <div className="space-y-6 relative max-h-[300px] overflow-y-auto">
                {history.map((item, idx) => (
                  <div key={item.id} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-4 h-4 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    </div>
                    <div className="text-[11px] font-bold text-gray-800">
                      {format(new Date(item.adjustmentDate), "dd MMM yyyy")}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Adjust Stock{" "}
                      <span className="text-gray-900 font-medium">
                        &quot;{item.quantity.toString()} Unit&quot;
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                        {item.member?.user?.image ? (
                          <Image
                            src={item.member.user.image}
                            alt={item.member?.user?.name || "User"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600">
                        {item.member?.user?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-xs text-gray-500 pl-8">
                    No history available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
