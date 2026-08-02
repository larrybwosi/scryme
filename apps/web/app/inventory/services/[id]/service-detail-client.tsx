"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { formatCurrency } from "../../../../lib/utils";
import { updateService } from "../../../actions/services";

// Core PricingModel & DepositType enums
const PricingModel = {
  FIXED: "FIXED" as const,
  HOURLY: "HOURLY" as const,
  VARIABLE: "VARIABLE" as const,
};
type PricingModel = (typeof PricingModel)[keyof typeof PricingModel];

const DepositType = {
  FIXED: "FIXED" as const,
  PERCENTAGE: "PERCENTAGE" as const,
};
type DepositType = (typeof DepositType)[keyof typeof DepositType];

// Import Subcomponents
import { CoreTab } from "./_components/core-tab";
import { RichTab } from "./_components/rich-tab";
import { SEOTab } from "./_components/seo-tab";

interface ServiceDetailPageClientProps {
  initialService: any;
  categories: any[];
  currency: string;
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

export function ServiceDetailPageClient({
  initialService,
  categories,
  currency,
}: ServiceDetailPageClientProps) {
  const router = useRouter();
  const [service, setService] = useState(initialService);
  const [isSaving, setIsSaving] = useState(false);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<"core" | "rich" | "preview">("core");

  // 1. Core Attributes Form State
  const [coreForm, setCoreForm] = useState({
    name: service.name || "",
    description: service.description || "",
    sku: service.sku || "",
    categoryId: service.categoryId || "",
    pricingModel: (service.pricingModel || PricingModel.FIXED) as PricingModel,
    price: service.price ? service.price.toString() : "",
    minPrice: service.minPrice ? service.minPrice.toString() : "",
    estimatedDuration: service.estimatedDuration ? service.estimatedDuration.toString() : "",
    requiresDeposit: !!service.requiresDeposit,
    depositAmount: service.depositAmount ? service.depositAmount.toString() : "",
    depositType: (service.depositType || DepositType.FIXED) as DepositType,
    isActive: !!service.isActive,
  });

  // Extract initial dynamic JSON data from customFields
  const customFieldsData = typeof service.customFields === "object" && service.customFields ? service.customFields : {};

  // 2. Rich content CMS states (Markdown + Multiple Images)
  const [markdown, setMarkdown] = useState<string>(
    customFieldsData.markdownDescription ||
    `# ${service.name}\n\n${service.description || ""}`
  );

  // Multiple images state
  const initialImages: ImageItem[] = Array.isArray(customFieldsData.images)
    ? customFieldsData.images.map((img: any, idx: number) => ({
        id: img.id || `img-${idx}-${Date.now()}`,
        url: img.url || "",
        caption: img.caption || "",
      }))
    : [];
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  // 3. SEO settings state
  const [seo, setSeo] = useState({
    title: customFieldsData.seo?.title || `${service.name} | Premium Custom Services`,
    description: customFieldsData.seo?.description || `Book our signature ${service.name} today. Read descriptions, view details, and secure your spot easily!`,
    keywords: customFieldsData.seo?.keywords || `${service.name}, custom booking, service class, storefront`,
  });

  // 4. Custom Attributes metadata state
  const initialAttrs: CustomAttribute[] =
    typeof customFieldsData.customAttributes === "object" && customFieldsData.customAttributes
      ? Object.entries(customFieldsData.customAttributes).map(([key, val]: any, idx) => ({
          id: `attr-${idx}-${Date.now()}`,
          key,
          value: val || "",
        }))
      : [];
  const [customAttrs, setCustomAttrs] = useState<CustomAttribute[]>(initialAttrs);
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  // Real-time Preview: Current main image URL selected in Simulated Storefront
  const [storefrontMainImageIdx, setStorefrontMainImageIdx] = useState(0);

  // Markdown editor textarea ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated Preview Settings
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");

  // Markdown syntax insertion helper
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
    else if (syntax === "image") insertion = `![${selectedText}](https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80)`;

    const updatedText = text.substring(0, start) + insertion + text.substring(end);
    setMarkdown(updatedText);

    // Refocus & reset cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 50);
  };

