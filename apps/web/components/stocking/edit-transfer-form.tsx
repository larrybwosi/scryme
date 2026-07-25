"use client";

import { useMemo, useState, useTransition } from "react";
import { ProductVariantSelect } from "../product-variant-select";
import { Button } from "@repo/ui/components/ui/button";
import {
  Save,
  Plus,
  Trash2,
  ArrowRightLeft,
  AlertTriangle,
  PackageSearch,
  Loader2,
} from "lucide-react";
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
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";

interface Product {
  variantId: string;
  name: string;
  sku: string;
  currentStock: number;
  variantName?: string;
}

interface Location {
  id: string;
  name: string;
}

interface LineItem {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  availableStock: number;
}

const PRIORITIES = [
  { value: "standard", label: "Standard" },
  { value: "urgent", label: "Urgent" },
] as const;

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function EditTransferForm({
  transfer,
  products,
  locations,
  onSave,
}: {
  transfer: any;
  products: Product[];
  locations: Location[];
  onSave: (formData: FormData) => Promise<void>;
}) {
  const [fromLocationId, setFromLocationId] = useState(transfer.fromLocationId);
  const [toLocationId, setToLocationId] = useState(transfer.toLocationId);
  const [priority, setPriority] = useState<string>(
    transfer.priority?.toLowerCase() === "urgent" ? "urgent" : "standard",
  );
  const [notes, setNotes] = useState(transfer.notes || "");

  const [draftVariantId, setDraftVariantId] = useState("");
  const [draftQuantity, setDraftQuantity] = useState("");
  const [items, setItems] = useState<LineItem[]>(() => {
    return (transfer.items || []).map((item: any) => {
      const prod = products.find(p => p.variantId === item.variantId);
      return {
        id: item.id,
        variantId: item.variantId,
        productName: item.variant?.product?.name || "Item",
        sku: item.variant?.sku || "",
        quantity: item.requestedQuantity ? Number(item.requestedQuantity) : 0,
        availableStock: prod ? prod.currentStock : 0,
      };
    });
  });
  const [itemError, setItemError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const variants = products.map(p => ({
    id: p.variantId,
    name: p.variantName || "Default",
    productName: p.name,
    sku: p.sku,
    stock: p.currentStock,
  }));

  const productByVariant = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.variantId, p);
    return map;
  }, [products]);

  const locationsMismatch =
    !!fromLocationId && !!toLocationId && fromLocationId === toLocationId;

  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const overStockCount = items.filter(
    i => i.quantity > i.availableStock,
  ).length;

  const canAddItem = !!draftVariantId && Number(draftQuantity) > 0;
  const canSubmit =
    items.length > 0 &&
    !!fromLocationId &&
    !!toLocationId &&
    !locationsMismatch &&
    !isPending;

  function handleAddItem() {
    setItemError(null);
    const qty = Number(draftQuantity);

    if (!draftVariantId) {
      setItemError("Choose a product before adding it to the transfer.");
      return;
    }
    if (!qty || qty <= 0) {
      setItemError("Enter a quantity greater than zero.");
      return;
    }
    if (items.some(i => i.variantId === draftVariantId)) {
      setItemError(
        "That product is already on this transfer. Update its quantity instead.",
      );
      return;
    }

    const product = productByVariant.get(draftVariantId);
    if (!product) return;

    setItems(prev => [
      ...prev,
      {
        id: makeId(),
        variantId: product.variantId,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        availableStock: product.currentStock,
      },
    ]);
    setDraftVariantId("");
    setDraftQuantity("");
  }

  function handleRemoveItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleQuantityChange(id: string, value: string) {
    const qty = Math.max(0, Number(value) || 0);
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity: qty } : i)),
    );
  }

  function swapLocations() {
    setFromLocationId(toLocationId);
    setToLocationId(fromLocationId);
  }

  return (
    <form
      action={formData => {
        formData.set("fromLocationId", fromLocationId);
        formData.set("toLocationId", toLocationId);
        formData.set("priority", priority);
        formData.set("notes", notes);
        formData.set(
          "items",
          JSON.stringify(
            items.map(({ variantId, sku, quantity }) => ({
              variantId,
              sku,
              quantity,
            })),
          ),
        );
        startTransition(async () => {
          await onSave(formData);
        });
      }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Items</CardTitle>
            <CardDescription>
              Add each product and the quantity to move between locations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-7">
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Product
                </Label>
                <ProductVariantSelect
                  variants={variants}
                  value={draftVariantId}
                  onValueChange={setDraftVariantId}
                  placeholder="Select a product..."
                  allowZeroStock={true}
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Quantity
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={draftQuantity}
                  onChange={e => setDraftQuantity(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="bg-white"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={!canAddItem}
                  className="w-full gap-2 border-dashed">
                  <Plus size={14} /> Add
                </Button>
              </div>
            </div>

            {itemError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle size={14} /> {itemError}
              </p>
            )}

            <div className="pt-2 border-t">
              {items.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-10 bg-gray-50 rounded-lg border border-dashed flex flex-col items-center gap-2">
                  <PackageSearch size={22} className="text-gray-400" />
                  <span>No items added yet.</span>
                  <span className="text-xs font-medium">
                    Select a product and quantity above, then click Add.
                  </span>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                        <th className="text-left px-4 py-2">Product</th>
                        <th className="text-left px-4 py-2">SKU</th>
                        <th className="text-right px-4 py-2">Available</th>
                        <th className="text-right px-4 py-2 w-28">Qty</th>
                        <th className="px-4 py-2 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map(item => {
                        const overStock = item.quantity > item.availableStock;
                        return (
                          <tr
                            key={item.id}
                            className={overStock ? "bg-red-50/50" : undefined}>
                            <td className="px-4 py-2.5 font-medium text-gray-900">
                              {item.productName}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {item.sku}
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-500">
                              {item.availableStock}
                            </td>
                            <td className="px-4 py-2.5">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e =>
                                  handleQuantityChange(item.id, e.target.value)
                                }
                                className={`bg-white h-8 text-right ${
                                  overStock ? "border-red-400" : ""
                                }`}
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="h-8 w-8 text-gray-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {overStockCount > 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1.5 mt-2">
                  <AlertTriangle size={13} />
                  {overStockCount === 1
                    ? "1 item exceeds available stock at the source location."
                    : `${overStockCount} items exceed available stock at the source location.`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>
              Reason for transfer, handling instructions, or approval
              references.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-white min-h-[100px]"
              placeholder="e.g. Rebalancing stock ahead of the Q3 promotion..."
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

            <div className="flex justify-center -my-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={swapLocations}
                disabled={!fromLocationId && !toLocationId}
                className="h-7 w-7 text-gray-400 hover:text-gray-700"
                aria-label="Swap source and destination">
                <ArrowRightLeft size={14} />
              </Button>
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
            {locationsMismatch && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Source and destination must be
                different.
              </p>
            )}

            <Separator />

            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Line items</span>
              <span className="font-medium text-gray-900">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total units</span>
              <span className="font-medium text-gray-900">{totalUnits}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Priority</span>
              <Badge
                variant={priority === "urgent" ? "destructive" : "secondary"}>
                {PRIORITIES.find(p => p.value === priority)?.label}
              </Badge>
            </div>

            <Separator />

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full gap-2">
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </Button>
            {!canSubmit && !isPending && (
              <p className="text-xs text-gray-400 text-center">
                Add at least one item and choose both locations to continue.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
