// components/CmsCustomizationGuide.tsx
import React, { useState } from "react";
import {
  Globe,
  Sparkles,
  Layers,
  Workflow,
  Fingerprint,
  Copy,
  Check,
} from "lucide-react";

// --- Design Tokens (Scryme) ---
const colors = {
  inkBg: "var(--bg-color)",
  inkCard: "var(--card-color)",
  inkBorder: "var(--border-color)",
  brass: "#C89A4B",
  paper: "var(--text-color)",
  lightText: "var(--light-text-color)",
};

// --- Type Definitions ---
interface CmsSimulatorState {
  name: string;
  sku: string;
  price: number;
  markdownDescription: string;
  imageUrl: string;
  seoTitle: string;
  seoDesc: string;
  instructor: string;
}

// Preset definitions for CMS Customization Simulator
export const PRESETS = {
  sourdough: {
    name: "Artisan Sourdough Masterclass",
    sku: "SRV-BKA-001",
    price: 120.0,
    markdownDescription:
      "# Sourdough Masterclass 🌾\nLearn fermentation secrets from our master bakers.\n\n### Outline\n- Wild yeast starter cultivation\n- High-hydration mixing\n- Bulk proofing & scoring",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
    seoTitle: "Artisan Sourdough Masterclass | Scryme Bakery",
    seoDesc:
      "Learn organic sourdough artisan baking techniques in a 4-hour hands-on class.",
    instructor: "Marie Dubois",
  },
  banneton: {
    name: "Premium Round Proofing Banneton",
    sku: "PROD-BKA-BANN-02",
    price: 24.99,
    markdownDescription:
      "# Round Cane Proofing Banneton 🧺\nHand-crafted from 100% natural organic Indonesian rattan cane.\n\n## Features\n- Draws moisture away for crisper crust\n- Flour leaves beautiful spiral designs",
    imageUrl:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
    seoTitle: "Premium Indonesian Cane Banneton | Scryme Shop",
    seoDesc:
      "Buy premium Indonesian cane rattan proofing banneton baskets with linen liners.",
    instructor: "N/A (Product)",
  },
  spa: {
    name: "Traditional Swedish Massage",
    sku: "SRV-SPA-004",
    price: 85.0,
    markdownDescription:
      "# Traditional Swedish Massage 💆‍♀️\nRestore balance and ease tension with our signature body therapy.\n\n### Benefits\n- Stimulates lymphatic system\n- Relieves chronic muscle tightness\n- Promotes deep full-body relaxation",
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
    seoTitle: "Swedish Body Therapy Massage | Scryme Spa",
    seoDesc:
      "Relax and rejuvenate with our signature swedish body therapy and hot oils.",
    instructor: "Sarah Jenkins",
  },
};

// --- CMS Guide Component Props ---
interface CmsCustomizationGuideProps {
  selectedCmsTarget: "service" | "product";
  setSelectedCmsTarget: (target: "service" | "product") => void;
  simState: CmsSimulatorState;
  onSimStateChange: (
    field: keyof CmsSimulatorState,
    value: string | number,
  ) => void;
  onApplyPreset: (presetKey: keyof typeof PRESETS) => void;
  copiedMap: Record<string, boolean>;
  onCopy: (text: string, id: string) => void;
  renderHighlightedCode: (code: string, language: string) => JSX.Element;
}

/**
 * CMS Customization Guide Component
 *
 * Provides an interactive documentation view for Scryme V3's CMS Customization Engine.
 * Includes dynamic field controls, preset selectors, and live preview functionality.
 *
 * @component
 * @param {Object} props - Component props
 * @param {"service"|"product"} props.selectedCmsTarget - Current CMS target type (service or product)
 * @param {Function} props.setSelectedCmsTarget - Callback to update CMS target type
 * @param {CmsSimulatorState} props.simState - Current simulator state values
 * @param {Function} props.onSimStateChange - Callback for individual field updates
 * @param {Function} props.onApplyPreset - Callback to apply a preset configuration
 * @param {Record<string, boolean>} props.copiedMap - Map tracking copy button states
 * @param {Function} props.onCopy - Callback for copy-to-clipboard functionality
 * @param {Function} props.renderHighlightedCode - Function to render syntax-highlighted code
 */
