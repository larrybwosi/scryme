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
  QrCode,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  searchInventoryProducts,
  updateVariantBarcode,
} from "@/app/actions/barcode-registration";

type Step = "select" | "configure" | "preview";

export function BarcodeRegistrationClient() {
  const [step, setStep] = useState<Step>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [barcode, setBarcode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchInventoryProducts(searchQuery);
      setProducts(results || []);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search products");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVariant = (variant: any, product: any) => {
    setSelectedVariant({ ...variant, productName: product.name });
    setBarcode(variant.barcode || "");
    setStep("configure");
  };

  const generateRandomBarcode = () => {
    const random = Math.floor(
      100000000000 + Math.random() * 900000000000,
    ).toString();
    setBarcode(random);
  };

  const handleRegister = async () => {
    if (!selectedVariant || !barcode) return;
    setIsSubmitting(true);
    try {
      await updateVariantBarcode(selectedVariant.id, barcode);
      toast.success("Barcode registered successfully");
      setStep("preview");
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(error.message || "Failed to register barcode");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep("select");
    setSelectedVariant(null);
    setBarcode("");
    setSearchQuery("");
    setProducts([]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Barcode Registration
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">
            Connect your physical inventory with digital records
          </p>
        </div>
        <div className="flex gap-3">
          {step !== "select" && (
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                setStep(step === "preview" ? "configure" : "select")
              }
              className="rounded-xl">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </Button>
          )}
          {step === "preview" && (
            <Button
              variant="outline"
              size="lg"
              onClick={reset}
              className="rounded-xl">
              <RefreshCw className="w-5 h-5 mr-2" /> Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center py-6">
        {[
          { id: "select", label: "Select Product", icon: Package },
          { id: "configure", label: "Assign Barcode", icon: QrCode },
          { id: "preview", label: "Completed", icon: Check },
        ].map((s, i, arr) => {
          const isActive = step === s.id;
          const isDone = arr.findIndex(x => x.id === step) > i;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all duration-300 shadow-sm",
                    isActive
                      ? "bg-zinc-900 border-zinc-900 text-white scale-110"
                      : isDone
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white border-zinc-200 text-zinc-400",
                  )}>
                  {isDone ? (
                    <Check className="w-8 h-8" />
                  ) : (
                    <s.icon className="w-7 h-7" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-3 text-sm font-bold",
                    isActive ? "text-zinc-900" : "text-zinc-400",
                  )}>
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div
                  className={cn(
                    "w-24 h-1 mx-4 rounded-full transition-colors duration-500",
                    isDone ? "bg-green-500" : "bg-zinc-100",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === "select" && (
        <Card className="border-zinc-200 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-zinc-50 border-b border-zinc-200 pb-8 pt-8 px-8">
            <CardTitle className="text-2xl">Find a Product</CardTitle>
            <CardDescription className="text-base">
              Search for the product variant you want to register a barcode for.
            </CardDescription>
            <div className="flex gap-3 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  placeholder="Search by name, SKU or existing barcode..."
                  className="pl-12 h-14 text-lg rounded-2xl border-zinc-200 focus:ring-zinc-900"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                size="lg"
                className="h-14 px-8 rounded-2xl bg-zinc-900 hover:bg-zinc-800">
                {isSearching ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  "Search Products"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <ScrollArea className="h-125 pr-4">
              {products.length > 0 ? (
                <div className="grid gap-8">
                  {products.map(product => (
                    <div key={product.id} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-zinc-900 rounded-full" />
                        <h3 className="font-black text-xl text-zinc-900">
                          {product.name}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.variants.map((v: any) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-900 hover:shadow-lg transition-all cursor-pointer group"
                            onClick={() => handleSelectVariant(v, product)}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                <Package className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900 group-hover:text-zinc-900">
                                  {v.name || "Default Variant"}
                                </div>
                                <div className="text-sm text-zinc-500">
                                  SKU:{" "}
                                  <span className="font-mono">
                                    {v.sku || "N/A"}
                                  </span>{" "}
                                  • Barcode:{" "}
                                  <span className="font-mono">
                                    {v.barcode || "Not Set"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
                              <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-100 text-center text-zinc-400">
                  <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-12 h-12 opacity-20" />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900">
                    Start your search
                  </h4>
                  <p className="max-w-xs mt-2">
                    Enter a product name or SKU above to begin registration.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {step === "configure" && selectedVariant && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3 border-zinc-200 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-8">
              <CardTitle>Assign Barcode</CardTitle>
              <CardDescription className="text-base">
                Scanning or entering a barcode for{" "}
                <span className="font-black text-zinc-900">
                  {selectedVariant.productName}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-wider text-zinc-500">
                  Barcode Value
                </label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Scan barcode now or type it here..."
                    className="h-16 text-2xl font-mono rounded-2xl border-zinc-200 focus:ring-zinc-900"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    onClick={generateRandomBarcode}
                    className="h-16 w-16 rounded-2xl shrink-0"
                    title="Auto-generate barcode">
                    <RefreshCw className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-zinc-900">Scanner Ready</h5>
                  <p className="text-sm text-zinc-500">
                    If you have a handheld scanner, simply focus the input field
                    above and scan the item&apos;s barcode.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-zinc-50 border-t border-zinc-200">
              <Button
                className="w-full h-16 text-lg font-bold rounded-2xl bg-zinc-900 hover:bg-zinc-800"
                onClick={handleRegister}
                disabled={!barcode || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-6 h-6 mr-2" />
                ) : (
                  <Check className="w-6 h-6 mr-2" />
                )}
                Confirm & Register
              </Button>
            </CardFooter>
          </Card>

          <Card className="lg:col-span-2 border-zinc-200 shadow-xl rounded-3xl overflow-hidden h-fit">
            <CardHeader className="p-8 pb-4">
              <CardTitle>Info</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-400 uppercase">
                  Product
                </p>
                <p className="text-xl font-black text-zinc-900">
                  {selectedVariant.productName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-400 uppercase">
                  Variant
                </p>
                <p className="text-lg font-bold text-zinc-700">
                  {selectedVariant.name || "Default"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-400 uppercase">SKU</p>
                <p className="text-lg font-mono text-zinc-700">
                  {selectedVariant.sku || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "preview" && selectedVariant && (
        <Card className="border-zinc-200 shadow-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-16 flex flex-col items-center text-center space-y-8">
            <div className="w-32 h-32 bg-green-500 text-white rounded-4xl flex items-center justify-center shadow-lg shadow-green-200 rotate-3">
              <Check className="w-20 h-20" />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-zinc-900 tracking-tight">
                All Set!
              </h2>
              <p className="text-xl text-zinc-500 max-w-md mx-auto">
                Barcode{" "}
                <span className="font-mono font-bold text-zinc-900">
                  {barcode}
                </span>{" "}
                has been successfully linked.
              </p>
            </div>

            <div className="w-full max-w-sm p-8 rounded-4xl border-2 border-dashed border-zinc-200 bg-zinc-50 space-y-4">
              <div className="text-left">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  Inventory Linked
                </p>
                <p className="text-xl font-bold text-zinc-900 mt-1">
                  {selectedVariant.productName}
                </p>
                <p className="text-zinc-500 font-medium">
                  {selectedVariant.name || "Default Variant"}
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                  <Barcode className="w-48 h-12 opacity-40" />
                  <p className="mt-2 font-mono text-sm font-bold text-zinc-900">
                    {barcode}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-16 rounded-2xl font-bold"
                onClick={() => window.print()}>
                <Printer className="w-5 h-5 mr-2" /> Print Label
              </Button>
              <Button
                size="lg"
                className="flex-1 h-16 rounded-2xl font-bold bg-zinc-900 hover:bg-zinc-800"
                onClick={reset}>
                Register Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
