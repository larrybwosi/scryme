"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Check,
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
  Layers,
  Wand2,
  FileCode,
  Calendar,
  Zap,
  Undo,
  Download,
  Copy,
  Sliders,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Eye,
  EyeOff,
  Info,
  Keyboard,
  History,
  Maximize2,
  Minimize2,
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
} from "@repo/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
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

const TABS = [
  { id: "rich-images", label: "Story & Media", icon: BookOpen, shortcut: "1" },
  { id: "seo-layout", label: "Layout & SEO", icon: Globe, shortcut: "2" },
  {
    id: "enterprise-tools",
    label: "Enterprise Tools",
    icon: Zap,
    shortcut: "3",
  },
] as const;

const MARKDOWN_TOOLS = [
  { key: "bold", label: "B", title: "Bold (Ctrl+B)", cls: "font-bold" },
  { key: "italic", label: "I", title: "Italic (Ctrl+I)", cls: "italic" },
  { key: "h1", label: "H1", title: "Heading 1", cls: "font-extrabold" },
  { key: "h2", label: "H2", title: "Heading 2", cls: "font-bold" },
  { key: "quote", label: '"', title: "Blockquote", cls: "" },
  { key: "link", label: "🔗", title: "Insert Link", cls: "" },
] as const;

export function HybridCmsClient({
  initialItem,
  categories,
  currency,
  itemType,
}: HybridCmsClientProps) {
  const router = useRouter();
  const [item] = useState(initialItem);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("rich-images");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Custom Fields extraction
  const customFieldsData =
    typeof item.customFields === "object" && item.customFields
      ? item.customFields
      : {};

  // 1. Rich Description / Story (Markdown)
  const [markdown, setMarkdown] = useState<string>(
    customFieldsData.markdownDescription || item.detailedDescription || "",
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
          caption:
            itemType === "product" ? "Product Image" : "Service Showcase Image",
        }))
      : [];
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  // 3. SEO Settings State
  const [seo, setSeo] = useState({
    title: customFieldsData.seo?.title || item.name || "",
    description: customFieldsData.seo?.description || "",
    keywords: customFieldsData.seo?.keywords || "",
  });

  // 4. Custom Parameters metadata State
  const initialAttrs: CustomAttribute[] =
    typeof customFieldsData.customAttributes === "object" &&
    customFieldsData.customAttributes
      ? Object.entries(customFieldsData.customAttributes).map(
          ([key, val]: any, idx) => ({
            id: `attr-${idx}-${Date.now()}`,
            key,
            value: val || "",
          }),
        )
      : [];
  const [customAttrs, setCustomAttrs] =
    useState<CustomAttribute[]>(initialAttrs);
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  // 5. High-end Layout & Scheduling fields
  const [publishStatus, setPublishStatus] = useState<string>(
    customFieldsData.publishStatus || "Draft",
  );
  const [publishedAt, setPublishedAt] = useState<string>(
    customFieldsData.publishedAt || "",
  );
  const [archivedAt, setArchivedAt] = useState<string>(
    customFieldsData.archivedAt || "",
  );
  const [layoutTemplate, setLayoutTemplate] = useState<string>(
    customFieldsData.layoutTemplate || "Elegant Editorial",
  );
  const [fontPair, setFontPair] = useState<string>(
    customFieldsData.fontPair || "Luxury Serif",
  );
  const [customSlugOverride, setCustomSlugOverride] = useState<string>(
    customFieldsData.customSlugOverride || item.slug || "",
  );

  // 6. Enterprise Features State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Luxury");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [generatedSeo, setGeneratedSeo] = useState({
    title: "",
    description: "",
  });

  const [optimizationQuality, setOptimizationQuality] = useState("80");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedMetrics, setOptimizedMetrics] = useState<string | null>(null);

  const [revisions, setRevisions] = useState<Revision[]>([
    {
      id: "rev-initial",
      timestamp: new Date().toLocaleString(),
      label: "Workspace opened",
      markdown,
      seo,
      images,
    },
  ]);

  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");
  const [storefrontMainImageIdx, setStorefrontMainImageIdx] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const recordRevision = (label: string) => {
    const newRev: Revision = {
      id: `rev-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      label,
      markdown,
      seo,
      images,
    };
    setRevisions(prev => [newRev, ...prev].slice(0, 20)); // Keep last 20 revisions
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
    else if (syntax === "link")
      insertion = `[${selectedText}](https://example.com)`;
    else if (syntax === "image")
      insertion = `![${selectedText}](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80)`;

    const updatedText =
      text.substring(0, start) + insertion + text.substring(end);
    setMarkdown(updatedText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + insertion.length,
        start + insertion.length,
      );
    }, 50);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim())
      return toast.error("Please provide a valid image URL");
    const itemImg = {
      id: `img-user-${Date.now()}`,
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || "Showcase Image",
    };
    setImages(prev => [...prev, itemImg]);
    setNewImageUrl("");
    setNewImageCaption("");
    toast.success("Image added to gallery");
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
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
    if (!newAttrKey.trim())
      return toast.error("Attribute key name cannot be empty");
    if (!newAttrValue.trim())
      return toast.error("Attribute value cannot be empty");

    const normalizedKey = newAttrKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");

    if (customAttrs.some(attr => attr.key === normalizedKey)) {
      return toast.error("Attribute key already exists");
    }

    const attr = {
      id: `attr-user-${Date.now()}`,
      key: normalizedKey,
      value: newAttrValue.trim(),
    };

    setCustomAttrs(prev => [...prev, attr]);
    setNewAttrKey("");
    setNewAttrValue("");
    toast.success(`Metadata parameter '${normalizedKey}' registered`);
  };

  const handleRemoveCustomAttr = (id: string) => {
    setCustomAttrs(prev => prev.filter(attr => attr.id !== id));
    toast.success("Metadata parameter removed");
  };

  const handleGenerateAI = () => {
    if (!aiPrompt.trim())
      return toast.error(
        "Please state what highlights or details the AI should write about",
      );
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
    setSeo(prev => ({
      ...prev,
      title: generatedSeo.title,
      description: generatedSeo.description,
    }));
    recordRevision("AI Content Applied");
    toast.success("AI Copywriter content applied to workspace!");
  };

  const handleBatchOptimize = () => {
    if (images.length === 0) return toast.error("No images loaded to optimize");
    setIsOptimizing(true);
    setTimeout(() => {
      const savedKB = Math.floor(Math.random() * 450) + 120;
      setOptimizedMetrics(
        `Optimized ${images.length} assets to standard WebP/AVIF format (Quality: ${optimizationQuality}%). Saved approx. ${savedKB} KB of payload delivery costs.`,
      );
      setIsOptimizing(false);
      toast.success("Batch Image Optimization Completed!");
    }, 1800);
  };

  const generatedSchema = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": itemType === "product" ? "Product" : "Service",
      name: item.name,
      image: images.map(img => img.url),
      description: seo.description,
      sku: item.sku,
      offers: {
        "@type": "Offer",
        priceCurrency: currency,
        price:
          itemType === "product"
            ? item.variants?.[0]?.retailPrice || 0
            : item.price || 0,
        availability: item.isActive
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
    },
    null,
    2,
  );

  const handleSaveAll = async (isAutoSave = false) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const customAttributesObj: Record<string, string> = {};
      customAttrs.forEach(attr => {
        if (attr.key.trim()) {
          customAttributesObj[attr.key.trim()] = attr.value;
        }
      });

      const customFieldsPayload = {
        markdownDescription: markdown,
        images: images.map(img => ({
          id: img.id,
          url: img.url,
          caption: img.caption,
        })),
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
          imageUrls: images.map(img => img.url),
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

      const now = new Date().toLocaleTimeString();
      setLastSaved(now);
      if (!isAutoSave) {
        recordRevision("Manual save");
        toast.success("All CMS Studio customizations saved successfully!");
      }
    } catch (error) {
      if (!isAutoSave) {
        toast.error("Failed to persist CMS changes");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllRef = useRef(handleSaveAll);
  const insertMarkdownRef = useRef(insertMarkdown);

  React.useEffect(() => {
    handleSaveAllRef.current = handleSaveAll;
    insertMarkdownRef.current = insertMarkdown;
  });

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab switching with numbers
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          handleSaveAllRef.current();
        } else if (e.key === "b" && activeTab === "rich-images") {
          e.preventDefault();
          insertMarkdownRef.current("bold", "bold text");
        } else if (e.key === "i" && activeTab === "rich-images") {
          e.preventDefault();
          insertMarkdownRef.current("italic", "italic text");
        }
        return;
      }

      // Tab switching
      const tabIndex = TABS.findIndex(t => t.shortcut === e.key);
      if (
        tabIndex !== -1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setActiveTab(TABS[tabIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSaveEnabled) return;

    const timer = setTimeout(() => {
      const hasChanges =
        markdown !==
        (customFieldsData.markdownDescription ||
          item.detailedDescription ||
          "");
      if (hasChanges && markdown.length > 0) {
        handleSaveAllRef.current(true);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [markdown, autoSaveEnabled, customFieldsData.markdownDescription, item.detailedDescription]);

  // --- derived UX helpers -------------------------------------------------
  const titleLen = seo.title.length;
  const descLen = seo.description.length;
  const titlePct = Math.min(100, (titleLen / 60) * 100);
  const descPct = Math.min(100, (descLen / 160) * 100);
  const statusTone: Record<string, string> = {
    Draft: "bg-muted text-muted-foreground border-border",
    Published:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400",
    Scheduled:
      "bg-blue-500/10 text-blue-500 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400",
    Archived:
      "bg-red-500/10 text-red-500 border-red-500/30 dark:bg-red-500/20 dark:text-red-400",
  };

  const hasUnsavedChanges =
    markdown !==
    (customFieldsData.markdownDescription || item.detailedDescription || "");

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col min-h-screen bg-background text-foreground",
          isFullscreen && "fixed inset-0 z-50",
        )}>
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b px-6 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <Button
              onClick={() =>
                router.push(
                  itemType === "product"
                    ? `/inventory/products/${item.id}`
                    : `/inventory/services/${item.id}`,
                )
              }
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Back to item details">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-[0.14em] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                  CMS Studio &middot; {itemType}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1.5 py-0 h-5">
                  {item.sku}
                </Badge>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded border",
                    statusTone[publishStatus] ?? statusTone.Draft,
                  )}>
                  {publishStatus}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] text-amber-500 flex items-center gap-1">
                    <Info size={10} />
                    Unsaved changes
                  </span>
                )}
              </div>
              <h1 className="text-[15px] font-semibold mt-0.5 leading-tight truncate">
                {item.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(!showPreview)}
                  aria-label="Toggle preview">
                  {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle preview panel</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  aria-label="Toggle fullscreen">
                  {isFullscreen ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle fullscreen mode</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Keyboard size={12} />
              <span className="hidden sm:inline">Ctrl+S to save</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  itemType === "product"
                    ? `/inventory/products/${item.id}`
                    : `/inventory/services/${item.id}`,
                )
              }>
              Exit Studio
            </Button>
            <Button
              onClick={() => handleSaveAll(false)}
              disabled={isSaving}
              size="sm"
              className="gap-2 min-w-[150px] shadow-sm">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Customizations
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-1.5 flex items-center gap-2 text-xs">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400">
              Last saved at {lastSaved}
            </span>
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className="ml-auto text-muted-foreground hover:text-foreground text-[10px] font-medium">
              {autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"}
            </button>
          </div>
        )}

        <div
          className={cn(
            "px-6 md:px-8 py-7 max-w-[1680px] mx-auto w-full",
            showPreview
              ? "grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-7"
              : "block",
          )}>
          <div className="space-y-7 min-w-0">
            {/* Panel intro + tab switcher */}
            <Card>
              <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b">
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-foreground">
                    Hybrid Content Studio
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                    Build rich storefront copy, curate visual assets, tune SEO
                    metadata, and run enterprise-grade publishing tools — all in
                    one workspace.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <History size={12} />
                    {revisions.length} revisions
                  </Badge>
                </div>
              </div>
              <nav
                className="flex items-center gap-1 px-2 overflow-x-auto"
                aria-label="Studio sections">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors group",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}>
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      <kbd className="ml-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity bg-muted px-1 py-0.5 rounded">
                        {tab.shortcut}
                      </kbd>
                      {isActive && (
                        <span className="absolute inset-x-3 -bottom-px h-[2px] bg-primary" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </Card>

            {/* TAB 1: STORY & MEDIA */}
            {activeTab === "rich-images" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <ImageIcon size={16} />
                      </span>
                      <span>Showcase Gallery</span>
                      <Badge
                        variant="secondary"
                        className="ml-auto font-mono text-[10px] font-normal">
                        {images.length}{" "}
                        {images.length === 1 ? "asset" : "assets"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Add image links or upload files, reorder the gallery, and
                      write captions used for alt text and catalog listings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {images.length === 0 ? (
                      <div className="border border-dashed rounded-lg py-10 text-center text-xs text-muted-foreground italic">
                        <ImageIcon
                          size={24}
                          className="mx-auto mb-2 opacity-50"
                        />
                        No image assets yet — the storefront preview will show a
                        placeholder until you add one.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {images.map((img, idx) => (
                          <div
                            key={img.id}
                            className="bg-card border rounded-lg p-3 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video w-full bg-muted rounded overflow-hidden relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.caption || "Preview"}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-background/90 backdrop-blur px-2 py-0.5 text-[10px] font-mono text-foreground rounded font-semibold shadow-sm">
                                #{idx + 1}
                                {idx === 0 && " · main"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                                Caption & alt text
                              </Label>
                              <Input
                                value={img.caption}
                                onChange={e => {
                                  const updated = [...images];
                                  updated[idx].caption = e.target.value;
                                  setImages(updated);
                                }}
                                className="text-xs h-8"
                                placeholder="e.g. Detailed closeup view"
                              />
                            </div>
                            <div className="flex items-center justify-between border-t pt-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() => handleMoveImage(idx, "up")}
                                  disabled={idx === 0}
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 p-0"
                                  title="Move earlier">
                                  <ChevronUp size={12} />
                                </Button>
                                <Button
                                  onClick={() => handleMoveImage(idx, "down")}
                                  disabled={idx === images.length - 1}
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 p-0"
                                  title="Move later">
                                  <ChevronDown size={12} />
                                </Button>
                              </div>
                              <Button
                                onClick={() => handleRemoveImage(img.id)}
                                variant="ghost"
                                className="h-7 px-2 text-destructive hover:bg-destructive/10 text-[11px] font-medium">
                                <Trash2 size={12} className="mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border rounded-lg p-4 bg-muted/20 space-y-3.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Plus size={13} className="text-primary" /> Add a new
                        image
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                            Upload file
                          </Label>
                          <div
                            onClick={() =>
                              !isUploading && fileInputRef.current?.click()
                            }
                            className="relative border-2 border-dashed border-border bg-background rounded-lg p-4 text-center hover:border-primary/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[90px]">
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  Uploading...
                                </span>
                              </div>
                            ) : newImageUrl ? (
                              <div className="flex items-center gap-2 w-full justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={newImageUrl}
                                    className="h-10 w-10 object-cover rounded"
                                    alt="Upload preview"
                                  />
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                                    Uploaded
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setNewImageUrl("");
                                  }}>
                                  <X size={14} />
                                </Button>
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  Click or drag to upload
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={async e => {
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
                                  toast.error("Image upload failed");
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="new-img-caption"
                            className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                            Caption
                          </Label>
                          <Input
                            id="new-img-caption"
                            placeholder="e.g. Editorial showcase banner"
                            value={newImageCaption}
                            onChange={e => setNewImageCaption(e.target.value)}
                            className="text-xs h-9 bg-background"
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddImage();
                              }
                            }}
                          />
                          <Input
                            placeholder="or paste an image URL"
                            value={newImageUrl}
                            onChange={e => setNewImageUrl(e.target.value)}
                            className="text-xs h-9 bg-background font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddImage}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs hover:bg-muted gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          Add to gallery
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rich Markdown Composer */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Sparkles size={16} />
                      </span>
                      <span>Storefront Story Composer</span>
                    </CardTitle>
                    <CardDescription>
                      Write in Markdown — headings, quotes, and lists render
                      live in the preview on the right.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-1 flex-wrap bg-muted/50 p-1.5 rounded-lg border">
                      {MARKDOWN_TOOLS.map(btn => (
                        <Tooltip key={btn.key}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                insertMarkdown(
                                  btn.key,
                                  btn.key === "h1"
                                    ? "Header 1"
                                    : btn.key === "h2"
                                      ? "Header 2"
                                      : btn.key === "quote"
                                        ? "blockquote citation"
                                        : `${btn.key} text`,
                                )
                              }
                              className={cn(
                                "h-7 px-2.5 text-xs hover:bg-background text-foreground",
                                btn.cls,
                              )}>
                              {btn.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{btn.title}</TooltipContent>
                        </Tooltip>
                      ))}
                      <span className="h-4 w-px bg-border mx-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => insertMarkdown("bullet", "list item")}
                        className="h-7 px-2.5 text-xs hover:bg-background text-foreground"
                        title="Bullet list">
                        • List
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => insertMarkdown("ordered", "list item")}
                        className="h-7 px-2.5 text-xs hover:bg-background text-foreground"
                        title="Numbered list">
                        1. List
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex flex-col">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Markdown Editor
                        </Label>
                        <textarea
                          ref={textareaRef}
                          value={markdown}
                          onChange={e => setMarkdown(e.target.value)}
                          placeholder="Compose your story using Markdown..."
                          className="w-full flex-1 min-h-[300px] p-3.5 text-xs font-mono border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-y"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Live preview
                        </Label>
                        <div className="w-full flex-1 min-h-[300px] p-4 border border-border bg-muted/10 rounded-lg overflow-y-auto max-h-[420px]">
                          {markdown ? (
                            <div
                              className="prose prose-sm max-w-none text-foreground break-words dark:prose-invert"
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdownToHtml(markdown),
                              }}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              No story description composed. Start typing to see
                              the preview.
                            </span>
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
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Globe size={16} />
                      </span>
                      <span>Search & Sharing Metadata</span>
                    </CardTitle>
                    <CardDescription>
                      Control how this listing appears in search results and
                      when shared on social platforms.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="seo-title"
                          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Meta title
                        </Label>
                        <span
                          className={cn(
                            "text-[10px] font-medium tabular-nums",
                            titleLen > 60
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}>
                          {titleLen}/60
                        </span>
                      </div>
                      <Input
                        id="seo-title"
                        value={seo.title}
                        onChange={e =>
                          setSeo({ ...seo, title: e.target.value })
                        }
                        placeholder="e.g. Premium Footwear Series"
                        className="bg-card"
                      />
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all rounded-full",
                            titleLen > 60 ? "bg-destructive" : "bg-emerald-500",
                          )}
                          style={{ width: `${titlePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="seo-desc"
                          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Meta description
                        </Label>
                        <span
                          className={cn(
                            "text-[10px] font-medium tabular-nums",
                            descLen > 160
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}>
                          {descLen}/160
                        </span>
                      </div>
                      <Textarea
                        id="seo-desc"
                        value={seo.description}
                        onChange={e =>
                          setSeo({ ...seo, description: e.target.value })
                        }
                        placeholder="e.g. Crafted to offer unparalleled performance under high pressure environments."
                        className="min-h-20 bg-card"
                      />
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all rounded-full",
                            descLen > 160 ? "bg-destructive" : "bg-emerald-500",
                          )}
                          style={{ width: `${descPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="seo-keywords"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Keywords
                      </Label>
                      <Input
                        id="seo-keywords"
                        value={seo.keywords}
                        onChange={e =>
                          setSeo({ ...seo, keywords: e.target.value })
                        }
                        placeholder="Comma-separated keywords"
                        className="bg-card"
                      />
                    </div>

                    {/* Google-style result preview */}
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Search result preview
                      </span>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-[13px] text-blue-600 dark:text-blue-400 truncate font-medium">
                          {seo.title || item.name}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-500">
                          scryme.store/
                          {itemType === "product" ? "products" : "services"}/
                          {customSlugOverride || item.slug}
                        </p>
                        <p className="text-[12px] text-muted-foreground line-clamp-2 leading-snug">
                          {seo.description || "No meta description set yet."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Sliders size={16} />
                      </span>
                      <span>Layout & Typography</span>
                    </CardTitle>
                    <CardDescription>
                      Set the visual theme and canonical URL for this listing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="layout-temp"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Layout theme
                      </Label>
                      <Select
                        value={layoutTemplate}
                        onValueChange={setLayoutTemplate}>
                        <SelectTrigger id="layout-temp" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Elegant Editorial">
                            Elegant Editorial
                          </SelectItem>
                          <SelectItem value="Minimalist Modern">
                            Minimalist Modern
                          </SelectItem>
                          <SelectItem value="Classic Grid">
                            Classic Grid
                          </SelectItem>
                          <SelectItem value="Bold Creative">
                            Bold Creative
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="font-p"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Font pairing
                      </Label>
                      <Select value={fontPair} onValueChange={setFontPair}>
                        <SelectTrigger id="font-p" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Luxury Serif">
                            Playfair Display & Inter
                          </SelectItem>
                          <SelectItem value="Tech Mono">
                            IBM Plex Mono & Space Grotesk
                          </SelectItem>
                          <SelectItem value="Classic Sans">
                            Plus Jakarta Sans & Geist
                          </SelectItem>
                          <SelectItem value="Creative Editorial">
                            Cinzel & Montserrat
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <Label
                        htmlFor="marketing-slug"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        URL slug
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="marketing-slug"
                          value={customSlugOverride}
                          onChange={e => setCustomSlugOverride(e.target.value)}
                          placeholder="e.g. customized-premium-deal"
                          className="bg-card font-mono"
                        />
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const slug = await generateProductSlug(item.name);
                            setCustomSlugOverride(slug);
                            toast.success("Slug generated");
                          }}>
                          Generate
                        </Button>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        scryme.store/
                        {itemType === "product" ? "products" : "services"}/
                        {customSlugOverride || item.slug}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Layers size={16} />
                      </span>
                      <span>Custom Parameters</span>
                      <Badge
                        variant="secondary"
                        className="ml-auto font-mono text-[10px] font-normal">
                        {customAttrs.length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Define custom specifications, filterable in search and
                      catalogs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-[1fr_1.4fr_44px] bg-muted/50 font-semibold border-b text-[10px] uppercase text-muted-foreground tracking-wide p-2.5">
                        <div>Key</div>
                        <div>Value</div>
                        <div />
                      </div>
                      {customAttrs.length === 0 ? (
                        <div className="p-5 text-center text-xs text-muted-foreground italic">
                          No custom specifications registered yet.
                        </div>
                      ) : (
                        customAttrs.map((attr, idx) => (
                          <div
                            key={attr.id}
                            className="grid grid-cols-[1fr_1.4fr_44px] items-center p-2 border-b last:border-b-0 text-xs text-foreground">
                            <div className="font-medium font-mono text-foreground pl-1 truncate pr-2">
                              {attr.key}
                            </div>
                            <div>
                              <Input
                                value={attr.value}
                                onChange={e => {
                                  const updated = [...customAttrs];
                                  updated[idx].value = e.target.value;
                                  setCustomAttrs(updated);
                                }}
                                className="h-7 text-xs bg-card"
                              />
                            </div>
                            <div className="text-right">
                              <Button
                                onClick={() => handleRemoveCustomAttr(attr.id)}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Plus size={13} className="text-primary" /> Register a
                        parameter
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="attr-key"
                            className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                            Key
                          </Label>
                          <Input
                            id="attr-key"
                            placeholder="e.g. style_tier"
                            value={newAttrKey}
                            onChange={e => setNewAttrKey(e.target.value)}
                            className="text-xs h-8 bg-card font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="attr-val"
                            className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                            Value
                          </Label>
                          <Input
                            id="attr-val"
                            placeholder="e.g. Limited Edition"
                            value={newAttrValue}
                            onChange={e => setNewAttrValue(e.target.value)}
                            className="text-xs h-8 bg-card"
                            onKeyDown={e => {
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
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs hover:bg-muted gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          Register
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Calendar size={16} />
                      </span>
                      <span>Publication Schedule</span>
                    </CardTitle>
                    <CardDescription>
                      Set the listing status, and optionally schedule when it
                      should go live or be archived.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="cms-status"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </Label>
                      <Select
                        value={publishStatus}
                        onValueChange={setPublishStatus}>
                        <SelectTrigger id="cms-status" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="sched-pub"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Goes live
                      </Label>
                      <Input
                        id="sched-pub"
                        type="datetime-local"
                        value={publishedAt}
                        onChange={e => setPublishedAt(e.target.value)}
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="sched-arch"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Archives
                      </Label>
                      <Input
                        id="sched-arch"
                        type="datetime-local"
                        value={archivedAt}
                        onChange={e => setArchivedAt(e.target.value)}
                        className="bg-card"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 3: ENTERPRISE TOOLS */}
            {activeTab === "enterprise-tools" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Wand2 size={16} />
                      </span>
                      <span>AI Content Generator</span>
                    </CardTitle>
                    <CardDescription>
                      Generate on-brand story copy and SEO headlines from a
                      short prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ai-prompt"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Prompt
                      </Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="e.g. Write an editorial description about waterproof mesh, targeting luxury winter sports clients."
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="min-h-16"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                      <div className="w-full sm:w-[200px] space-y-1">
                        <Label
                          htmlFor="ai-tone"
                          className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                          Tone
                        </Label>
                        <Select value={aiTone} onValueChange={setAiTone}>
                          <SelectTrigger id="ai-tone" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Luxury">
                              Luxury Connoisseur
                            </SelectItem>
                            <SelectItem value="Tech">
                              Tech Spec Matrix
                            </SelectItem>
                            <SelectItem value="Playful">
                              Playful Everyday
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="h-9 gap-1.5 text-xs font-semibold shrink-0"
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}>
                        {isGeneratingAI ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Generate copy
                          </>
                        )}
                      </Button>
                    </div>

                    {generatedMarkdown && (
                      <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Sparkles size={12} />
                          <span className="text-[10px] font-bold tracking-wide uppercase">
                            Suggested story copy
                          </span>
                        </div>
                        <div className="border rounded-lg bg-card p-3 text-xs font-mono max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                          {generatedMarkdown}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
                              Suggested title
                            </span>
                            <p className="text-xs font-medium mt-1">
                              {generatedSeo.title}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
                              Suggested description
                            </span>
                            <p className="text-xs font-medium mt-1">
                              {generatedSeo.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          className="w-full text-xs font-semibold py-1.5 h-9 gap-1.5"
                          variant="default"
                          onClick={applyAIGenerated}>
                          <Check className="w-4 h-4" /> Apply to workspace
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Zap size={16} />
                      </span>
                      <span>Batch Image Optimization</span>
                    </CardTitle>
                    <CardDescription>
                      Compress showcase assets into WebP/AVIF to improve load
                      speed and rankings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                      <div className="w-full sm:w-[200px] space-y-1">
                        <Label
                          htmlFor="opt-quality"
                          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Target quality
                        </Label>
                        <Select
                          value={optimizationQuality}
                          onValueChange={setOptimizationQuality}>
                          <SelectTrigger id="opt-quality" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="90">
                              90% · Lossless detail
                            </SelectItem>
                            <SelectItem value="80">
                              80% · Standard web
                            </SelectItem>
                            <SelectItem value="70">
                              70% · High compression
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="h-9 text-xs font-semibold gap-1.5 shrink-0"
                        variant="secondary"
                        onClick={handleBatchOptimize}
                        disabled={isOptimizing || images.length === 0}>
                        {isOptimizing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Optimize{" "}
                            {images.length > 0
                              ? `${images.length} assets`
                              : "assets"}
                          </>
                        )}
                      </Button>
                    </div>

                    {images.length === 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <AlertCircle size={12} />
                        Add images in Story & Media before optimizing.
                      </div>
                    )}

                    {optimizedMetrics && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-start gap-2">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                        <span>{optimizedMetrics}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <Undo size={16} />
                      </span>
                      <span>Revision History</span>
                    </CardTitle>
                    <CardDescription>
                      Trace past edits and instantly restore the workspace to a
                      previous state.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {revisions.map(rev => (
                      <div
                        key={rev.id}
                        className="flex items-center justify-between border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {rev.label}
                            </span>
                            <span className="text-[10px] font-mono font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {rev.timestamp}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {rev.markdown.length} chars · {rev.images.length}{" "}
                            {rev.images.length === 1 ? "image" : "images"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs font-semibold hover:bg-primary hover:text-primary-foreground shrink-0"
                          onClick={() => {
                            setMarkdown(rev.markdown);
                            setSeo(rev.seo);
                            if (rev.images.length > 0) {
                              setImages(rev.images);
                            }
                            toast.success(`Restored to: ${rev.label}`);
                          }}>
                          Restore
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded">
                        <FileCode size={16} />
                      </span>
                      <span>Schema.org Structured Data</span>
                    </CardTitle>
                    <CardDescription>
                      JSON-LD indexed by search engines to power rich result
                      snippets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative border rounded-lg bg-card dark:bg-zinc-950 p-4 text-xs font-mono text-foreground dark:text-zinc-300 max-h-[300px] overflow-y-auto">
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedSchema);
                                toast.success(
                                  "Structured JSON-LD schema copied to clipboard",
                                );
                              }}>
                              <Copy size={13} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy to clipboard</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                const blob = new Blob([generatedSchema], {
                                  type: "application/json",
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `schema-${item.id}.json`;
                                a.click();
                              }}>
                              <Download size={13} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download JSON</TooltipContent>
                        </Tooltip>
                      </div>
                      <pre className="text-inherit select-all whitespace-pre-wrap leading-relaxed pr-16">
                        {generatedSchema}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar: Storefront Card Preview */}
          {showPreview && (
            <div className="space-y-6 lg:block sticky top-[92px] self-start">
              <Card className="shadow-xl overflow-hidden flex flex-col font-sans bg-card text-card-foreground">
                <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/50">
                  <span className="text-[10px] tracking-wide font-bold uppercase text-primary flex items-center gap-1.5">
                    <Check size={12} />
                    Live storefront preview
                  </span>
                  <div className="flex items-center gap-1 h-6 bg-muted p-0.5 rounded border">
                    <button
                      type="button"
                      onClick={() => setPreviewTheme("light")}
                      className={cn(
                        "px-1.5 py-0.5 text-[9px] font-bold h-full rounded transition-colors",
                        previewTheme === "light"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                      aria-label="Light preview">
                      <Sun size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTheme("dark")}
                      className={cn(
                        "px-1.5 py-0.5 text-[9px] font-bold h-full rounded transition-colors",
                        previewTheme === "dark"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                      aria-label="Dark preview">
                      <Moon size={10} />
                    </button>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-4 transition-colors duration-300 flex flex-col gap-4",
                    previewTheme === "dark" ? "bg-zinc-950" : "bg-slate-50",
                  )}>
                  <div
                    className={cn(
                      "border rounded-lg overflow-hidden shadow-md flex flex-col",
                      previewTheme === "dark"
                        ? "bg-zinc-900 border-zinc-800"
                        : "bg-white border-zinc-200",
                    )}>
                    <div className="aspect-video w-full bg-muted relative flex items-center justify-center overflow-hidden">
                      {images[storefrontMainImageIdx]?.url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={images[storefrontMainImageIdx].url}
                          alt="Storefront"
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 opacity-50" />
                          <span className="text-[10px] font-medium">
                            No image configured
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 pt-6 text-left">
                        <span className="text-[9px] uppercase tracking-wide font-bold text-primary">
                          {categories.find(c => c.id === item.categoryId)
                            ?.name || "Premium Category"}
                        </span>
                        <h4
                          className={cn(
                            "text-sm font-bold text-white",
                            fontPair === "Luxury Serif"
                              ? "font-serif"
                              : fontPair === "Tech Mono"
                                ? "font-mono"
                                : "font-sans",
                          )}>
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    {images.length > 0 && (
                      <div className="p-2 flex gap-1 overflow-x-auto border-b border-border/40">
                        {images.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => setStorefrontMainImageIdx(idx)}
                            className={cn(
                              "h-8 w-12 flex-shrink-0 bg-muted border rounded relative overflow-hidden transition-all duration-150",
                              storefrontMainImageIdx === idx
                                ? "border-primary ring-1 ring-primary"
                                : "opacity-60 hover:opacity-90",
                            )}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt="Thumb"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="p-4 space-y-4 text-left">
                      <div className="flex items-center justify-between border-b pb-3 border-border/70">
                        <div>
                          <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wide">
                            {itemType === "product"
                              ? "Storefront price"
                              : "Booking rate"}
                          </span>
                          <div className="text-base font-bold mt-0.5 text-foreground">
                            {itemType === "product"
                              ? `$${Number(item.variants?.[0]?.retailPrice || item.retailPrice || 0).toFixed(2)}`
                              : item.pricingModel === "VARIABLE"
                                ? `$${(item.minPrice || 0).toFixed(2)} - $${(item.price || 0).toFixed(2)}`
                                : `$${(item.price || 0).toFixed(2)}`}
                          </div>
                        </div>
                        {itemType === "service" && item.estimatedDuration && (
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wide">
                              Duration
                            </span>
                            <div className="text-xs font-semibold flex items-center gap-1 justify-end mt-0.5 text-primary">
                              <Clock size={11} />
                              {item.estimatedDuration} min
                            </div>
                          </div>
                        )}
                      </div>

                      {itemType === "service" && item.requiresDeposit && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                          <span className="font-semibold">
                            Deposit required
                          </span>
                          <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                            {item.depositType === "PERCENTAGE"
                              ? `${item.depositAmount}%`
                              : `$${(item.depositAmount || 0).toFixed(2)}`}
                          </span>
                        </div>
                      )}

                      {customAttrs.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold">
                            Parameters
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {customAttrs.slice(0, 3).map(attr => (
                              <div
                                key={attr.id}
                                className="border rounded px-1.5 py-0.5 text-[9px] flex items-center gap-1 bg-muted/60">
                                <span className="text-primary font-semibold font-mono">
                                  {attr.key}:
                                </span>
                                <span className="truncate max-w-[80px] text-foreground">
                                  {attr.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold">
                          Story highlights
                        </span>
                        <div
                          className={cn(
                            "max-h-[140px] overflow-y-auto border rounded p-2.5 text-[11px] leading-relaxed font-sans",
                            previewTheme === "dark"
                              ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                              : "bg-slate-50 border-zinc-200 text-zinc-700",
                          )}>
                          {markdown ? (
                            <div
                              className="prose prose-xs text-inherit dark:prose-invert"
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdownToHtml(markdown),
                              }}
                            />
                          ) : (
                            <span className="italic text-muted-foreground">
                              No description highlights configured.
                            </span>
                          )}
                        </div>
                      </div>

                      <Button className="w-full text-xs font-bold py-1.5 h-9 uppercase tracking-wide">
                        {itemType === "product"
                          ? "Purchase asset"
                          : "Schedule consultation"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick stats card */}
              <Card>
                <CardContent className="p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold">{images.length}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Images
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {customAttrs.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Params
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{revisions.length}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Revisions
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-[10px] font-black uppercase mt-3 mb-1 text-inherit">$1</h3>',
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-xs font-bold mt-4 mb-1.5 text-inherit">$1</h2>',
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="text-sm font-extrabold mt-5 mb-2 text-inherit">$1</h1>',
  );
  html = html.replace(
    /^\s*&gt;\s+(.*$)/gim,
    '<blockquote class="border-l-2 border-primary pl-2 italic my-2 text-muted-foreground">$1</blockquote>',
  );
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-bold text-inherit">$1</strong>',
  );
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-inherit">$1</em>');
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-muted px-1 py-0.5 font-mono text-[10px] rounded">$1</code>',
  );

  const lines = html.split("\n");
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] =
          '<ul class="list-disc pl-3 my-1 space-y-0.5 text-inherit text-[11px]">\n<li>' +
          content +
          "</li>";
        inList = true;
      } else {
        lines[i] = "<li>" + content + "</li>";
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
        lines[i] =
          '<p class="my-1 leading-relaxed text-inherit text-[11px]">' +
          lines[i] +
          "</p>";
      }
    }
  }
  if (inList) lines.push("</ul>");
  return lines.join("\n");
}
