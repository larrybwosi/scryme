import type { Metadata } from "next";
import {
  ShoppingCart,
  Monitor,
  Wifi,
  BarChart2,
  Package,
  Receipt,
  Shield,
  Repeat2,
  Layers,
  HardDrive,
  UserCheck,
} from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { ModuleConnects } from "@/components/products/module-connects";
import { IndexGrid } from "@/components/products/index-grid";
import { LedgerCardGrid } from "@/components/products/ledger-card-grid";
import { CalloutRow } from "@/components/products/callout-row";
import { StructuredData } from "@/components/seo/structured-data";
import { PosTerminalStub } from "@/components/products/pos/pos-terminal-stub";
import { PosReceiptTape } from "@/components/products/pos/pos-receipt-tape";
import { PosCheckoutMock } from "@/components/products/pos/pos-checkout-mock";
import { PosOfflineMock } from "@/components/products/pos/pos-offline-mock";
import { PosInventorySyncMock } from "@/components/products/pos/pos-inventory-sync-mock";
import { PosDownloadSection } from "@/components/products/pos/pos-download-section";
import { PricingCTA } from "@/components/home/pricing-cta";
import { PageBuilder } from "@/components/sections/page-builder";
import { getCmsPage, getHomePageContent, getPageMetadata } from "@/lib/sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getCmsPage("products/pos");
  if (cmsPage?.seo) {
    return getPageMetadata({
      pageSeo: cmsPage.seo,
      fallbackTitle: "Offline-First POS System for Retail & Wholesale",
      fallbackDescription: "Scryme POS is a desktop-class point-of-sale built on Tauri, designed for high-volume retail and wholesale with full offline support. Keep selling even without internet.",
      canonicalPath: "/products/pos",
    });
  }
  const content = await getHomePageContent();
  const moduleData = content.modules?.find((m) => m.code === "POS" || m.href?.endsWith("/pos"));
  return getPageMetadata({
    pageSeo: moduleData?.seo,
    fallbackTitle: "Offline-First POS System for Retail & Wholesale",
    fallbackDescription: "Scryme POS is a desktop-class point-of-sale built on Tauri, designed for high-volume retail and wholesale with full offline support. Keep selling even without internet.",
    canonicalPath: "/products/pos",
  });
}

const capabilities = [
  { icon: Monitor, label: "Desktop App (Tauri)" },
  { icon: Wifi, label: "Full Offline Mode" },
  { icon: Receipt, label: "Multi-tender" },
  { icon: Package, label: "Live Inventory Sync" },
  { icon: BarChart2, label: "Shift Reports" },
  { icon: Repeat2, label: "Returns & Exchanges" },
  { icon: Shield, label: "Role Permissions" },
  { icon: ShoppingCart, label: "Layaway & Credit" },
];

const edgeCaseCards = [
  {
    tag: "MR",
    title: "Multi-register Support",
    desc: "Run any number of terminals per location. Each syncs independently and merges conflict-free.",
  },
  {
    tag: "RE",
    title: "Returns & Exchanges",
    desc: "Process full or partial returns with or without a receipt. Stock is automatically restocked.",
  },
  {
    tag: "LD",
    title: "Layaway & Deposits",
    desc: "Accept partial payments with automatic hold on stock until balance is cleared.",
  },
  {
    tag: "SM",
    title: "Shift Management",
    desc: "Open and close tills, assign floats, and generate shift reconciliation reports per cashier.",
  },
  {
    tag: "PS",
    title: "Peripheral Support",
    desc: "Plug-and-play with Epson receipt printers, USB/Bluetooth barcode scanners, and cash drawers.",
  },
  {
    tag: "CD",
    title: "Customer Display",
    desc: "Mirror line items to a second screen or tablet for transparent, branded customer-facing checkout.",
  },
];

