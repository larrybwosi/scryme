import type { Metadata } from "next";
import {
  Users,
  Clock,
  Briefcase,
  DollarSign,
  ShieldCheck,
  FileText,
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
  title: "HR & Workforce Management Software — Unified Employee Records",
  description:
    "Scryme HR manages payroll, workforce attendance, compliance, and employee schedules, syncing human capital costs directly into the Finance ledger.",
  alternates: {
    canonical: "/products/hr",
  },
  openGraph: {
    title: "Scryme HR — Integrated Employee Records",
    description:
      "Manage payroll, workforce attendance, compliance, and schedules in one place.",
    url: "https://scryme.tech/products/hr",
  },
};

const capabilities = [
  { icon: Users, label: "Unified Employee Profiles" },
  { icon: Clock, label: "Attendance & Time Tracking" },
  { icon: DollarSign, label: "Integrated Payroll" },
  { icon: ShieldCheck, label: "Compliance & Audits" },
  { icon: Briefcase, label: "Onboarding & Recruiting" },
  { icon: FileText, label: "Document Management" },
  { icon: Lock, label: "Role-Based Access" },
  { icon: Globe, label: "Multi-jurisdiction Payroll" },
];

const includedCards = [
  {
    tag: "PY",
    title: "Integrated Payroll Processing",
    desc: "Calculate salaries, bonuses, tax withholdings, and localized compliance rules automatically.",
  },
  {
    tag: "TS",
    title: "Timesheet Approvals",
    desc: "Digital timesheets linked to shift schedules, with manager approvals and discrepancy tracking.",
  },
  {
    tag: "BA",
    title: "Benefits Administration",
    desc: "Manage health insurance, retirement contributions, and custom allowance configurations in one portal.",
  },
  {
    tag: "ES",
    title: "Employee Self-Service",
    desc: "Allow staff to view payslips, request time off, and update personal information via mobile web.",
  },
  {
    tag: "AL",
    title: "Audit & Compliance Log",
    desc: "Keep records of all HR modifications, policy changes, and security access requests.",
  },
  {
    tag: "API",
    title: "Global API Sync",
    desc: "Export payroll journals to legacy accounts or trigger payments with regional banking standard APIs.",
  },
];

