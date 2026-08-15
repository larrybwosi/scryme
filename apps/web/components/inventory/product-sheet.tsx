"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  createProduct,
  updateProduct,
  getProduct,
  checkProductUniqueness,
} from "../../app/actions/inventory";
import { CategoryDialog } from "./category-dialog";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  AlertCircle,
  Package,
  Plus,
  Tag,
  DollarSign,
  BarChart2,
  ImageIcon,
  ChevronRight,
} from "lucide-react";
import { ImageUpload } from "../image-upload";
import { useDebounce } from "use-debounce";
import slugify from "slugify";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";

interface ProductSheetProps {
  children?: React.ReactNode;
  productId?: string;
  categories: { id: string; name: string }[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  currency?: string;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  step,
}: {
  icon: React.ElementType;
  label: string;
  step: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-widest font-mono border border-primary/30 shrink-0">
        {step}
      </div>
      <div className="flex items-center gap-2 text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function FieldWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}

function FieldLabel({
  htmlFor,
  children,
  status,
  checking,
}: {
  htmlFor: string;
  children: React.ReactNode;
  status?: boolean | null;
  checking?: boolean;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
      {children}
      {checking ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
      ) : status === true ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : status === false ? (
        <AlertCircle className="h-3 w-3 text-destructive" />
      ) : null}
    </Label>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 text-[10px] text-destructive font-medium mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

import { getCurrencySymbol } from "../../lib/utils";

export function ProductSheet({
  children,
  productId,
  categories,
  isOpen: controlledOpen,
  onOpenChange,
  currency = "USD",
}: ProductSheetProps) {
  const symbol = getCurrencySymbol(currency);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [localCategories, setLocalCategories] = useState(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setIsOpen;

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    slug: "",
    categoryId: "",
    buyingPrice: 0,
    retailPrice: 0,
    initialStock: 0,
    imageUrls: [] as string[],
    type: "FINISHED_GOOD",
  });

  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
  const [uniqueness, setUniqueness] = useState({ sku: true, slug: true });
  const [isManualSku, setIsManualSku] = useState(false);
  const [isManualSlug, setIsManualSlug] = useState(false);

  const [debouncedSku] = useDebounce(formData.sku, 500);
  const [debouncedSlug] = useDebounce(formData.slug, 500);

  useEffect(() => {
    if (!productId) {
      if (!isManualSku && formData.name) {
        const prefix = formData.name.substring(0, 3).toUpperCase();
        const random = Math.floor(10000 + Math.random() * 90000);
        setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
      }
      if (!isManualSlug && formData.name) {
        const slug = slugify(formData.name, { lower: true, strict: true });
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  }, [formData.name, isManualSku, isManualSlug, productId]);

  useEffect(() => {
    const check = async () => {
      if (!debouncedSku && !debouncedSlug) return;
      setIsCheckingUniqueness(true);
      try {
        const result = await checkProductUniqueness({
          sku: debouncedSku,
          slug: debouncedSlug,
          excludeId: productId,
        });
        setUniqueness(result);
      } catch {
        console.error("Uniqueness check failed");
      } finally {
        setIsCheckingUniqueness(false);
      }
    };
    check();
  }, [debouncedSku, debouncedSlug, productId]);

  useEffect(() => {
    if (productId && open) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const product = await getProduct(productId);
          if (product) {
            const variant = product.variants[0];
            setFormData({
              name: product.name,
              sku: product.sku,
              slug: product.slug || "",
              categoryId: product.categoryId,
              buyingPrice: variant?.buyingPrice
                ? Number(variant.buyingPrice)
                : 0,
              retailPrice: variant?.retailPrice
                ? Number(variant.retailPrice)
                : 0,
              initialStock: 0,
              imageUrls: product.imageUrls,
              type: product.type || "FINISHED_GOOD",
            });
          }
        } catch {
          toast.error("Failed to load product details");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    } else if (!productId) {
      setFormData({
        name: "",
        sku: "",
        slug: "",
        categoryId: "",
        buyingPrice: 0,
        retailPrice: 0,
        initialStock: 0,
        imageUrls: [],
        type: "FINISHED_GOOD",
      });
      setIsManualSku(false);
      setIsManualSlug(false);
    }
  }, [productId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueness.sku) return toast.error("SKU already in use");
    if (!uniqueness.slug) return toast.error("Slug already in use");

    setIsSubmitting(true);
    try {
      if (productId) {
        await updateProduct(productId, {
          name: formData.name,
          sku: formData.sku,
          slug: formData.slug,
          categoryId: formData.categoryId,
          buyingPrice: formData.buyingPrice,
          retailPrice: formData.retailPrice,
          imageUrls: formData.imageUrls,
          type: formData.type,
        });
        toast.success("Item updated successfully");
      } else {
        await createProduct(formData);
        toast.success("Item created successfully");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const margin =
    formData.buyingPrice > 0 && formData.retailPrice > 0
      ? (
          ((formData.retailPrice - formData.buyingPrice) /
            formData.retailPrice) *
          100
        ).toFixed(1)
      : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}

      <SheetContent
        className={cn(
          "sm:max-w-[560px] p-0 overflow-hidden flex flex-col",
          "bg-card border-l border-border shadow-2xl",
        )}>
        {/* ── Header Bar ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shadow-sm">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-[15px] font-semibold text-foreground tracking-tight">
                {productId ? "Edit Product" : "New Product"}
              </SheetTitle>
              <SheetDescription className="text-[12px] text-muted-foreground mt-0.5">
                {productId
                  ? `Editing product · ID ${productId.slice(0, 8).toUpperCase()}`
                  : "Complete all required fields to add to inventory"}
              </SheetDescription>
            </div>
          </div>
          {/* breadcrumb hint */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-1">
            <span>Inventory</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">
              {productId ? "Edit" : "Create"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/40" />
            <p className="text-[12px] text-muted-foreground">Loading product data…</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* ── Section 1: Basic Info ── */}
              <section>
                <SectionHeader icon={Tag} label="Basic Information" step={1} />
                <div className="space-y-4">
                  <FieldWrapper>
                    <FieldLabel htmlFor="product-name">Product Name</FieldLabel>
                    <Input
                      id="product-name"
                      placeholder="e.g., Artisan Sourdough Bread"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="h-9 text-sm bg-background border-border focus-visible:ring-ring focus-visible:ring-1 focus-visible:border-ring placeholder:text-muted-foreground/40 transition-colors"
                    />
                  </FieldWrapper>

                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper>
                      <FieldLabel
                        htmlFor="sku"
                        status={formData.sku ? uniqueness.sku : null}
                        checking={isCheckingUniqueness}>
                        SKU
                      </FieldLabel>
                      <Input
                        id="sku"
                        placeholder="e.g., BRD-00123"
                        value={formData.sku}
                        onChange={e => {
                          setIsManualSku(true);
                          setFormData({ ...formData, sku: e.target.value });
                        }}
                        required
                        className={cn(
                          "h-9 text-sm font-mono bg-background border-border focus-visible:ring-1 placeholder:text-muted-foreground/40 transition-colors",
                          !uniqueness.sku && formData.sku
                            ? "border-destructive focus-visible:ring-destructive"
                            : uniqueness.sku && formData.sku
                              ? "border-emerald-500 focus-visible:ring-emerald-500"
                              : "focus-visible:ring-ring focus-visible:border-ring",
                        )}
                      />
                      {!uniqueness.sku && formData.sku && (
                        <FieldError message="SKU already exists" />
                      )}
                    </FieldWrapper>

                    <FieldWrapper>
                      <FieldLabel
                        htmlFor="slug"
                        status={formData.slug ? uniqueness.slug : null}
                        checking={isCheckingUniqueness}>
                        URL Slug
                      </FieldLabel>
                      <Input
                        id="slug"
                        placeholder="e.g., sourdough-bread"
                        value={formData.slug}
                        onChange={e => {
                          setIsManualSlug(true);
                          setFormData({ ...formData, slug: e.target.value });
                        }}
                        className={cn(
                          "h-9 text-sm font-mono bg-background border-border focus-visible:ring-1 placeholder:text-muted-foreground/40 transition-colors",
                          !uniqueness.slug && formData.slug
                            ? "border-destructive focus-visible:ring-destructive"
                            : uniqueness.slug && formData.slug
                              ? "border-emerald-500 focus-visible:ring-emerald-500"
                              : "focus-visible:ring-ring focus-visible:border-ring",
                        )}
                      />
                      {!uniqueness.slug && formData.slug && (
                        <FieldError message="Slug already exists" />
                      )}
                    </FieldWrapper>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="category">Category</FieldLabel>
                        <CategoryDialog
                          onSuccess={(newCat) => {
                            setLocalCategories(prev => [
                              ...prev,
                              { id: newCat.id, name: newCat.name },
                            ]);
                            setFormData(prev => ({
                              ...prev,
                              categoryId: newCat.id,
                            }));
                          }}>
                          <button
                            type="button"
                            className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
                            <Plus className="h-3 w-3" />
                            Create Inline
                          </button>
                        </CategoryDialog>
                      </div>

                      {localCategories.length === 0 ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="h-9 px-3 flex items-center text-sm border border-dashed border-border rounded-md bg-muted/30 text-muted-foreground/60">
                            No categories available
                          </div>
                        </div>
                      ) : (
                        <Select
                          value={formData.categoryId}
                          onValueChange={value =>
                            setFormData({ ...formData, categoryId: value })
                          }
                          required>
                          <SelectTrigger
                            id="category"
                            className="h-9 text-sm border-border focus:ring-1 focus:ring-ring focus:border-ring bg-background">
                            <SelectValue placeholder="Select category…" />
                          </SelectTrigger>
                          <SelectContent>
                            {localCategories.map(cat => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id}
                                className="text-sm">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FieldWrapper>

                    <FieldWrapper>
                      <FieldLabel htmlFor="product-type">Item Type</FieldLabel>
                      <Select
                        value={formData.type}
                        onValueChange={value =>
                          setFormData({ ...formData, type: value })
                        }
                        required>
                        <SelectTrigger
                          id="product-type"
                          className="h-9 text-sm border-border focus:ring-1 focus:ring-ring focus:border-ring bg-background">
                          <SelectValue placeholder="Select item type…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FINISHED_GOOD" className="text-sm">
                            Finished Good
                          </SelectItem>
                          <SelectItem value="RAW_MATERIAL" className="text-sm">
                            Raw Material
                          </SelectItem>
                          <SelectItem value="MERCHANDISE" className="text-sm">
                            Merchandise
                          </SelectItem>
                          <SelectItem value="OTHER" className="text-sm">
                            Other
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWrapper>
                  </div>
                </div>
              </section>

              {/* ── Section 2: Pricing & Stock ── */}
              <section>
                <SectionHeader
                  icon={DollarSign}
                  label="Pricing & Stock"
                  step={2}
                />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper>
                      <FieldLabel htmlFor="buying-price">Cost Price</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-[13px] font-medium pointer-events-none">
                          {symbol}
                        </span>
                        <Input
                          id="buying-price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.buyingPrice || ""}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              buyingPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          required
                          className="h-9 pl-7 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </FieldWrapper>

                    <FieldWrapper>
                      <FieldLabel htmlFor="retail-price">
                        Retail Price
                      </FieldLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-[13px] font-medium pointer-events-none">
                          {symbol}
                        </span>
                        <Input
                          id="retail-price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.retailPrice || ""}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              retailPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          required
                          className="h-9 pl-7 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </FieldWrapper>
                  </div>

                  {/* Margin indicator */}
                  {margin !== null && (
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border text-[12px] font-medium transition-all",
                        parseFloat(margin) >= 20
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : parseFloat(margin) >= 0
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                            : "bg-destructive/10 border-destructive/20 text-destructive",
                      )}>
                      <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Gross margin{" "}
                        <span className="font-semibold font-mono">
                          {margin}%
                        </span>
                        {parseFloat(margin) < 0 && " · Below cost price"}
                        {parseFloat(margin) >= 0 &&
                          parseFloat(margin) < 20 &&
                          " · Low margin"}
                        {parseFloat(margin) >= 20 && " · Healthy margin"}
                      </span>
                    </div>
                  )}

                  {!productId && (
                    <FieldWrapper className="w-1/2 pr-2">
                      <FieldLabel htmlFor="initial-stock">
                        Default Variant Stock
                      </FieldLabel>
                      <Input
                        id="initial-stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.initialStock || ""}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            initialStock: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                        className="h-9 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground/40"
                      />
                    </FieldWrapper>
                  )}
                </div>
              </section>

              {/* ── Section 3: Images ── */}
              <section>
                <SectionHeader
                  icon={ImageIcon}
                  label="Product Images"
                  step={3}
                />
                <ImageUpload
                  value={formData.imageUrls}
                  onChange={urls =>
                    setFormData({ ...formData, imageUrls: urls })
                  }
                  maxImages={3}
                />
                <p className="text-[11px] text-muted-foreground/60 mt-2">
                  Upload up to 3 images. First image will be used as the primary
                  display.
                </p>
              </section>
            </div>

            {/* ── Footer ── */}
            <SheetFooter className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-muted-foreground">
                {!uniqueness.sku || !uniqueness.slug ? (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    Resolve conflicts before saving
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    All fields with * are required
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="h-8 text-[12px] border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !uniqueness.sku || !uniqueness.slug}
                  className="h-8 text-[12px] bg-primary hover:bg-primary/90 text-primary-foreground px-4 transition-colors disabled:opacity-50">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      {productId ? "Saving…" : "Creating…"}
                    </>
                  ) : productId ? (
                    "Save Changes"
                  ) : (
                    "Create Product"
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
