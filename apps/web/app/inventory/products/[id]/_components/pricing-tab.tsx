"use client";

import { useOrganizationStore } from "../../../../../lib/stores/organization-store";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Tag,
  Plus,
  TrendingUp,
  Percent,
  Layers,
  Trash2,
  Package,
  ShoppingBag,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Badge } from "@repo/ui/components/ui/badge";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { toast } from "sonner";
import {
  getProductPricingDetails,
  createVolumeTierForProduct,
  deleteVolumeTier,
  createProductPricingRule,
  deleteProductPricingRule,
  createProductPricingBundle,
  deleteProductPricingBundle,
} from "../../../../actions/pricing";

interface PricingTabProps {
  product: any;
  setProduct: (v: any) => void;
}

export function PricingTab({ product, setProduct }: PricingTabProps) {
  const { currency, currencySymbol: storeSymbol } = useOrganizationStore();
  const currencySymbol = storeSymbol || "$";
  const retailPrice = Number(product.variants?.[0]?.retailPrice || 0);
  const buyingPrice = Number(product.variants?.[0]?.buyingPrice || 0);
  const marginPercentage =
    retailPrice > 0 ? ((1 - buyingPrice / retailPrice) * 100).toFixed(1) : "0.0";

  const [pricingData, setPricingData] = useState<{
    priceListItems: any[];
    pricingRules: any[];
    bundles: any[];
    priceLists: any[];
  }>({
    priceListItems: [],
    pricingRules: [],
    bundles: [],
    priceLists: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Dialog States
  const [isVolumeTierOpen, setIsVolumeTierOpen] = useState(false);
  const [isBundleOpen, setIsBundleOpen] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Volume Tier Form State
  const [volumeForm, setVolumeForm] = useState({
    variantId: product.variants?.[0]?.id || "",
    minQuantity: 5,
    maxQuantity: "",
    price: retailPrice > 0 ? Number((retailPrice * 0.9).toFixed(2)) : 0,
    wholesalePrice: "",
    priceListId: "",
  });

  // Bundle Form State
  const [bundleForm, setBundleForm] = useState({
    variantId: product.variants?.[0]?.id || "",
    name: "Buy 3 Pack Special",
    description: "Get a special discounted package price when buying 3 items",
    bundleType: "FIXED" as "FIXED" | "DYNAMIC",
    buyQuantity: 3,
    bundlePrice: retailPrice > 0 ? Number((retailPrice * 2.5).toFixed(2)) : 0,
    getQuantity: 1,
    getDiscountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT" | "FIXED_PRICE",
    getDiscountValue: 50,
  });

  // Pricing Rule Form State
  const [ruleForm, setRuleForm] = useState({
    variantId: "ALL",
    name: "Bulk Order Discount",
    description: "Special percentage off for high volume orders",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT" | "FIXED_PRICE",
    discountValue: 10,
    minQuantity: 10,
    minOrderValue: 0,
    priceListId: "",
  });

  const variants = product.variants || [];

  const loadPricingData = async () => {
    try {
      setIsLoading(true);
      const res = await getProductPricingDetails(product.id);
      if (res) {
        setPricingData({
          priceListItems: res.priceListItems || [],
          pricingRules: res.pricingRules || [],
          bundles: res.bundles || [],
          priceLists: res.priceLists || [],
        });
      }
    } catch (e) {
      console.error("Failed to load product pricing details", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (product.id) {
      loadPricingData();
    }
  }, [product.id]);

  // Volume Tier Handlers
  const handleAddVolumeTier = async () => {
    if (!volumeForm.variantId) {
      return toast.error("Please select a product variant");
    }
    if (Number(volumeForm.minQuantity) <= 1) {
      return toast.error("Minimum quantity for a volume tier must be greater than 1");
    }
    if (Number(volumeForm.price) <= 0) {
      return toast.error("Tier price must be greater than 0");
    }

    try {
      setIsSubmitting(true);
      await createVolumeTierForProduct({
        productId: product.id,
        variantId: volumeForm.variantId,
        minQuantity: Number(volumeForm.minQuantity),
        maxQuantity: volumeForm.maxQuantity ? Number(volumeForm.maxQuantity) : null,
        price: Number(volumeForm.price),
        wholesalePrice: volumeForm.wholesalePrice ? Number(volumeForm.wholesalePrice) : null,
        priceListId: volumeForm.priceListId || undefined,
      });
      toast.success("Volume pricing tier added successfully");
      setIsVolumeTierOpen(false);
      await loadPricingData();
    } catch (e) {
      toast.error("Failed to create volume pricing tier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVolumeTier = async (id: string) => {
    try {
      setIsDeleting(id);
      await deleteVolumeTier(id, product.id);
      toast.success("Volume pricing tier removed");
      await loadPricingData();
    } catch (e) {
      toast.error("Failed to remove volume tier");
    } finally {
      setIsDeleting(null);
    }
  };

  // Bundle Handlers
  const handleAddBundle = async () => {
    if (!bundleForm.variantId) {
      return toast.error("Please select a product variant");
    }
    if (!bundleForm.name.trim()) {
      return toast.error("Please enter a rule/bundle name");
    }
    if (Number(bundleForm.buyQuantity) <= 0) {
      return toast.error("Buy quantity must be at least 1");
    }

    try {
      setIsSubmitting(true);
      await createProductPricingBundle({
        productId: product.id,
        variantId: bundleForm.variantId,
        name: bundleForm.name.trim(),
        description: bundleForm.description.trim() || undefined,
        bundleType: bundleForm.bundleType,
        bundlePrice: bundleForm.bundleType === "FIXED" ? Number(bundleForm.bundlePrice) : null,
        buyQuantity: Number(bundleForm.buyQuantity),
        getQuantity: bundleForm.bundleType === "DYNAMIC" ? Number(bundleForm.getQuantity) : null,
        getDiscountType: bundleForm.bundleType === "DYNAMIC" ? bundleForm.getDiscountType : null,
        getDiscountValue: bundleForm.bundleType === "DYNAMIC" ? Number(bundleForm.getDiscountValue) : null,
      });
      toast.success("Multi-buy pricing rule created");
      setIsBundleOpen(false);
      await loadPricingData();
    } catch (e) {
      toast.error("Failed to create multi-buy rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBundle = async (id: string) => {
    try {
      setIsDeleting(id);
      await deleteProductPricingBundle(id, product.id);
      toast.success("Multi-buy rule removed");
      await loadPricingData();
    } catch (e) {
      toast.error("Failed to remove multi-buy rule");
    } finally {
      setIsDeleting(null);
    }
  };

  // Rule Handlers
  const handleAddRule = async () => {
    if (!ruleForm.name.trim()) {
      return toast.error("Please provide a rule name");
    }
    if (Number(ruleForm.discountValue) <= 0) {
      return toast.error("Discount value must be greater than 0");
    }

    try {
      setIsSubmitting(true);
      await createProductPricingRule({
        productId: product.id,
        variantId: ruleForm.variantId === "ALL" ? null : ruleForm.variantId,
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        discountType: ruleForm.discountType,
        discountValue: Number(ruleForm.discountValue),
        minQuantity: ruleForm.minQuantity ? Number(ruleForm.minQuantity) : null,
        minOrderValue: ruleForm.minOrderValue ? Number(ruleForm.minOrderValue) : null,
        priceListId: ruleForm.priceListId || undefined,
      });
      toast.success("Pricing rule created");
      setIsRuleOpen(false);
      await loadPricingData();
    } catch (e) {
      toast.error("Failed to create pricing rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      setIsDeleting(id);
      await deleteProductPricingRule(id, product.id);
      toast.success("Pricing rule removed");
      await loadPricingData();
    } catch (e) {
      toast.error("Failed to remove pricing rule");
    } finally {
      setIsDeleting(null);
    }
  };

  const volumeTiers = pricingData.priceListItems.filter(item => Number(item.minQuantity) > 1);

  return (
    <div className="space-y-8 mt-0">
      {/* 1. Base Prices & Margin Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Base Retail Price
              </CardTitle>
              <CardDescription className="text-xs">
                Default selling price
              </CardDescription>
            </div>
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="number"
                step="0.01"
                className="pl-8 text-lg font-bold h-10"
                value={retailPrice}
                onChange={e => {
                  const updatedVariants = [...(product.variants || [])];
                  if (updatedVariants[0]) {
                    updatedVariants[0] = {
                      ...updatedVariants[0],
                      retailPrice: Number(e.target.value),
                    };
                    setProduct({ ...product, variants: updatedVariants });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Base Cost Price
              </CardTitle>
              <CardDescription className="text-xs">
                Base buying/manufacturing cost
              </CardDescription>
            </div>
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="number"
                step="0.01"
                className="pl-8 text-lg font-bold h-10"
                value={buyingPrice}
                onChange={e => {
                  const updatedVariants = [...(product.variants || [])];
                  if (updatedVariants[0]) {
                    updatedVariants[0] = {
                      ...updatedVariants[0],
                      buyingPrice: Number(e.target.value),
                    };
                    setProduct({ ...product, variants: updatedVariants });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Profit Margin
              </CardTitle>
              <CardDescription className="text-xs">
                Estimated profit percentage
              </CardDescription>
            </div>
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-10 flex items-center justify-between px-3 bg-muted/50 rounded-md border border-border">
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {marginPercentage}%
              </span>
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Loyalty & Points */}
      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Loyalty & Points Configuration
          </CardTitle>
          <CardDescription>
            Configure reward points earned when purchasing this product.
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

      {/* 3. Volume & Quantity Pricing Tiers */}
      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              Volume & Quantity Pricing Tiers
            </CardTitle>
            <CardDescription>
              Set reduced unit pricing for customers buying above specific unit quantities.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsVolumeTierOpen(true)}
            variant="outline"
            className="gap-2">
            <Plus className="w-4 h-4" /> Add Quantity Tier
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading volume tiers...
            </div>
          ) : volumeTiers.length === 0 ? (
            <div className="bg-muted/40 rounded-xl p-6 border border-dashed border-border flex flex-col items-center justify-center text-center">
              <SlidersHorizontal className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <h4 className="font-semibold text-foreground text-sm mb-1">
                No quantity tiers defined
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Offer bulk quantity discounts (e.g. 10+ units @ {currencySymbol}8.00, 50+ units @ {currencySymbol}6.50) to incentivize higher volume sales.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsVolumeTierOpen(true)}
                className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create First Volume Tier
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Min Quantity</TableHead>
                  <TableHead>Max Quantity</TableHead>
                  <TableHead>Tier Unit Price</TableHead>
                  <TableHead>Wholesale Price</TableHead>
                  <TableHead>Price List</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumeTiers.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.variant?.name || "Variant"}
                      {item.variant?.sku && (
                        <span className="block text-xs text-muted-foreground">
                          {item.variant.sku}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        ≥ {item.minQuantity} units
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.maxQuantity ? `${item.maxQuantity} units` : "∞"}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Number(item.price), currency)}
                    </TableCell>
                    <TableCell>
                      {item.wholesalePrice ? formatCurrency(Number(item.wholesalePrice), currency) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {item.priceList?.name || "Global Store"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isDeleting === item.id}
                        onClick={() => handleDeleteVolumeTier(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                        {isDeleting === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 4. Grouped & Multi-Buy Rules */}
      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-500" />
              Grouped & Multi-Buy Rules
            </CardTitle>
            <CardDescription>
              Configure package deals, bulk bundles (e.g. 3 for {currencySymbol}25), or Buy-X-Get-Y promotions.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsBundleOpen(true)}
            variant="outline"
            className="gap-2">
            <Plus className="w-4 h-4" /> Add Multi-Buy Rule
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading multi-buy rules...
            </div>
          ) : pricingData.bundles.length === 0 ? (
            <div className="bg-muted/40 rounded-xl p-6 border border-dashed border-border flex flex-col items-center justify-center text-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <h4 className="font-semibold text-foreground text-sm mb-1">
                No multi-buy rules configured
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Set up group pricing like "Buy 3 for {currencySymbol}25.00" or dynamic rules like "Buy 2 Get 1 50% Off".
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBundleOpen(true)}
                className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create Multi-Buy Rule
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricingData.bundles.map((bundle: any) => (
                <div
                  key={bundle.id}
                  className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between space-y-3 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground text-sm">
                          {bundle.name}
                        </h4>
                        <Badge
                          variant={bundle.bundleType === "FIXED" ? "default" : "secondary"}
                          className="text-[10px]">
                          {bundle.bundleType === "FIXED" ? "Fixed Package" : "Buy X Get Y"}
                        </Badge>
                      </div>
                      {bundle.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {bundle.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting === bundle.id}
                      onClick={() => handleDeleteBundle(bundle.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                      {isDeleting === bundle.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50 text-xs space-y-1">
                    {bundle.bundleType === "FIXED" ? (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Group Price ({bundle.buyQuantity || 1} units):</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(bundle.bundlePrice || 0), currency)}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Buy Quantity:</span>
                          <span className="font-bold">{bundle.buyQuantity} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reward/Discount:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            Get {bundle.getQuantity || 1} @ {bundle.getDiscountValue}% Off
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Custom Conditional Pricing Rules */}
      <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500" />
              Conditional Discounts & Rules
            </CardTitle>
            <CardDescription>
              Custom pricing rules applied when order thresholds or conditions are met.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsRuleOpen(true)}
            variant="outline"
            className="gap-2">
            <Plus className="w-4 h-4" /> Create Rule
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading rules...
            </div>
          ) : pricingData.pricingRules.length === 0 ? (
            <div className="bg-muted/40 rounded-xl p-6 border border-dashed border-border flex flex-col items-center justify-center text-center">
              <Tag className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <h4 className="font-bold text-foreground text-sm mb-1">
                No custom pricing rules found
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Create conditional rules to offer percentage discounts or fixed markdowns for bulk orders or VIP segments.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRuleOpen(true)}
                className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create Pricing Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Price List</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingData.pricingRules.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-semibold">
                      {rule.name}
                      {rule.description && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {rule.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {rule.variant ? rule.variant.name : "All Variants"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">
                      {rule.discountType === "PERCENTAGE"
                        ? `${rule.discountValue}% OFF`
                        : rule.discountType === "FIXED_AMOUNT"
                        ? `${formatCurrency(Number(rule.discountValue), currency)} OFF`
                        : `${formatCurrency(Number(rule.discountValue), currency)} FIXED`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {rule.conditions?.minQuantity ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Min Qty: {rule.conditions.minQuantity}</span>
                        </div>
                      ) : null}
                      {rule.conditions?.minOrderValue ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Min Order: {formatCurrency(Number(rule.conditions.minOrderValue), currency)}</span>
                        </div>
                      ) : null}
                      {!rule.conditions?.minQuantity && !rule.conditions?.minOrderValue && "No threshold conditions"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px]">
                        {rule.priceList?.name || "Global Store"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isDeleting === rule.id}
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                        {isDeleting === rule.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DIALOG 1: Add Volume Tier */}
      <Dialog open={isVolumeTierOpen} onOpenChange={setIsVolumeTierOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Volume Pricing Tier</DialogTitle>
            <DialogDescription>
              Specify a tier price for purchases at or above a minimum quantity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Product Variant</Label>
              <Select
                value={volumeForm.variantId}
                onValueChange={val => setVolumeForm({ ...volumeForm, variantId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Quantity</Label>
                <Input
                  type="number"
                  min="2"
                  value={volumeForm.minQuantity}
                  onChange={e => setVolumeForm({ ...volumeForm, minQuantity: Number(e.target.value) })}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Quantity (Optional)</Label>
                <Input
                  type="number"
                  value={volumeForm.maxQuantity}
                  onChange={e => setVolumeForm({ ...volumeForm, maxQuantity: e.target.value })}
                  placeholder="Unlimited if empty"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tier Unit Price ({currencySymbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={volumeForm.price}
                  onChange={e => setVolumeForm({ ...volumeForm, price: Number(e.target.value) })}
                  placeholder="e.g. 8.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Wholesale Price ({currencySymbol} Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={volumeForm.wholesalePrice}
                  onChange={e => setVolumeForm({ ...volumeForm, wholesalePrice: e.target.value })}
                  placeholder="e.g. 7.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price List Context (Optional)</Label>
              <Select
                value={volumeForm.priceListId}
                onValueChange={val => setVolumeForm({ ...volumeForm, priceListId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Standard Global Price List" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default_global">Standard Global Store</SelectItem>
                  {pricingData.priceLists.map((pl: any) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVolumeTierOpen(false)}
              disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddVolumeTier}
              disabled={isSubmitting}
              className="gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Volume Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Add Multi-Buy / Group Rule */}
      <Dialog open={isBundleOpen} onOpenChange={setIsBundleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Multi-Buy / Group Pricing</DialogTitle>
            <DialogDescription>
              Configure package discounts like "Buy 3 for {currencySymbol}25" or "Buy 2 Get 1 Free".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rule / Bundle Name</Label>
              <Input
                value={bundleForm.name}
                onChange={e => setBundleForm({ ...bundleForm, name: e.target.value })}
                placeholder="e.g. 3-Pack Special Deal"
              />
            </div>

            <div className="space-y-2">
              <Label>Product Variant</Label>
              <Select
                value={bundleForm.variantId}
                onValueChange={val => setBundleForm({ ...bundleForm, variantId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Multi-Buy Deal Type</Label>
              <Select
                value={bundleForm.bundleType}
                onValueChange={(val: any) => setBundleForm({ ...bundleForm, bundleType: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed Group Price (e.g. 3 for {currencySymbol}25)</SelectItem>
                  <SelectItem value="DYNAMIC">Buy X Get Y (e.g. Buy 2 Get 1 50% Off)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buy Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={bundleForm.buyQuantity}
                  onChange={e => setBundleForm({ ...bundleForm, buyQuantity: Number(e.target.value) })}
                />
              </div>

              {bundleForm.bundleType === "FIXED" ? (
                <div className="space-y-2">
                  <Label>Group Bundle Price ({currencySymbol})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bundleForm.bundlePrice}
                    onChange={e => setBundleForm({ ...bundleForm, bundlePrice: Number(e.target.value) })}
                    placeholder="e.g. 25.00"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Reward Get Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bundleForm.getQuantity}
                    onChange={e => setBundleForm({ ...bundleForm, getQuantity: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {bundleForm.bundleType === "DYNAMIC" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={bundleForm.getDiscountType}
                    onValueChange={(val: any) => setBundleForm({ ...bundleForm, getDiscountType: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount ({currencySymbol})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={bundleForm.getDiscountValue}
                    onChange={e => setBundleForm({ ...bundleForm, getDiscountValue: Number(e.target.value) })}
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                rows={2}
                value={bundleForm.description}
                onChange={e => setBundleForm({ ...bundleForm, description: e.target.value })}
                placeholder="Brief explanation shown to staff or storefront customers..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBundleOpen(false)}
              disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBundle}
              disabled={isSubmitting}
              className="gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Multi-Buy Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Add Conditional Pricing Rule */}
      <Dialog open={isRuleOpen} onOpenChange={setIsRuleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Pricing Rule</DialogTitle>
            <DialogDescription>
              Configure percentage or fixed discount rules triggered by order thresholds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={ruleForm.name}
                onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g. Bulk Order 10% Discount"
              />
            </div>

            <div className="space-y-2">
              <Label>Apply To</Label>
              <Select
                value={ruleForm.variantId}
                onValueChange={val => setRuleForm({ ...ruleForm, variantId: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Product Variants</SelectItem>
                  {variants.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={ruleForm.discountType}
                  onValueChange={(val: any) => setRuleForm({ ...ruleForm, discountType: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount ({currencySymbol})</SelectItem>
                    <SelectItem value="FIXED_PRICE">Fixed Price ({currencySymbol})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ruleForm.discountValue}
                  onChange={e => setRuleForm({ ...ruleForm, discountValue: Number(e.target.value) })}
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Order Quantity (Optional)</Label>
                <Input
                  type="number"
                  value={ruleForm.minQuantity}
                  onChange={e => setRuleForm({ ...ruleForm, minQuantity: Number(e.target.value) })}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order Value ({currencySymbol} Optional)</Label>
                <Input
                  type="number"
                  value={ruleForm.minOrderValue}
                  onChange={e => setRuleForm({ ...ruleForm, minOrderValue: Number(e.target.value) })}
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                rows={2}
                value={ruleForm.description}
                onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })}
                placeholder="Description of this discount rule..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRuleOpen(false)}
              disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={isSubmitting}
              className="gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Pricing Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
