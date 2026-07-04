"use client";

import { useState } from "react";
import {
  Barcode,
  Search,
  Package,
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCw,
  Printer,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { BarcodeService, BarcodeFormat } from "@/lib/barcode-service";
import { cn } from "@repo/ui/lib/utils";
import { usePosStore } from "@/store/store";

type Step = "select" | "configure" | "preview";

export default function BarcodeRegistrationPage() {
  const [step, setStep] = useState<Step>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [barcode, setBarcode] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("code128");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = usePosStore((state) => state.settings.receiptConfig.currency || "USD");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await invoke<any>("search_products_command", {
        query: searchQuery,
        category: "All",
        page: 1,
        page_size: 20,
      });
      setProducts(response.products || []);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search products");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVariant = (variant: any, product: any) => {
    setSelectedVariant({ ...variant, productName: product.productName });
    setBarcode(variant.barcode || "");
    setStep("configure");
    if (variant.barcode) {
      updatePreview(variant.barcode, format);
    }
  };

  const updatePreview = async (text: string, fmt: BarcodeFormat) => {
    if (!text) {
      setPreviewUrl(null);
      return;
    }
    try {
      const url = await BarcodeService.generate(text, fmt, {
        height: 15,
        scale: 2,
      });
      setPreviewUrl(url);
    } catch (error) {
      setPreviewUrl(null);
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
      await invoke("authenticated_api_request", {
        method: "POST",
        path: "api/v2/pos/inventory/barcode",
        body: {
          variantId: selectedVariant.id,
          barcode,
        },
      });
      toast.success("Barcode registered successfully");
      setStep("preview");
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
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barcode Registration</h1>
          <p className="text-muted-foreground mt-1">Link physical barcodes to your digital inventory</p>
        </div>
        <div className="flex gap-2">
          {step !== "select" && (
            <Button variant="outline" onClick={() => setStep(step === "preview" ? "configure" : "select")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          {step === "preview" && (
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Wizard Progress */}
      <div className="flex items-center justify-center mb-8">
        {[
          { id: "select", label: "Select Product" },
          { id: "configure", label: "Configure Barcode" },
          { id: "preview", label: "Success" },
        ].map((s, i, arr) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                step === s.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : arr.findIndex((x) => x.id === step) > i
                  ? "bg-green-500 border-green-500 text-white"
                  : "bg-background border-muted text-muted-foreground"
              )}
            >
              {arr.findIndex((x) => x.id === step) > i ? <Check className="w-6 h-6" /> : i + 1}
            </div>
            <span className={cn("ml-2 text-sm font-medium mr-4", step === s.id ? "text-primary" : "text-muted-foreground")}>
              {s.label}
            </span>
            {i < arr.length - 1 && <div className="w-12 h-px bg-muted mr-4" />}
          </div>
        ))}
      </div>

      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>Find Product</CardTitle>
            <CardDescription>Search for the product variant you want to register a barcode for.</CardDescription>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU or current barcode..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="animate-spin w-4 h-4" /> : "Search"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.productId} className="space-y-2">
                      <div className="font-bold text-lg border-b pb-1">{product.productName}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.variants.map((v: any) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer group"
                            onClick={() => handleSelectVariant(v, product)}
                          >
                            <div className="flex items-center gap-3">
                              <Package className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{v.name || "Default Variant"}</div>
                                <div className="text-xs text-muted-foreground">
                                  SKU: {v.sku || "N/A"} • Barcode: {v.barcode || "None"}
                                </div>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p>No products found. Start by searching above.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {step === "configure" && selectedVariant && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure Barcode</CardTitle>
              <CardDescription>
                Assign a barcode to <span className="font-bold">{selectedVariant.productName}</span> ({selectedVariant.name})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Barcode Value</label>
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
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Barcode Format</label>
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
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Register Barcode
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
              {previewUrl ? (
                <div className="space-y-4 text-center">
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <img src={previewUrl} alt="Barcode Preview" className="max-w-full h-auto" />
                  </div>
                  <div className="text-sm font-mono font-bold">{barcode}</div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Barcode className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p>Enter a barcode to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === "preview" && selectedVariant && (
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Registration Successful!</h2>
              <p className="text-muted-foreground mt-2">
                Barcode <span className="font-mono font-bold">{barcode}</span> is now linked to:
                <br />
                <span className="font-semibold text-foreground">
                  {selectedVariant.productName} - {selectedVariant.name}
                </span>
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Print Label
              </Button>
              <Button onClick={reset}>
                Register Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
