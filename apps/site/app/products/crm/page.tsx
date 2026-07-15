import type { Metadata } from "next";
import {
  Users,
  GitBranch,
  BarChart2,
  Bell,
  Mail,
  Zap,
  Lock,
  Globe,
} from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { ModuleConnects } from "@/components/products/module-connects";
import { IndexGrid } from "@/components/products/index-grid";
import { LedgerCardGrid } from "@/components/products/ledger-card-grid";
import { StructuredData } from "@/components/seo/structured-data";
import { CrmDealStub } from "@/components/products/crm/crm-deal-stub";
import { CrmPipelineMock } from "@/components/products/crm/crm-pipeline-mock";
import { CrmContactMock } from "@/components/products/crm/crm-contact-mock";
import { CrmAnalyticsMock } from "@/components/products/crm/crm-analytics-mock";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Cloud CRM Software for Growing Sales Teams",
  description:
    "Scryme CRM gives sales teams a visual pipeline, unified contact records, automated follow-ups, and real-time analytics to close more deals faster.",
  alternates: {
    canonical: "/products/crm",
  },
  openGraph: {
    title: "Scryme CRM — Visual Pipeline & Sales Automation",
    description:
      "Close more deals with a pipeline built for scale. AI-assisted follow-ups, deal scoring, and revenue forecasting.",
    url: "https://scryme.tech/products/crm",
  },
};

const capabilities = [
  { icon: GitBranch, label: "Visual Pipeline" },
  { icon: Users, label: "Contact Intelligence" },
  { icon: Mail, label: "Email Sequences" },
  { icon: Bell, label: "Smart Alerts" },
  { icon: BarChart2, label: "Revenue Analytics" },
  { icon: Zap, label: "Workflow Automation" },
  { icon: Lock, label: "Role-Based Access" },
  { icon: Globe, label: "Multi-org Support" },
];

const includedCards = [
  {
    tag: "WF",
    title: "Workflow Automation",
    desc: "Trigger emails, tasks, and stage moves based on any CRM event — no code needed.",
  },
  {
    tag: "ES",
    title: "Email Sequences",
    desc: "Multi-step outreach cadences with A/B testing and open/click analytics.",
  },
  {
    tag: "LS",
    title: "Lead Scoring",
    desc: "Score inbound leads automatically by company size, engagement, and fit.",
  },
  {
    tag: "TM",
    title: "Territory Management",
    desc: "Assign accounts by region, industry, or round-robin rules with audit logs.",
  },
  {
    tag: "QB",
    title: "Quotation Builder",
    desc: "Generate branded PDF quotes directly from a deal card. E-sign ready.",
  },
  {
    tag: "API",
    title: "API & Webhooks",
    desc: "Bidirectional sync with your ERP, marketing tools, and data warehouse.",
  },
];

export default function CrmPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Scryme CRM",
    description:
      "Scryme CRM gives sales teams a visual pipeline, unified contact records, automated follow-ups, and real-time analytics to close more deals faster.",
    brand: {
      "@type": "Brand",
      name: "Scryme",
    },
    offers: {
      "@type": "Offer",
      url: "https://scryme.tech/products/crm",
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
        name: "CRM",
        item: "https://scryme.tech/products/crm",
      },
    ],
  };

  return (
    <main className="bg-[#0B1220]">
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />

      <ProductHero
        module="crm"
        eyebrow="Module · CRM"
        title={
          <>
            Every deal,{" "}
            <em className="not-italic text-[#C89A4B]">on the record</em> — start
            to close.
          </>
        }
        description="Scryme CRM gives your team one visual pipeline and one contact record per account. Close a deal and it posts straight to Finance and unlocks fulfillment in Inventory — no re-entry, no reconciliation."
        primaryCta={{ label: "Start free trial", href: "#pricing" }}
        secondaryCta={{ label: "See the pipeline ↓", href: "#pipeline" }}
        visual={<CrmDealStub />}
      />

      <ModuleConnects current="CRM" />

      <IndexGrid title="What's on the record" items={capabilities} />

      <FeatureSection
        id="pipeline"
        eyebrow="Visual Pipeline"
        title="See every deal's status at a glance"
        description="Drag-and-drop Kanban stages let your team move deals forward without switching apps. Custom stages, deal weighting, and probability scoring ship out of the box."
        bullets={[
          { text: "Unlimited custom pipeline stages per product line" },
          { text: "Deal probability auto-scoring based on activity signals" },
          { text: "Stale deal alerts when no activity for N days" },
          { text: "One-click bulk stage transitions for batch operations" },
        ]}
      >
        <CrmPipelineMock />
      </FeatureSection>

      <FeatureSection
        id="contact"
        eyebrow="Contact Intelligence"
        title="Every interaction — in one place"
        description="Calls, emails, meetings and notes are automatically linked to the right contact and company. Your reps always know what was said and what needs to happen next."
        bullets={[
          { text: "Automatic email and calendar sync with Gmail & Outlook" },
          { text: "Call recordings transcribed and indexed for search" },
          { text: "AI-generated meeting summaries and next-step suggestions" },
          { text: "Company hierarchy mapping for enterprise accounts" },
        ]}
        reverse
        dark
      >
        <CrmContactMock />
      </FeatureSection>

      <FeatureSection
        id="analytics"
        eyebrow="Revenue Analytics"
        title="Forecast with confidence, not guesswork"
        description="Scryme CRM surfaces the metrics that matter — win rates, cycle length, and pipeline velocity — so you can plan headcount and quota with real data."
        bullets={[
          { text: "Rolling 12-month revenue forecasts with confidence bands" },
          { text: "Cohort analysis by rep, region, and product" },
          { text: "Pipeline health score with actionable recommendations" },
          { text: "Exportable reports and Slack/Teams digest integrations" },
        ]}
      >
        <CrmAnalyticsMock />
      </FeatureSection>

      <LedgerCardGrid
        eyebrow="Everything included"
        title="No add-ons required. No hidden tiers."
        cards={includedCards}
      />

      <div id="pricing">
        <PricingCTA />
      </div>
    </main>
  );
}
