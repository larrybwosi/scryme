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
  Upload,
  X,
  ExternalLink,
  Edit,
  Scale,
  RefreshCw,
  PlusCircle,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Link2,
  Globe,
  Clock,
  Check,
  Sun,
  Moon,
  Calendar,
  Settings,
  Eye,
  ChevronUp,
  ChevronDown,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
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

  // Reusable sub-component: Simulated High-Fidelity Storefront Card Preview with Light/Dark Mode Support
  function StorefrontCardPreview() {
    const mainImgUrl = cmsImages[storefrontMainImageIdx]?.url || "";
    const mainImgCaption = cmsImages[storefrontMainImageIdx]?.caption || "Product preview";
    const selectedCategory = categories.find((c: any) => c.id === product.categoryId);

    // Calculate retail price range
    const prices = product.variants?.map((v: any) => Number(v.retailPrice || 0)) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const isDark = previewTheme === "dark";

    return (
      <Card className={cn(
        "border shadow-xl rounded-xl overflow-hidden flex flex-col font-sans transition-all duration-300",
        isDark ? "bg-[#0f1115] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
      )}>
        {/* Preview header info */}
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

        {/* Gallery main image display */}
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

        {/* Gallery thumbnails strip */}
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

        {/* Card pricing and brief context */}
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

          {/* Schedule status disclaimer */}
          {publishStatus === "Scheduled" && publishedAt && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] text-amber-500 flex items-center justify-between rounded-lg">
              <span className="font-semibold">Auto-publishing active:</span>
              <span className="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                {new Date(publishedAt).toLocaleString()}
              </span>
            </div>
          )}

          {/* Layout Template badge */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b pb-2 dark:border-zinc-800">
            <span>Template Style:</span>
            <span className="font-bold text-amber-500 font-mono">{layoutTemplate}</span>
          </div>

          {/* Dynamic attributes preview (only shows first 4 keys for nice sizing) */}
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

          {/* Rating stars & storefront review simulation */}
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

          {/* Markdown text preview container */}
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

          {/* CTA preview button */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                        <Select
                          value={product.type}
                          onValueChange={value =>
                            setProduct({ ...product, type: value })
                          }>
                          <SelectTrigger id="type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FINISHED_GOOD">
                              Finished Good
                            </SelectItem>
                            <SelectItem value="RAW_MATERIAL">
                              Raw Material
                            </SelectItem>
                            <SelectItem value="MERCHANDISE">
                              Merchandise
                            </SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select
                          value={product.categoryId}
                          onValueChange={value =>
                            setProduct({
                              ...product,
                              categoryId: value,
                            })
                          }>
                          <SelectTrigger id="category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        className="min-h-25"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                  <CardFooter className="bg-muted/50 border-t py-3 dark:border-zinc-800">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Recommended: 1000x1000px JPG/PNG
                    </p>
                  </CardFooter>
                </Card>
              </div>

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
              <div className="bg-white dark:bg-zinc-950 p-6 border shadow-sm rounded-xl dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-foreground">Enterprise CMS Studio</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage high-fidelity storefront presentation, rich markdown guides, SEO target parameters, layouts, and scheduled publishing options.
                </p>
              </div>

              <Tabs defaultValue="rich-images" className="w-full">
                <div className="bg-background dark:bg-zinc-950 rounded-xl p-1 border shadow-sm mb-6 inline-flex dark:border-zinc-800">
                  <TabsList className="bg-transparent border-none p-0 h-auto gap-1">
                    <TabsTrigger
                      value="rich-images"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Rich Content & Gallery</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="seo-layout"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
                    >
                      <Globe className="w-4 h-4" />
                      <span>SEO & Theme Settings</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="publishing"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Publishing & Attributes</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* SUB-TAB 1: Rich Description & Images */}
                <TabsContent value="rich-images" className="space-y-6 mt-0">
                  {/* Image Manager Section */}
                  <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <ImageIcon size={18} className="text-amber-500" />
                        <span>Showcase Gallery (Unified Images)</span>
                      </CardTitle>
                      <CardDescription>
                        Reorder gallery items, define captions/alt text, and manage direct image links. Keep standard assets fully unified.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Grid list of current images */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 bg-muted/30 rounded-lg dark:border-zinc-800">
                        {cmsImages.length === 0 ? (
                          <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic">
                            No images added yet. Storefront will use fallback placeholders.
                          </div>
                        ) : (
                          cmsImages.map((img, idx) => (
                            <div key={img.id} className="bg-background border p-3 flex flex-col gap-2 relative shadow-xs rounded-lg dark:border-zinc-800">
                              <div className="aspect-video w-full bg-muted overflow-hidden relative rounded-md">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.url}
                                  alt={img.caption || "Product Image"}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-mono text-white tracking-widest font-bold rounded">
                                  #{idx + 1} {idx === 0 && "(MAIN)"}
                                </div>
                              </div>

                              {/* Caption input */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Caption / Alternative Text</Label>
                                <Input
                                  value={img.caption}
                                  onChange={(e) => {
                                    const updated = [...cmsImages];
                                    updated[idx].caption = e.target.value;
                                    setCmsImages(updated);
                                  }}
                                  className="text-xs h-7 rounded border-border"
                                  placeholder="e.g. Ergonomic sole close up"
                                />
                              </div>

                              {/* Reordering and removal controls */}
                              <div className="flex items-center justify-between border-t pt-2 mt-1 dark:border-zinc-800">
                                <div className="flex items-center gap-1">
                                  <Button
                                    onClick={() => handleMoveImage(idx, "up")}
                                    disabled={idx === 0}
                                    variant="outline"
                                    className="h-6 w-6 p-0 rounded border-border bg-background"
                                    title="Move main image forward"
                                  >
                                    <ChevronUp size={12} />
                                  </Button>
                                  <Button
                                    onClick={() => handleMoveImage(idx, "down")}
                                    disabled={idx === cmsImages.length - 1}
                                    variant="outline"
                                    className="h-6 w-6 p-0 rounded border-border bg-background"
                                    title="Move back"
                                  >
                                    <ChevronDown size={12} />
                                  </Button>
                                </div>

                                <Button
                                  onClick={() => handleRemoveImage(img.id)}
                                  variant="ghost"
                                  className="h-6 px-2 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-xs rounded"
                                >
                                  <Trash2 size={12} className="mr-1 inline" />
                                  <span>Remove</span>
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add new image form */}
                      <div className="border p-4 bg-muted/10 space-y-3 rounded-lg dark:border-zinc-800">
                        <span className="text-xs font-bold text-foreground">Add New Showcase Image</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Upload Image</Label>
                            <div
                              onClick={() => !isUploading && fileInputRef.current?.click()}
                              className="relative border-2 border-dashed border-border dark:border-zinc-800 bg-background p-4 text-center rounded-lg hover:border-muted-foreground/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[90px]"
                            >
                              {isUploading ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                                  <span className="text-[10px] text-muted-foreground font-semibold">Uploading to storage...</span>
                                </div>
                              ) : newImageUrl ? (
                                <div className="flex items-center gap-2 w-full justify-between">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={newImageUrl} className="h-10 w-10 object-cover rounded" alt="Upload preview" />
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">Uploaded successfully</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:bg-muted rounded text-muted-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewImageUrl("");
                                    }}
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                  <span className="text-[10px] text-muted-foreground font-semibold">Click or Drag to Upload</span>
                                </div>
                              )}
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsUploading(true);
                                  try {
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      body: formData,
                                    });
                                    if (!res.ok) throw new Error("Upload failed");
                                    const resData = await res.json();
                                    const url = resData.data?.url || resData.url;
                                    if (!url) throw new Error("No URL returned");
                                    setNewImageUrl(url);
                                    toast.success("Image uploaded successfully!");
                                  } catch (err) {
                                    console.error(err);
                                    toast.error("Failed to upload image");
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="new-img-caption" className="text-[10px] font-bold uppercase text-muted-foreground">Caption / Alt text</Label>
                            <Input
                              id="new-img-caption"
                              placeholder="e.g. Back view of the product"
                              value={newImageCaption}
                              onChange={(e) => setNewImageCaption(e.target.value)}
                              className="text-xs h-8 rounded bg-background border-border"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddImage();
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={handleAddImage}
                            variant="outline"
                            className="h-8 rounded text-xs border-border hover:bg-muted flex items-center gap-1"
                          >
                            <Plus size={13} />
                            <span>Insert Image</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Split-pane Markdown Editor */}
                  <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <Sparkles size={18} className="text-amber-500" />
                        <span>Storefront Rich Content Composer</span>
                      </CardTitle>
                      <CardDescription>
                        Compose detailed Markdown stories, manuals, or guides that render as high-fidelity HTML on public listings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Formatting Helper Tools */}
                      <div className="flex items-center gap-1.5 flex-wrap bg-muted/60 p-2 border border-border rounded-lg dark:border-zinc-800">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("bold", "bold text")}
                          className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                          title="Bold (**text**)"
                        >
                          <Bold size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("italic", "italic text")}
                          className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                          title="Italic (*text*)"
                        >
                          <Italic size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("h1", "Heading 1")}
                          className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                          title="H1 heading (# Heading)"
                        >
                          <Heading1 size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("h2", "Heading 2")}
                          className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                          title="H2 heading (## Heading)"
                        >
                          <Heading2 size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("quote", "blockquote citation")}
                          className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                          title="Blockquote (> citation)"
                        >
                          <Quote size={13} />
                        </Button>
                        <span className="h-4 w-[1px] bg-border mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("bullet", "list item")}
                          className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                          title="Bullet List (- item)"
                        >
                          <List size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("ordered", "list item")}
                          className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                          title="Numbered List (1. item)"
                        >
                          <ListOrdered size={13} />
                        </Button>
                        <span className="h-4 w-[1px] bg-border mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("link", "Link Title")}
                          className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                          title="Hyperlink ([title](url))"
                        >
                          <Link2 size={13} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => insertMarkdown("image", "Image alt caption")}
                          className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                          title="Image ([caption](url))"
                        >
                          <ImageIcon size={13} />
                        </Button>
                      </div>

                      {/* Text editor and preview side-by-side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Editor */}
                        <div className="space-y-1.5 flex flex-col">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Markdown Composer</Label>
                          <textarea
                            ref={textareaRef}
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            placeholder="# Product Overview..."
                            className="w-full flex-1 min-h-[300px] p-3 text-xs font-mono border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y rounded-lg dark:border-zinc-800"
                          />
                        </div>

                        {/* Live parsing HTML render preview */}
                        <div className="flex flex-col">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Live Formatted Output Preview</Label>
                          <div className="w-full flex-1 min-h-[300px] p-4 border border-border bg-muted/10 overflow-y-auto rounded-lg dark:border-zinc-800 max-h-[420px]">
                            {markdown ? (
                              <div
                                className="prose prose-sm max-w-none text-foreground break-words dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No description composed. HTML preview is empty.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SUB-TAB 2: SEO & Layout Options */}
                <TabsContent value="seo-layout" className="space-y-6 mt-0">
                  <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <Globe size={18} className="text-amber-500" />
                        <span>Search Engine Optimization (SEO) Metadata</span>
                      </CardTitle>
                      <CardDescription>
                        Define fields to configure browser tab metadata, search crawler descriptions, and social media sharing previews.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="seo-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SEO Meta Title</Label>
                        <Input
                          id="seo-title"
                          value={seo.title}
                          onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                          placeholder="Tab Title & Search Engines Headline"
                          className="rounded bg-background border-border"
                        />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>Recommended: 50-60 characters.</span>
                          <span className={seo.title.length > 60 ? "text-amber-500 font-semibold" : "text-green-500"}>
                            Current: {seo.title.length} chars
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="seo-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SEO Meta Description</Label>
                        <Textarea
                          id="seo-desc"
                          value={seo.description}
                          onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                          placeholder="Short summary paragraph displayed beneath the heading on Google results"
                          className="min-h-20 rounded bg-background border-border"
                        />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>Recommended: 120-160 characters.</span>
                          <span className={seo.description.length > 160 ? "text-amber-500 font-semibold" : "text-green-500"}>
                            Current: {seo.description.length} chars
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="seo-keywords" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Keywords (Comma separated)</Label>
                        <Input
                          id="seo-keywords"
                          value={seo.keywords}
                          onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                          placeholder="e.g. sports shoes, lightweight boots, athletic gear"
                          className="rounded bg-background border-border"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <Settings size={18} className="text-amber-500" />
                        <span>E-commerce Layout & Preview Themes</span>
                      </CardTitle>
                      <CardDescription>
                        Customize page template designs and modify storefront live previews instantly.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label htmlFor="cms-template" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Layout Style</Label>
                        <Select
                          value={layoutTemplate}
                          onValueChange={setLayoutTemplate}
                        >
                          <SelectTrigger id="cms-template" className="rounded bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="Default Grid">Default Grid Showcase</SelectItem>
                            <SelectItem value="Elegant Editorial">Elegant Editorial Profile</SelectItem>
                            <SelectItem value="Minimalist Modern">Minimalist Modern Single-Focus</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-[10px] text-muted-foreground">Dictates the page structures on client-facing storefronts.</span>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview Theme Toggle</Label>
                        <div className="flex items-center gap-3 border p-2 bg-muted/20 rounded-lg dark:border-zinc-800 h-9">
                          <button
                            type="button"
                            onClick={() => setPreviewTheme("light")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 py-1 text-xs rounded transition-all font-semibold",
                              previewTheme === "light" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Sun size={13} />
                            <span>Light mode</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewTheme("dark")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 py-1 text-xs rounded transition-all font-semibold",
                              previewTheme === "dark" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Moon size={13} />
                            <span>Dark mode</span>
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Toggle colors inside the simulated live preview card.</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SUB-TAB 3: Publishing & Advanced Settings */}
                <TabsContent value="publishing" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status selection */}
                    <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-foreground">
                          <CheckCircle2 size={18} className="text-amber-500" />
                          <span>Publishing Status</span>
                        </CardTitle>
                        <CardDescription>Configure storefront listings status parameters.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <Label htmlFor="cms-status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Listing Status</Label>
                        <Select
                          value={publishStatus}
                          onValueChange={setPublishStatus}
                        >
                          <SelectTrigger id="cms-status" className="rounded bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="Draft">Draft (Internal Only)</SelectItem>
                            <SelectItem value="Published">Published (Publicly Searchable)</SelectItem>
                            <SelectItem value="Scheduled">Scheduled (Auto live / Archive)</SelectItem>
                            <SelectItem value="Archived">Archived (De-listed)</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-[10px] text-muted-foreground">Draft mode prevents checkout access in active shopping carts.</span>
                      </CardContent>
                    </Card>

                    {/* Schedule times */}
                    <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-foreground">
                          <Calendar size={18} className="text-amber-500" />
                          <span>Publication Schedule</span>
                        </CardTitle>
                        <CardDescription>Optional automatic publishing timelines.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="published-at" className="text-[10px] font-bold uppercase text-muted-foreground">Scheduled Live</Label>
                          <input
                            id="published-at"
                            type="datetime-local"
                            value={publishedAt}
                            onChange={(e) => setPublishedAt(e.target.value)}
                            className="w-full text-xs p-2 border border-border rounded bg-background text-foreground dark:border-zinc-800 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="archived-at" className="text-[10px] font-bold uppercase text-muted-foreground">Scheduled Archive</Label>
                          <input
                            id="archived-at"
                            type="datetime-local"
                            value={archivedAt}
                            onChange={(e) => setArchivedAt(e.target.value)}
                            className="w-full text-xs p-2 border border-border rounded bg-background text-foreground dark:border-zinc-800 focus:outline-none"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Slug Override */}
                  <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <ExternalLink size={18} className="text-amber-500" />
                        <span>SEO Customized URL Override</span>
                      </CardTitle>
                      <CardDescription>Overwrites default products slug path to yield highly optimized clean marketing URLs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="cms-slug-override" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Marketing Slug Override</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cms-slug-override"
                            value={customSlugOverride}
                            onChange={(e) => setCustomSlugOverride(e.target.value)}
                            className="rounded bg-background border-border"
                            placeholder="e.g. premium-sneakers-seasonal-deal"
                          />
                          <Button
                            variant="outline"
                            onClick={() => setCustomSlugOverride(product.slug || "")}
                            title="Reset to default slug"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Output path: https://scryme.store/products/{customSlugOverride || product.slug || "unnamed"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dynamic Custom Metadata attributes */}
                  <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <Layers size={18} className="text-amber-500" />
                        <span>Dynamic Product Metadata Parameters</span>
                      </CardTitle>
                      <CardDescription>Configure custom tag properties filterable inside search indices and shopping catalog selectors.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Grid attributes table */}
                      <div className="border rounded-lg overflow-hidden dark:border-zinc-800">
                        <div className="grid grid-cols-3 bg-muted/60 font-bold border-b text-[10px] uppercase text-muted-foreground tracking-wider p-2.5 dark:border-zinc-800">
                          <div>Parameter Key</div>
                          <div>Value Settings</div>
                          <div className="text-right">Remove</div>
                        </div>

                        {customAttrs.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground italic">No parameters registered. Use inputs below.</div>
                        ) : (
                          customAttrs.map((attr: any, idx: number) => (
                            <div key={attr.id} className="grid grid-cols-3 items-center p-2 border-b text-xs text-foreground font-mono dark:border-zinc-800">
                              <div className="font-semibold text-foreground pl-1">{attr.key}</div>
                              <div>
                                <Input
                                  value={attr.value}
                                  onChange={(e) => {
                                    const updated = [...customAttrs];
                                    updated[idx].value = e.target.value;
                                    setCustomAttrs(updated);
                                  }}
                                  className="h-7 text-xs rounded border-border bg-background font-sans"
                                />
                              </div>
                              <div className="text-right pr-1">
                                <Button
                                  onClick={() => handleRemoveCustomAttr(attr.id)}
                                  variant="ghost"
                                  className="h-7 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add attribute forms */}
                      <div className="border p-4 bg-muted/10 space-y-3 rounded-lg dark:border-zinc-800">
                        <span className="text-xs font-bold text-foreground">Add Custom Parameter</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="attr-key" className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Key Name (alphanumeric & underscore)</Label>
                            <Input
                              id="attr-key"
                              placeholder="e.g. fabric_rating"
                              value={newAttrKey}
                              onChange={(e) => setNewAttrKey(e.target.value)}
                              className="text-xs h-8 rounded bg-background border-border font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="attr-val" className="text-[10px] font-bold uppercase text-muted-foreground">Value Content</Label>
                            <Input
                              id="attr-val"
                              placeholder="e.g. Waterproof Gore-Tex"
                              value={newAttrValue}
                              onChange={(e) => setNewAttrValue(e.target.value)}
                              className="text-xs h-8 rounded bg-background border-border"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomAttr();
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={handleAddCustomAttr}
                            variant="outline"
                            className="h-8 rounded text-xs border-border hover:bg-muted flex items-center gap-1"
                          >
                            <Plus size={13} />
                            <span>Register Attribute</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* VARIANTS TAB */}
            <TabsContent value="variants" className="mt-0">
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Product Variants</CardTitle>
                    <CardDescription>
                      Manage different sizes, colors, or materials.
                    </CardDescription>
                  </div>
                  <Button
                    className="gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
                            <TableCell className="font-medium text-foreground">
                              {v.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {v.sku}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
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
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[10px] uppercase font-bold">
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
                                        pointsOnPurchase:
                                          v.pointsOnPurchase || 0,
                                        loyaltyPointsOverride:
                                          v.loyaltyPointsOverride || 0,
                                        requiresExpiryTracking:
                                          v.requiresExpiryTracking ?? true,
                                        expiryWarningDays:
                                          v.expiryWarningDays || 2,
                                        defaultShelfLifeDays:
                                          v.defaultShelfLifeDays || 0,
                                        requiresSerialNumber:
                                          v.requiresSerialNumber ?? false,
                                        wholesalePrice: Number(
                                          v.wholesalePrice || 0,
                                        ),
                                        promotionalPrice: Number(
                                          v.promotionalPrice || 0,
                                        ),
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
                                    className="text-red-600 dark:text-red-400"
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
                    <span className="text-sm text-muted-foreground">
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
                      className="text-red-600 dark:text-red-400"
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
                  className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                        <Select
                          value={
                            variant.baseUnitId || variant.baseOrgUnitId || ""
                          }
                          onValueChange={async val => {
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select Unit..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>System Units</SelectLabel>
                              {systemUnits.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name} ({u.symbol})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Organization Units</SelectLabel>
                              {organizationUnits.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name} ({u.symbol})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4">
                        <Label>Stocking Unit (Purchasing Unit)</Label>
                        <Select
                          value={
                            variant.stockingUnitId ||
                            variant.stockingOrgUnitId ||
                            ""
                          }
                          onValueChange={async val => {
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select Unit..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>System Units</SelectLabel>
                              {systemUnits.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name} ({u.symbol})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Organization Units</SelectLabel>
                              {organizationUnits.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name} ({u.symbol})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
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
                                <Select
                                  value={su.systemUnitId || su.orgUnitId || ""}
                                  onValueChange={async val => {
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
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>System Units</SelectLabel>
                                      {systemUnits.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id}>
                                          {u.symbol}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                    <SelectGroup>
                                      <SelectLabel>
                                        Organization Units
                                      </SelectLabel>
                                      {organizationUnits.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id}>
                                          {u.symbol}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
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
                <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Retail Price</CardTitle>
                    <CardDescription>Default selling price.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Cost Price</CardTitle>
                    <CardDescription>
                      Base manufacturing/buying cost.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Margin</CardTitle>
                    <CardDescription>
                      Estimated profit percentage.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-14 flex items-center">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
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

              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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

              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                    <div className="bg-muted rounded-xl p-6 border border-dashed border-border flex flex-col items-center justify-center text-center">
                      <Tag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <h4 className="font-bold text-foreground mb-1">
                        No custom pricing rules found
                      </h4>
                      <p className="text-sm text-muted-foreground max-w-[300px]">
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
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                              <span className="text-muted-foreground">/</span>
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
                            <Select
                              value={rule.preferredSupplierId || ""}
                              onValueChange={async val => {
                                await updateReorderRule({
                                  ...rule,
                                  preferredSupplierId: val || null,
                                });
                                setProduct({
                                  ...product,
                                  reorderRules: product.reorderRules.map(
                                    (r: any) =>
                                      r.id === rule.id
                                        ? {
                                            ...r,
                                            preferredSupplierId: val || null,
                                          }
                                        : r,
                                  ),
                                });
                              }}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {suppliers.map((s: any) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            className="h-24 text-center text-muted-foreground italic">
                            No reorder rules configured.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                            <TableCell className="text-muted-foreground">
                              Default
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {variantStocks[0]?.availableStock
                                ? Number(variantStocks[0].availableStock)
                                : 0}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              0
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground">
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

              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                        <p className="text-sm text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground">
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
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
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
                            <TableCell className="font-bold text-foreground">
                              {s.supplier.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
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
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
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
                                  <DropdownMenuItem className="text-red-600 dark:text-red-400">
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
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
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