export default function HrPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Scryme HR",
    description:
      "Scryme HR manages payroll, workforce attendance, compliance, and employee schedules, syncing human capital costs directly into the Finance ledger.",
    brand: {
      "@type": "Brand",
      name: "Scryme",
    },
    offers: {
      "@type": "Offer",
      url: "https://scryme.tech/products/hr",
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
        name: "HR",
        item: "https://scryme.tech/products/hr",
      },
    ],
  };

  return (
    <main className="bg-[#0B1220]">
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />

      <ProductHero
        module="hr"
        eyebrow="Module · HR & Workforce"
        title={
          <>
            Manage human capital,{" "}
            <em className="not-italic text-[#C89A4B]">syncing labor cost</em>{" "}
            dynamically.
          </>
        }
        description="Sync labor costs, roster shifts, track attendance, and run localized payroll. Scryme HR pulls timesheet data directly and posts labor costs straight into your general ledger, eliminating monthly reconciliation nightmares."
        primaryCta={{ label: "Start free trial", href: "#pricing" }}
        secondaryCta={{ label: "See details ↓", href: "#workforce" }}
        visual={
          <div className="p-6 rounded-lg border border-[rgba(241,233,216,0.08)] bg-[#121B2E]">
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4 font-mono text-[#C89A4B]">
              Operating Payroll Journal
            </h4>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-[rgba(241,233,216,0.04)] pb-2 text-[#F1E9D8]">
                <span>Salaries & Wages</span>
                <span className="text-[#4B9073]">$48,250.00</span>
              </div>
              <div className="flex justify-between border-b border-[rgba(241,233,216,0.04)] pb-2 text-[#F1E9D8]">
                <span>Employer Taxes</span>
                <span className="text-[#4B9073]">$4,825.00</span>
              </div>
              <div className="flex justify-between border-b border-[rgba(241,233,216,0.04)] pb-2 text-[#F1E9D8]">
                <span>Health Benefits</span>
                <span className="text-[#4B9073]">$3,200.00</span>
              </div>
              <div className="flex justify-between pt-2 text-[#C89A4B]">
                <span>Total Workforce Cost</span>
                <span>$56,275.00</span>
              </div>
            </div>
          </div>
        }
      />

      <ModuleConnects current="HR" />

      <IndexGrid title="What is on the employee record" items={capabilities} />

      <FeatureSection
        id="workforce"
        eyebrow="Employee & Rosters"
        title="Dynamic scheduling aligned with demand"
        description="Set up shift patterns, track attendance automatically via terminal clock-ins or GPS, and map rosters to historical store demand to optimize workforce cost."
        bullets={[
          {
            text: "Generate weekly rosters in minutes with templates and auto-scheduling",
          },
          {
            text: "Geofenced mobile clock-in/out and physical terminal support",
          },
          {
            text: "Shift swap requests with automatic manager approval routing",
          },
          {
            text: "Real-time cost tracking shows rota budget vs actual cost as you schedule",
          },
        ]}
      >
        <div className="p-6 rounded-lg border border-[rgba(241,233,216,0.08)] bg-[#0E1626] font-mono text-xs space-y-4 text-[#F1E9D8]">
          <div className="text-sm font-semibold border-b border-[rgba(241,233,216,0.08)] pb-2 text-[#C89A4B]">
            Shift Schedule - Main Terminal
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-[#121B2E] p-2.5 rounded border border-[rgba(241,233,216,0.04)]">
              <div>
                <p className="font-semibold text-sm">Amara Mensah</p>
                <p className="text-xs text-[rgba(241,233,216,0.5)]">
                  Retail Supervisor
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#4B9073]">08:00 - 16:30</p>
                <p className="text-[10px] text-[rgba(241,233,216,0.4)]">
                  8.5 hrs · Confirmed
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-[#121B2E] p-2.5 rounded border border-[rgba(241,233,216,0.04)]">
              <div>
                <p className="font-semibold text-sm">Samuel Carter</p>
                <p className="text-xs text-[rgba(241,233,216,0.5)]">Cashier</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#4B9073]">09:00 - 17:30</p>
                <p className="text-[10px] text-[rgba(241,233,216,0.4)]">
                  8.5 hrs · Confirmed
                </p>
              </div>
            </div>
          </div>
        </div>
      </FeatureSection>

      <FeatureSection
        id="compliance"
        eyebrow="Compliance & Audit"
        title="Always compliant with regional labor laws"
        description="Scryme keeps compliance records, documents and tax calculations up to date. Avoid penalizations by setting localized maximum work limits, mandatory rest intervals, and overtime multipliers."
        bullets={[
          {
            text: "Auto-calculated overtime multipliers based on local jurisdictions",
          },
          {
            text: "Centralized compliance dashboard highlighting expired credentials",
          },
          {
            text: "Rest periods and maximum daily work limit enforcement alerts",
          },
          {
            text: "Secure records repository with audit trails for corporate auditors",
          },
        ]}
        reverse
        dark
      >
        <div className="p-6 rounded-lg border border-[rgba(241,233,216,0.08)] bg-[#0E1626] font-mono text-xs space-y-4 text-[#F1E9D8]">
          <div className="text-sm font-semibold border-b border-[rgba(241,233,216,0.08)] pb-2 text-[#B4553A]">
            Compliance & License Monitors
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-[#121B2E] p-2.5 rounded border border-[rgba(241,233,216,0.04)]">
              <span>Food Handler Permit (A. Mensah)</span>
              <span className="text-[#4B9073] bg-[rgba(75,144,115,0.15)] px-2 py-0.5 rounded text-[10px]">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#121B2E] p-2.5 rounded border border-[rgba(241,233,216,0.04)]">
              <span>Forklift Certification (S. Carter)</span>
              <span className="text-[#B4553A] bg-[rgba(180,85,58,0.15)] px-2 py-0.5 rounded text-[10px]">
                Expiring (12d)
              </span>
            </div>
          </div>
        </div>
      </FeatureSection>

      <LedgerCardGrid
        eyebrow="Everything included"
        title="Modern workforce features built for scale."
        cards={includedCards}
      />

      <div id="pricing">
        <PricingCTA />
      </div>
    </main>
  );
}