export default function CmsCustomizationGuide({
  selectedCmsTarget,
  setSelectedCmsTarget,
  simState,
  onSimStateChange,
  onApplyPreset,
  copiedMap,
  onCopy,
  renderHighlightedCode,
}: CmsCustomizationGuideProps) {
  const [cmsPreviewTab, setCmsPreviewTab] = useState<"preview" | "payload">(
    "preview",
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3 text-xs text-brass uppercase tracking-wider font-semibold mb-2">
          <span>Developer Guide</span>
          <span>&bull;</span>
          <span>Storefront & Catalog CMS</span>
        </div>
        <h1 className="text-3xl font-extrabold text-paper leading-tight">
          CMS Customization Engine
        </h1>
        <p className="text-light-text text-sm mt-2 leading-relaxed">
          Scryme V3 powers highly customizable, media-rich catalogs using a
          flexible database column structure. This guide explains how
          third-party and headless storefront developers utilize the dynamic{" "}
          <code className="text-paper bg-ink-card px-1.5 py-0.5 border border-ink-border font-mono text-xs rounded">
            customFields
          </code>{" "}
          JSON payload to build exceptional storefront and booking experiences.
        </p>
      </div>

      {/* Preset Selector Buttons */}
      <div className="bg-ink-card rounded-xl border border-ink-border p-4 space-y-3">
        <span className="text-[10px] text-brass uppercase tracking-widest font-bold flex items-center gap-1">
          <Sparkles size={12} />
          <span>Instant Simulator Presets</span>
        </span>
        <p className="text-xs text-light-text">
          Choose a product or service category preset to instantly populate the
          live interactive engine and preview how custom metadata structures
          translate.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onApplyPreset("sourdough")}
            className="bg-ink-bg border border-ink-border text-paper hover:border-brass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            🌾 Sourdough Masterclass
          </button>
          <button
            onClick={() => onApplyPreset("banneton")}
            className="bg-ink-bg border border-ink-border text-paper hover:border-brass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            🧺 Cane Banneton
          </button>
          <button
            onClick={() => onApplyPreset("spa")}
            className="bg-ink-bg border border-ink-border text-paper hover:border-brass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            💆‍♀️ Swedish Massage
          </button>
        </div>
      </div>

      {/* Conceptual Card */}
      <div className="bg-ink-card/50 rounded-xl border border-ink-border p-5 space-y-3">
        <div className="flex items-center gap-2 text-brass font-bold text-sm">
          <Layers size={16} />
          <span>Prisma JSON Column Mapping</span>
        </div>
        <p className="text-xs text-light-text leading-relaxed">
          The <code className="text-paper">Product</code> and{" "}
          <code className="text-paper">Service</code> schemas each contain a
          schema-free nullable{" "}
          <code className="text-brass font-mono font-semibold">
            customFields
          </code>{" "}
          field. This layout completely bypasses rigid database structures,
          permitting organizations to serialize rich-media elements, Markdown
          descriptions, SEO details, and custom technical specification
          attributes without database schema migrations.
        </p>
      </div>

      {/* Main Customize Parameters Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          CMS Payload Specifications
        </h2>

        {/* markdownDescription */}
        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              markdownDescription
            </span>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              string
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Accepts GitHub Flavored Markdown (GFM) formatting. Headless
            storefronts parse this dynamically to output formatted guides, rich
            tables, blockquotes, and lists for services or product details.
          </p>
        </div>

        {/* images */}
        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              images
            </span>
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              array of objects
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Ordered gallery of uploaded image assets. The primary image is
            defined at index <code className="text-paper font-mono">0</code>.
          </p>
          <div className="bg-ink-card rounded-lg border border-ink-border p-3 text-xs font-mono space-y-1.5">
            <div className="text-paper font-bold pb-1 border-b border-ink-border/60 text-[10px] uppercase text-brass">
              ImageItem Schema:
            </div>
            <div>
              • <span className="text-paper font-bold">id</span> (string):
              Unique image ID (crucial for react rendering keys).
            </div>
            <div>
              • <span className="text-paper font-bold">url</span> (string):
              Absolute URL to CDN image asset.
            </div>
            <div>
              • <span className="text-paper font-bold">caption</span> (string):
              Alt text for accessibility and crawl performance.
            </div>
          </div>
        </div>

        {/* seo */}
        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">seo</span>
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              object
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Custom HTML page headers to override default metadata tags
            dynamically.
          </p>
          <div className="bg-ink-card rounded-lg border border-ink-border p-3 text-xs font-mono space-y-1.5">
            <div className="text-paper font-bold pb-1 border-b border-ink-border/60 text-[10px] uppercase text-brass">
              Seo Schema:
            </div>
            <div>
              • <span className="text-paper font-bold">title</span> (string):
              Custom browser tab title. Max 60 chars.
            </div>
            <div>
              • <span className="text-paper font-bold">description</span>{" "}
              (string): Search card snippet. Max 160 chars.
            </div>
            <div>
              • <span className="text-paper font-bold">keywords</span> (string):
              Comma-separated tag phrases.
            </div>
          </div>
        </div>

        {/* customAttributes */}
        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              customAttributes
            </span>
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              object (dictionary)
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Key-value map representing dynamic parameters. This supports
            advanced faceted filters in storefront lists (e.g. searching items
            filtered by <code className="text-paper">difficulty</code> or{" "}
            <code className="text-paper">material</code>) without rigid database
            specifications. Keys must be strictly{" "}
            <code className="text-paper">snake_case</code> or{" "}
            <code className="text-paper">lowercase</code>.
          </p>
        </div>

        {/* eCommerce Controls */}
        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-paper text-sm pb-1.5 border-b border-ink-border/40">
            <Workflow size={16} className="text-brass" />
            <span>Product Specific eCommerce Lifecycle Options</span>
          </div>
          <div className="divide-y divide-ink-border/60 text-xs">
            <div className="py-2.5 flex items-baseline justify-between gap-2">
              <div>
                <code className="text-paper font-bold">publishStatus</code>
                <span className="text-light-text block text-[10px]">
                  Values: Draft | Published | Scheduled | Archived
                </span>
              </div>
              <span className="text-brass font-semibold text-[10px] font-mono">
                string
              </span>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-2">
              <div>
                <code className="text-paper font-bold">publishedAt</code>
                <span className="text-light-text block text-[10px]">
                  ISO timestamp of release schedule
                </span>
              </div>
              <span className="text-brass font-semibold text-[10px] font-mono">
                ISO8601 string / null
              </span>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-2">
              <div>
                <code className="text-paper font-bold">layoutTemplate</code>
                <span className="text-light-text block text-[10px]">
                  Visual layout style token for the headless portal
                </span>
              </div>
              <span className="text-brass font-semibold text-[10px] font-mono">
                string
              </span>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-2">
              <div>
                <code className="text-paper font-bold">customSlugOverride</code>
                <span className="text-light-text block text-[10px]">
                  Targeted override of SEO friendly URL slugs
                </span>
              </div>
              <span className="text-brass font-semibold text-[10px] font-mono">
                string
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Storefront Live Simulator Form */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          Custom CMS Field Controls
        </h2>
        <p className="text-xs text-light-text">
          Modify the CMS fields below dynamically to see how they rebuild the
          request payload and simulated customer-facing UI card on the right.
        </p>

        <div className="bg-ink-card border border-ink-border rounded-xl p-5 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
                Name
              </label>
              <input
                type="text"
                value={simState.name}
                onChange={(e) => onSimStateChange("name", e.target.value)}
                className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
                SKU Code
              </label>
              <input
                type="text"
                value={simState.sku}
                onChange={(e) => onSimStateChange("sku", e.target.value)}
                className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
                Price ($)
              </label>
              <input
                type="number"
                value={simState.price}
                onChange={(e) =>
                  onSimStateChange("price", Number(e.target.value))
                }
                className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
                SEO Title Override
              </label>
              <input
                type="text"
                value={simState.seoTitle}
                onChange={(e) => onSimStateChange("seoTitle", e.target.value)}
                className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
              Primary Image Asset URL
            </label>
            <input
              type="text"
              value={simState.imageUrl}
              onChange={(e) => onSimStateChange("imageUrl", e.target.value)}
              className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
                SEO Description
              </label>
              <input
                type="text"
                value={simState.seoDesc}
                onChange={(e) => onSimStateChange("seoDesc", e.target.value)}
                className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
                Attribute: instructor_name
              </label>
              <input
                type="text"
                value={simState.instructor}
                onChange={(e) => onSimStateChange("instructor", e.target.value)}
                className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brass">
              markdownDescription (supports standard Markdown syntax)
            </label>
            <textarea
              value={simState.markdownDescription}
              onChange={(e) =>
                onSimStateChange("markdownDescription", e.target.value)
              }
              className="w-full h-28 bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper font-mono focus:outline-none focus:border-brass resize-y"
            />
          </div>
        </div>
      </div>

      {/* Right Column: CMS Target Selector & Preview */}
      <div className="space-y-6">
        {/* Service vs Product Schema Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-ink-border pb-3">
            <span className="text-[10px] font-black uppercase text-light-text tracking-widest flex items-center gap-1">
              <Fingerprint size={12} className="text-brass" />
              <span>CMS Target Type</span>
            </span>
            <div className="bg-ink-card p-0.5 border border-ink-border rounded flex gap-1">
              <button
                onClick={() => setSelectedCmsTarget("service")}
                className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                  selectedCmsTarget === "service"
                    ? "bg-brass text-ink-bg"
                    : "text-light-text hover:text-paper"
                }`}
              >
                Service Schema
              </button>
              <button
                onClick={() => setSelectedCmsTarget("product")}
                className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                  selectedCmsTarget === "product"
                    ? "bg-brass text-ink-bg"
                    : "text-light-text hover:text-paper"
                }`}
              >
                Product Schema
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Preview Switcher Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-black text-brass">
              Storefront Output
            </span>
            <div className="bg-ink-card p-0.5 border border-ink-border rounded flex gap-1">
              <button
                onClick={() => setCmsPreviewTab("preview")}
                className={`text-[9px] font-mono font-bold uppercase px-2 py-1 transition-colors cursor-pointer rounded ${
                  cmsPreviewTab === "preview"
                    ? "bg-brass text-ink-bg"
                    : "text-light-text"
                }`}
              >
                Live Card Preview
              </button>
              <button
                onClick={() => setCmsPreviewTab("payload")}
                className={`text-[9px] font-mono font-bold uppercase px-2 py-1 transition-colors cursor-pointer rounded ${
                  cmsPreviewTab === "payload"
                    ? "bg-brass text-ink-bg"
                    : "text-light-text"
                }`}
              >
                Serialized JSON
              </button>
            </div>
          </div>

          {cmsPreviewTab === "preview" ? (
            /* Live Simulated Storefront Card Preview */
            <div className="bg-ink-bg border border-ink-border rounded-xl overflow-hidden flex flex-col justify-between shadow-xl animate-fade-in text-left">
              {/* Browser window top bar */}
              <div className="bg-ink-card border-b border-ink-border px-3 py-2 flex items-center gap-1.5 text-[10px] text-light-text font-mono">
                <Globe size={11} className="text-brass" />
                <span className="truncate">
                  {simState.seoTitle || "Storefront Browser Tab"}
                </span>
              </div>

              <div className="relative aspect-video bg-ink-card">
                <img
                  src={simState.imageUrl}
                  alt="Simulated storefront cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src =
                      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600";
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-4 pt-10">
                  <span className="text-[8px] font-black uppercase tracking-widest text-brass">
                    {selectedCmsTarget === "service"
                      ? "Premium Service Booking"
                      : "Retail Catalog Item"}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">
                    {simState.name || "Unnamed Custom Item"}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-white">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {simState.sku || "N/A"}
                    </span>
                    <span className="text-xs font-black text-brass">
                      ${simState.price}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Custom attributes tag */}
                <div className="flex flex-wrap gap-1">
                  <span className="bg-ink-card border border-ink-border text-light-text px-2 py-0.5 rounded text-[10px] font-mono">
                    instructor:{" "}
                    <span className="text-paper font-semibold">
                      {simState.instructor}
                    </span>
                  </span>
                </div>

                {/* SEO Tag information preview snippet */}
                <div className="bg-zinc-950/40 p-2.5 rounded border border-ink-border text-[10px] text-light-text space-y-1">
                  <strong className="text-brass text-[9px] font-bold uppercase block">
                    Google Search Preview:
                  </strong>
                  <div className="text-blue-400 hover:underline truncate font-semibold">
                    {simState.seoTitle}
                  </div>
                  <div className="line-clamp-2 text-zinc-400 leading-relaxed">
                    {simState.seoDesc}
                  </div>
                </div>

                {/* Parsed Markdown block */}
                <div className="border border-ink-border/60 p-3 rounded bg-ink-card/45 text-[11px] leading-relaxed text-light-text max-h-24 overflow-y-auto scrollbar-thin">
                  <strong className="text-white block font-bold text-xs mb-1">
                    Storefront About / Specifications (MD)
                  </strong>
                  <p className="whitespace-pre-line text-xs font-sans">
                    {simState.markdownDescription}
                  </p>
                </div>

                <button className="w-full bg-brass text-ink-bg font-black uppercase text-[10px] py-2.5 tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer rounded">
                  {selectedCmsTarget === "service"
                    ? "Reserve Available Slot"
                    : "Add Catalog Item to Cart"}
                </button>
              </div>
            </div>
          ) : (
            /* Serialized customFields JSON view */
            <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl animate-fade-in text-left">
              <button
                onClick={() => {
                  const payload = {
                    markdownDescription: simState.markdownDescription,
                    images: [
                      {
                        id: "img_cms_primary",
                        url: simState.imageUrl,
                        caption: simState.name,
                      },
                    ],
                    seo: {
                      title: simState.seoTitle,
                      description: simState.seoDesc,
                      keywords: "baking, premium",
                    },
                    customAttributes: { instructor_name: simState.instructor },
                  };
                  onCopy(JSON.stringify(payload, null, 2), "cms-raw-payload");
                }}
                className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                {copiedMap["cms-raw-payload"] ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <pre className="overflow-x-auto text-green-300 whitespace-pre leading-relaxed scrollbar-thin max-h-96">
                <code>
                  {renderHighlightedCode(
                    JSON.stringify(
                      {
                        markdownDescription: simState.markdownDescription,
                        images: [
                          {
                            id: "img_cms_primary",
                            url: simState.imageUrl,
                            caption: simState.name,
                          },
                        ],
                        seo: {
                          title: simState.seoTitle,
                          description: simState.seoDesc,
                          keywords: "baking, premium",
                        },
                        customAttributes: {
                          instructor_name: simState.instructor,
                        },
                      },
                      null,
                      2,
                    ),
                    "json",
                  )}
                </code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
