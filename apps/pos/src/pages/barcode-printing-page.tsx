"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Search,
  Printer,
  Trash2,
  Plus,
  Minus,
  Settings2,
  Package,
  Layers,
  Info,
  Tag,
  ArrowRight,
  Check,
  RefreshCw,
  Loader2,
  ScanLine,
  X,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { BarcodeService, type BarcodeFormat } from "@/lib/barcode-service";
import { LabelService, type PrintLabelItem, type LabelPrintConfig, type LabelSize } from "@/lib/label-service";
import { usePosStore } from "@/store/store";

type WorkspaceTab = "print" | "register";
type RegisterStep = "select" | "configure" | "success";

export default function BarcodeWorkspacePage() {
  const [tab, setTab] = useState<WorkspaceTab>("print");

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <Tabs value={tab} onValueChange={(v) => setTab(v as WorkspaceTab)} className="flex h-full flex-col">
        <div className="border-b bg-background px-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Barcode Workspace</h1>
              <p className="text-muted-foreground">
                Register barcodes to your inventory and print professional labels, all in one place.
              </p>
            </div>
            <TabsList className="h-11">
              <TabsTrigger value="print" className="gap-2 px-4">
                <Printer className="h-4 w-4" />
                Print Labels
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2 px-4">
                <ScanLine className="h-4 w-4" />
                Register Barcode
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="h-4" />
        </div>

        <TabsContent value="print" className="mt-0 flex-1 min-h-0 data-[state=inactive]:hidden">
          <PrintLabelsPanel />
        </TabsContent>

        <TabsContent value="register" className="mt-0 flex-1 min-h-0 data-[state=inactive]:hidden">
          <RegisterBarcodePanel onRegistered={() => setTab("print")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Print Labels Panel                                                  */
/* ------------------------------------------------------------------ */

function PrintLabelsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [previewBarcode, setPreviewBarcode] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [printQueue, setPrintQueue] = useState<PrintLabelItem[]>([]);
  const [printers, setPrinters] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [config, setConfig] = useState<LabelPrintConfig & { nameFontSize?: number; priceFontSize?: number }>({
    size: "50x30",
    showPrice: true,
    showSku: true,
    showName: true,
    barcodeType: "code128",
    printerName: "default",
    nameFontSize: 1,
    priceFontSize: 2,
  });

  const currency = usePosStore((state) => state.settings.receiptConfig.currency || "USD");

  useEffect(() => {
    const loadPrinters = async () => {
      try {
        const list = await LabelService.getAvailablePrinters();
        setPrinters(list);
        if (list.length > 0 && config.printerName === "default") {
          const labelPrinter = list.find((p) => p.toLowerCase().includes("label"));
          if (labelPrinter) {
            setConfig((prev) => ({ ...prev, printerName: labelPrinter }));
          }
        }
      } catch {
        // Printer discovery failing shouldn't block the rest of the workspace.
      }
    };

    loadPrinters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalLabels = useMemo(
    () => printQueue.reduce((acc, i) => acc + i.quantity, 0),
    [printQueue]
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await invoke<any>("search_products_command", {
        query: searchQuery,
        category: "all",
        page: 1,
        pageSize: 20,
      });
      const mappedProducts = (response.products || []).map((p: any) => ({
        ...p,
        productName: p.productName || p.name || '',
        stock: p.stock ?? p.totalStock ?? 0,
        variants: p.variants?.map((v: any) => ({
          ...v,
          variantName: v.variantName || v.name || '',
        })) || [],
      }));
      setSearchResults(mappedProducts);

      if (mappedProducts.length > 0) {
        generatePreview(mappedProducts[0]);
      } else {
        setPreviewBarcode(null);
      }
    } catch (err) {
      toast.error("Search failed", { description: String(err) });
    } finally {
      setIsSearching(false);
    }
  };

  const generatePreview = async (product: any) => {
    setPreviewLoading(true);
    try {
      const barcode = product.barcode || product.sku || product.productId;
      const dataUrl = await BarcodeService.generate(barcode, config.barcodeType as any, {
        height: 15,
        scale: 2,
      });
      setPreviewBarcode(dataUrl);
    } catch {
      setPreviewBarcode(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const addToQueue = (product: any) => {
    const existing = printQueue.find((item) => item.id === product.productId);
    if (existing) {
      setPrintQueue((prev) =>
        prev.map((item) =>
          item.id === product.productId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newItem: PrintLabelItem = {
        id: product.productId,
        name: product.productName,
        sku: product.sku,
        barcode: product.barcode || product.sku || product.productId,
        price: product.sellableUnits?.[0]?.price || 0,
        currency,
        category: product.category,
        quantity: 1,
      };
      setPrintQueue((prev) => [...prev, newItem]);
    }
    toast.success("Added to queue", { description: product.productName });
  };

  const removeFromQueue = (id: string) => {
    setPrintQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setPrintQueue((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item)));
  };

  const clearQueue = () => {
    if (printQueue.length === 0) return;
    setPrintQueue([]);
    toast("Queue cleared");
  };

  const handlePrint = async () => {
    if (printQueue.length === 0) {
      toast.error("Queue is empty");
      return;
    }

    setIsPrinting(true);
    const printPromise = LabelService.printLabels(printQueue, config);

    toast.promise(printPromise, {
      loading: "Sending labels to printer...",
      success: "Labels sent successfully",
      error: (err) => `Printing failed: ${err.message}`,
    });

    try {
      await printPromise;
    } catch {
      // Error surface handled by toast.promise
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-6 p-6 xl:grid-cols-12">
      {/* Left: Search & Results */}
      <div className="flex min-h-0 flex-col xl:col-span-8">
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Product Lookup</CardTitle>
            <CardDescription>Find products to add to your printing queue.</CardDescription>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  autoFocus
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {isSearching ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[68px] animate-pulse rounded-xl border bg-zinc-100 dark:bg-zinc-900" />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {searchResults.map((product) => {
                    const inQueue = printQueue.find((item) => item.id === product.productId);
                    return (
                      <div
                        key={product.productId}
                        onClick={() => generatePreview(product)}
                        className={cn(
                          "group relative flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900",
                          inQueue && "border-primary/50 ring-1 ring-primary/20"
                        )}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          <Package className="h-6 w-6 text-zinc-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{product.productName}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>SKU: {product.sku || "N/A"}</span>
                            <span className="h-1 w-1 rounded-full bg-zinc-300" />
                            <span>
                              {currency} {product.sellableUnits?.[0]?.price ?? 0}
                            </span>
                          </div>
                        </div>
                        {inQueue && (
                          <Badge variant="secondary" className="shrink-0">
                            {inQueue.quantity} in queue
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(product);
                          }}
                          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 py-24 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <Barcode className="h-8 w-8 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {hasSearched ? "No products found" : "No products selected"}
                    </h3>
                    <p className="mx-auto max-w-xs text-muted-foreground">
                      {hasSearched
                        ? "Try a different name, SKU, or barcode."
                        : "Search for products above to start building your print queue."}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right: Queue, Preview, Settings */}
      <div className="flex min-h-0 flex-col gap-6 xl:col-span-4">
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Print Queue ({printQueue.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearQueue}
                disabled={printQueue.length === 0}
                className="text-muted-foreground"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {printQueue.length > 0 ? (
                <div className="space-y-3">
                  {printQueue.map((item) => (
                    <div key={item.id} className="space-y-3 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.name}</div>
                          <div className="truncate text-[10px] text-muted-foreground">{item.barcode}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          onClick={() => removeFromQueue(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <Input
                            type="number"
                            className="h-7 w-14 p-0 text-center"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Badge variant="outline">Label{item.quantity > 1 ? "s" : ""}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <Layers className="h-8 w-8 opacity-20" />
                  Your queue is empty. Add products from the left to get started.
                </div>
              )}
            </ScrollArea>
          </CardContent>
          {printQueue.length > 0 && (
            <CardFooter className="flex flex-col gap-3 border-t bg-zinc-50/60 p-4 dark:bg-zinc-900/30">
              <div className="flex w-full items-center justify-between text-sm">
                <span className="text-muted-foreground">Total labels</span>
                <span className="font-semibold">{totalLabels}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handlePrint} disabled={isPrinting}>
                {isPrinting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-5 w-5" />
                )}
                Print Labels ({totalLabels})
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Barcode className="h-4 w-4" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-[2/1] w-full flex-col items-center justify-center rounded-lg border bg-white p-4">
              {previewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
              ) : previewBarcode ? (
                <>
                  <img src={previewBarcode} alt="Barcode Preview" className="h-auto max-w-full" />
                  <span className="mt-2 font-mono text-[10px] text-zinc-500">Sample Rendering</span>
                </>
              ) : (
                <div className="text-center text-xs text-zinc-400">
                  <Barcode className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  Select a product to preview
                </div>
              )}
            </div>
          </CardContent>
          <Separator />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" />
              Print Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Printer</Label>
              <Select value={config.printerName} onValueChange={(v) => setConfig((prev) => ({ ...prev, printerName: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select printer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System Default (Label)</SelectItem>
                  {printers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label Size</Label>
              <Select value={config.size} onValueChange={(v: LabelSize) => setConfig((prev) => ({ ...prev, size: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50x30">50mm x 30mm (Standard)</SelectItem>
                  <SelectItem value="40x25">40mm x 25mm</SelectItem>
                  <SelectItem value="30x20">30mm x 20mm (Small)</SelectItem>
                  <SelectItem value="100x50">100mm x 50mm (Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-name" className="text-sm">
                  Display Product Name
                </Label>
                <Switch
                  id="show-name"
                  checked={config.showName}
                  onCheckedChange={(v) => setConfig((prev) => ({ ...prev, showName: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-price" className="text-sm">
                  Display Price
                </Label>
                <Switch
                  id="show-price"
                  checked={config.showPrice}
                  onCheckedChange={(v) => setConfig((prev) => ({ ...prev, showPrice: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-sku" className="text-sm">
                  Display SKU
                </Label>
                <Switch
                  id="show-sku"
                  checked={config.showSku}
                  onCheckedChange={(v) => setConfig((prev) => ({ ...prev, showSku: v }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Barcode Type</Label>
              <Select
                value={config.barcodeType}
                onValueChange={(v: string) => setConfig((prev) => ({ ...prev, barcodeType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code128">Standard Barcode (Code128)</SelectItem>
                  <SelectItem value="ean13">EAN-13</SelectItem>
                  <SelectItem value="ean8">EAN-8</SelectItem>
                  <SelectItem value="upca">UPC-A</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name Size</Label>
                <Select
                  value={String(config.nameFontSize)}
                  onValueChange={(v) => setConfig((prev) => ({ ...prev, nameFontSize: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="2">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price Size</Label>
                <Select
                  value={String(config.priceFontSize)}
                  onValueChange={(v) => setConfig((prev) => ({ ...prev, priceFontSize: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="2">Large</SelectItem>
                    <SelectItem value="3">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-zinc-50 p-4 dark:bg-zinc-900/50">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-[10px] text-muted-foreground">
                Ensure your label printer is loaded with the selected size. Using incorrect sizes may result in
                misaligned prints.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Register Barcode Panel                                              */
/* ------------------------------------------------------------------ */

function RegisterBarcodePanel({ onRegistered }: { onRegistered?: () => void }) {
  const [step, setStep] = useState<RegisterStep>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [barcode, setBarcode] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("code128");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await invoke<any>("search_products_command", {
        query: searchQuery,
        category: "all",
        page: 1,
        pageSize: 20,
      });
      const mappedProducts = (response.products || []).map((p: any) => ({
        ...p,
        productName: p.productName || p.name || '',
        stock: p.stock ?? p.totalStock ?? 0,
        variants: p.variants?.map((v: any) => ({
          ...v,
          variantName: v.variantName || v.name || '',
        })) || [],
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search products");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVariant = (variant: any, product: any) => {
    setSelectedVariant({
      ...variant,
      productName: product.productName,
      productId: product.productId,
      product,
    });
    setBarcode(variant.barcode || "");
    setStep("configure");
    if (variant.barcode) {
      updatePreview(variant.barcode, format);
    } else {
      setPreviewUrl(null);
    }
  };

  const updatePreview = async (text: string, fmt: BarcodeFormat) => {
    if (!text) {
      setPreviewUrl(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const url = await BarcodeService.generate(text, fmt, { height: 15, scale: 2 });
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const generateRandomBarcode = () => {
    const random = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setBarcode(random);
    updatePreview(random, format);
  };

  const handleRegister = async () => {
    if (!selectedVariant || !barcode) return;
    setIsSubmitting(true);
    try {
      const targetVariantId = selectedVariant.variantId || selectedVariant.id;
      await invoke("authenticated_api_request", {
        method: "POST",
        path: "api/v2/pos/inventory/barcode",
        body: {
          variantId: targetVariantId,
          barcode,
        },
      });

      // Synchronize the local SQLite product store immediately
      if (selectedVariant.product) {
        const updatedProduct = { ...selectedVariant.product };
        updatedProduct.variants = (updatedProduct.variants || []).map((v: any) => {
          const vId = v.variantId || v.id;
          if (vId === targetVariantId) {
            return { ...v, barcode };
          }
          return v;
        });

        // Also update primary product barcode if the updated variant was the first/primary one
        if (updatedProduct.variants[0]?.variantId === targetVariantId || updatedProduct.variants[0]?.id === targetVariantId) {
          updatedProduct.barcode = barcode;
        }

        try {
          await invoke("update_local_product_command", { product: updatedProduct });
          toast.success("Barcode registered and synced locally successfully");
        } catch (localErr: any) {
          console.error("Local sync failed:", localErr);
          toast.success("Barcode registered on cloud, but failed to sync locally");
        }
      } else {
        toast.success("Barcode registered successfully");
      }

      setStep("success");
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error("Failed to register barcode", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep("select");
    setSelectedVariant(null);
    setBarcode("");
    setPreviewUrl(null);
    setSearchQuery("");
    setProducts([]);
    setHasSearched(false);
  };

  const steps: { id: RegisterStep; label: string }[] = [
    { id: "select", label: "Select Product" },
    { id: "configure", label: "Configure Barcode" },
    { id: "success", label: "Success" },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Register a Barcode</h2>
          <p className="text-sm text-muted-foreground">Link a physical barcode to a product variant in three steps.</p>
        </div>
        <div className="flex gap-2">
          {step !== "select" && (
            <Button variant="outline" onClick={() => setStep(step === "success" ? "configure" : "select")}>
              Back
            </Button>
          )}
          {step === "success" && (
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" /> Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Wizard Progress */}
      <div className="flex items-center justify-center">
        {steps.map((s, i, arr) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                step === s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : currentIndex > i
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-muted bg-background text-muted-foreground"
              )}
            >
              {currentIndex > i ? <Check className="h-5 w-5" /> : i + 1}
            </div>
            <span
              className={cn(
                "ml-2 mr-4 text-sm font-medium",
                step === s.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {i < arr.length - 1 && <div className="mr-4 h-px w-16 bg-muted" />}
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {step === "select" && (
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Find Product</CardTitle>
              <CardDescription>Search for the product variant you want to register a barcode for.</CardDescription>
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, SKU or current barcode..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    autoFocus
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-[440px]">
                {products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.productId} className="space-y-2">
                        <div className="border-b pb-1 text-lg font-bold">{product.productName}</div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {product.variants.map((v: any) => (
                            <div
                              key={v.variantId || v.id}
                              className="group flex cursor-pointer items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                              onClick={() => handleSelectVariant(v, product)}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{v.variantName || v.name || "Default Variant"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    SKU: {v.sku || "N/A"} • Barcode: {v.barcode || "None"}
                                  </div>
                                </div>
                              </div>
                              <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Search className="mb-4 h-12 w-12 opacity-20" />
                    <p>{hasSearched ? "No products found. Try another search." : "Start by searching above."}</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {step === "configure" && selectedVariant && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configure Barcode</CardTitle>
                <CardDescription>
                  Assign a barcode to <span className="font-bold">{selectedVariant.productName}</span> (
                  {selectedVariant.name || "Default Variant"})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Barcode Value</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Scan or enter barcode..."
                      value={barcode}
                      onChange={(e) => {
                        setBarcode(e.target.value);
                        updatePreview(e.target.value, format);
                      }}
                      autoFocus
                    />
                    <Button variant="outline" size="icon" onClick={generateRandomBarcode} title="Generate Random">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Barcode Format</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["code128", "ean13", "qr"] as const).map((f) => (
                      <Button
                        key={f}
                        variant={format === f ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFormat(f);
                          updatePreview(barcode, f);
                        }}
                      >
                        {f.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleRegister} disabled={!barcode || isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Register Barcode
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
                {previewLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                ) : previewUrl ? (
                  <div className="space-y-4 text-center">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                      <img src={previewUrl} alt="Barcode Preview" className="h-auto max-w-full" />
                    </div>
                    <div className="font-mono text-sm font-bold">{barcode}</div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Barcode className="mx-auto mb-4 h-16 w-16 opacity-10" />
                    <p>Enter a barcode to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "success" && selectedVariant && (
          <Card className="py-12 text-center">
            <CardContent className="space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                <Check className="h-12 w-12" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Registration Successful!</h2>
                <p className="mt-2 text-muted-foreground">
                  Barcode <span className="font-mono font-bold">{barcode}</span> is now linked to:
                  <br />
                  <span className="font-semibold text-foreground">
                    {selectedVariant.productName} - {selectedVariant.name || "Default Variant"}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print Label
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onRegistered?.();
                  }}
                >
                  <Tag className="mr-2 h-4 w-4" /> Go Print Labels
                </Button>
                <Button onClick={reset}>Register Another</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}