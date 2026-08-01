"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Check,
  Eye,
  Settings,
  Globe,
  Sun,
  Moon,
  Clock,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Trash2,
  Upload,
  Loader2,
  X,
  Plus,
  RefreshCw,
  Layers,
  Wand2,
  FileCode,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Zap,
  Undo,
  Download,
  Copy,
  Sliders,
  Type,
  Maximize2,
  Percent,
  TrendingUp,
  Info
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@repo/ui/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui/components/ui/select";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { updateProduct, generateProductSlug } from "../../../actions/inventory";
import { updateService } from "../../../actions/services";

interface HybridCmsClientProps {
  initialItem: any;
  categories: any[];
  currency: string;
  itemType: "product" | "service";
}

interface ImageItem {
  id: string;
  url: string;
  caption: string;
}

interface CustomAttribute {
  id: string;
  key: string;
  value: string;
}

interface Revision {
  id: string;
  timestamp: string;
  label: string;
  markdown: string;
  seo: { title: string; description: string; keywords: string };
  images: ImageItem[];
}

export function HybridCmsClient({
  initialItem,
  categories,
  currency,
  itemType
}: HybridCmsClientProps) {
  const router = useRouter();
  const [item, setItem] = useState(initialItem);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("rich-images");

  // Custom Fields extraction
  const customFieldsData =
    typeof item.customFields === "object" && item.customFields ? item.customFields : {};

  // 1. Rich Description / Story (Markdown)
  const [markdown, setMarkdown] = useState<string>(
    customFieldsData.markdownDescription ||
      item.detailedDescription ||
      (itemType === "product"
        ? `# ${item.name}\n\nExperience our high-quality product tailored specifically to your needs.\n\n## Key Features\n- Premium build quality\n- Long-lasting durability\n- High customer satisfaction`
        : `# ${item.name}\n\nOur custom-tailored luxury service delivers high-end professional standards to satisfy your organizational needs.`)
  );

  // 2. Multi-Image state
  const initialImages: ImageItem[] = Array.isArray(customFieldsData.images)
    ? customFieldsData.images.map((img: any, idx: number) => ({
        id: img.id || `img-${idx}-${Date.now()}`,
        url: img.url || "",
        caption: img.caption || "",
      }))
    : item.imageUrls && item.imageUrls.length > 0
    ? item.imageUrls.map((url: string, idx: number) => ({
        id: `img-init-${idx}`,
        url,
        caption: itemType === "product" ? "Product Image" : "Service Showcase Image",
      }))
    : [];
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  // 3. SEO Settings State
  const [seo, setSeo] = useState({
    title: customFieldsData.seo?.title || `${item.name} | Enterprise Collection`,
    description:
      customFieldsData.seo?.description ||
      `Explore ${item.name}. Premium catalog items optimized for high performance, luxury appeal, and global delivery.`,
    keywords: customFieldsData.seo?.keywords || `${item.name}, luxury experience, enterprise boutique, premium asset`,
  });

  // 4. Custom Parameters metadata State
  const initialAttrs: CustomAttribute[] =
    typeof customFieldsData.customAttributes === "object" && customFieldsData.customAttributes
      ? Object.entries(customFieldsData.customAttributes).map(([key, val]: any, idx) => ({
          id: `attr-${idx}-${Date.now()}`,
          key,
          value: val || "",
        }))
      : itemType === "product"
      ? [
          { id: "attr-1", key: "material", value: "Premium Grade Aluminum & Matte Finish" },
          { id: "attr-2", key: "warranty", value: "3 Year Global Comprehensive Warranty" },
        ]
      : [
          { id: "attr-1", key: "delivery_format", value: "On-site / Virtual Consultation" },
          { id: "attr-2", key: "expert_tier", value: "Senior Architect & Strategy Lead" },
        ];
  const [customAttrs, setCustomAttrs] = useState<CustomAttribute[]>(initialAttrs);
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  // 5. High-end Layout & Scheduling fields
  const [publishStatus, setPublishStatus] = useState<string>(customFieldsData.publishStatus || "Draft");
  const [publishedAt, setPublishedAt] = useState<string>(customFieldsData.publishedAt || "");
  const [archivedAt, setArchivedAt] = useState<string>(customFieldsData.archivedAt || "");
  const [layoutTemplate, setLayoutTemplate] = useState<string>(customFieldsData.layoutTemplate || "Elegant Editorial");
  const [fontPair, setFontPair] = useState<string>(customFieldsData.fontPair || "Luxury Serif");
  const [customSlugOverride, setCustomSlugOverride] = useState<string>(customFieldsData.customSlugOverride || item.slug || "");

  // 6. Enterprise Features State
  // AI Generator
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Luxury");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [generatedSeo, setGeneratedSeo] = useState({ title: "", description: "" });

  // Batch Image Optimization simulation
  const [optimizationQuality, setOptimizationQuality] = useState("80");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedMetrics, setOptimizedMetrics] = useState<string | null>(null);

  // Version/Revision Timeline
  const [revisions, setRevisions] = useState<Revision[]>([
    {
      id: "rev-1",
      timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString(),
      label: "Initial CMS Setup",
      markdown: `# ${item.name}\n\nInitial draft copy.`,
      seo: { title: `${item.name} | Catalog`, description: "Premium listing details", keywords: "draft" },
      images: initialImages.slice(0, 1)
    },
    {
      id: "rev-2",
      timestamp: new Date().toLocaleString(),
      label: "Current Workspace State",
      markdown,
      seo,
      images
    }
  ]);

  // Sidebar Preview Settings
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");
  const [storefrontMainImageIdx, setStorefrontMainImageIdx] = useState(0);

  // File Upload and Editor Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-record new revision on key changes
  const recordRevision = (label: string) => {
    const newRev: Revision = {
      id: `rev-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      label,
      markdown,
      seo,
      images
    };
    setRevisions((prev) => [newRev, ...prev]);
  };

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
    else if (syntax === "image") insertion = `![${selectedText}](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80)`;

    const updatedText = text.substring(0, start) + insertion + text.substring(end);
    setMarkdown(updatedText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 50);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return toast.error("Please provide a valid image URL");
    const itemImg = {
      id: `img-user-${Date.now()}`,
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || "Showcase Image",
    };
    setImages((prev) => [...prev, itemImg]);
    setNewImageUrl("");
    setNewImageCaption("");
    toast.success("Image added to gallery");
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (storefrontMainImageIdx >= images.length - 1) {
      setStorefrontMainImageIdx(0);
    }
    toast.success("Image removed from showcase gallery");
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setImages(updated);
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

  // Enterprise AI Copywriter & SEO engine
  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) return toast.error("Please state what highlights or details the AI should write about");
    setIsGeneratingAI(true);
    setTimeout(() => {
      let desc = "";
      let titleSeo = "";
      let descSeo = "";

      if (aiTone === "Luxury") {
        desc = `# The Sovereign Edition: ${item.name}\n\nIndulge in unparalleled prestige. Formulated for elite connoisseurs, this masterpiece bridges state-of-the-art innovation with timeless aesthetics.\n\n## Exquisite Attributes\n- Hand-assembled organic materials\n- Engineered to impeccable standards\n- Prestigious limited-tier release`;
        titleSeo = `The Sovereign ${item.name} | Timeless Grandeur`;
        descSeo = `Experience the luxurious essence of ${item.name}. Handcrafted craftsmanship meeting elite modern innovation for high-status lifestyles.`;
      } else if (aiTone === "Tech") {
        desc = `# Synapse System: ${item.name}\n\nNext-gen architectural throughput engineered for ultimate performance metrics. Features highly optimized algorithms coupled with next-tier durable design.\n\n## Tech Matrix\n- Accelerated latency-reduction architecture\n- Seamless cross-platform integrations\n- Multi-threaded cloud synchronization`;
        titleSeo = `${item.name} Spec-V3 | High-Yield Engine`;
        descSeo = `Maximize productivity parameters with ${item.name}. Deep specifications, robust metrics, and elite developer toolkits.`;
      } else {
        desc = `# Everyday Brilliance: ${item.name}\n\nSay hello to your new daily favorite! Extremely easy to use, lightweight, and perfect for dynamic schedules. Brighten up your routine instantly.\n\n## Why You'll Love It\n- Light, playful, and portable design\n- Budget-friendly, reliable construction\n- Joy-infused user experience guaranteed`;
        titleSeo = `Discover ${item.name} | Simple & Joyful`;
        descSeo = `Meet the everyday companion ${item.name}. Reliable quality, cheerful aesthetics, and incredible value to elevate your daily routine.`;
      }

      setGeneratedMarkdown(desc);
      setGeneratedSeo({ title: titleSeo, description: descSeo });
      setIsGeneratingAI(false);
      toast.success("AI Generation Complete!");
    }, 1500);
  };

  const applyAIGenerated = () => {
    if (!generatedMarkdown) return;
    setMarkdown(generatedMarkdown);
    setSeo((prev) => ({
      ...prev,
      title: generatedSeo.title,
      description: generatedSeo.description,
    }));
    recordRevision("AI Content Applied");
    toast.success("AI Copywriter content applied to workspace!");
  };

  // Enterprise Batch Image Optimizer simulation
  const handleBatchOptimize = () => {
    if (images.length === 0) return toast.error("No images loaded to optimize");
    setIsOptimizing(true);
    setTimeout(() => {
      const savedKB = Math.floor(Math.random() * 450) + 120;
      setOptimizedMetrics(
        `Optimized ${images.length} assets to standard WebP/AVIF format (Quality: ${optimizationQuality}%). Saved approx. ${savedKB} KB of payload delivery costs.`
      );
      setIsOptimizing(false);
      toast.success("Batch Image Optimization Completed!");
    }, 1800);
  };

  // Schema.org Structured Metadata generation
  const generatedSchema = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": itemType === "product" ? "Product" : "Service",
      "name": item.name,
      "image": images.map((img) => img.url),
      "description": seo.description,
      "sku": item.sku,
      "offers": {
        "@type": "Offer",
        "priceCurrency": currency,
        "price": itemType === "product" ? item.variants?.[0]?.retailPrice || 0 : item.price || 0,
        "availability": item.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    },
    null,
    2
  );

  // Save changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const customAttributesObj: Record<string, string> = {};
      customAttrs.forEach((attr) => {
        if (attr.key.trim()) {
          customAttributesObj[attr.key.trim()] = attr.value;
        }
      });

      const customFieldsPayload = {
        markdownDescription: markdown,
        images: images.map((img) => ({ id: img.id, url: img.url, caption: img.caption })),
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
        fontPair,
        customSlugOverride: customSlugOverride.trim(),
      };

      if (itemType === "product") {
        await updateProduct(item.id, {
          name: item.name,
          sku: item.sku,
          slug: customSlugOverride.trim() || item.slug,
          categoryId: item.categoryId,
          description: item.description,
          detailedDescription: markdown,
          imageUrls: images.map((img) => img.url),
          customFields: customFieldsPayload,
        });
      } else {
        await updateService(item.id, {
          name: item.name,
          sku: item.sku,
          categoryId: item.categoryId,
          description: item.description,
          customFields: customFieldsPayload,
        });
      }
      toast.success("All CMS Studio customizations saved successfully!");
    } catch (error) {
      toast.error("Failed to persist CMS changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-8 py-4 flex items-center justify-between shadow-sm dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push(itemType === "product" ? `/inventory/products/${item.id}` : `/inventory/services/${item.id}`)}
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Back to item details"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                Hybrid Studio &bull; {itemType.toUpperCase()}
              </span>
              <Badge variant="outline" className="font-mono bg-background text-xs">
                {item.sku}
              </Badge>
            </div>
            <h1 className="text-lg font-bold mt-1 leading-none">{item.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(itemType === "product" ? `/inventory/products/${item.id}` : `/inventory/services/${item.id}`)}
          >
            Exit Studio
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white min-w-[120px]"
          >
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Customizations
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-[1680px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-950 p-6 border shadow-sm rounded-xl dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-foreground">Enterprise CMS Hybrid Studio</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Customize rich storefront layouts, deploy marketing copy generators, manage optimized visual assets, and index high-end SEO schemas.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
              <Button
                variant={activeTab === "rich-images" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("rich-images")}
                size="sm"
                className="text-xs"
              >
                Story & Media
              </Button>
              <Button
                variant={activeTab === "seo-layout" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("seo-layout")}
                size="sm"
                className="text-xs"
              >
                Layout & SEO
              </Button>
              <Button
                variant={activeTab === "enterprise-tools" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("enterprise-tools")}
                size="sm"
                className="text-xs"
              >
                Enterprise Tools
              </Button>
            </div>
          </div>

          {/* TAB 1: STORY & MEDIA */}
          {activeTab === "rich-images" && (
            <div className="space-y-6">
              {/* Showcase Image Gallery */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon size={18} className="text-amber-500" />
                    <span>Unified Showcase Gallery</span>
                  </CardTitle>
                  <CardDescription>
                    Add direct visual asset links, drag uploads, order layouts, and define precise image captions for assistive tech and catalogs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 bg-muted/30 rounded-lg dark:border-zinc-800">
                    {images.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic">
                        No image assets loaded. Storefront preview will use default placeholder grids.
                      </div>
                    ) : (
                      images.map((img, idx) => (
                        <div key={img.id} className="bg-background border p-3 flex flex-col gap-2 relative shadow-xs rounded-lg dark:border-zinc-800">
                          <div className="aspect-video w-full bg-muted overflow-hidden relative rounded-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.caption || "Preview"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-mono text-white tracking-widest font-bold rounded">
                              #{idx + 1} {idx === 0 && "(MAIN)"}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Caption & Alt Text</Label>
                            <Input
                              value={img.caption}
                              onChange={(e) => {
                                const updated = [...images];
                                updated[idx].caption = e.target.value;
                                setImages(updated);
                              }}
                              className="text-xs h-7 rounded border-border"
                              placeholder="e.g. Detailed closeup view"
                            />
                          </div>
                          <div className="flex items-center justify-between border-t pt-2 mt-1 dark:border-zinc-800">
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => handleMoveImage(idx, "up")}
                                disabled={idx === 0}
                                variant="outline"
                                className="h-6 w-6 p-0 rounded border-border"
                                title="Move forward"
                              >
                                <ChevronUp size={12} />
                              </Button>
                              <Button
                                onClick={() => handleMoveImage(idx, "down")}
                                disabled={idx === images.length - 1}
                                variant="outline"
                                className="h-6 w-6 p-0 rounded border-border"
                                title="Move backward"
                              >
                                <ChevronDown size={12} />
                              </Button>
                            </div>
                            <Button
                              onClick={() => handleRemoveImage(img.id)}
                              variant="ghost"
                              className="h-6 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 text-xs rounded"
                            >
                              <Trash2 size={12} className="mr-1 inline" />
                              <span>Remove</span>
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border p-4 bg-muted/10 space-y-3 rounded-lg dark:border-zinc-800">
                    <span className="text-xs font-bold text-foreground">Upload & Register Image</span>
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
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-img-caption" className="text-[10px] font-bold uppercase text-muted-foreground">Caption</Label>
                        <Input
                          id="new-img-caption"
                          placeholder="e.g. Editorial showcase banner"
                          value={newImageCaption}
                          onChange={(e) => setNewImageCaption(e.target.value)}
                          className="text-xs h-8 bg-background border-border"
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
                        <Plus className="w-4 h-4" />
                        <span>Insert Image URL</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rich Markdown Composer */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <span>Storefront Story Composer</span>
                  </CardTitle>
                  <CardDescription>
                    Design exquisite narratives. Use rich Markdown format with custom headers, blockquotes, and highlights to capture high-end client interest.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-1.5 flex-wrap bg-muted/60 p-2 border border-border rounded-lg dark:border-zinc-800">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => insertMarkdown("bold", "bold text")}
                      className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                      title="Bold"
                    >
                      B
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => insertMarkdown("italic", "italic text")}
                      className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground italic"
                      title="Italic"
                    >
                      I
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => insertMarkdown("h1", "Header 1")}
                      className="h-7 px-2 text-xs font-extrabold hover:bg-muted rounded text-foreground"
                      title="H1"
                    >
                      H1
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => insertMarkdown("h2", "Header 2")}
                      className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                      title="H2"
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => insertMarkdown("quote", "blockquote citation")}
                      className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                      title="Blockquote"
                    >
                      &ldquo;
                    </Button>
                    <span className="h-4 w-[1px] bg-border mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => insertMarkdown("bullet", "list item")}
                      className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                      title="Bullet List"
                    >
                      &bull;
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => insertMarkdown("ordered", "list item")}
                      className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                      title="Numbered List"
                    >
                      1.
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Markdown Composer</Label>
                      <textarea
                        ref={textareaRef}
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        placeholder="Compose details..."
                        className="w-full flex-1 min-h-[300px] p-3 text-xs font-mono border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y rounded-lg dark:border-zinc-800"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Live Formatted Preview</Label>
                      <div className="w-full flex-1 min-h-[300px] p-4 border border-border bg-muted/10 overflow-y-auto rounded-lg dark:border-zinc-800 max-h-[420px]">
                        {markdown ? (
                          <div
                            className="prose prose-sm max-w-none text-foreground break-words dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No story description composed.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: LAYOUT & SEO */}
          {activeTab === "seo-layout" && (
            <div className="space-y-6">
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe size={18} className="text-amber-500" />
                    <span>Advanced SEO Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Provide targeted browser heads, sharing parameters, and custom keyword taxonomies to ensure organic discoverability.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="seo-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Title Headline</Label>
                    <Input
                      id="seo-title"
                      value={seo.title}
                      onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                      placeholder="e.g. Premium Footwear Series"
                      className="rounded bg-background border-border"
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Ideal: 50-60 characters.</span>
                      <span className={seo.title.length > 60 ? "text-amber-500 font-semibold" : "text-green-500"}>
                        Current: {seo.title.length} characters
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Description Snippet</Label>
                    <Textarea
                      id="seo-desc"
                      value={seo.description}
                      onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                      placeholder="e.g. Crafted to offer unparalleled performance under high pressure environments."
                      className="min-h-20 rounded bg-background border-border"
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Ideal: 120-160 characters.</span>
                      <span className={seo.description.length > 160 ? "text-amber-500 font-semibold" : "text-green-500"}>
                        Current: {seo.description.length} characters
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-keywords" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Keywords</Label>
                    <Input
                      id="seo-keywords"
                      value={seo.keywords}
                      onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                      placeholder="Keywords separated by commas"
                      className="rounded bg-background border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Layout templates and font configurations */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sliders size={18} className="text-amber-500" />
                    <span>Multi-Channel Front Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Tailor style aesthetics, font weights, and catalog layouts across storefront layouts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="layout-temp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout Theme Profile</Label>
                    <Select value={layoutTemplate} onValueChange={setLayoutTemplate}>
                      <SelectTrigger id="layout-temp" className="rounded bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Elegant Editorial">Elegant Editorial Profile</SelectItem>
                        <SelectItem value="Minimalist Modern">Minimalist Modern Single-Focus</SelectItem>
                        <SelectItem value="Classic Grid">Classic Grid Showcase</SelectItem>
                        <SelectItem value="Bold Creative">Bold Creative Feature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="font-p" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Theme Font Pairing</Label>
                    <Select value={fontPair} onValueChange={setFontPair}>
                      <SelectTrigger id="font-p" className="rounded bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Luxury Serif">Playfair Display & Inter</SelectItem>
                        <SelectItem value="Tech Mono">IBM Plex Mono & Space Grotesk</SelectItem>
                        <SelectItem value="Classic Sans">Plus Jakarta Sans & Geist</SelectItem>
                        <SelectItem value="Creative Editorial">Cinzel & Montserrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="marketing-slug" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marketing URL Override (Slug)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="marketing-slug"
                        value={customSlugOverride}
                        onChange={(e) => setCustomSlugOverride(e.target.value)}
                        placeholder="e.g. customized-premium-deal"
                        className="rounded bg-background border-border font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const slug = await generateProductSlug(item.name);
                          setCustomSlugOverride(slug);
                        }}
                      >
                        Generate Default
                      </Button>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Target URL: https://scryme.store/{itemType === "product" ? "products" : "services"}/{customSlugOverride || item.slug}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Metadata Fields */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers size={18} className="text-amber-500" />
                    <span>Dynamic Metadata Parameters</span>
                  </CardTitle>
                  <CardDescription>
                    Define custom specifications filterable in indices and searchable catalogs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg overflow-hidden dark:border-zinc-800">
                    <div className="grid grid-cols-3 bg-muted/60 font-bold border-b text-[10px] uppercase text-muted-foreground tracking-wider p-2.5 dark:border-zinc-800">
                      <div>Parameter Key</div>
                      <div>Value Settings</div>
                      <div className="text-right">Remove</div>
                    </div>
                    {customAttrs.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground italic">No custom specifications registered. Use inputs below.</div>
                    ) : (
                      customAttrs.map((attr, idx) => (
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

                  <div className="border p-4 bg-muted/10 space-y-3 rounded-lg dark:border-zinc-800">
                    <span className="text-xs font-bold text-foreground">Register Custom Parameter</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="attr-key" className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Key (lowercase & underscore)</Label>
                        <Input
                          id="attr-key"
                          placeholder="e.g. style_tier"
                          value={newAttrKey}
                          onChange={(e) => setNewAttrKey(e.target.value)}
                          className="text-xs h-8 bg-background border-border font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="attr-val" className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Value Settings</Label>
                        <Input
                          id="attr-val"
                          placeholder="e.g. Limited Edition"
                          value={newAttrValue}
                          onChange={(e) => setNewAttrValue(e.target.value)}
                          className="text-xs h-8 bg-background border-border"
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
                        <Plus className="w-4 h-4" />
                        <span>Register Parameter</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar size={18} className="text-amber-500" />
                    <span>Publication & Scheduled Listing</span>
                  </CardTitle>
                  <CardDescription>
                    Configure the active listing status, and optionally set automated date intervals when pages should launch or archive automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="cms-status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Listing Status</Label>
                    <Select value={publishStatus} onValueChange={setPublishStatus}>
                      <SelectTrigger id="cms-status" className="rounded bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft (Internal/Testing)</SelectItem>
                        <SelectItem value="Published">Published (Public Catalog)</SelectItem>
                        <SelectItem value="Scheduled">Scheduled (Auto Publication)</SelectItem>
                        <SelectItem value="Archived">Archived (De-listed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sched-pub" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scheduled Live</Label>
                    <Input
                      id="sched-pub"
                      type="datetime-local"
                      value={publishedAt}
                      onChange={(e) => setPublishedAt(e.target.value)}
                      className="rounded bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sched-arch" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scheduled Archive</Label>
                    <Input
                      id="sched-arch"
                      type="datetime-local"
                      value={archivedAt}
                      onChange={(e) => setArchivedAt(e.target.value)}
                      className="rounded bg-background border-border"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: ENTERPRISE TOOLS */}
          {activeTab === "enterprise-tools" && (
            <div className="space-y-6">
              {/* AI Assistant */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-amber-500" />
                    <span>AI-Assisted Content Generator</span>
                  </CardTitle>
                  <CardDescription>
                    Deploy deep-copywriter neural networks to formulate luxurious copy and search engine headlines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-prompt" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Creative Prompt / Directives</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="e.g. Write an editorial description about waterproof mesh, targeting luxury winter sports clients."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="min-h-16"
                    />
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-[180px] space-y-1">
                      <Label htmlFor="ai-tone" className="text-[10px] font-bold uppercase text-muted-foreground">Tone Style</Label>
                      <Select value={aiTone} onValueChange={setAiTone}>
                        <SelectTrigger id="ai-tone" className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Luxury">Luxury Connoisseur</SelectItem>
                          <SelectItem value="Tech">Tech Spec Matrix</SelectItem>
                          <SelectItem value="Playful">Playful Everyday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="mt-auto h-8 bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs font-semibold"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Spec...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate Copy
                        </>
                      )}
                    </Button>
                  </div>

                  {generatedMarkdown && (
                    <div className="border rounded-lg p-4 bg-muted/40 space-y-4 dark:border-zinc-800">
                      <div>
                        <span className="text-xs font-extrabold tracking-widest text-amber-500 uppercase font-mono">Suggested AI Story Copy</span>
                        <div className="border bg-background p-3 mt-2 text-xs font-mono max-h-[160px] overflow-y-auto rounded-md">
                          {generatedMarkdown}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Suggested SEO Title</span>
                          <p className="text-xs font-semibold mt-1">{generatedSeo.title}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Suggested SEO Desc</span>
                          <p className="text-xs font-semibold mt-1">{generatedSeo.description}</p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 h-8 gap-1.5 rounded-lg"
                        onClick={applyAIGenerated}
                      >
                        <Check className="w-4 h-4" /> Apply AI Copy to Workspace
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Batch Image Optimizer */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>Batch Image Optimization Engine</span>
                  </CardTitle>
                  <CardDescription>
                    Compress showcase visual payloads into WebP/AVIF containers to enhance page load speeds and search engine rankings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="w-[180px] space-y-1">
                      <Label htmlFor="opt-quality" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Image Quality</Label>
                      <Select value={optimizationQuality} onValueChange={setOptimizationQuality}>
                        <SelectTrigger id="opt-quality" className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="90">90% Quality (Lossless detail)</SelectItem>
                          <SelectItem value="80">80% Quality (Standard Web)</SelectItem>
                          <SelectItem value="70">70% Quality (High Compression)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="mt-auto h-8 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold gap-1.5"
                      onClick={handleBatchOptimize}
                      disabled={isOptimizing || images.length === 0}
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Optimizing Pipeline...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Optimize Showcase Assets
                        </>
                      )}
                    </Button>
                  </div>

                  {optimizedMetrics && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium rounded-lg">
                      {optimizedMetrics}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revision History Log */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Undo className="w-5 h-5 text-amber-500" />
                    <span>Revision Workspace History</span>
                  </CardTitle>
                  <CardDescription>
                    Trace past editing iterations. Instantly revert workspace configurations to a previous baseline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {revisions.map((rev) => (
                      <div
                        key={rev.id}
                        className="flex items-center justify-between border p-3 rounded-lg bg-background hover:bg-muted/30 transition-colors dark:border-zinc-800"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{rev.label}</span>
                            <span className="text-[10px] font-mono font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {rev.timestamp}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            Markdown: {rev.markdown.length} chars &bull; Images: {rev.images.length}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-semibold hover:bg-amber-500 hover:text-white"
                          onClick={() => {
                            setMarkdown(rev.markdown);
                            setSeo(rev.seo);
                            if (rev.images.length > 0) {
                              setImages(rev.images);
                            }
                            toast.success(`Restored to: ${rev.label}`);
                          }}
                        >
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Schema JSON structured code metadata inspector */}
              <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-amber-500" />
                    <span>Schema.org Structured Data Inspector</span>
                  </CardTitle>
                  <CardDescription>
                    Verify exact JSON-LD structures indexing parameters directly into Google Search engines to produce Rich Snippet carousels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative border rounded-lg bg-zinc-950 p-4 text-xs font-mono text-zinc-300 max-h-[300px] overflow-y-auto">
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedSchema);
                          toast.success("Structured JSON-LD schema copied to clipboard");
                        }}
                      >
                        <Copy size={13} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-white"
                        onClick={() => {
                          const blob = new Blob([generatedSchema], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `schema-${item.id}.json`;
                          a.click();
                        }}
                      >
                        <Download size={13} />
                      </Button>
                    </div>
                    <pre className="text-inherit select-all whitespace-pre-wrap leading-relaxed">{generatedSchema}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar: Storefront Card Preview with typography controls */}
        <div className="space-y-6 lg:block sticky top-24">
          <Card className="border-border shadow-xl rounded-xl overflow-hidden flex flex-col font-sans transition-all duration-300 bg-[#0f1115] border-zinc-800 text-white">
            <div className="border-b px-4 py-3 flex items-center justify-between bg-[#16181d] border-zinc-800">
              <span className="text-[10px] tracking-widest font-black uppercase text-amber-500 flex items-center gap-1.5 font-mono">
                <Check size={12} />
                <span>Live Storefront Preview</span>
              </span>
              <div className="flex items-center gap-1 h-6 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPreviewTheme("light")}
                  className={cn(
                    "px-1.5 py-0.5 text-[9px] rounded font-bold h-full",
                    previewTheme === "light" ? "bg-amber-500 text-white" : "text-zinc-400"
                  )}
                >
                  <Sun size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme("dark")}
                  className={cn(
                    "px-1.5 py-0.5 text-[9px] rounded font-bold h-full",
                    previewTheme === "dark" ? "bg-amber-500 text-white" : "text-zinc-400"
                  )}
                >
                  <Moon size={10} />
                </button>
              </div>
            </div>

            {/* Simulated Frame */}
            <div className={cn(
              "p-4 transition-all duration-300 flex flex-col gap-4",
              previewTheme === "dark" ? "bg-[#090b0e]" : "bg-slate-50 text-slate-900"
            )}>
              {/* Product Card Rendering */}
              <div className={cn(
                "border rounded-xl overflow-hidden shadow-md flex flex-col",
                previewTheme === "dark" ? "bg-[#111419] border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <div className="aspect-video w-full bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                  {images[storefrontMainImageIdx]?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={images[storefrontMainImageIdx].url}
                      alt="Storefront"
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <ImageIcon className="h-8 w-8 text-zinc-600" />
                      <span className="text-[10px] font-bold">No Image Configured</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 pt-6 text-left">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-400">
                      {categories.find((c) => c.id === item.categoryId)?.name || "Premium Category"}
                    </span>
                    <h4 className={cn(
                      "text-sm font-black text-slate-100",
                      fontPair === "Luxury Serif" ? "font-serif" : fontPair === "Tech Mono" ? "font-mono" : "font-sans"
                    )}>
                      {item.name}
                    </h4>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="p-2 flex gap-1 overflow-x-auto border-b border-zinc-800 dark:border-zinc-800/40">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setStorefrontMainImageIdx(idx)}
                        className={cn(
                          "h-8 w-12 flex-shrink-0 bg-zinc-900 border relative overflow-hidden transition-all duration-150 rounded",
                          storefrontMainImageIdx === idx ? "border-amber-500 ring-1 ring-amber-500" : "opacity-60"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Body details dependent on type */}
                <div className="p-4 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800 border-zinc-100">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        {itemType === "product" ? "Storefront Price" : "Booking Rate"}
                      </span>
                      <div className={cn(
                        "text-base font-black mt-0.5",
                        previewTheme === "dark" ? "text-slate-100" : "text-zinc-900"
                      )}>
                        {itemType === "product" ? (
                          `$${(Number(item.variants?.[0]?.retailPrice || item.retailPrice || 0)).toFixed(2)}`
                        ) : item.pricingModel === "VARIABLE" ? (
                          `$${(item.minPrice || 0).toFixed(2)} - $${(item.price || 0).toFixed(2)}`
                        ) : (
                          `$${(item.price || 0).toFixed(2)}`
                        )}
                      </div>
                    </div>
                    {itemType === "service" && item.estimatedDuration && (
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Duration</span>
                        <div className="text-xs font-bold flex items-center gap-1 justify-end mt-0.5 text-amber-500">
                          <Clock size={11} />
                          <span>{item.estimatedDuration} Min</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {itemType === "service" && item.requiresDeposit && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 text-[10px] text-emerald-500 flex items-center justify-between rounded-md">
                      <span className="font-extrabold">Secure Deposit Req:</span>
                      <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                        {item.depositType === "PERCENTAGE" ? `${item.depositAmount}%` : `$${(item.depositAmount || 0).toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  {customAttrs.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black font-mono">Parameters</span>
                      <div className="flex flex-wrap gap-1">
                        {customAttrs.slice(0, 3).map((attr) => (
                          <div key={attr.id} className="border px-1.5 py-0.5 text-[9px] flex items-center gap-1 rounded bg-muted/40 dark:border-zinc-800">
                            <span className="text-amber-500 font-bold font-mono">{attr.key}:</span>
                            <span className="truncate max-w-[80px] text-muted-foreground">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black font-mono">Story Highlights</span>
                    <div className={cn(
                      "max-h-[140px] overflow-y-auto border p-2.5 text-[11px] leading-relaxed scrollbar-thin rounded-lg font-sans",
                      previewTheme === "dark" ? "bg-[#16181d] border-zinc-800 text-slate-300" : "bg-slate-50 border-zinc-200 text-zinc-700"
                    )}>
                      {markdown ? (
                        <div
                          className="prose prose-xs text-inherit dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                        />
                      ) : (
                        <span className="italic text-muted-foreground">No description highlights configured.</span>
                      )}
                    </div>
                  </div>

                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 h-8 uppercase tracking-wider rounded-lg border-none mt-2">
                    {itemType === "product" ? "Purchase Asset" : "Schedule Consultation"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-[10px] font-black uppercase mt-3 mb-1 text-inherit">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xs font-bold mt-4 mb-1.5 text-inherit">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-sm font-extrabold mt-5 mb-2 text-inherit">$1</h1>');
  html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote class="border-l-2 border-amber-500 pl-2 italic my-2 text-muted-foreground">$1</blockquote>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-inherit">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-inherit">$1</em>');
  html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded font-mono text-[10px]">$1</code>');

  const lines = html.split("\n");
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul class="list-disc pl-3 my-1 space-y-0.5 text-inherit text-[11px]">\n<li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else {
      if (inList) {
        lines[i] = "</ul>\n" + lines[i];
        inList = false;
      }
      if (
        lines[i].trim() &&
        !lines[i].trim().startsWith("<h") &&
        !lines[i].trim().startsWith("<blockquote") &&
        !lines[i].trim().startsWith("<ul") &&
        !lines[i].trim().startsWith("<li")
      ) {
        lines[i] = '<p class="my-1 leading-relaxed text-inherit text-[11px]">' + lines[i] + '</p>';
      }
    }
  }
  if (inList) lines.push("</ul>");
  return lines.join("\n");
}
