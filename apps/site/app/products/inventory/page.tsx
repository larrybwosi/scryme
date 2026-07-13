import type { Metadata } from "next";
import {
  Package,
  Truck,
  AlertTriangle,
  BarChart2,
  RefreshCw,
  Globe,
  Lock,
  Layers,
} from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { ModuleConnects } from "@/components/products/module-connects";
import { IndexGrid } from "@/components/products/index-grid";
import { LedgerCardGrid } from "@/components/products/ledger-card-grid";
import { StructuredData } from "@/components/seo/structured-data";
import { InventoryStockStub } from "@/components/products/inventory/inventory-stock-stub";
import { InventoryStockMock } from "@/components/products/inventory/inventory-stock-mock";
import { InventoryForecastMock } from "@/components/products/inventory/inventory-forecast-mock";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Multi-Location Inventory Management Software",
  description:
    "Scryme Inventory gives multi-location businesses real-time stock visibility, automated reorder triggers, and intelligent demand forecasting.",
  alternates: {
    canonical: "/products/inventory",
  },
  openGraph: {
    title: "Scryme Inventory — Real-time Stock Control",
    description:
      "Track every SKU across warehouses and stores. Eliminate stockouts with data-driven reorder automation.",
    url: "https://scryme.co/products/inventory",
  },
};

const capabilities = [
  { icon: Package, label: "Multi-location Stock" },
  { icon: Truck, label: "Supplier Management" },
  { icon: AlertTriangle, label: "Reorder Alerts" },
  { icon: BarChart2, label: "Demand Forecasting" },
  { icon: RefreshCw, label: "Stock Transfers" },
  { icon: Globe, label: "Multi-warehouse" },
  { icon: Lock, label: "Audit Trails" },
  { icon: Layers, label: "Variant Tracking" },
];

const includedCards = [
  {
    tag: "WT",
    title: "Multi-warehouse Transfers",
    desc: "Initiate and track inter-location transfers with expected arrival dates and transit status.",
  },
  {
    tag: "BT",
    title: "Batch & Expiry Tracking",
    desc: "Mandatory lot numbers and expiry dates for food, pharma, and regulated goods.",
  },
  {
    tag: "SM",
    title: "Supplier Management",
    desc: "Store lead times, MOQs, and pricing tiers for each supplier. Compare quotes side by side.",
  },
  {
    tag: "SA",
    title: "Stock Adjustments",
    desc: "Audit-logged manual adjustments with reason codes for shrinkage, damage, or cycle counts.",
  },
  {
    tag: "BP",
    title: "Barcode & QR Printing",
    desc: "Print labels directly from the inventory module. Supports Zebra and standard label printers.",
  },
  {
    tag: "CC",
    title: "Cycle Count Workflow",
    desc: "Schedule rolling cycle counts by category. Mobile-friendly count entry with variance reporting.",
  },
];

export default function InventoryPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Scryme Inventory",
    description:
      "Scryme Inventory gives multi-location businesses real-time stock visibility, automated reorder triggers, and intelligent demand forecasting.",
    brand: {
      "@type": "Brand",
      name: "Scryme",
    },
    offers: {
      "@type": "Offer",
      url: "https://scryme.co/products/inventory",
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
        item: "https://scryme.co",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: "https://scryme.co/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Inventory",
        item: "https://scryme.co/products/inventory",
      },
    ],
  };

  return (
    <main className="bg-[#0B1220]">
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />

      <ProductHero
        eyebrow="Module · Inventory"
        title={
          <>
            Real-time stock control{" "}
            <em className="not-italic text-[#C89A4B]">— across every location</em>.
          </>
        }
        description="Track every SKU, variant, and batch number across warehouses, stores, and in-transit. Scryme Inventory eliminates stockouts and overstocking with data-driven reorder automation."
        primaryCta={{ label: "Start free trial", href: "#pricing" }}
        secondaryCta={{ label: "See live stock ↓", href: "#stock" }}
        visual={<InventoryStockStub />}
      />

      <ModuleConnects current="INV" />

      <IndexGrid title="What's in the warehouse" items={capabilities} />

      <FeatureSection
        id="stock"
        eyebrow="Live Stock Dashboard"
        title="Know exactly what you have — everywhere"
        description="One unified view of all stock across every warehouse, store, and in-transit shipment. Filter by location, supplier, category, or reorder status in seconds."
        bullets={[
          {
            text: "Real-time stock count updated on every POS sale and goods receipt",
          },
          {
            text: "Drill down from total on-hand to individual lot and serial numbers",
          },
          {
            text: "Stock valuation using FIFO, LIFO, or weighted-average costing",
          },
          { text: "CSV and API export for accountants and ERP integrations" },
        ]}
      >
        <InventoryStockMock />
      </FeatureSection>

      <FeatureSection
        id="forecasting"
        eyebrow="Demand Forecasting"
        title="Buy the right amount — every time"
        description="Scryme analyses 24 months of sales history, seasonality, and supplier lead times to recommend exactly when and how much to reorder — so you never overstock slow movers or run dry on bestsellers."
        bullets={[
          { text: "ML-based demand model trained on your actual sales data" },
          { text: "Seasonal and trend adjustments with manual override support" },
          { text: "Automatic purchase order generation for approved suppliers" },
          { text: "Cost simulation: see the cash impact of each reorder scenario" },
        ]}
        reverse
        dark
      >
        <InventoryForecastMock />
      </FeatureSection>

      <LedgerCardGrid
        eyebrow="Complete control"
        title="From receiving dock to customer delivery"
        cards={includedCards}
      />

      <div id="pricing">
        <PricingCTA />
      </div>
    </main>
  );
}
