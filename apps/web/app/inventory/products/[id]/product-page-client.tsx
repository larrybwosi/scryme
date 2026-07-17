"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  MoreHorizontal,
  Package,
  Tag,
  Layers,
  DollarSign,
  History,
  Truck,
  Image as ImageIcon,
  ChevronRight,
  Loader2,
  ExternalLink,
  Edit,
  Scale,
  RefreshCw,
  PlusCircle,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { ImageUpload } from "../../../../components/image-upload";
import {
  updateProduct,
  bulkDeleteVariants,
  updateVariantStatus,
  createVariant,
  updateVariant,
  updateVariantUnits,
  generateProductSlug,
  updateReorderRule,
} from "../../../actions/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";

export function ProductPageClient({
  product: initialProduct,
  categories,
  suppliers,
  locations,
  systemUnits,
  organizationUnits,
}: any) {
  const [product, setProduct] = useState(initialProduct);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [variantsToDelete, setVariantsToDelete] = useState<string[] | null>(
    null,
  );

  // Variant Dialog State
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [variantForm, setVariantForm] = useState<any>({
    name: "",
    sku: "",
    barcode: "",
    buyingPrice: 0,
    retailPrice: 0,
    initialStock: 0,
    isActive: true,
    attributes: {},
    pointsOnPurchase: 0,
    loyaltyPointsOverride: 0,
    requiresExpiryTracking: true,
    expiryWarningDays: 2,
    defaultShelfLifeDays: 0,
    requiresSerialNumber: false,
    wholesalePrice: 0,
    promotionalPrice: 0,
    isPopular: false,
    isNew: false,
  });

  // Hardware barcode scanner integration
  React.useEffect(() => {
    if (!isVariantDialogOpen) return;

    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keys like Shift, Control, Alt, CapsLock, Arrow keys, Tab, Escape etc.
      if (e.key.length > 1 && e.key !== "Enter") {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Reset buffer if character input takes longer than 45ms, meaning it's likely manual typing
      if (timeDiff > 45 && e.key !== "Enter") {
        buffer = "";
      }

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          // Scanner finished. Intercept and prevent form submit / click handlers
          e.preventDefault();
          e.stopPropagation();

          setVariantForm((prev: any) => ({ ...prev, barcode: buffer }));
          toast.success(`Barcode scanned: ${buffer}`);

          // Remove the first leaked character from the currently focused element, if applicable.
          if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
          ) {
            const activeInput = document.activeElement;
            if (activeInput.id !== "v-barcode") {
              const val = activeInput.value;
              // Check if the input value ends with the first character of our buffer
              if (buffer.length > 0 && val.endsWith(buffer[0])) {
                const newVal = val.slice(0, -1);
                activeInput.value = newVal;

                // Dispatch event to inform React/controlled component of the updated value
                const tracker = (activeInput as any)._valueTracker;
                if (tracker) {
                  tracker.setValue(newVal);
                }
                const event = new Event("input", { bubbles: true });
                activeInput.dispatchEvent(event);
              }
            }
          }
          buffer = "";
        } else {
          buffer = "";
        }
        return;
      }

      buffer += e.key;

      // If we are gathering keys with scanner speed, prevent those keys from leaking into focused text inputs
      if (buffer.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isVariantDialogOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        categoryId: product.categoryId,
        description: product.description,
        detailedDescription: product.detailedDescription,
        tags: product.tags,
        type: product.type,
        brand: product.brand,
        rating: Number(product.rating),
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        lowStockThreshold: Number(product.lowStockThreshold),
        isActive: product.isActive,
        buyingPrice: product.variants?.[0]?.buyingPrice,
        retailPrice: product.variants?.[0]?.retailPrice,
        imageUrls: product.imageUrls,
        pointsOnPurchase: product.pointsOnPurchase,
        loyaltyPointsOverride: product.loyaltyPointsOverride,
      });
      toast.success("Product updated successfully");
    } catch (error) {
      toast.error("Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSlug = async () => {
    const slug = await generateProductSlug(product.name);
    setProduct({ ...product, slug });
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedVariants.length === 0) return;
    try {
      await updateVariantStatus(selectedVariants, isActive);
      toast.success("Variants updated");
      // Refresh logic would go here
    } catch (e) {
      toast.error("Failed to update variants");
    }
  };

  const handleDeleteVariants = async () => {
    if (!variantsToDelete) return;
    setIsDeleting(true);
    try {
      await bulkDeleteVariants(variantsToDelete);
      toast.success(
        variantsToDelete.length === 1 ? "Variant deleted" : "Variants deleted",
      );
      setProduct({
        ...product,
        variants: product.variants.filter(
          (v: any) => !variantsToDelete.includes(v.id),
        ),
      });
      setSelectedVariants(prev =>
        prev.filter(id => !variantsToDelete.includes(id)),
      );
      setVariantsToDelete(null);
    } catch (e) {
      toast.error("Failed to delete variant(s)");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Back to inventory">
                <Link href="/inventory">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to inventory</TooltipContent>
          </Tooltip>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900">
                {product.name}
              </h1>
              <Badge variant="outline" className="bg-zinc-100 border-zinc-200">
                {product.sku}
              </Badge>
              <select
                className="h-7 text-[10px] font-bold uppercase rounded border border-zinc-200 bg-white px-2"
                value={product.isActive ? "active" : "inactive"}
                onChange={e =>
                  setProduct({
                    ...product,
                    isActive: e.target.value === "active",
                  })
                }>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Inventory</span>
              <ChevronRight className="w-3 h-3" />
              <span>Products</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-medium text-zinc-900">{product.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-zinc-900 hover:bg-zinc-800 min-w-[120px]">
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full">
            <div className="bg-white rounded-xl p-1 border shadow-sm mb-6 inline-flex">
              <TabsList className="bg-transparent border-none p-0 h-auto">
                {[
                  { value: "overview", label: "Overview", icon: Package },
                  { value: "variants", label: "Variants", icon: Layers },
                  {
                    value: "pricing",
                    label: "Pricing & Rules",
                    icon: DollarSign,
                  },
                  { value: "units", label: "Units", icon: Scale },
                  {
                    value: "inventory",
                    label: "Stock & Locations",
                    icon: History,
                  },
                  { value: "suppliers", label: "Suppliers", icon: Truck },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-md",
                    )}>
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>
                      Update your product details and attributes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={product.name}
                        onChange={e =>
                          setProduct({ ...product, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="sku">Base SKU</Label>
                        <Input
                          id="sku"
                          value={product.sku}
                          onChange={e =>
                            setProduct({ ...product, sku: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type">Product Type</Label>
                        <select
                          id="type"
                          className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 text-sm"
                          value={product.type}
                          onChange={e =>
                            setProduct({ ...product, type: e.target.value })
                          }>
                          <option value="FINISHED_GOOD">Finished Good</option>
                          <option value="RAW_MATERIAL">Raw Material</option>
                          <option value="MERCHANDISE">Merchandise</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Product Slug</Label>
                      <div className="flex gap-2">
                        <Input
                          id="slug"
                          value={product.slug || ""}
                          onChange={e =>
                            setProduct({ ...product, slug: e.target.value })
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleGenerateSlug}
                          title="Generate slug"
                          aria-label="Generate slug">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          value={product.categoryId}
                          onChange={e =>
                            setProduct({
                              ...product,
                              categoryId: e.target.value,
                            })
                          }>
                          {categories.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={product.brand || ""}
                          onChange={e =>
                            setProduct({ ...product, brand: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rating">Product Rating (0-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={product.rating || 0}
                        onChange={e =>
                          setProduct({
                            ...product,
                            rating: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Short Description</Label>
                      <Textarea
                        id="description"
                        value={product.description || ""}
                        onChange={e =>
                          setProduct({
                            ...product,
                            description: e.target.value,
                          })
                        }
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle>Media & Assets</CardTitle>
                    <CardDescription>
                      Product images and gallery.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      value={product.imageUrls || []}
                      onChange={urls =>
                        setProduct({ ...product, imageUrls: urls })
                      }
                      maxImages={5}
                    />
                  </CardContent>
                  <CardFooter className="bg-zinc-50/50 border-t py-3">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Recommended: 1000x1000px JPG/PNG
                    </p>
                  </CardFooter>
                </Card>
              </div>

              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader>
                  <CardTitle>Detailed Description</CardTitle>
                  <CardDescription>
                    Rich text description for e-commerce and internal catalogs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Write a detailed product description..."
                    className="min-h-[200px] text-base leading-relaxed"
                    value={product.detailedDescription || ""}
                    onChange={e =>
                      setProduct({
                        ...product,
                        detailedDescription: e.target.value,
                      })
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* VARIANTS TAB */}
            <TabsContent value="variants" className="mt-0">
              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Product Variants</CardTitle>
                    <CardDescription>
                      Manage different sizes, colors, or materials.
                    </CardDescription>
                  </div>
                  <Button
                    className="gap-2 bg-zinc-900 hover:bg-zinc-800"
                    onClick={() => {
                      setEditingVariant(null);
                      setVariantForm({
                        name: "",
                        sku: `${product.sku}-${(product.variants?.length || 0) + 1}`,
                        buyingPrice: Number(
                          product.variants?.[0]?.buyingPrice || 0,
                        ),
                        retailPrice: Number(
                          product.variants?.[0]?.retailPrice || 0,
                        ),
                        initialStock: 0,
                      });
                      setIsVariantDialogOpen(true);
                    }}>
                    <Plus className="w-4 h-4" /> Add Variant
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Variant Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.variants?.map((v: any) => (
                          <TableRow key={v.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedVariants.includes(v.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedVariants([
                                      ...selectedVariants,
                                      v.id,
                                    ]);
                                  } else {
                                    setSelectedVariants(
                                      selectedVariants.filter(
                                        id => id !== v.id,
                                      ),
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-zinc-900">
                              {v.name}
                            </TableCell>
                            <TableCell className="text-zinc-500">
                              {v.sku}
                            </TableCell>
                            <TableCell className="text-zinc-500">
                              {v.barcode || "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              ${Number(v.retailPrice || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="font-bold">
                                {v.variantStocks?.reduce(
                                  (acc: number, s: any) =>
                                    acc + Number(s.currentStock),
                                  0,
                                ) || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {v.isActive ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] uppercase font-bold">
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="More options">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>More options</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingVariant(v);
                                      setVariantForm({
                                        name: v.name,
                                        sku: v.sku,
                                        barcode: v.barcode || "",
                                        buyingPrice: Number(v.buyingPrice),
                                        retailPrice: Number(v.retailPrice),
                                        initialStock: 0,
                                        isActive: v.isActive,
                                        attributes: v.attributes || {},
                                        pointsOnPurchase: v.pointsOnPurchase || 0,
                                        loyaltyPointsOverride: v.loyaltyPointsOverride || 0,
                                        requiresExpiryTracking: v.requiresExpiryTracking ?? true,
                                        expiryWarningDays: v.expiryWarningDays || 2,
                                        defaultShelfLifeDays: v.defaultShelfLifeDays || 0,
                                        requiresSerialNumber: v.requiresSerialNumber ?? false,
                                        wholesalePrice: Number(v.wholesalePrice || 0),
                                        promotionalPrice: Number(v.promotionalPrice || 0),
                                        isPopular: v.isPopular ?? false,
                                        isNew: v.isNew ?? false,
                                      });
                                      setIsVariantDialogOpen(true);
                                    }}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                    Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <ImageIcon className="w-4 h-4 mr-2" />{" "}
                                    Manage Media
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    disabled={product.variants?.length <= 1}
                                    onClick={() => setVariantsToDelete([v.id])}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">
                      Bulk Actions ({selectedVariants.length}):
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedVariants.length === 0}
                      onClick={() => handleBulkStatusUpdate(true)}>
                      Mark Active
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      disabled={
                        selectedVariants.length === 0 ||
                        selectedVariants.length >=
                          (product.variants?.length || 0)
                      }
                      onClick={() => setVariantsToDelete(selectedVariants)}>
                      Delete Selected
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* UNITS TAB */}
            <TabsContent value="units" className="space-y-6 mt-0">
              {product.variants?.map((variant: any) => (
                <Card
                  key={variant.id}
                  className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle>Units for Variant: {variant.name}</CardTitle>
                    <CardDescription>
                      Configure primary and selling units.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label>Base Unit (Primary Inventory Unit)</Label>
                        <select
                          className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 text-sm"
                          value={
                            variant.baseUnitId || variant.baseOrgUnitId || ""
                          }
                          onChange={async e => {
                            const val = e.target.value;
                            const isOrg = organizationUnits.some(
                              (u: any) => u.id === val,
                            );
                            const updatedVariant = {
                              ...variant,
                              baseUnitId: isOrg ? null : val,
                              baseOrgUnitId: isOrg ? val : null,
                            };
                            await updateVariantUnits(
                              variant.id,
                              updatedVariant,
                            );
                            setProduct({
                              ...product,
                              variants: product.variants.map((v: any) =>
                                v.id === variant.id ? updatedVariant : v,
                              ),
                            });
                            toast.success("Units updated");
                          }}>
                          <option value="">Select Unit...</option>
                          <optgroup label="System Units">
                            {systemUnits.map((u: any) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.symbol})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Organization Units">
                            {organizationUnits.map((u: any) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.symbol})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <Label>Stocking Unit (Purchasing Unit)</Label>
                        <select
                          className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 text-sm"
                          value={
                            variant.stockingUnitId ||
                            variant.stockingOrgUnitId ||
                            ""
                          }
                          onChange={async e => {
                            const val = e.target.value;
                            const isOrg = organizationUnits.some(
                              (u: any) => u.id === val,
                            );
                            const updatedVariant = {
                              ...variant,
                              stockingUnitId: isOrg ? null : val,
                              stockingOrgUnitId: isOrg ? val : null,
                            };
                            await updateVariantUnits(
                              variant.id,
                              updatedVariant,
                            );
                            setProduct({
                              ...product,
                              variants: product.variants.map((v: any) =>
                                v.id === variant.id ? updatedVariant : v,
                              ),
                            });
                            toast.success("Units updated");
                          }}>
                          <option value="">Select Unit...</option>
                          <optgroup label="System Units">
                            {systemUnits.map((u: any) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.symbol})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Organization Units">
                            {organizationUnits.map((u: any) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.symbol})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-bold">
                          Selling Units
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={async () => {
                            const newSellingUnits = [
                              ...(variant.sellingUnits || []),
                              {
                                systemUnitId: null,
                                orgUnitId: null,
                                retailPrice: Number(variant.retailPrice),
                                conversionMultiplier: 1,
                                isActive: true,
                              },
                            ];
                            await updateVariantUnits(variant.id, {
                              ...variant,
                              sellingUnits: newSellingUnits,
                            });
                            setProduct({
                              ...product,
                              variants: product.variants.map((v: any) =>
                                v.id === variant.id
                                  ? { ...v, sellingUnits: newSellingUnits }
                                  : v,
                              ),
                            });
                            toast.success("Selling unit added");
                          }}>
                          <PlusCircle className="w-4 h-4" /> Add Selling Unit
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Unit</TableHead>
                            <TableHead>Conversion Multiplier</TableHead>
                            <TableHead>Retail Price</TableHead>
                            <TableHead>Wholesale Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variant.sellingUnits?.map((su: any, idx: number) => (
                            <TableRow key={su.id || idx}>
                              <TableCell>
                                <select
                                  className="w-full h-9 px-2 rounded border border-zinc-200 text-xs"
                                  value={su.systemUnitId || su.orgUnitId || ""}
                                  onChange={async e => {
                                    const val = e.target.value;
                                    const isOrg = organizationUnits.some(
                                      (u: any) => u.id === val,
                                    );
                                    const updated = [...variant.sellingUnits];
                                    updated[idx] = {
                                      ...su,
                                      systemUnitId: isOrg ? null : val,
                                      orgUnitId: isOrg ? val : null,
                                    };
                                    await updateVariantUnits(variant.id, {
                                      ...variant,
                                      sellingUnits: updated,
                                    });
                                    setProduct({
                                      ...product,
                                      variants: product.variants.map(
                                        (v: any) =>
                                          v.id === variant.id
                                            ? { ...v, sellingUnits: updated }
                                            : v,
                                      ),
                                    });
                                  }}>
                                  <option value="">Select...</option>
                                  <optgroup label="System Units">
                                    {systemUnits.map((u: any) => (
                                      <option key={u.id} value={u.id}>
                                        {u.symbol}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Organization Units">
                                    {organizationUnits.map((u: any) => (
                                      <option key={u.id} value={u.id}>
                                        {u.symbol}
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="h-9"
                                  value={su.conversionMultiplier}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    const updated = [...variant.sellingUnits];
                                    updated[idx] = {
                                      ...su,
                                      conversionMultiplier: val,
                                    };
                                    setProduct({
                                      ...product,
                                      variants: product.variants.map(
                                        (v: any) =>
                                          v.id === variant.id
                                            ? { ...v, sellingUnits: updated }
                                            : v,
                                      ),
                                    });
                                  }}
                                  onBlur={() => {
                                    updateVariantUnits(variant.id, {
                                      ...variant,
                                      sellingUnits: variant.sellingUnits,
                                    });
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="h-9"
                                  value={su.wholesalePrice || ""}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    const updated = [...variant.sellingUnits];
                                    updated[idx] = {
                                      ...su,
                                      wholesalePrice: val,
                                    };
                                    setProduct({
                                      ...product,
                                      variants: product.variants.map(
                                        (v: any) =>
                                          v.id === variant.id
                                            ? { ...v, sellingUnits: updated }
                                            : v,
                                      ),
                                    });
                                  }}
                                  onBlur={() => {
                                    updateVariantUnits(variant.id, {
                                      ...variant,
                                      sellingUnits: variant.sellingUnits,
                                    });
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="h-9"
                                  value={su.retailPrice}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    const updated = [...variant.sellingUnits];
                                    updated[idx] = { ...su, retailPrice: val };
                                    setProduct({
                                      ...product,
                                      variants: product.variants.map(
                                        (v: any) =>
                                          v.id === variant.id
                                            ? { ...v, sellingUnits: updated }
                                            : v,
                                      ),
                                    });
                                  }}
                                  onBlur={() => {
                                    updateVariantUnits(variant.id, {
                                      ...variant,
                                      sellingUnits: variant.sellingUnits,
                                    });
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    su.isActive ? "default" : "secondary"
                                  }>
                                  {su.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={async () => {
                                    const updated = variant.sellingUnits.filter(
                                      (_: any, i: number) => i !== idx,
                                    );
                                    await updateVariantUnits(variant.id, {
                                      ...variant,
                                      sellingUnits: updated,
                                    });
                                    setProduct({
                                      ...product,
                                      variants: product.variants.map(
                                        (v: any) =>
                                          v.id === variant.id
                                            ? { ...v, sellingUnits: updated }
                                            : v,
                                      ),
                                    });
                                    toast.success("Selling unit removed");
                                  }}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* PRICING TAB */}
            <TabsContent value="pricing" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Retail Price</CardTitle>
                    <CardDescription>Default selling price.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                      <Input
                        className="pl-9 text-2xl font-bold h-14"
                        value={Number(product.variants?.[0]?.retailPrice || 0)}
                        onChange={e => {
                          const updatedVariants = [...product.variants];
                          updatedVariants[0] = {
                            ...updatedVariants[0],
                            retailPrice: Number(e.target.value),
                          };
                          setProduct({ ...product, variants: updatedVariants });
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Cost Price</CardTitle>
                    <CardDescription>
                      Base manufacturing/buying cost.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                      <Input
                        className="pl-9 text-2xl font-bold h-14"
                        value={Number(product.variants?.[0]?.buyingPrice || 0)}
                        onChange={e => {
                          const updatedVariants = [...product.variants];
                          updatedVariants[0] = {
                            ...updatedVariants[0],
                            buyingPrice: Number(e.target.value),
                          };
                          setProduct({ ...product, variants: updatedVariants });
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Margin</CardTitle>
                    <CardDescription>
                      Estimated profit percentage.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-14 flex items-center">
                    <span className="text-3xl font-black text-emerald-600">
                      {(
                        (1 -
                          Number(product.variants?.[0]?.buyingPrice || 0) /
                            Number(product.variants?.[0]?.retailPrice || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader>
                  <CardTitle>Loyalty & Points</CardTitle>
                  <CardDescription>
                    Configure points earned on purchase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Base Points (Product Level)</Label>
                    <Input
                      type="number"
                      value={product.pointsOnPurchase || 0}
                      onChange={e =>
                        setProduct({
                          ...product,
                          pointsOnPurchase: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points Override</Label>
                    <Input
                      type="number"
                      value={product.loyaltyPointsOverride || 0}
                      onChange={e =>
                        setProduct({
                          ...product,
                          loyaltyPointsOverride: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Price Lists & Rules</CardTitle>
                    <CardDescription>
                      Assign special pricing for customer segments or events.
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" /> Create Rule
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-zinc-50 rounded-xl p-6 border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center">
                      <Tag className="w-12 h-12 text-zinc-200 mb-4" />
                      <h4 className="font-bold text-zinc-900 mb-1">
                        No custom pricing rules found
                      </h4>
                      <p className="text-sm text-zinc-500 max-w-[300px]">
                        Create rules to offer discounts for bulk orders,
                        specific seasons or VIP customers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-6 mt-0">
              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Automated Reorder Rules</CardTitle>
                    <CardDescription>
                      Manage thresholds and auto-replenishment settings.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      const newRule = {
                        productId: product.id,
                        locationId: locations[0]?.id,
                        minQuantity: 5,
                        maxQuantity: 20,
                        reorderQuantity: 15,
                        isActive: true,
                        autoGenerate: false,
                      };
                      const rule = await updateReorderRule(newRule);
                      setProduct({
                        ...product,
                        reorderRules: [
                          ...(product.reorderRules || []),
                          { ...rule, location: locations[0] },
                        ],
                      });
                      toast.success("Reorder rule added");
                    }}>
                    <PlusCircle className="w-4 h-4" /> Add Rule
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Threshold (Min/Max)</TableHead>
                        <TableHead>Order Qty</TableHead>
                        <TableHead>Preferred Supplier</TableHead>
                        <TableHead>Auto</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.reorderRules?.map((rule: any) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">
                            {rule.location?.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-16 h-8 text-xs"
                                value={Number(rule.minQuantity)}
                                onChange={async e => {
                                  const val = Number(e.target.value);
                                  await updateReorderRule({
                                    ...rule,
                                    minQuantity: val,
                                  });
                                  setProduct({
                                    ...product,
                                    reorderRules: product.reorderRules.map(
                                      (r: any) =>
                                        r.id === rule.id
                                          ? { ...r, minQuantity: val }
                                          : r,
                                    ),
                                  });
                                }}
                              />
                              <span className="text-zinc-400">/</span>
                              <Input
                                type="number"
                                className="w-16 h-8 text-xs"
                                value={Number(rule.maxQuantity)}
                                onChange={async e => {
                                  const val = Number(e.target.value);
                                  await updateReorderRule({
                                    ...rule,
                                    maxQuantity: val,
                                  });
                                  setProduct({
                                    ...product,
                                    reorderRules: product.reorderRules.map(
                                      (r: any) =>
                                        r.id === rule.id
                                          ? { ...r, maxQuantity: val }
                                          : r,
                                    ),
                                  });
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-16 h-8 text-xs"
                              value={Number(rule.reorderQuantity)}
                              onChange={async e => {
                                const val = Number(e.target.value);
                                await updateReorderRule({
                                  ...rule,
                                  reorderQuantity: val,
                                });
                                setProduct({
                                  ...product,
                                  reorderRules: product.reorderRules.map(
                                    (r: any) =>
                                      r.id === rule.id
                                        ? { ...r, reorderQuantity: val }
                                        : r,
                                  ),
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              className="h-8 rounded border border-zinc-200 text-xs"
                              value={rule.preferredSupplierId || ""}
                              onChange={async e => {
                                const val = e.target.value || null;
                                await updateReorderRule({
                                  ...rule,
                                  preferredSupplierId: val,
                                });
                                setProduct({
                                  ...product,
                                  reorderRules: product.reorderRules.map(
                                    (r: any) =>
                                      r.id === rule.id
                                        ? { ...r, preferredSupplierId: val }
                                        : r,
                                  ),
                                });
                              }}>
                              <option value="">None</option>
                              {suppliers.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={rule.autoGenerate}
                              onChange={async e => {
                                const val = e.target.checked;
                                await updateReorderRule({
                                  ...rule,
                                  autoGenerate: val,
                                });
                                setProduct({
                                  ...product,
                                  reorderRules: product.reorderRules.map(
                                    (r: any) =>
                                      r.id === rule.id
                                        ? { ...r, autoGenerate: val }
                                        : r,
                                  ),
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={rule.isActive ? "default" : "secondary"}>
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!product.reorderRules ||
                        product.reorderRules.length === 0) && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-24 text-center text-zinc-500 italic">
                            No reorder rules configured.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader>
                  <CardTitle>Stock by Location</CardTitle>
                  <CardDescription>
                    Real-time inventory levels across your warehouses and
                    stores.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Reserved</TableHead>
                        <TableHead className="text-right">On Hand</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((loc: any) => {
                        const variantStocks =
                          product.variants?.[0]?.variantStocks?.filter(
                            (s: any) => s.locationId === loc.id,
                          ) || [];
                        return (
                          <TableRow key={loc.id}>
                            <TableCell className="font-bold">
                              {loc.name}
                            </TableCell>
                            <TableCell className="text-zinc-500">
                              Default
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {variantStocks[0]?.availableStock
                                ? Number(variantStocks[0].availableStock)
                                : 0}
                            </TableCell>
                            <TableCell className="text-right text-zinc-400">
                              0
                            </TableCell>
                            <TableCell className="text-right font-bold text-zinc-900">
                              {variantStocks[0]?.currentStock
                                ? Number(variantStocks[0].currentStock)
                                : 0}
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View location details">
                                    <ChevronRight className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  View location details
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader>
                  <CardTitle>Inventory Settings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-bold">
                          Low Stock Threshold
                        </Label>
                        <p className="text-sm text-zinc-500">
                          Global threshold for stock alerts.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="threshold">Alert Threshold</Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={product.lowStockThreshold || 0}
                        onChange={e =>
                          setProduct({
                            ...product,
                            lowStockThreshold: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-bold">
                          Product Rating & Visibility
                        </Label>
                        <p className="text-sm text-zinc-500">
                          Manage featured status and ratings.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isFeatured"
                          checked={product.isFeatured}
                          onChange={e =>
                            setProduct({
                              ...product,
                              isFeatured: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor="isFeatured">Featured</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isNew"
                          checked={product.isNew}
                          onChange={e =>
                            setProduct({ ...product, isNew: e.target.checked })
                          }
                        />
                        <Label htmlFor="isNew">New Arrival</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SUPPLIERS TAB */}
            <TabsContent value="suppliers" className="mt-0">
              <Card className="border-none shadow-sm ring-1 ring-zinc-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Assigned Suppliers</CardTitle>
                    <CardDescription>
                      Who you buy this product from.
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" /> Link Supplier
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Supplier SKU</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Lead Time</TableHead>
                        <TableHead>Preferred</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.suppliers?.length > 0 ? (
                        product.suppliers.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-bold text-zinc-900">
                              {s.supplier.name}
                            </TableCell>
                            <TableCell className="text-zinc-500">
                              {s.supplierSku || "-"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${Number(s.costPrice).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {s.leadTimeDays || "7"} days
                            </TableCell>
                            <TableCell>
                              {s.isPreferred ? (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                  YES
                                </Badge>
                              ) : (
                                <Badge variant="secondary">NO</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="More options">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>More options</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    View Supplier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Update Pricing
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    Unlink Supplier
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-40 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                              <Truck className="w-8 h-8" />
                              <p className="text-sm font-medium">
                                No suppliers linked to this product.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-zinc-200 overflow-hidden">
            <div className="aspect-square relative bg-zinc-100">
              {product.imageUrls?.[0] ? (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-16 h-16 text-zinc-300" />
                </div>
              )}
            </div>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-sm text-zinc-500 font-medium">
                    Global Stock
                  </span>
                  <span className="text-lg font-black text-zinc-900">
                    {product.variants?.reduce(
                      (acc: number, v: any) =>
                        acc +
                        (v.variantStocks?.reduce(
                          (sa: number, s: any) => sa + Number(s.currentStock),
                          0,
                        ) || 0),
                      0,
                    )}
                  </span>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Quick Actions
                  </h4>
                  <Button
                    className="w-full justify-start gap-2 h-11"
                    variant="outline">
                    <ExternalLink className="w-4 h-4" /> View Storefront
                  </Button>
                  <Button
                    className="w-full justify-start gap-2 h-11"
                    variant="outline">
                    <History className="w-4 h-4" /> Audit History
                  </Button>
                  <Button
                    className="w-full justify-start gap-2 h-11"
                    variant="outline">
                    <Layers className="w-4 h-4" /> Duplicate Product
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-zinc-200">
            <CardHeader>
              <CardTitle className="text-base">Tags & Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Add tag and press Enter..."
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter") {
                      const val = e.currentTarget.value.trim();
                      if (val && !product.tags?.includes(val)) {
                        setProduct({
                          ...product,
                          tags: [...(product.tags || []), val],
                        });
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.tags?.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-zinc-100 border-zinc-200 hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setProduct({
                          ...product,
                          tags: product.tags.filter((t: string) => t !== tag),
                        });
                      }}>
                      {tag} <XCircle className="w-3 h-3" />
                    </Badge>
                  )) || (
                    <span className="text-xs text-zinc-400 italic">
                      No tags added
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-2 pt-4 border-t">
                <Label className="text-xs font-bold uppercase text-zinc-400">
                  Created At
                </Label>
                <p className="text-sm font-medium text-zinc-600">
                  {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-zinc-400">
                  Last Updated
                </Label>
                <p className="text-sm font-medium text-zinc-600">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={!!variantsToDelete}
        onOpenChange={open => !open && setVariantsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected variant(s) and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleDeleteVariants();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Edit Variant" : "Add New Variant"}
            </DialogTitle>
            <DialogDescription>
              {editingVariant
                ? "Update the details of your variant."
                : "Create a new variant for this product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh] px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-name">Variant Name</Label>
                <Input
                  id="v-name"
                  placeholder="e.g. XL / Red"
                  value={variantForm.name}
                  onChange={e =>
                    setVariantForm({ ...variantForm, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-sku">SKU</Label>
                <Input
                  id="v-sku"
                  value={variantForm.sku}
                  onChange={e =>
                    setVariantForm({ ...variantForm, sku: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-reorder-point">Reorder Point</Label>
                <Input
                  id="v-reorder-point"
                  type="number"
                  value={variantForm.reorderPoint || 0}
                  onChange={e =>
                    setVariantForm({
                      ...variantForm,
                      reorderPoint: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-reorder-qty">Reorder Qty</Label>
                <Input
                  id="v-reorder-qty"
                  type="number"
                  value={variantForm.reorderQty || 0}
                  onChange={e =>
                    setVariantForm({
                      ...variantForm,
                      reorderQty: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="v-barcode">Barcode</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                      onClick={() => {
                        const randomNum = Math.floor(100000000000 + Math.random() * 900000000000).toString();
                        setVariantForm((prev: any) => ({ ...prev, barcode: randomNum }));
                      }}>
                      (Generate)
                    </Button>
                  </div>
                  <span className="text-[10px] text-green-600 font-medium flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Scanner Ready
                  </span>
                </div>
                <Input
                  id="v-barcode"
                  value={variantForm.barcode || ""}
                  onChange={e =>
                    setVariantForm({ ...variantForm, barcode: e.target.value })
                  }
                  placeholder="Scan or enter barcode"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-status">Status</Label>
                <select
                  id="v-status"
                  className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 text-sm"
                  value={variantForm.isActive ? "true" : "false"}
                  onChange={e =>
                    setVariantForm({
                      ...variantForm,
                      isActive: e.target.value === "true",
                    })
                  }>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="v-buying">Buying Price</Label>
                <Input
                  id="v-buying"
                  type="number"
                  value={variantForm.buyingPrice}
                  onChange={e =>
                    setVariantForm({
                      ...variantForm,
                      buyingPrice: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="v-retail">Retail Price</Label>
                <Input
                  id="v-retail"
                  type="number"
                  value={variantForm.retailPrice}
                  onChange={e =>
                    setVariantForm({
                      ...variantForm,
                      retailPrice: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="font-bold">Loyalty Points</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="v-points">Base Points</Label>
                  <Input
                    id="v-points"
                    type="number"
                    value={variantForm.pointsOnPurchase}
                    onChange={e =>
                      setVariantForm({
                        ...variantForm,
                        pointsOnPurchase: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="v-points-override">Points Override</Label>
                  <Input
                    id="v-points-override"
                    type="number"
                    value={variantForm.loyaltyPointsOverride}
                    onChange={e =>
                      setVariantForm({
                        ...variantForm,
                        loyaltyPointsOverride: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="font-bold">Expiration & Serial Tracking</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="v-expiry-tracking"
                    checked={variantForm.requiresExpiryTracking}
                    onChange={e =>
                      setVariantForm({
                        ...variantForm,
                        requiresExpiryTracking: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="v-expiry-tracking">Expiry Tracking</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="v-serial-tracking"
                    checked={variantForm.requiresSerialNumber}
                    onChange={e =>
                      setVariantForm({
                        ...variantForm,
                        requiresSerialNumber: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="v-serial-tracking">Serial Tracking</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="v-expiry-warning">Warning Days</Label>
                  <Input
                    id="v-expiry-warning"
                    type="number"
                    value={variantForm.expiryWarningDays}
                    onChange={e =>
                      setVariantForm({
                        ...variantForm,
                        expiryWarningDays: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="v-shelf-life">Shelf Life Days</Label>
                  <Input
                    id="v-shelf-life"
                    type="number"
                    value={variantForm.defaultShelfLifeDays}
                    onChange={e =>
                      setVariantForm({
                        ...variantForm,
                        defaultShelfLifeDays: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {!editingVariant && (
              <div className="grid gap-2">
                <Label htmlFor="v-stock">Initial Stock</Label>
                <Input
                  id="v-stock"
                  type="number"
                  value={variantForm.initialStock}
                  onChange={e =>
                    setVariantForm({
                      ...variantForm,
                      initialStock: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="font-bold">Variant Attributes</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const key = prompt("Attribute name (e.g. Color)");
                    if (key) {
                      setVariantForm({
                        ...variantForm,
                        attributes: { ...variantForm.attributes, [key]: "" },
                      });
                    }
                  }}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
              {Object.entries(variantForm.attributes || {}).map(
                ([key, value]: [string, any]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <Badge variant="outline" className="min-w-[80px]">
                      {key}
                    </Badge>
                    <Input
                      value={value}
                      onChange={e =>
                        setVariantForm({
                          ...variantForm,
                          attributes: {
                            ...variantForm.attributes,
                            [key]: e.target.value,
                          },
                        })
                      }
                      placeholder="Value..."
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const updated = { ...variantForm.attributes };
                        delete updated[key];
                        setVariantForm({ ...variantForm, attributes: updated });
                      }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ),
              )}
              {Object.keys(variantForm.attributes || {}).length === 0 && (
                <p className="text-xs text-zinc-400 italic">
                  No attributes defined.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVariantDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-zinc-900"
              onClick={async () => {
                try {
                  if (editingVariant) {
                    await updateVariant(editingVariant.id, {
                      ...variantForm,
                      buyingPrice: Number(variantForm.buyingPrice),
                      retailPrice: Number(variantForm.retailPrice),
                      reorderPoint: Number(variantForm.reorderPoint || 0),
                      reorderQty: Number(variantForm.reorderQty || 0),
                      pointsOnPurchase: Number(variantForm.pointsOnPurchase),
                      loyaltyPointsOverride: Number(
                        variantForm.loyaltyPointsOverride,
                      ),
                      defaultShelfLifeDays: Number(
                        variantForm.defaultShelfLifeDays,
                      ),
                      expiryWarningDays: Number(variantForm.expiryWarningDays),
                      wholesalePrice: Number(variantForm.wholesalePrice),
                      promotionalPrice: Number(variantForm.promotionalPrice),
                      isPopular: variantForm.isPopular,
                      isNew: variantForm.isNew,
                    });
                    toast.success("Variant updated");
                    // Manually update local state for better UX
                    setProduct({
                      ...product,
                      variants: product.variants.map((v: any) =>
                        v.id === editingVariant.id
                          ? { ...v, ...variantForm }
                          : v,
                      ),
                    });
                  } else {
                    const newVariant = await createVariant({
                      productId: product.id,
                      ...variantForm,
                      buyingPrice: Number(variantForm.buyingPrice),
                      retailPrice: Number(variantForm.retailPrice),
                      initialStock: Number(variantForm.initialStock || 0),
                      pointsOnPurchase: Number(variantForm.pointsOnPurchase),
                      loyaltyPointsOverride: Number(
                        variantForm.loyaltyPointsOverride,
                      ),
                      defaultShelfLifeDays: Number(
                        variantForm.defaultShelfLifeDays,
                      ),
                      expiryWarningDays: Number(variantForm.expiryWarningDays),
                      wholesalePrice: Number(variantForm.wholesalePrice),
                      promotionalPrice: Number(variantForm.promotionalPrice),
                      isPopular: variantForm.isPopular,
                      isNew: variantForm.isNew,
                    });
                    toast.success("Variant created");
                    // Add to local state
                    setProduct({
                      ...product,
                      variants: [
                        ...(product.variants || []),
                        {
                          ...newVariant,
                          variantStocks: [
                            { currentStock: variantForm.initialStock },
                          ], // Mock for display
                        },
                      ],
                    });
                  }
                  setIsVariantDialogOpen(false);
                } catch (e) {
                  toast.error("Operation failed");
                }
              }}>
              {editingVariant ? "Save Changes" : "Create Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
