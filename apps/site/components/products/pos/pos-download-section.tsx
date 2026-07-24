"use client";
import { useState } from "react";
import { Monitor, HardDrive, Terminal, Download, Sparkles, ShoppingBag, UtensilsCrossed, Store, ShieldAlert, Cpu } from "lucide-react";
import { captureCtaClicked } from "@/lib/posthog-tracking";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";

const variants = [
  {
    id: "retail",
    name: "Retail",
    icon: Store,
    description: "Standard retail point of sale with inventory, loyalty, and custom size/color variant support.",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    icon: UtensilsCrossed,
    description: "Equipped with floor/table management, split-bill processing, and native Kitchen Display System (KDS).",
  },
  {
    id: "supermarket",
    name: "Supermarket",
    icon: ShoppingBag,
    description: "Optimized for fast-paced, scan-only checkout lanes with bulk purchasing discounts and heavy peripheral support.",
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    icon: ShieldAlert,
    description: "Includes secure prescription intake, doctor verification records, and batch/expiry tracking compliance.",
  },
  {
    id: "standalone",
    name: "Standalone",
    icon: Cpu,
    description: "A completely localized build with fully local DB operations, bypassable auth, and manual data exports.",
  },
];

const platforms = [
  { icon: Monitor, name: "Windows", format: ".msi installer", path: "windows" },
  { icon: HardDrive, name: "macOS", format: "Universal .dmg", path: "macos" },
  { icon: Terminal, name: "Linux", format: ".AppImage", path: "linux" },
];

export function PosDownloadSection() {
  const [selectedVariant, setSelectedVariant] = useState("retail");

  const currentVariantObj = variants.find((v) => v.id === selectedVariant) || variants[0];

  return (
    <section
      className="border-t py-24"
      id="download"
      style={{ borderColor: colors.inkLine, background: colors.inkPanelAlt }}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Eyebrow center>Get Scryme POS</Eyebrow>
        <h2
          className="mb-5 mt-4 text-[2rem] sm:text-[2.6rem]"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Ready to speed up your checkout?
        </h2>
        <p
          className="mx-auto mb-12 max-w-2xl text-[15.5px]"
          style={{ color: colors.textMuted }}
        >
          Download the native Scryme POS application for your operating system.
          Select the variant tailored to your business, then choose your platform.
        </p>

        {/* Variant Selector Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2 rounded-lg border p-1" style={{ borderColor: colors.inkLine, background: colors.inkPanel }}>
          {variants.map((variant) => {
            const Icon = variant.icon;
            const isActive = selectedVariant === variant.id;
            return (
              <button
                key={variant.id}
                onClick={() => {
                  setSelectedVariant(variant.id);
                  captureCtaClicked("pos_download_variant_changed", {
                    location: "pos_download_section",
                    cta_label: `Switch to ${variant.name}`,
                    destination: "#download",
                    selected_variant: variant.id,
                    module: "pos",
                  });
                }}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
                style={{
                  fontFamily: fonts.mono,
                  background: isActive ? colors.brassDim : "transparent",
                  color: isActive ? colors.brass : colors.textMuted,
                  border: isActive ? `1px solid ${colors.brassLine}` : "1px solid transparent",
                }}
              >
                <Icon className="h-4 w-4" />
                {variant.name}
              </button>
            );
          })}
        </div>

        {/* Variant Info Callout */}
        <div
          className="mx-auto mb-12 max-w-2xl rounded-md border p-5 text-left transition-all"
          style={{
            borderColor: colors.brassLine,
            background: colors.inkPanel,
          }}
        >
          <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: colors.brass, fontFamily: fonts.mono }}>
            <Sparkles className="h-4 w-4" />
            {currentVariantObj.name} Variant Build
          </div>
          <p className="text-[14px]" style={{ color: colors.textPrimary }}>
            {currentVariantObj.description}
          </p>
        </div>

        {/* Platform Download Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {platforms.map(({ icon: Icon, name, format, path }) => {
            const downloadUrl = `${apiBase}/public/download/${path}/${selectedVariant}`;
            return (
              <a
                key={name}
                href={downloadUrl}
                className="group flex flex-col items-center rounded-md border p-7 transition-all hover:-translate-y-1"
                style={{
                  borderColor: colors.inkLine,
                  background: colors.inkPanel,
                }}
                onClick={() =>
                  captureCtaClicked("pos_download_clicked", {
                    location: "pos_download_section",
                    cta_label: `Download ${name} (${selectedVariant})`,
                    destination: downloadUrl,
                    cta_type: "download",
                    module: "pos",
                    platform: name,
                    variant: selectedVariant,
                  })
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = colors.brassLine)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = colors.inkLine)
                }
              >
                <Icon
                  className="mb-4 h-9 w-9"
                  style={{ color: colors.textMuted }}
                />
                <span className="font-medium" style={{ color: colors.paper }}>
                  {name}
                </span>
                <span
                  className="mt-1 text-xs"
                  style={{ fontFamily: fonts.mono, color: colors.textFaint }}
                >
                  {format}
                </span>
                <div
                  className="mt-6 flex items-center gap-2 text-sm font-medium"
                  style={{ fontFamily: fonts.mono, color: colors.brass }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
