"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  Layers,
  DollarSign,
  History,
  Truck,
  ChevronRight,
  Loader2,
  ExternalLink,
  Sparkles,
  Check,
  Scale,
  Image as ImageIcon,
  Star,
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
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import {
  updateProduct,
  bulkDeleteVariants,
  updateVariantStatus,
  createVariant,
  updateVariant,
  generateProductSlug,
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

// Subcomponents
import { OverviewTab } from "./_components/overview-tab";
import { CMSTab } from "./_components/cms-tab";
import { VariantsTab } from "./_components/variants-tab";
import { PricingTab } from "./_components/pricing-tab";
import { UnitsTab } from "./_components/units-tab";
import { InventoryTab } from "./_components/inventory-tab";
import { SuppliersTab } from "./_components/suppliers-tab";

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

  // Extract initial dynamic JSON data from customFields
  const customFieldsData = typeof product.customFields === "object" && product.customFields ? product.customFields : {};

  // 1. Rich Description (Markdown)
  const [markdown, setMarkdown] = useState<string>(
    customFieldsData.markdownDescription ||
    product.detailedDescription ||
    `# ${product.name}\n\nExperience our high-quality product tailored specifically to your needs.\n\n## Key Features\n- Premium build quality\n- Long-lasting durability\n- High customer satisfaction`
  );

  // 2. Multiple Images State (with captions and ordering)
  const initialCMSImages = Array.isArray(customFieldsData.images)
    ? customFieldsData.images.map((img: any, idx: number) => ({
        id: img.id || `img-${idx}-${Date.now()}`,
        url: img.url || "",
        caption: img.caption || "",
      }))
    : product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls.map((url: string, idx: number) => ({
        id: `img-init-${idx}`,
        url,
        caption: "Product Image",
      }))
    : [];
  const [cmsImages, setCmsImages] = useState<any[]>(initialCMSImages);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  // 3. SEO Settings State
  const [seo, setSeo] = useState({
    title: customFieldsData.seo?.title || `${product.name} | Enterprise Shop`,
    description: customFieldsData.seo?.description || `Explore our high-performance ${product.name}. High quality, affordable pricing, order now!`,
    keywords: customFieldsData.seo?.keywords || `${product.name}, premium gear, online store`,
  });

  // 4. Custom Attributes Metadata State
  const initialAttrs =
    typeof customFieldsData.customAttributes === "object" && customFieldsData.customAttributes
      ? Object.entries(customFieldsData.customAttributes).map(([key, val]: any, idx) => ({
          id: `attr-${idx}-${Date.now()}`,
          key: typeof key === "string" ? key : "",
          value: typeof val === "string" ? val : "",
        }))
      : [
          { id: "attr-1", key: "material", value: "Premium Synthetic Rubber & Mesh" },
          { id: "attr-2", key: "designed_in", value: "Milan, Italy" },
          { id: "attr-3", key: "warranty_period", value: "2 Year Global Warranty" },
        ];
  const [customAttrs, setCustomAttrs] = useState<any[]>(initialAttrs);
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  // 5. High-end CMS Specific States
  const [publishStatus, setPublishStatus] = useState<string>(customFieldsData.publishStatus || "Draft");
  const [publishedAt, setPublishedAt] = useState<string>(customFieldsData.publishedAt || "");
  const [archivedAt, setArchivedAt] = useState<string>(customFieldsData.archivedAt || "");
  const [layoutTemplate, setLayoutTemplate] = useState<string>(customFieldsData.layoutTemplate || "Default Grid");
  const [customSlugOverride, setCustomSlugOverride] = useState<string>(customFieldsData.customSlugOverride || product.slug || "");

  // Simulated Preview Settings
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");
  const [storefrontMainImageIdx, setStorefrontMainImageIdx] = useState(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Synchronization helpers
  React.useEffect(() => {
    const urls = cmsImages.map(img => img.url);
    if (JSON.stringify(product.imageUrls) !== JSON.stringify(urls)) {
      setProduct((prev: any) => ({ ...prev, imageUrls: urls }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsImages]);

  React.useEffect(() => {
    const urls = cmsImages.map(img => img.url);
    if (JSON.stringify(product.imageUrls) !== JSON.stringify(urls)) {
      const updated = product.imageUrls.map((url: string, idx: number) => {
        const existing = cmsImages.find((img: any) => img.url === url);
        return {
          id: existing?.id || `img-sync-${idx}-${Date.now()}`,
          url,
          caption: existing?.caption || "Product Image",
        };
      });
      setCmsImages(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.imageUrls]);

  // Markdown insertion helper
  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || placeholder;

    let insertion = "";
    if (syntax === "bold") insertion = `**${selectedText}**`;
    else if (syntax === "italic") insertion = `*${selectedText}*`;
    else if (syntax === "h1") insertion = `\n# ${selectedText}\n`;
    else if (syntax === "h2") insertion = `\n## ${selectedText}\n`;
    else if (syntax === "quote") insertion = `\n> ${selectedText}\n`;
    else if (syntax === "bullet") insertion = `\n- ${selectedText}`;
    else if (syntax === "ordered") insertion = `\n1. ${selectedText}`;
    else if (syntax === "link") insertion = `[${selectedText}](https://example.com)`;
    else if (syntax === "image") insertion = `![${selectedText}](https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80)`;

    const updatedText = text.substring(0, start) + insertion + text.substring(end);
    setMarkdown(updatedText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 50);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return toast.error("Please provide a valid image URL");
    const item = {
      id: `img-user-${Date.now()}`,
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || "Showcase Image",
    };
    setCmsImages((prev) => [...prev, item]);
    setNewImageUrl("");
    setNewImageCaption("");
    toast.success("Image added to showcase gallery");
  };

  const handleRemoveImage = (id: string) => {
    setCmsImages((prev) => prev.filter((img) => img.id !== id));
    if (storefrontMainImageIdx >= cmsImages.length - 1) {
      setStorefrontMainImageIdx(0);
    }
    toast.success("Image removed from showcase gallery");
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cmsImages.length) return;

    const updated = [...cmsImages];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCmsImages(updated);
  };

  const handleAddCustomAttr = () => {
    if (!newAttrKey.trim()) return toast.error("Attribute key name cannot be empty");
    if (!newAttrValue.trim()) return toast.error("Attribute value cannot be empty");

    const normalizedKey = newAttrKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");

    if (customAttrs.some((attr) => attr.key === normalizedKey)) {
      return toast.error("Attribute key already exists");
    }

    const attr = {
      id: `attr-user-${Date.now()}`,
      key: normalizedKey,
      value: newAttrValue.trim(),
    };

    setCustomAttrs((prev) => [...prev, attr]);
    setNewAttrKey("");
    setNewAttrValue("");
    toast.success(`Metadata parameter '${normalizedKey}' registered`);
  };

  const handleRemoveCustomAttr = (id: string) => {
    setCustomAttrs((prev) => prev.filter((attr) => attr.id !== id));
    toast.success("Metadata parameter removed");
  };

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
      if (e.key.length > 1 && e.key !== "Enter") {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (timeDiff > 45 && e.key !== "Enter") {
        buffer = "";
      }

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          e.preventDefault();
          e.stopPropagation();

          setVariantForm((prev: any) => ({ ...prev, barcode: buffer }));
          toast.success(`Barcode scanned: ${buffer}`);

          if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
          ) {
            const activeInput = document.activeElement;
            if (activeInput.id !== "v-barcode") {
              const val = activeInput.value;
              if (buffer.length > 0 && val.endsWith(buffer[0])) {
                const newVal = val.slice(0, -1);
                activeInput.value = newVal;

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
      const customAttributesObj: Record<string, string> = {};
      customAttrs.forEach((attr: any) => {
        if (attr.key.trim()) {
          customAttributesObj[attr.key.trim()] = attr.value;
        }
      });

      const customFieldsPayload = {
        markdownDescription: markdown,
        images: cmsImages.map((img: any) => ({ id: img.id, url: img.url, caption: img.caption })),
        seo: {
          title: seo.title.trim(),
          description: seo.description.trim(),
          keywords: seo.keywords.trim(),
        },
        customAttributes: customAttributesObj,
        publishStatus,
        publishedAt: publishedAt || null,
        archivedAt: archivedAt || null,
        layoutTemplate,
        customSlugOverride: customSlugOverride.trim(),
      };

      const updatedImages = cmsImages.map((img: any) => img.url);

      await updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        slug: customSlugOverride.trim() || product.slug,
        categoryId: product.categoryId,
        description: product.description,
        detailedDescription: markdown,
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
        imageUrls: updatedImages,
        pointsOnPurchase: product.pointsOnPurchase,
        loyaltyPointsOverride: product.loyaltyPointsOverride,
        customFields: customFieldsPayload,
      });
      toast.success("Product and CMS Studio data saved successfully!");
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

  // Reusable sub-component: Simulated High-Fidelity Storefront Card Preview with Light/Dark Mode Support
  function StorefrontCardPreview() {
    const mainImgUrl = cmsImages[storefrontMainImageIdx]?.url || "";
    const mainImgCaption = cmsImages[storefrontMainImageIdx]?.caption || "Product preview";
    const selectedCategory = categories.find((c: any) => c.id === product.categoryId);

    const prices = product.variants?.map((v: any) => Number(v.retailPrice || 0)) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const isDark = previewTheme === "dark";

    return (
      <Card className={cn(
        "border shadow-xl rounded-xl overflow-hidden flex flex-col font-sans transition-all duration-300",
        isDark ? "bg-[#0f1115] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
      )}>
        <div className={cn(
          "border-b px-4 py-3 flex items-center justify-between transition-colors",
          isDark ? "bg-[#16181d] border-zinc-800" : "bg-zinc-50 border-zinc-200"
        )}>
          <span className="text-[10px] tracking-widest font-bold uppercase text-amber-500 flex items-center gap-1.5">
            <Check size={12} />
            <span>Storefront Live Preview</span>
          </span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 font-mono font-bold uppercase rounded",
              publishStatus === "Published"
                ? "bg-emerald-500/10 text-emerald-400"
                : publishStatus === "Scheduled"
                ? "bg-blue-500/10 text-blue-400"
                : "bg-amber-500/10 text-amber-400"
            )}>
              {publishStatus}
            </span>
          </div>
        </div>

        <div className="aspect-video w-full bg-zinc-900 relative flex items-center justify-center">
          {mainImgUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mainImgUrl}
              alt={mainImgCaption}
              className="w-full h-full object-cover transition-all duration-300"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <ImageIcon className="h-10 w-10 stroke-[1.5]" />
              <span className="text-xs">No image uploaded</span>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 pt-6 w-full text-left">
            <span className="text-[9px] tracking-wider uppercase font-bold text-amber-400">
              {selectedCategory?.name || "Product Category"}
            </span>
            <h4 className="text-sm font-bold text-slate-100">{product.name || "Unnamed Premium Product"}</h4>
          </div>
        </div>

        {cmsImages.length > 0 && (
          <div className={cn(
            "p-2 flex gap-1.5 overflow-x-auto border-b transition-colors",
            isDark ? "bg-[#16181d] border-zinc-800" : "bg-zinc-50 border-zinc-200"
          )}>
            {cmsImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setStorefrontMainImageIdx(idx)}
                className={cn(
                  "h-10 w-16 flex-shrink-0 bg-zinc-900 border relative overflow-hidden transition-all duration-150 rounded",
                  storefrontMainImageIdx === idx
                    ? "border-amber-500 ring-1 ring-amber-500"
                    : isDark
                    ? "border-zinc-700 opacity-60 hover:opacity-100"
                    : "border-zinc-300 opacity-60 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption || "Thumbnail"}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div className="p-4 space-y-4">
          <div className={cn(
            "flex items-center justify-between gap-2 border-b pb-3 transition-colors",
            isDark ? "border-zinc-800" : "border-zinc-200"
          )}>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Storefront Price</span>
              <div className={cn("text-base font-extrabold", isDark ? "text-slate-100" : "text-zinc-900")}>
                {minPrice === maxPrice ? (
                  `$${minPrice.toFixed(2)}`
                ) : (
                  `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
                )}
              </div>
            </div>

            {product.brand && (
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Brand</span>
                <div className={cn("text-xs font-semibold mt-0.5", isDark ? "text-slate-200" : "text-zinc-800")}>
                  {product.brand}
                </div>
              </div>
            )}
          </div>

          {publishStatus === "Scheduled" && publishedAt && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] text-amber-500 flex items-center justify-between rounded-lg">
              <span className="font-semibold">Auto-publishing active:</span>
              <span className="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                {new Date(publishedAt).toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b pb-2 dark:border-zinc-800">
            <span>Template Style:</span>
            <span className="font-bold text-amber-500 font-mono">{layoutTemplate}</span>
          </div>

          {customAttrs.length > 0 && (
            <div className={cn(
              "space-y-1.5 border-b pb-3 transition-colors",
              isDark ? "border-zinc-800" : "border-zinc-200"
            )}>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold font-mono">Product Parameters</span>
              <div className="flex flex-wrap gap-1.5">
                {customAttrs.slice(0, 4).map((attr: any) => (
                  <div key={attr.id} className={cn(
                    "border px-2 py-0.5 text-[9px] flex items-center gap-1 rounded",
                    isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                  )}>
                    <span className="text-amber-500 font-semibold">{attr.key.replace(/_/g, " ")}:</span>
                    <span className={isDark ? "text-slate-300" : "text-zinc-600"}>{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cn(
            "flex items-center gap-2 border-b pb-3 transition-colors",
            isDark ? "border-zinc-800" : "border-zinc-200"
          )}>
            <div className="flex text-amber-400">
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">(4.8 out of 5 &bull; 246 reviews)</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold font-mono">Storefront About / Story</span>
            <div className={cn(
              "max-h-[140px] overflow-y-auto border p-2.5 text-xs leading-relaxed font-sans scrollbar-thin rounded-lg",
              isDark ? "bg-zinc-900/40 border-zinc-800 text-slate-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
            )}>
              {markdown ? (
                <div
                  className="prose prose-xs text-inherit dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                />
              ) : (
                <span className="text-[11px] text-muted-foreground italic">No custom description configured.</span>
              )}
            </div>
          </div>

          <Button
            type="button"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 font-bold uppercase tracking-widest text-xs h-9 rounded-lg border-none mt-2 flex items-center justify-center gap-1"
          >
            <span>Add to Cart</span>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-8 py-4 flex items-center justify-between shadow-sm dark:border-zinc-800">
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
              <h1 className="text-xl font-bold text-foreground">
                {product.name}
              </h1>
              <Badge variant="outline" className="bg-background border-border">
                {product.sku}
              </Badge>
              <Select
                value={product.isActive ? "active" : "inactive"}
                onValueChange={value =>
                  setProduct({
                    ...product,
                    isActive: value === "active",
                  })
                }>
                <SelectTrigger className="h-7 text-[10px] font-bold uppercase rounded border-border w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Inventory</span>
              <ChevronRight className="w-3 h-3" />
              <span>Products</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-medium text-foreground">
                {product.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 min-w-[120px]">
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
            <div className="bg-background rounded-xl p-1 border shadow-sm mb-6 inline-flex dark:border-zinc-800">
              <TabsList className="bg-transparent border-none p-0 h-auto">
                {[
                  { value: "overview", label: "Overview", icon: Package },
                  { value: "cms", label: "CMS Studio", icon: Sparkles },
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
                      "flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all data-[state=active]:bg-zinc-900 data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900",
                    )}>
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              <OverviewTab
                product={product}
                setProduct={setProduct}
                categories={categories}
                handleGenerateSlug={handleGenerateSlug}
              />
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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

            {/* CMS STUDIO TAB */}
            <TabsContent value="cms" className="space-y-6 mt-0">
              <CMSTab
                product={product}
                categories={categories}
                markdown={markdown}
                setMarkdown={setMarkdown}
                cmsImages={cmsImages}
                setCmsImages={setCmsImages}
                newImageUrl={newImageUrl}
                setNewImageUrl={setNewImageUrl}
                newImageCaption={newImageCaption}
                setNewImageCaption={setNewImageCaption}
                seo={seo}
                setSeo={setSeo}
                customAttrs={customAttrs}
                setCustomAttrs={setCustomAttrs}
                newAttrKey={newAttrKey}
                setNewAttrKey={setNewAttrKey}
                newAttrValue={newAttrValue}
                setNewAttrValue={setNewAttrValue}
                publishStatus={publishStatus}
                setPublishStatus={setPublishStatus}
                publishedAt={publishedAt}
                setPublishedAt={setPublishedAt}
                archivedAt={archivedAt}
                setArchivedAt={setArchivedAt}
                layoutTemplate={layoutTemplate}
                setLayoutTemplate={setLayoutTemplate}
                customSlugOverride={customSlugOverride}
                setCustomSlugOverride={setCustomSlugOverride}
                previewTheme={previewTheme}
                setPreviewTheme={setPreviewTheme}
                storefrontMainImageIdx={storefrontMainImageIdx}
                setStorefrontMainImageIdx={setStorefrontMainImageIdx}
                textareaRef={textareaRef}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                fileInputRef={fileInputRef}
                insertMarkdown={insertMarkdown}
                handleAddImage={handleAddImage}
                handleRemoveImage={handleRemoveImage}
                handleMoveImage={handleMoveImage}
                handleAddCustomAttr={handleAddCustomAttr}
                handleRemoveCustomAttr={handleRemoveCustomAttr}
              />
            </TabsContent>

            {/* VARIANTS TAB */}
            <TabsContent value="variants" className="mt-0">
              <VariantsTab
                product={product}
                setProduct={setProduct}
                selectedVariants={selectedVariants}
                setSelectedVariants={setSelectedVariants}
                setIsVariantDialogOpen={setIsVariantDialogOpen}
                setEditingVariant={setEditingVariant}
                setVariantForm={setVariantForm}
                setVariantsToDelete={setVariantsToDelete}
                handleBulkStatusUpdate={handleBulkStatusUpdate}
              />
            </TabsContent>

            {/* UNITS TAB */}
            <TabsContent value="units" className="space-y-6 mt-0">
              <UnitsTab
                product={product}
                setProduct={setProduct}
                systemUnits={systemUnits}
                organizationUnits={organizationUnits}
              />
            </TabsContent>

            {/* PRICING TAB */}
            <TabsContent value="pricing" className="space-y-6 mt-0">
              <PricingTab
                product={product}
                setProduct={setProduct}
              />
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-6 mt-0">
              <InventoryTab
                product={product}
                setProduct={setProduct}
                locations={locations}
                suppliers={suppliers}
              />
            </TabsContent>

            {/* SUPPLIERS TAB */}
            <TabsContent value="suppliers" className="mt-0">
              <SuppliersTab product={product} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {activeTab === "cms" ? (
            <StorefrontCardPreview />
          ) : (
            <>
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800 overflow-hidden">
                <div className="aspect-square relative bg-muted">
                  {product.imageUrls?.[0] ? (
                    <Image
                      src={product.imageUrls[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-4 border-b dark:border-zinc-800">
                      <span className="text-sm text-muted-foreground font-medium">
                        Global Stock
                      </span>
                      <span className="text-lg font-black text-foreground">
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
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
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

              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                          className="bg-muted border-border hover:bg-muted/80 transition-colors cursor-pointer flex items-center gap-1"
                          onClick={() => {
                            setProduct({
                              ...product,
                              tags: product.tags.filter((t: string) => t !== tag),
                            });
                          }}>
                          {tag} <XCircle className="w-3 h-3" />
                        </Badge>
                      )) || (
                        <span className="text-xs text-muted-foreground italic">
                          No tags added
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 pt-4 border-t dark:border-zinc-800">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Created At
                    </Label>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Last Updated
                    </Label>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:hover:bg-red-800">
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
        <DialogContent className="sm:max-w-155 ">
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
                      className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                      onClick={() => {
                        const randomNum = Math.floor(
                          100000000000 + Math.random() * 900000000000,
                        ).toString();
                        setVariantForm((prev: any) => ({
                          ...prev,
                          barcode: randomNum,
                        }));
                      }}>
                      (Generate)
                    </Button>
                  </div>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
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
                <Select
                  value={variantForm.isActive ? "true" : "false"}
                  onValueChange={value =>
                    setVariantForm({
                      ...variantForm,
                      isActive: value === "true",
                    })
                  }>
                  <SelectTrigger id="v-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
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

            <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
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

            <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
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
                <p className="text-xs text-muted-foreground italic">
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
              className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
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
                    setProduct({
                      ...product,
                      variants: [
                        ...(product.variants || []),
                        {
                          ...newVariant,
                          variantStocks: [
                            { currentStock: variantForm.initialStock },
                          ],
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

// PlusCircle component
function PlusCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-plus-circle", props.className)}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

// XCircle component
function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-x-circle", props.className)}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

// Inline Markdown Parser to render HTML
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-3 mb-1.5 text-inherit font-sans">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold mt-4 mb-2 text-inherit font-sans">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-extrabold mt-5 mb-2.5 text-inherit font-sans">$1</h1>');

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-3 italic my-3 text-muted-foreground">$1</blockquote>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-inherit">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-inherit">$1</strong>');

  // Italics
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-inherit">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic text-inherit">$1</em>');

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-muted text-amber-500 px-1 py-0.5 rounded font-mono text-xs border">$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-500 font-medium underline hover:text-amber-600">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-3 border shadow-sm inline-block" />');

  const lines = html.split("\n");
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul class="list-disc pl-4 my-1.5 space-y-0.5 text-inherit text-xs">\n<li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, "");
      if (!inOrderedList) {
        lines[i] = '<ol class="list-decimal pl-4 my-1.5 space-y-0.5 text-inherit text-xs">\n<li>' + content + '</li>';
        inOrderedList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else {
      if (inList) {
        lines[i] = '</ul>\n' + lines[i];
        inList = false;
      }
      if (inOrderedList) {
        lines[i] = '</ol>\n' + lines[i];
        inOrderedList = false;
      }
      if (
        lines[i].trim() &&
        !lines[i].trim().startsWith("<h") &&
        !lines[i].trim().startsWith("<blockquote") &&
        !lines[i].trim().startsWith("<ul") &&
        !lines[i].trim().startsWith("<ol") &&
        !lines[i].trim().startsWith("<li")
      ) {
        lines[i] = '<p class="my-1.5 leading-relaxed text-inherit text-xs">' + lines[i] + '</p>';
      }
    }
  }

  if (inList) lines.push("</ul>");
  if (inOrderedList) lines.push("</ol>");

  return lines.join("\n");
}
