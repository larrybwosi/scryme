import type { Metadata } from "next";
import {
  TrendingUp,
  BarChart2,
  PieChart,
  LineChart,
  Database,
  Search,
  Lock,
  Globe,
} from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { ModuleConnects } from "@/components/products/module-connects";
import { IndexGrid } from "@/components/products/index-grid";
import { LedgerCardGrid } from "@/components/products/ledger-card-grid";
import { StructuredData } from "@/components/seo/structured-data";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Business Intelligence & Real-time Analytics Software",
  description:
    "Scryme Analytics consolidates CRM, POS, Inventory, and Finance streams into real-time business intelligence dashboards, eliminating manual reporting projects.",
  alternates: {
    canonical: "/products/analytics",
  },
  openGraph: {
    title: "Scryme Analytics — Real-time Business Intelligence",
    description:
      "Consolidate operational streams into real-time business intelligence dashboards.",
    url: "https://scryme.tech/products/analytics",
  },
};

const capabilities = [
  { icon: TrendingUp, label: "Live Ledger Streams" },
  { icon: BarChart2, label: "Sales & CRM Insights" },
  { icon: PieChart, label: "Gross Margin Breakdown" },
  { icon: LineChart, label: "Forecasting Engines" },
  { icon: Database, label: "Custom SQL Builder" },
  { icon: Search, label: "Interactive Filters" },
  { icon: Lock, label: "Encrypted Data Exports" },
  { icon: Globe, label: "Multi-branch Performance" },
];

const includedCards = [
  {
    tag: "CO",
    title: "Consolidated Dashboards",
    desc: "Unify POS receipts, CRM pipeline progress, and warehouse inventory levels onto a single unified pane.",
  },
  {
    tag: "GM",
    title: "Gross Profit & Margins",
    desc: "Calculate unit-level profit margins automatically using live purchase order costs and POS transaction data.",
  },
  {
    tag: "SQ",
    title: "Embedded SQL Editor",
    desc: "Query raw database streams directly inside the browser. Build and pin custom visualizations.",
  },
  {
    tag: "SR",
    title: "Scheduled Reports",
    desc: "Automate delivery of daily or weekly performance spreadsheets to executive emails and Slack channels.",
  },
  {
    tag: "RL",
    title: "Row-Level Security",
    desc: "Restrict dashboards and transactional data access based on branches, roles, or organization scopes.",
  },
  {
    tag: "DF",
    title: "Demand Analytics API",
    desc: "Pull demand indicators directly into external reporting tools or analytics storage layers.",
  },
];

export default function AnalyticsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Scryme Analytics",
    description:
      "Scryme Analytics consolidates CRM, POS, Inventory, and Finance streams into real-time business intelligence dashboards, eliminating manual reporting projects.",
    brand: {
      "@type": "Brand",
      name: "Scryme",
    },
    offers: {
      "@type": "Offer",
      url: "https://scryme.tech/products/analytics",
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
        name: "Analytics",
        item: "https://scryme.tech/products/analytics",
      },
    ],
  };

  return (
    <main className="bg-[#0B1220]">
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />

      <ProductHero
        module="analytics"
        eyebrow="Module · Analytics"
        title={
          <>
            Real-time intelligence,{" "}
            <em className="not-italic text-[#C89A4B]">zero pipeline delays</em>.
          </>
        }
        description="Consolidate POS, CRM, Inventory, and Finance into instantaneous business insights. Scryme Analytics writes straight to a single operational database, so reports are refreshed immediately — without batch loads or pipeline lags."
        primaryCta={{ label: "Start free trial", href: "#pricing" }}
        secondaryCta={{ label: "See analytics ↓", href: "#metrics" }}
        visual={
          <div className="p-6 rounded-lg border border-[rgba(241,233,216,0.08)] bg-[#121B2E]">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-rgba(241,233,216,0.32) mb-4 font-mono text-[#C89A4B]">
              Integrated Performance Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3 bg-[#0E1626] rounded border border-[rgba(241,233,216,0.04)]">
                <p className="text-[rgba(241,233,216,0.5)] text-[10px]">
                  TOTAL REVENUE
                </p>
                <p className="text-lg font-bold text-[#F1E9D8] mt-1">$1.48M</p>
                <p className="text-[9px] text-[#4B9073] mt-1">↑ 12.4% MoM</p>
              </div>
              <div className="p-3 bg-[#0E1626] rounded border border-[rgba(241,233,216,0.04)]">
                <p className="text-[rgba(241,233,216,0.5)] text-[10px]">
                  GROSS MARGIN
                </p>
                <p className="text-lg font-bold text-[#F1E9D8] mt-1">68.2%</p>
                <p className="text-[9px] text-[#4B9073] mt-1">↑ 1.5% vs Q1</p>
              </div>
            </div>
          </div>
        }
      />

      <ModuleConnects current="BI" />

      <IndexGrid title="What's inside the dashboard" items={capabilities} />

      <FeatureSection
        id="metrics"
        eyebrow="Live Intelligence"
        title="Interactive insights built on live records"
        description="Ditch outdated export spreadsheets and manually compiled slide decks. Drill into localized performance, sales cohorts, or inventory turn rates dynamically with real-time operational database sync."
        bullets={[
          {
            text: "Drill down instantly from total global revenue down to itemized POS receipts",
          },
          {
            text: "Cohort retention analysis for wholesale and corporate accounts",
          },
          {
            text: "Segment gross margins by brand, branch, or product category",
          },
          {
            text: "Interactive dashboards that anyone can build with drag-and-drop metrics",
          },
        ]}
      >
        <div className="p-6 rounded-lg border border-[rgba(241,233,216,0.08)] bg-[#0E1626] font-mono text-xs space-y-4 text-[#F1E9D8]">
          <div className="text-sm font-semibold border-b border-[rgba(241,233,216,0.08)] pb-2 text-[#C89A4B]">
            Margin Performance By Category
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Enterprise POS Hardware</span>
                <span className="text-[#4B9073] font-semibold">
                  74.5% Margin
                </span>
              </div>
              <div className="w-full bg-[#121B2E] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#4B9073] h-full"
                  style={{ width: "74.5%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Cloud SaaS Subscriptions</span>
                <span className="text-[#4B9073] font-semibold">
                  88.0% Margin
                </span>
              </div>
              <div className="w-full bg-[#121B2E] h-2 rounded-full overflow-hidden">
                <div className="bg-[#4B9073] h-full" style={{ width: "88%" }} />
              </div>
            </div>
          </div>
        </div>
      </FeatureSection>

      <LedgerCardGrid
        eyebrow="Everything included"
        title="Consolidate reporting, scrap legacy BI overhead."
        cards={includedCards}
      />

      <div id="pricing">
        <PricingCTA />
      </div>
    </main>
  );
}
