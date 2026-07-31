"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Check,
  Eye,
  Settings,
  Globe,
  Star,
  Clock,
  Layers,
  HelpCircle,
  Upload,
  X,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
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

// Inline Markdown Parser to render HTML
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  // Escape HTML tags to prevent arbitrary HTML injections, but preserve markdown formatting
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

  // Split by line to convert lists
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
      // Add standard paragraph spacing for empty or plain text lines
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

export function ServiceDetailPageClient({
  initialService,
  categories,
  currency,
}: ServiceDetailPageClientProps) {
  const router = useRouter();
  const [service, setService] = useState(initialService);
  const [isSaving, setIsSaving] = useState(false);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<"core" | "rich" | "seo" | "preview">("core");

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

    // Standardize key (alphanumeric, lowercase, underscore)
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
      // Serialize custom attributes list back into a record dictionary
      const customAttributesObj: Record<string, string> = {};
      customAttrs.forEach((attr) => {
        if (attr.key.trim()) {
          customAttributesObj[attr.key.trim()] = attr.value;
        }
      });

      // Construct dynamic payload
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

  return (
    <div className="flex flex-col gap-6 p-8 bg-[#0b1220]/5 min-h-screen font-sans">

      {/* Dynamic Navigation & Save Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/inventory/services")}
            variant="outline"
            className="h-9 w-9 p-0 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-none shadow-none"
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
                  <span>Rich Description & Images</span>
                </TabsTrigger>
                <TabsTrigger
                  value="seo"
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-[#c89a4b] data-[state=active]:text-slate-900 rounded-none shadow-none bg-transparent flex items-center gap-2"
                >
                  <Globe size={15} className="text-slate-500" />
                  <span>SEO & Metadata Attributes</span>
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
            <TabsContent value="core" className="m-0 space-y-6 bg-white p-6 border shadow-sm">
              <div>
                <h3 className="text-base font-bold text-slate-900">Standard Service Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Edit basic parameters used for bookings, checkout sessions, and invoice generation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="core-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Name</Label>
                  <Input
                    id="core-name"
                    value={coreForm.name}
                    onChange={(e) => setCoreForm({ ...coreForm, name: e.target.value })}
                    className="rounded-none bg-white border-slate-300"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="core-desc" className="text-xs font-bold uppercase tracking-wider text-slate-500">Brief Summary</Label>
                  <Input
                    id="core-desc"
                    value={coreForm.description}
                    onChange={(e) => setCoreForm({ ...coreForm, description: e.target.value })}
                    placeholder="Short plain-text summary displayed on invoices & booking emails"
                    className="rounded-none bg-white border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="core-sku" className="text-xs font-bold uppercase tracking-wider text-slate-500">Unique SKU Code</Label>
                  <Input
                    id="core-sku"
                    value={coreForm.sku}
                    onChange={(e) => setCoreForm({ ...coreForm, sku: e.target.value })}
                    className="rounded-none bg-white border-slate-300 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="core-cat" className="text-xs font-bold uppercase tracking-wider text-slate-500">Category Placement</Label>
                  <Select
                    value={coreForm.categoryId}
                    onValueChange={(val) => setCoreForm({ ...coreForm, categoryId: val })}
                  >
                    <SelectTrigger id="core-cat" className="rounded-none bg-white border-slate-300 h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="rounded-none">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="core-model" className="text-xs font-bold uppercase tracking-wider text-slate-500">Pricing Engine</Label>
                  <Select
                    value={coreForm.pricingModel}
                    onValueChange={(val: PricingModel) => setCoreForm({ ...coreForm, pricingModel: val })}
                  >
                    <SelectTrigger id="core-model" className="rounded-none bg-white border-slate-300 h-9">
                      <SelectValue placeholder="Pricing structure" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value={PricingModel.FIXED} className="rounded-none">Fixed Pricing</SelectItem>
                      <SelectItem value={PricingModel.HOURLY} className="rounded-none">Hourly Rate</SelectItem>
                      <SelectItem value={PricingModel.VARIABLE} className="rounded-none">Variable Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="core-price" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {coreForm.pricingModel === PricingModel.VARIABLE ? "Maximum Price" : "Rate / Price"}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
                    <Input
                      id="core-price"
                      type="number"
                      step="0.01"
                      className="pl-7 rounded-none bg-white border-slate-300"
                      value={coreForm.price}
                      onChange={(e) => setCoreForm({ ...coreForm, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {coreForm.pricingModel === PricingModel.VARIABLE && (
                  <div className="space-y-1.5">
                    <Label htmlFor="core-min" className="text-xs font-bold uppercase tracking-wider text-slate-500">Minimum Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
                      <Input
                        id="core-min"
                        type="number"
                        step="0.01"
                        className="pl-7 rounded-none bg-white border-slate-300"
                        value={coreForm.minPrice}
                        onChange={(e) => setCoreForm({ ...coreForm, minPrice: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="core-duration" className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Duration (Mins)</Label>
                  <Input
                    id="core-duration"
                    type="number"
                    value={coreForm.estimatedDuration}
                    onChange={(e) => setCoreForm({ ...coreForm, estimatedDuration: e.target.value })}
                    placeholder="e.g., 60 minutes"
                    className="rounded-none bg-white border-slate-300"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t mt-2 flex items-center space-x-2">
                  <Checkbox
                    id="core-deposit"
                    checked={coreForm.requiresDeposit}
                    onCheckedChange={(checked) => setCoreForm({ ...coreForm, requiresDeposit: !!checked })}
                  />
                  <Label htmlFor="core-deposit" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer select-none">
                    Requires Deposit to confirm Bookings
                  </Label>
                </div>

                {coreForm.requiresDeposit && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="core-dep-type" className="text-xs font-bold uppercase tracking-wider text-slate-500">Deposit Calculation</Label>
                      <Select
                        value={coreForm.depositType}
                        onValueChange={(val: DepositType) => setCoreForm({ ...coreForm, depositType: val })}
                      >
                        <SelectTrigger id="core-dep-type" className="rounded-none bg-white border-slate-300 h-9">
                          <SelectValue placeholder="Select deposit type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value={DepositType.FIXED} className="rounded-none">Fixed Standard Amount</SelectItem>
                          <SelectItem value={DepositType.PERCENTAGE} className="rounded-none">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="core-dep-amt" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {coreForm.depositType === DepositType.PERCENTAGE ? "Deposit %" : "Deposit Amount"}
                      </Label>
                      <div className="relative">
                        {coreForm.depositType === DepositType.FIXED && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
                        )}
                        <Input
                          id="core-dep-amt"
                          type="number"
                          step="0.01"
                          className={cn("rounded-none bg-white border-slate-300", coreForm.depositType === DepositType.FIXED && "pl-7")}
                          value={coreForm.depositAmount}
                          onChange={(e) => setCoreForm({ ...coreForm, depositAmount: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 pt-2 flex items-center space-x-2">
                  <Checkbox
                    id="core-active"
                    checked={coreForm.isActive}
                    onCheckedChange={(checked) => setCoreForm({ ...coreForm, isActive: !!checked })}
                  />
                  <Label htmlFor="core-active" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer select-none">
                    Active & Listed on Booking Dashboards
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Rich CMS Description & Multiple Images */}
            <TabsContent value="rich" className="m-0 space-y-6">

              {/* Image Manager Section */}
              <div className="bg-white p-6 border shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <ImageIcon size={18} className="text-[#c89a4b]" />
                    <span>Multiple Storefront Images</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage the gallery showcasing this service in storefront listings and booking portals.</p>
                </div>

                {/* Grid list of current images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 bg-slate-50">
                  {images.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
                      No images added yet. Storefronts will use standard placeholders.
                    </div>
                  ) : (
                    images.map((img, idx) => (
                      <div key={img.id} className="bg-white border p-3 flex flex-col gap-2 relative shadow-xs">
                        <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.caption || "Service Image"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-white tracking-widest font-bold">
                            #{idx + 1} {idx === 0 && "(MAIN)"}
                          </div>
                        </div>

                        {/* Caption input */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-slate-500">Caption / Alternative Text</Label>
                          <Input
                            value={img.caption}
                            onChange={(e) => {
                              const updated = [...images];
                              updated[idx].caption = e.target.value;
                              setImages(updated);
                            }}
                            className="text-xs h-7 rounded-none border-slate-300"
                            placeholder="e.g., Bread dough proofing room"
                          />
                        </div>

                        {/* Reordering and removal controls */}
                        <div className="flex items-center justify-between border-t pt-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleMoveImage(idx, "up")}
                              disabled={idx === 0}
                              variant="outline"
                              className="h-6 w-6 p-0 rounded-none border-slate-300 bg-white"
                              title="Move main image forward"
                            >
                              <ChevronUp size={12} />
                            </Button>
                            <Button
                              onClick={() => handleMoveImage(idx, "down")}
                              disabled={idx === images.length - 1}
                              variant="outline"
                              className="h-6 w-6 p-0 rounded-none border-slate-300 bg-white"
                              title="Move back"
                            >
                              <ChevronDown size={12} />
                            </Button>
                          </div>

                          <Button
                            onClick={() => handleRemoveImage(img.id)}
                            variant="ghost"
                            className="h-6 px-2 hover:bg-red-50 text-red-600 text-xs rounded-none"
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
                <div className="border p-4 bg-slate-50/50 space-y-3">
                  <span className="text-xs font-bold text-slate-700">Add New Showcase Image</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">Upload Image</Label>
                      <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className="relative border-2 border-dashed border-slate-300 bg-white p-4 text-center rounded-none hover:border-slate-400 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[90px]"
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-1">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                            <span className="text-[10px] text-slate-500 font-semibold">Uploading to storage...</span>
                          </div>
                        ) : newImageUrl ? (
                          <div className="flex items-center gap-2 w-full justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={newImageUrl} className="h-10 w-10 object-cover" alt="Upload preview" />
                              <span className="text-[10px] text-emerald-600 font-bold truncate">Uploaded successfully</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-slate-100 rounded-none text-slate-500"
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
                            <Upload className="h-5 w-5 text-slate-400 mb-1" />
                            <span className="text-[10px] text-slate-500 font-semibold">Click or Drag to Upload</span>
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
                    <div className="space-y-1">
                      <Label htmlFor="new-img-caption" className="text-[10px] font-bold uppercase text-slate-500">Caption</Label>
                      <Input
                        id="new-img-caption"
                        placeholder="e.g., Freshly baked croissants details"
                        value={newImageCaption}
                        onChange={(e) => setNewImageCaption(e.target.value)}
                        className="text-xs h-8 rounded-none bg-white border-slate-300"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddImage();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddImage}
                    variant="outline"
                    className="h-8 rounded-none text-xs border-slate-300 hover:bg-slate-50 flex items-center gap-1 ml-auto"
                  >
                    <Plus size={13} />
                    <span>Insert Image</span>
                  </Button>
                </div>
              </div>

              {/* Split-pane Markdown Editor */}
              <div className="bg-white p-6 border shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles size={18} className="text-[#c89a4b]" />
                    <span>Storefront Rich Content Description</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Write detailed markdown content to display beautiful informational guides about this service.</p>
                </div>

                {/* Formatting Tools Helper Bar */}
                <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1.5 border border-slate-300">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("bold", "bold text")}
                    className="h-7 px-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-none"
                    title="Bold (**text**)"
                  >
                    <Bold size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("italic", "italic text")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
                    title="Italic (*text*)"
                  >
                    <Italic size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("h1", "Heading 1")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none font-bold"
                    title="H1 heading (# Heading)"
                  >
                    <Heading1 size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("h2", "Heading 2")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none font-bold"
                    title="H2 heading (## Heading)"
                  >
                    <Heading2 size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("quote", "blockquote citation")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
                    title="Blockquote (> citation)"
                  >
                    <Quote size={13} />
                  </Button>
                  <span className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("bullet", "list item")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
                    title="Bullet List (- item)"
                  >
                    <List size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("ordered", "list item")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
                    title="Numbered List (1. item)"
                  >
                    <ListOrdered size={13} />
                  </Button>
                  <span className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("link", "Link Title")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
                    title="Hyperlink ([title](url))"
                  >
                    <Link2 size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => insertMarkdown("image", "Image alt caption")}
                    className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
                    title="Image ([caption](url))"
                  >
                    <ImageIcon size={13} />
                  </Button>
                </div>

                {/* Editor Split-Pane */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Left: Raw text editor */}
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Markdown Composer</Label>
                    <textarea
                      ref={textareaRef}
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      placeholder="# Service Overview..."
                      className="w-full flex-1 min-h-[300px] md:min-h-[420px] p-3 text-xs font-mono border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#c89a4b] resize-y rounded-none"
                    />
                  </div>

                  {/* Right: Rich parsed rendering preview */}
                  <div className="flex flex-col">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Live Formatted Render Preview</Label>
                    <div className="w-full flex-1 min-h-[300px] md:min-h-[420px] p-4 border border-slate-300 bg-slate-50 overflow-y-auto rounded-none">
                      {markdown ? (
                        <div
                          className="prose prose-sm max-w-none text-slate-800 break-words"
                          dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">No content written. HTML render preview is empty.</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </TabsContent>

            {/* TAB 3: SEO Configuration & Custom Metadata fields */}
            <TabsContent value="seo" className="m-0 space-y-6">

              {/* SEO parameters block */}
              <div className="bg-white p-6 border shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Globe size={18} className="text-[#c89a4b]" />
                    <span>Search Engine Optimization (SEO) Fields</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Define custom metadata used by storefront crawlers, Google searches, and social sharing snippets.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="seo-title" className="text-xs font-bold uppercase tracking-wider text-slate-500">SEO Meta Title</Label>
                    <Input
                      id="seo-title"
                      value={seo.title}
                      onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                      placeholder="Display title on tab bars & Google search results"
                      className="rounded-none bg-white border-slate-300"
                    />
                    <span className="text-[10px] text-slate-400">Recommended length: 50-60 characters. Current length: {seo.title.length} chars</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-desc" className="text-xs font-bold uppercase tracking-wider text-slate-500">SEO Meta Description</Label>
                    <textarea
                      id="seo-desc"
                      value={seo.description}
                      onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                      placeholder="Snippet explaining service context to potential clients on social media previews"
                      className="w-full min-h-[70px] p-2.5 text-xs border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#c89a4b] rounded-none"
                    />
                    <span className="text-[10px] text-slate-400">Recommended length: 120-160 characters. Current length: {seo.description.length} chars</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-keywords" className="text-xs font-bold uppercase tracking-wider text-slate-500">Meta Keywords (Comma separated)</Label>
                    <Input
                      id="seo-keywords"
                      value={seo.keywords}
                      onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                      placeholder="e.g., baking, bakery masterclass, sourdough, learn baking"
                      className="rounded-none bg-white border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Custom attributes workspace block */}
              <div className="bg-white p-6 border shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers size={18} className="text-[#c89a4b]" />
                    <span>Dynamic Custom Attributes</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Register arbitrary key-value parameters. These details synchronize to the storefront API, allowing custom filtering and dynamic product tags.</p>
                </div>

                {/* List table */}
                <div className="border">
                  <div className="grid grid-cols-3 bg-slate-50 font-bold border-b text-[10px] uppercase text-slate-600 tracking-wider p-2.5">
                    <div>Attribute Key</div>
                    <div>Value</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {customAttrs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">No custom attributes registered. Click below to add.</div>
                  ) : (
                    customAttrs.map((attr, idx) => (
                      <div key={attr.id} className="grid grid-cols-3 items-center p-2 border-b text-xs text-slate-700 font-mono">
                        <div className="font-semibold text-slate-900">{attr.key}</div>
                        <div>
                          <Input
                            value={attr.value}
                            onChange={(e) => {
                              const updated = [...customAttrs];
                              updated[idx].value = e.target.value;
                              setCustomAttrs(updated);
                            }}
                            className="h-7 text-xs rounded-none border-slate-300 font-sans"
                          />
                        </div>
                        <div className="text-right">
                          <Button
                            onClick={() => handleRemoveCustomAttr(attr.id)}
                            variant="ghost"
                            className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-none"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add block */}
                <div className="border p-4 bg-slate-50/50 space-y-3">
                  <span className="text-xs font-bold text-slate-700">Add New Dynamic Parameter</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="attr-key" className="text-[10px] font-bold uppercase text-slate-500">Key Name (alphanumeric & underscore)</Label>
                      <Input
                        id="attr-key"
                        placeholder="e.g., maximum_students_count"
                        value={newAttrKey}
                        onChange={(e) => setNewAttrKey(e.target.value)}
                        className="text-xs h-8 rounded-none bg-white border-slate-300 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="attr-val" className="text-[10px] font-bold uppercase text-slate-500">Attribute Value</Label>
                      <Input
                        id="attr-val"
                        placeholder="e.g., 20 people"
                        value={newAttrValue}
                        onChange={(e) => setNewAttrValue(e.target.value)}
                        className="text-xs h-8 rounded-none bg-white border-slate-300"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomAttr();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCustomAttr}
                    variant="outline"
                    className="h-8 rounded-none text-xs border-slate-300 hover:bg-slate-50 flex items-center gap-1 ml-auto"
                  >
                    <Plus size={13} />
                    <span>Register Attribute</span>
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

  // Reusable sub-component: Simulated High-Fidelity Storefront Card Preview
  function StorefrontCardPreview() {
    const isDark = previewTheme === "dark";
    const mainImgUrl = images[storefrontMainImageIdx]?.url || "";
    const mainImgCaption = images[storefrontMainImageIdx]?.caption || "Service preview";
    const selectedCategory = categories.find((c) => c.id === coreForm.categoryId);

    return (
      <div className="flex flex-col gap-3">
        {/* Theme toggle controls */}
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

          {/* Preview header info */}
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

          {/* Gallery main image display */}
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

          {/* Gallery thumbnails strip */}
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

          {/* Card pricing and brief context */}
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

            {/* Dynamic attributes preview (only shows first 3 keys for nice sizing) */}
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


            {/* Markdown text preview container */}
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

            {/* CTA preview button */}
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
}
