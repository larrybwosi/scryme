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
  Scan,
  ShieldCheck,
  Paperclip,
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
import { Switch } from "@repo/ui/components/ui/switch";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { StockAttachmentManager, StockAttachment } from "./stock-attachment-manager";
import { toast } from "sonner";

interface Product {
  variantId: string;
  name: string;
  sku: string;
  currentStock: number;
  variantName?: string;
  barcode?: string;
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
  batchNumber?: string;
  serialNumbers?: string[];
  serialInput?: string;
}

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium (Standard)" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function NewTransferForm({
  products,
  locations,
  onSave,
  userRole = "ADMIN",
}: {
  products: Product[];
  locations: Location[];
  onSave: (formData: FormData) => Promise<void>;
  userRole?: string;
}) {
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [autoApproveAndShip, setAutoApproveAndShip] = useState(false);
  const [attachments, setAttachments] = useState<StockAttachment[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isPrivilegedUser = userRole === "OWNER" || userRole === "ADMIN";

  const totalQuantity = useMemo(
    () => lineItems.reduce((acc, item) => acc + (item.quantity || 0), 0),
    [lineItems],
  );

  const handleAddProduct = (variantId: string) => {
    const product = products.find((p) => p.variantId === variantId);
    if (!product) return;

    if (lineItems.some((item) => item.variantId === variantId)) {
      toast.info("Product variant already in transfer list");
      return;
    }

    setLineItems((prev) => [
      ...prev,
      {
        id: makeId(),
        variantId: product.variantId,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        availableStock: product.currentStock,
        serialNumbers: [],
      },
    ]);
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    const cleanCode = scannedCode.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleanCode) ||
        p.sku.toLowerCase() === cleanCode ||
        p.variantId.toLowerCase() === cleanCode,
    );

    if (matched) {
      handleAddProduct(matched.variantId);
      toast.success(`Matched & added: ${matched.name} (${matched.sku})`);
    } else {
      toast.error(`No variant found matching barcode: ${scannedCode}`);
    }
  };

  const updateItemQuantity = (id: string, qty: number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item)),
    );
  };

  const updateItemBatch = (id: string, batchNumber: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, batchNumber } : item)),
    );
  };

  const updateItemSerials = (id: string, rawSerials: string) => {
    const list = rawSerials
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, serialInput: rawSerials, serialNumbers: list } : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromLocationId || !toLocationId) {
      toast.error("Please select both source and destination locations.");
      return;
    }

    if (fromLocationId === toLocationId) {
      toast.error("Source and destination locations must be different.");
      return;
    }

    if (lineItems.length === 0) {
      toast.error("Please add at least one product to the transfer.");
      return;
    }

    const formData = new FormData();
    formData.append("fromLocationId", fromLocationId);
    formData.append("toLocationId", toLocationId);
    formData.append("priority", priority);
    formData.append("notes", notes);
    formData.append("autoApproveAndShip", String(autoApproveAndShip));
    formData.append(
      "attachmentIds",
      JSON.stringify(attachments.map((a) => a.id)),
    );
    formData.append(
      "items",
      JSON.stringify(
        lineItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          batchNumber: item.batchNumber || undefined,
          serialNumbers: item.serialNumbers || [],
        })),
      ),
    );

    startTransition(async () => {
      try {
        await onSave(formData);
        toast.success("Stock transfer initiated successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to initiate transfer");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                Transfer Route & Details
              </CardTitle>
              <CardDescription>
                Select originating facility, destination warehouse, and urgency priority.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-loc">Source Location (From)</Label>
                <Select value={fromLocationId} onValueChange={setFromLocationId}>
                  <SelectTrigger id="from-loc">
                    <SelectValue placeholder="Select Origin Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem
                        key={loc.id}
                        value={loc.id}
                        disabled={loc.id === toLocationId}
                      >
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-loc">Destination Location (To)</Label>
                <Select value={toLocationId} onValueChange={setToLocationId}>
                  <SelectTrigger id="to-loc">
                    <SelectValue placeholder="Select Destination Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem
                        key={loc.id}
                        value={loc.id}
                        disabled={loc.id === fromLocationId}
                      >
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority-select">Dispatch Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isPrivilegedUser && (
                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold cursor-pointer">
                        Instant Dispatch (Auto-Approve)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Skip multi-step queue and dispatch immediately.
                      </p>
                    </div>
                    <Switch
                      checked={autoApproveAndShip}
                      onCheckedChange={setAutoApproveAndShip}
                    />
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="notes">Transfer Notes / Reason</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Replenishing high-demand stock for weekend sale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PackageSearch className="w-4 h-4 text-primary" />
                  Transfer Items & Batches
                </CardTitle>
                <CardDescription>
                  Scan barcode, pick items, specify batches and serial numbers.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="gap-2"
              >
                <Scan className="w-4 h-4 text-primary" />
                Scan Barcode / QR
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add Product Variant</Label>
                <Select onValueChange={handleAddProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product variant to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.variantId} value={p.variantId}>
                        {p.name} ({p.sku}) - {p.currentStock} in stock
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {lineItems.length > 0 ? (
                <div className="divide-y divide-border border rounded-lg overflow-hidden">
                  {lineItems.map((item) => (
                    <div key={item.id} className="p-4 space-y-3 bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {item.productName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {item.sku} | In Stock: {item.availableStock}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Transfer Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(item.id, Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Batch / Lot (Optional)</Label>
                          <Input
                            placeholder="Auto FEFO if empty"
                            value={item.batchNumber || ""}
                            onChange={(e) =>
                              updateItemBatch(item.id, e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Serial Numbers (Comma / Newline)</Label>
                          <Input
                            placeholder="SN1, SN2, SN3"
                            value={item.serialInput || ""}
                            onChange={(e) =>
                              updateItemSerials(item.id, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/10 text-muted-foreground text-sm">
                  No products added yet. Use the selector above or barcode scanner to add line items.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Summary & Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Unique Items:</span>
                  <span className="font-semibold">{lineItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Units:</span>
                  <span className="font-semibold">{totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge variant="outline">{priority}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Dispatch Mode:</span>
                  <Badge variant={autoApproveAndShip ? "default" : "secondary"}>
                    {autoApproveAndShip ? "Instant Dispatch" : "Pending Approval"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <StockAttachmentManager
                attachments={attachments}
                onChange={setAttachments}
              />

              <Button
                type="submit"
                className="w-full gap-2 mt-4"
                disabled={isPending || lineItems.length === 0}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {autoApproveAndShip ? "Dispatch Stock Immediately" : "Submit Stock Transfer"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BarcodeScannerDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Item Barcode for Transfer"
      />
    </form>
  );
}