const architectureCallouts = [
  {
    icon: Layers,
    title: "Multi-Register Sync",
    description:
      "Seamlessly run multiple terminals in a single location. Our CRDT-based synchronization keeps every register updated with live inventory and sales data, resolving conflicts automatically.",
  },
  {
    icon: HardDrive,
    title: "Peripheral Support",
    description:
      "Connect your existing hardware. Native support for industry-standard receipt printers, barcode scanners, and cash drawers via USB, Bluetooth, or network.",
  },
  {
    icon: UserCheck,
    title: "Advanced Permissions",
    description:
      "Granular role-based access control. Manage cashier shifts, till floats, and manager overrides with a detailed audit trail of every action on the terminal.",
  },
];

export default async function PosPage() {
  const cmsPage = await getCmsPage("products/pos");
  if (cmsPage?.sections?.length) {
    return (
      <main id="main-content">
        <PageBuilder sections={cmsPage.sections} />
      </main>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Scryme POS",
    description:
      "Scryme POS is a desktop-class point-of-sale built on Tauri, designed for high-volume retail and wholesale with full offline support.",
    brand: {
      "@type": "Brand",
      name: "Scryme",
    },
    offers: {
      "@type": "Offer",
      url: "https://scryme.tech/products/pos",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://scryme.tech",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: "https://scryme.tech/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "POS",
        item: "https://scryme.tech/products/pos",
      },
    ],
  };

  return (
    <main className="bg-[#0B1220]">
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />

      <ProductHero
        module="pos"
        eyebrow="Module · POS"
        title={
          <>
            A desktop register that keeps selling{" "}
            <em className="not-italic text-[#C89A4B]">— even offline</em>.
          </>
        }
        description="Built as a native desktop app (Tauri + React), Scryme POS gives your retail and wholesale staff a fast, reliable checkout that never depends on the internet."
        primaryCta={{ label: "Start free trial", href: "#pricing" }}
        secondaryCta={{ label: "See it checkout ↓", href: "#checkout" }}
        visual={<PosTerminalStub />}
      />

      <ModuleConnects current="POS" />

      <IndexGrid title="What's on the terminal" items={capabilities} />

      <PosReceiptTape />

      <FeatureSection
        id="checkout"
        eyebrow="Checkout Experience"
        title="Blazing-fast checkout built for volume"
        description="Process a sale in under 5 seconds. Barcode scan, item search, or manual entry — all from a clean interface your staff can learn in minutes. Supports card, cash, mobile pay, and split tender."
        bullets={[
          { text: "Barcode, QR, and manual SKU product lookup" },
          { text: "Split payments across any combination of tender types" },
          { text: "Customer account lookup and store credit redemption" },
          { text: "One-tap discount codes and loyalty point application" },
        ]}
      >
        <PosCheckoutMock />
      </FeatureSection>

      <FeatureSection
        id="offline"
        eyebrow="Offline First"
        title="Internet down? You're still open"
        description="Scryme POS stores a complete local copy of inventory, pricing, and customer data. Transactions queue locally and auto-sync the moment connectivity returns — no data loss, ever."
        bullets={[
          { text: "Full SQLite database cached locally on every terminal" },
          { text: "Conflict-free sync using a CRDT-based merge strategy" },
          {
            text: "Queue visibility lets managers see pending uploads in real time",
          },
          {
            text: "Supports up to 72 hours of uninterrupted offline operation",
          },
        ]}
        reverse
        dark
      >
        <PosOfflineMock />
      </FeatureSection>

      <FeatureSection
        id="inventory"
        eyebrow="Live Inventory Sync"
        title="Every sale updates stock in real time"
        description="Scryme POS is natively connected to the Inventory module. Every checkout immediately reflects on the warehouse stock count, reorder triggers, and supplier dashboards — no manual reconciliation."
        bullets={[
          { text: "Sub-second inventory deduction on each completed sale" },
          { text: "Low-stock alerts surfaced directly on the POS terminal" },
          { text: "Multi-location stock transfer initiated from the POS" },
          { text: "End-of-day reconciliation report auto-generated on close" },
        ]}
      >
        <PosInventorySyncMock />
      </FeatureSection>

      <LedgerCardGrid
        eyebrow="Built for serious retail"
        title="Every edge case, already handled"
        cards={edgeCaseCards}
      />

      <CalloutRow items={architectureCallouts} />

      <PosDownloadSection />

      <div id="pricing">
        <PricingCTA />
      </div>
    </main>
  );
}
