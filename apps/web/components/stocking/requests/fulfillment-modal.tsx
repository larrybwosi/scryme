"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { Truck, ShoppingCart, Package, Info, History, TrendingUp, TrendingDown, DollarSign, Loader2, Building2 } from "lucide-react";
import {
  fulfillStockRequestItems,
  getStockRequestLocations,
  getVariantSupplierPrices,
} from "@/app/actions/stock-management";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";

interface AggregatedItem {
  variantId: string;
  sku: string;
  name: string;
  variantName: string;
  totalRemaining: number;
  requests: {
    requestId: string;
    requestNumber: string;
    locationName: string;
    remaining: number;
  }[];
}

interface FulfillmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AggregatedItem;
}

export function FulfillmentModal({
  isOpen,
  onClose,
  item,
}: FulfillmentModalProps) {
  const [activeTab, setActiveTab] = useState<"TRANSFER" | "PURCHASE">(
    "TRANSFER",
  );
  const [fromLocationId, setFromLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [supplierPrices, setSupplierPrices] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Track how much to fulfill for each request
  const [fulfillmentQuantities, setFulfillmentQuantities] = useState<
    Record<string, number>
  >(Object.fromEntries(item.requests.map(r => [r.requestId, r.remaining])));

  useEffect(() => {
    getStockRequestLocations().then(setLocations);

    setLoadingPrices(true);
    getVariantSupplierPrices(item.variantId)
      .then(setSupplierPrices)
      .finally(() => setLoadingPrices(false));
  }, [item.variantId]);

  const handleFulfill = async () => {
    if (activeTab === "TRANSFER" && !fromLocationId) {
      toast.error("Please select a source branch.");
      return;
    }
    if (activeTab === "PURCHASE" && !supplierId) {
      toast.error("Please select a supplier.");
      return;
    }

    const itemsToFulfill = Object.entries(fulfillmentQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([requestId, quantity]) => ({ requestId, quantity }));

    if (itemsToFulfill.length === 0) {
      toast.error("Please specify quantities to fulfill.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fulfillStockRequestItems({
        variantId: item.variantId,
        fulfillmentType: activeTab,
        fromLocationId: activeTab === "TRANSFER" ? fromLocationId : undefined,
        supplierId: activeTab === "PURCHASE" ? supplierId : undefined,
        items: itemsToFulfill,
        notes,
      });
      toast.success("Fulfillment created successfully.");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to fulfill items.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="text-blue-600" size={20} />
            Fulfill {item.name}{" "}
            {item.variantName !== "Default" && `(${item.variantName})`}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="TRANSFER"
          onValueChange={v => setActiveTab(v as any)}
          className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="TRANSFER" className="gap-2">
              <Truck size={16} /> Fulfill from Branch
            </TabsTrigger>
            <TabsTrigger value="PURCHASE" className="gap-2">
              <ShoppingCart size={16} /> Add to Procurement
            </TabsTrigger>
          </TabsList>

          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Quantities to Fulfill
              </Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Branch Request</th>
                      <th className="px-4 py-2 text-center">Remaining</th>
                      <th className="px-4 py-2 text-right">Fulfill Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.requests.map(req => (
                      <tr
                        key={req.requestId}
                        className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <div className="font-medium">{req.locationName}</div>
                          <div className="text-xs text-gray-400">
                            {req.requestNumber}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center text-amber-600 font-bold">
                          {req.remaining}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min="0"
                            max={req.remaining}
                            value={fulfillmentQuantities[req.requestId]}
                            onChange={e =>
                              setFulfillmentQuantities({
                                ...fulfillmentQuantities,
                                [req.requestId]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-24 ml-auto h-8"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="px-4 py-2">Total Fulfillment</td>
                      <td
                        colSpan={2}
                        className="px-4 py-2 text-right text-blue-600">
                        {Object.values(fulfillmentQuantities).reduce(
                          (a, b) => a + b,
                          0,
                        )}{" "}
                        units
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <TabsContent value="TRANSFER" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Source Branch</Label>
                <Select
                  value={fromLocationId}
                  onValueChange={setFromLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location to supply from..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 italic">
                  This will create a Stock Transfer for approval.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="PURCHASE" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Supplier Price Comparison
                  </Label>
                  <Badge variant="outline" className="text-[10px] font-normal border-green-200 text-green-700 bg-green-50">
                    Live Rates
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {loadingPrices ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    </div>
                  ) : supplierPrices.length === 0 ? (
                    <div className="text-center py-4 border-2 border-dashed rounded-lg text-zinc-400 text-sm">
                      No suppliers registered for this product.
                    </div>
                  ) : (
                    supplierPrices.map((sp, idx) => {
                      const isCheapest = idx === 0;
                      return (
                        <div
                          key={sp.supplierId}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                            supplierId === sp.supplierId
                              ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                              : "hover:border-zinc-300 hover:bg-zinc-50 border-zinc-100"
                          }`}
                          onClick={() => setSupplierId(sp.supplierId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCheapest ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-500"}`}>
                              {isCheapest ? <DollarSign size={16} /> : <Building2 size={16} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-700">{sp.supplierName}</span>
                                {sp.isPreferred && <Badge className="text-[9px] bg-blue-100 text-blue-600 hover:bg-blue-100 border-none px-1 h-3.5">PREFER</Badge>}
                                {isCheapest && <Badge className="text-[9px] bg-green-100 text-green-600 hover:bg-green-100 border-none px-1 h-3.5">BEST PRICE</Badge>}
                              </div>
                              <p className="text-[10px] text-zinc-400">
                                Lead time: {sp.leadTimeDays || "?"} days • Min order: {sp.minimumOrderQuantity || "none"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-zinc-900">KES {sp.currentCost.toLocaleString()}</div>
                            {sp.history.length > 1 && (
                              <div className="flex items-center gap-1 text-[10px] justify-end">
                                {sp.history[0].price < sp.history[1].price ? (
                                  <TrendingDown size={10} className="text-green-500" />
                                ) : (
                                  <TrendingUp size={10} className="text-red-500" />
                                )}
                                <span className={sp.history[0].price < sp.history[1].price ? "text-green-600" : "text-red-600"}>
                                  {Math.abs(((sp.history[0].price - sp.history[1].price) / sp.history[1].price) * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 italic bg-zinc-50 p-2 rounded border border-zinc-100">
                  <Info size={12} className="inline mr-1 mb-0.5" />
                  Prices are fetched from the Product Supplier database. Creating this order will trigger a new Purchase Order workflow.
                </p>
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes for this fulfillment..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleFulfill}
            disabled={isSubmitting}>
            {isSubmitting
              ? "Processing..."
              : activeTab === "TRANSFER"
                ? "Create Transfer"
                : "Create Purchase Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
