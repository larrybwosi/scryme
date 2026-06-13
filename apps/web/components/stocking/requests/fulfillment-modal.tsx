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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Truck, ShoppingCart, Package } from "lucide-react";
import { fulfillStockRequestItems, getStockRequestLocations } from "../../app/actions/stock-management";
import { useToast } from "@repo/ui/components/ui/use-toast";

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

export function FulfillmentModal({ isOpen, onClose, item }: FulfillmentModalProps) {
  const [activeTab, setActiveTab] = useState<'TRANSFER' | 'PURCHASE'>('TRANSFER');
  const [fromLocationId, setFromLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);

  // Track how much to fulfill for each request
  const [fulfillmentQuantities, setFulfillmentQuantities] = useState<Record<string, number>>(
    Object.fromEntries(item.requests.map(r => [r.requestId, r.remaining]))
  );

  const { toast } = useToast();

  useEffect(() => {
    getStockRequestLocations().then(setLocations);
  }, []);

  const handleFulfill = async () => {
    if (activeTab === 'TRANSFER' && !fromLocationId) {
      toast({ title: "Error", description: "Please select a source branch.", variant: "destructive" });
      return;
    }
    if (activeTab === 'PURCHASE' && !supplierId) {
      toast({ title: "Error", description: "Please select a supplier.", variant: "destructive" });
      return;
    }

    const itemsToFulfill = Object.entries(fulfillmentQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([requestId, quantity]) => ({ requestId, quantity }));

    if (itemsToFulfill.length === 0) {
      toast({ title: "Error", description: "Please specify quantities to fulfill.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await fulfillStockRequestItems({
        variantId: item.variantId,
        fulfillmentType: activeTab,
        fromLocationId: activeTab === 'TRANSFER' ? fromLocationId : undefined,
        supplierId: activeTab === 'PURCHASE' ? supplierId : undefined,
        items: itemsToFulfill,
        notes
      });
      toast({ title: "Success", description: "Fulfillment created successfully." });
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fulfill items.", variant: "destructive" });
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
            Fulfill {item.name} {item.variantName !== "Default" && `(${item.variantName})`}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="TRANSFER" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
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
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantities to Fulfill</Label>
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
                    {item.requests.map((req) => (
                      <tr key={req.requestId} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <div className="font-medium">{req.locationName}</div>
                          <div className="text-xs text-gray-400">{req.requestNumber}</div>
                        </td>
                        <td className="px-4 py-2 text-center text-amber-600 font-bold">{req.remaining}</td>
                        <td className="px-4 py-2 text-right">
                          <Input
                            type="number"
                            min="0"
                            max={req.remaining}
                            value={fulfillmentQuantities[req.requestId]}
                            onChange={(e) => setFulfillmentQuantities({
                              ...fulfillmentQuantities,
                              [req.requestId]: parseInt(e.target.value) || 0
                            })}
                            className="w-24 ml-auto h-8"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="px-4 py-2">Total Fulfillment</td>
                      <td colSpan={2} className="px-4 py-2 text-right text-blue-600">
                        {Object.values(fulfillmentQuantities).reduce((a, b) => a + b, 0)} units
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <TabsContent value="TRANSFER" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Source Branch</Label>
                <Select value={fromLocationId} onValueChange={setFromLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location to supply from..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 italic">This will create a Stock Transfer for approval.</p>
              </div>
            </TabsContent>

            <TabsContent value="PURCHASE" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier to order from..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* In a real app, you'd fetch suppliers. For now, placeholders or simple list. */}
                    <SelectItem value="SUP-001">Main Distribution Center</SelectItem>
                    <SelectItem value="SUP-002">Global Imports Ltd</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 italic">This will create a new Purchase Order.</p>
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes for this fulfillment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleFulfill}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : activeTab === 'TRANSFER' ? "Create Transfer" : "Create Purchase Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
