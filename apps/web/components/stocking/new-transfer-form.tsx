"use client";

import { useState, useEffect, useMemo } from "react";
import { ProductVariantSelect } from "../product-variant-select";
import { Button } from "@repo/ui/components/ui/button";
import { Save, Plus, Trash2, ArrowRight, AlertCircle, Package, Info } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { getInventoryProducts, type InventoryProduct } from "../../app/actions/inventory";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
}

interface TransferItem {
  variantId: string;
  quantity: number;
  product: InventoryProduct;
}

export function NewTransferForm({
  locations,
  onSave,
}: {
  locations: Location[];
  onSave: (data: {
    fromLocationId: string;
    toLocationId: string;
    items: { variantId: string; quantity: number }[];
    notes?: string;
  }) => Promise<void>;
}) {
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);

  // Selection state for adding new item
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load products when source location changes
  useEffect(() => {
    if (fromLocationId) {
      setIsLoadingProducts(true);
      getInventoryProducts({ locationId: fromLocationId, stockLevel: "all" })
        .then(setProducts)
        .finally(() => setIsLoadingProducts(false));

      // Clear items if source changes as stock levels will be different
      setItems([]);
      setSelectedVariantId("");
    } else {
      setProducts([]);
      setItems([]);
    }
  }, [fromLocationId]);

  const selectedProduct = useMemo(() =>
    products.find(p => p.variantId === selectedVariantId),
    [products, selectedVariantId]
  );

  const addItem = () => {
    if (!selectedProduct) return;

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (quantity > selectedProduct.currentStock) {
      toast.error(`Only ${selectedProduct.currentStock} units available at source location`);
      return;
    }

    const existingItemIndex = items.findIndex(item => item.variantId === selectedVariantId);

    if (existingItemIndex > -1) {
      const newItems = [...items];
      const newTotalQuantity = newItems[existingItemIndex].quantity + quantity;

      if (newTotalQuantity > selectedProduct.currentStock) {
        toast.error(`Total quantity exceeds available stock (${selectedProduct.currentStock})`);
        return;
      }

      newItems[existingItemIndex].quantity = newTotalQuantity;
      setItems(newItems);
    } else {
      setItems([...items, {
        variantId: selectedVariantId,
        quantity,
        product: selectedProduct
      }]);
    }

    // Reset selection
    setSelectedVariantId("");
    setQuantity(1);
    toast.success("Item added to transfer");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromLocationId || !toLocationId) {
      toast.error("Please select both source and destination locations");
      return;
    }

    if (fromLocationId === toLocationId) {
      toast.error("Source and destination locations must be different");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item to transfer");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        fromLocationId,
        toLocationId,
        items: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        })),
        notes
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to create stock transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = products.map((p) => ({
    id: p.variantId,
    name: p.variantName,
    productName: p.name,
    sku: p.sku,
    stock: p.currentStock,
  }));

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Transfer Items</CardTitle>
                <CardDescription>Select products and quantities to move</CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {items.length} {items.length === 1 ? 'Item' : 'Items'} Selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {!fromLocationId ? (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                  <Info className="text-blue-500" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Select source location first</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  We need to know the source location to show you available stock.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="md:col-span-7 space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase ml-1">
                      Search Product
                    </Label>
                    <ProductVariantSelect
                      variants={variants}
                      value={selectedVariantId}
                      onValueChange={setSelectedVariantId}
                      placeholder={isLoadingProducts ? "Loading products..." : "Search by name or SKU..."}
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase ml-1">
                      Quantity
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min="1"
                        max={selectedProduct?.currentStock}
                        className="bg-white pr-16"
                        placeholder="0"
                      />
                      {selectedProduct && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                          Max: {selectedProduct.currentStock}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      onClick={addItem}
                      disabled={!selectedVariantId || isLoadingProducts}
                      className="w-full gap-2 shadow-sm"
                    >
                      <Plus size={16} />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="w-[40%] font-bold">Product</TableHead>
                        <TableHead className="font-bold">SKU</TableHead>
                        <TableHead className="font-bold text-center">Available</TableHead>
                        <TableHead className="font-bold text-center">Transfer Qty</TableHead>
                        <TableHead className="text-right font-bold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-gray-400">
                            No items added yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, index) => (
                          <TableRow key={item.variantId} className="hover:bg-gray-50/30">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{item.product.name}</span>
                                {item.product.variantName !== "Default" && (
                                  <span className="text-xs text-gray-500">{item.product.variantName}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{item.product.sku}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                {item.product.currentStock}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-3">
                                <span className="font-bold text-blue-600">{item.quantity}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Notes
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white min-h-[120px] resize-none focus:ring-blue-500 rounded-xl"
                placeholder="Add any additional details or instructions for this transfer..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="border-none shadow-sm overflow-hidden sticky top-8">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl text-gray-900">Transfer Route</CardTitle>
            <CardDescription>Define source and destination</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="relative pb-8">
              <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-gray-100 border-dashed border-l-2"></div>

              <div className="space-y-6 relative">
                <div className="flex gap-4">
                  <div className="z-10 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 border-4 border-white shadow-sm">
                    <Package size={18} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase ml-1">
                      From (Source)
                    </Label>
                    <Select value={fromLocationId} onValueChange={setFromLocationId}>
                      <SelectTrigger className="bg-white h-11 rounded-xl focus:ring-blue-500">
                        <SelectValue placeholder="Choose source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="z-10 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 border-4 border-white shadow-sm">
                    <ArrowRight size={18} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase ml-1">
                      To (Destination)
                    </Label>
                    <Select value={toLocationId} onValueChange={setToLocationId}>
                      <SelectTrigger className="bg-white h-11 rounded-xl focus:ring-blue-500">
                        <SelectValue placeholder="Choose destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations
                          .filter((l) => l.id !== fromLocationId)
                          .map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {fromLocationId && toLocationId && fromLocationId === toLocationId && (
              <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 rounded-xl">
                <AlertCircle size={16} />
                <AlertTitle>Invalid Route</AlertTitle>
                <AlertDescription>
                  Source and destination locations must be different.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Items:</span>
                <span className="font-bold">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Quantity:</span>
                <span className="font-bold">
                  {items.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
              </div>

              <Button
                type="submit"
                className="w-full h-12 gap-2 text-base font-bold shadow-md bg-blue-600 hover:bg-blue-700 transition-all rounded-xl"
                disabled={isSubmitting || items.length === 0 || fromLocationId === toLocationId}
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Initiate Transfer</span>
                  </>
                )}
              </Button>
              <p className="text-[10px] text-center text-gray-400 uppercase tracking-wider font-semibold">
                Requires Approval after submission
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