  // Image actions
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return toast.error("Please provide a valid image URL");
    const item: ImageItem = {
      id: `img-user-${Date.now()}`,
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || "Service Showcase Image",
    };
    setImages((prev) => [...prev, item]);
    setNewImageUrl("");
    setNewImageCaption("");
    toast.success("Image URL added to showcase gallery");
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

  // Custom metadata attributes actions
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

    const attr: CustomAttribute = {
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

  // Core & CMS Save Routine
  const handleSaveChanges = async () => {
    if (!coreForm.name.trim()) return toast.error("Service Name is required");
    if (!coreForm.sku.trim()) return toast.error("SKU Code is required");
    if (!coreForm.categoryId) return toast.error("Category must be selected");
    if (!coreForm.price) return toast.error("Service pricing is required");

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
      };

      const payload: any = {
        name: coreForm.name.trim(),
        description: coreForm.description.trim() || undefined,
        sku: coreForm.sku.trim(),
        categoryId: coreForm.categoryId,
        pricingModel: coreForm.pricingModel,
        price: parseFloat(coreForm.price),
        minPrice: coreForm.pricingModel === PricingModel.VARIABLE && coreForm.minPrice ? parseFloat(coreForm.minPrice) : null,
        estimatedDuration: coreForm.estimatedDuration ? parseInt(coreForm.estimatedDuration, 10) : null,
        requiresDeposit: coreForm.requiresDeposit,
        depositAmount: coreForm.requiresDeposit && coreForm.depositAmount ? parseFloat(coreForm.depositAmount) : null,
        depositType: coreForm.depositType,
        isActive: coreForm.isActive,
        customFields: customFieldsPayload,
      };

      const updated = await updateService(service.id, payload);
      setService(updated);
      toast.success("Service changes and rich CMS content persisted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to persist CMS modifications");
    } finally {
      setIsSaving(false);
    }
  };

  // Reusable sub-component: Simulated High-Fidelity Storefront Card Preview
  function StorefrontCardPreview() {
    const isDark = previewTheme === "dark";
    const mainImgUrl = images[storefrontMainImageIdx]?.url || "";
    const mainImgCaption = images[storefrontMainImageIdx]?.caption || "Service preview";
    const selectedCategory = categories.find((c) => c.id === coreForm.categoryId);

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-slate-100 p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1.5 flex items-center gap-1">
            <Settings size={12} className="text-slate-400" />
            <span>Preview Mode</span>
          </span>
          <div className="flex items-center gap-1.5 h-8 bg-white p-0.5 border">
            <button
              type="button"
              onClick={() => setPreviewTheme("light")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 text-[10px] transition-all font-semibold rounded-none h-full",
                !isDark ? "bg-[#c89a4b] text-white font-bold" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Sun size={11} />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTheme("dark")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 text-[10px] transition-all font-semibold rounded-none h-full",
                isDark ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Moon size={11} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        <div className={cn(
          "border overflow-hidden shadow-xl rounded-none flex flex-col font-sans transition-all duration-300",
          isDark ? "bg-[#0f1115] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        )}>
          <div className={cn(
            "border-b px-4 py-3 flex items-center justify-between transition-colors",
            isDark ? "bg-[#16181d] border-slate-800" : "bg-slate-50 border-slate-200"
          )}>
            <span className="text-[10px] tracking-widest font-bold uppercase text-[#c89a4b] flex items-center gap-1.5">
              <Check size={12} />
              <span>Storefront Live Preview</span>
            </span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 font-mono font-bold rounded",
              isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"
            )}>
              SYNCED
            </span>
          </div>

          <div className="aspect-video w-full bg-slate-900 relative flex items-center justify-center">
            {mainImgUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mainImgUrl}
                alt={mainImgCaption}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <ImageIcon className="h-10 w-10 stroke-[1.5]" />
                <span className="text-xs font-semibold">No image uploaded</span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-6 w-full text-left">
              <span className="text-[9px] tracking-wider uppercase font-bold text-[#c89a4b]">
                {selectedCategory?.name || "Service Category"}
              </span>
              <h4 className="text-sm font-bold text-slate-100">{coreForm.name || "Unnamed Premium Service"}</h4>
            </div>
          </div>

          {images.length > 0 && (
            <div className={cn(
              "p-2 flex gap-1.5 overflow-x-auto border-b transition-colors",
              isDark ? "bg-[#16181d] border-slate-800/60" : "bg-slate-100 border-slate-200"
            )}>
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setStorefrontMainImageIdx(idx)}
                  className={cn(
                    "h-10 w-16 flex-shrink-0 border relative overflow-hidden transition-all duration-150",
                    storefrontMainImageIdx === idx
                      ? "border-[#c89a4b] ring-1 ring-[#c89a4b]"
                      : isDark
                      ? "border-slate-700 bg-slate-900 opacity-60 hover:opacity-100"
                      : "border-slate-300 bg-white opacity-60 hover:opacity-100"
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

          <div className="p-4 space-y-4 text-left">
            <div className={cn("flex items-center justify-between gap-2 border-b pb-3 transition-colors", isDark ? "border-slate-800" : "border-slate-200")}>
              <div>
                <span className={cn("text-[9px] uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Booking Price</span>
                <div className={cn("text-base font-extrabold", isDark ? "text-slate-100" : "text-slate-900")}>
                  {coreForm.pricingModel === PricingModel.VARIABLE ? (
                    <span>
                      {formatCurrency(Number(coreForm.minPrice || 0), currency)} - {formatCurrency(Number(coreForm.price || 0), currency)}
                    </span>
                  ) : (
                    formatCurrency(Number(coreForm.price || 0), currency)
                  )}
                </div>
              </div>

              {coreForm.estimatedDuration && (
                <div className="text-right">
                  <span className={cn("text-[9px] uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Duration</span>
                  <div className={cn("text-xs font-semibold flex items-center gap-1 justify-end mt-0.5", isDark ? "text-slate-200" : "text-slate-700")}>
                    <Clock size={11} className="text-[#c89a4b]" />
                    <span>{coreForm.estimatedDuration} Minutes</span>
                  </div>
                </div>
              )}
            </div>

            {coreForm.requiresDeposit && (
              <div className={cn(
                "border p-2 text-[10px] flex items-center justify-between rounded-none transition-colors",
                isDark
                  ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              )}>
                <span className="font-semibold">Secure deposit required:</span>
                <span className={cn("font-mono px-1.5 py-0.5 font-bold transition-colors", isDark ? "bg-emerald-500/20" : "bg-emerald-100")}>
                  {coreForm.depositType === DepositType.PERCENTAGE
                    ? `${coreForm.depositAmount}%`
                    : formatCurrency(Number(coreForm.depositAmount || 0), currency)}
                </span>
              </div>
            )}

            {customAttrs.length > 0 && (
              <div className={cn("space-y-1.5 border-b pb-3 transition-colors", isDark ? "border-slate-800" : "border-slate-200")}>
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Service Details</span>
                <div className="flex flex-wrap gap-1.5">
                  {customAttrs.slice(0, 4).map((attr) => (
                    <div key={attr.id} className={cn(
                      "border px-2 py-0.5 text-[10px] flex items-center gap-1 transition-colors",
                      isDark ? "bg-[#1e2025] border-slate-800" : "bg-slate-50 border-slate-200"
                    )}>
                      <span className="text-[#c89a4b] font-semibold">{attr.key.replace(/_/g, " ")}:</span>
                      <span className={isDark ? "text-slate-300" : "text-slate-600"}>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Storefront About / Info</span>
              <div className={cn(
                "max-h-[140px] overflow-y-auto border p-2.5 text-xs leading-relaxed font-sans scrollbar-thin transition-colors",
                isDark ? "bg-[#16181d] border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
              )}>
                {markdown ? (
                  <div
                    className={cn("prose prose-xs transition-colors", isDark ? "prose-invert text-slate-300" : "text-slate-700")}
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No custom description.</span>
                )}
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-[#c89a4b] hover:bg-[#b0843a] text-white py-2 font-bold uppercase tracking-widest text-xs h-9 rounded-none border-none mt-2 flex items-center justify-center gap-1"
            >
              <span>Book Service Slot</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-[#0b1220]/5 min-h-screen font-sans">
      {/* Dynamic Navigation & Save Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/inventory/services")}
            variant="outline"
            className="h-9 w-9 p-0 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-none shadow-none"
            title="Back to services list"
            aria-label="Back to services list"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold font-mono">
                CMS Studio &bull; Service Editor
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{service.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize high-fidelity storefront imagery, rich markdown descriptions, SEO targets, and custom metadata attributes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/inventory/services")}
            variant="outline"
            className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-none shadow-none text-xs font-semibold h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-[#c89a4b] hover:bg-[#b0843a] text-white px-5 rounded-none shadow-none text-xs font-semibold h-9 flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{isSaving ? "Persisting CMS..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Main CMS Layout Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor controls (Left Side - 8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <div className="border-b mb-6">
              <TabsList className="bg-transparent h-auto p-0 gap-6 flex flex-wrap">
                <TabsTrigger
                  value="core"
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-[#c89a4b] data-[state=active]:text-slate-900 rounded-none shadow-none bg-transparent flex items-center gap-2"
                >
                  <Settings size={15} className="text-slate-500" />
                  <span>Core Attributes</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rich"
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-[#c89a4b] data-[state=active]:text-slate-900 rounded-none shadow-none bg-transparent flex items-center gap-2"
                >
                  <Sparkles size={15} className="text-slate-500" />
                  <span>Enterprise CMS Studio</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-[#c89a4b] data-[state=active]:text-slate-900 rounded-none shadow-none bg-transparent flex items-center gap-2 lg:hidden"
                >
                  <Eye size={15} className="text-slate-500" />
                  <span>Live Preview</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Core Service Parameters */}
            <TabsContent value="core" className="m-0">
              <CoreTab
                coreForm={coreForm}
                setCoreForm={setCoreForm}
                categories={categories}
              />
            </TabsContent>

            {/* TAB 2: Direct to Hybrid CMS Studio */}
            <TabsContent value="rich" className="m-0">
              <div className="space-y-6">
                <div className="border border-slate-200 shadow-sm p-6 bg-white">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#c89a4b]" />
                    <span>Enterprise Hybrid CMS Studio</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    To customize high-fidelity typography, launch AI copywriting tools, optimize showcase asset sizes, and manage multi-channel layouts, proceed to the unified Enterprise Studio.
                  </p>
                  <Button
                    onClick={() => router.push(`/inventory/cms/${service.id}?type=service`)}
                    className="mt-6 bg-[#c89a4b] hover:bg-[#b0843a] text-white text-xs font-semibold px-6 py-2"
                  >
                    Open Hybrid CMS Studio
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Mobile-only live preview trigger */}
            <TabsContent value="preview" className="m-0 lg:hidden">
              <StorefrontCardPreview />
            </TabsContent>
          </Tabs>
        </div>

        {/* Storefront High-Fidelity Live Preview (Right Side - 4 columns, hidden on smaller viewports) */}
        <div className="lg:col-span-4 hidden lg:block sticky top-8">
          <StorefrontCardPreview />
        </div>
      </div>
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
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-4 mb-2 text-slate-800 font-sans">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-5 mb-2.5 text-slate-900 font-sans">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold mt-6 mb-3 text-slate-900 font-sans">$1</h1>');

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-4 italic my-4 text-slate-600 bg-slate-50 py-1.5 pr-2 rounded-none">$1</blockquote>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-slate-950">$1</strong>');

  // Italics
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic text-slate-800">$1</em>');

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-amber-700 px-1.5 py-0.5 rounded-none font-mono text-xs border">$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-600 font-medium underline hover:text-amber-800">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-none my-4 border shadow-sm inline-block" />');

  const lines = html.split("\n");
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul class="list-disc pl-5 my-2 space-y-1 text-slate-700 text-sm">\n<li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, "");
      if (!inOrderedList) {
        lines[i] = '<ol class="list-decimal pl-5 my-2 space-y-1 text-slate-700 text-sm">\n<li>' + content + '</li>';
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
        lines[i] = '<p class="my-2.5 leading-relaxed text-slate-700 text-sm">' + lines[i] + '</p>';
      }
    }
  }

  if (inList) lines.push("</ul>");
  if (inOrderedList) lines.push("</ol>");

  return lines.join("\n");
}
