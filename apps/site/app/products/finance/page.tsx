import type { Metadata } from "next";
import {
  DollarSign,
  FileText,
  TrendingUp,
  CreditCard,
  Repeat,
  BarChart2,
  Lock,
  Globe,
} from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { ModuleConnects } from "@/components/products/module-connects";
import { IndexGrid } from "@/components/products/index-grid";
import { LedgerCardGrid } from "@/components/products/ledger-card-grid";
import { StructuredData } from "@/components/seo/structured-data";
import { FinanceLedgerStub } from "@/components/products/finance/finance-ledger-stub";
import { FinancePlMock } from "@/components/products/finance/finance-pl-mock";
import { FinanceInvoicesMock } from "@/components/products/finance/finance-invoices-mock";
import { FinanceExpenseMock } from "@/components/products/finance/finance-expense-mock";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Automated Finance & Accounting for Businesses",
  description:
    "Scryme Finance automates bookkeeping, invoicing, and financial reporting for retail and wholesale businesses — no accountant required for day-to-day operations.",
  alternates: {
    canonical: "/products/finance",
  },
  openGraph: {
    title: "Scryme Finance — Automated Bookkeeping",
    description:
      "Connect POS, inventory, and CRM for automated Posting. Close your month in hours, not days.",
    url: "https://scryme.tech/products/finance",
  },
};

const capabilities = [
  { icon: FileText, label: "Invoicing & Billing" },
  { icon: TrendingUp, label: "P&L Statements" },
  { icon: CreditCard, label: "Expense Tracking" },
  { icon: Repeat, label: "Recurring Billing" },
  { icon: BarChart2, label: "Cash Flow Reports" },
  { icon: DollarSign, label: "Multi-currency" },
  { icon: Lock, label: "Audit Logs" },
  { icon: Globe, label: "Tax Compliance" },
];

const includedCards = [
  {
    tag: "MC",
    title: "Multi-currency",
    desc: "Transact in any currency. Exchange rates updated automatically from open banking feeds.",
  },
  {
    tag: "TC",
    title: "Tax Compliance",
    desc: "VAT, GST, and sales tax calculation with jurisdiction-aware rules. One-click tax returns.",
  },
  {
    tag: "BR",
    title: "Bank Reconciliation",
    desc: "Auto-match bank statement lines to posted transactions. Exceptions flagged for manual review.",
  },
  {
    tag: "FA",
    title: "Fixed Asset Register",
    desc: "Track equipment, vehicles, and property with auto-calculated depreciation schedules.",
  },
  {
    tag: "IC",
    title: "Intercompany Transactions",
    desc: "Post eliminations and intercompany charges across subsidiaries with consolidated reporting.",
  },
  {
    tag: "AT",
    title: "Audit Trail",
    desc: "Every entry is timestamped and user-attributed. Immutable audit log exportable for compliance.",
  },
];

export default function FinancePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Scryme Finance",
    description:
      "Scryme Finance automates bookkeeping, invoicing, and financial reporting for retail and wholesale businesses — no accountant required for day-to-day operations.",
    brand: {
      "@type": "Brand",
      name: "Scryme",
    },
    offers: {
      "@type": "Offer",
      url: "https://scryme.tech/products/finance",
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
        name: "Finance",
        item: "https://scryme.tech/products/finance",
      },
    ],
  };

  return (
    <main className="bg-[#0B1220]">
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />

      <ProductHero
        eyebrow="Module · Finance"
        title={
          <>
            Books that balance{" "}
            <em className="not-italic text-[#C89A4B]">themselves</em> — to the
            penny.
          </>
        }
        description="Scryme Finance connects directly to your POS, inventory, and CRM — so every sale, purchase order, and expense is posted automatically. Close your month in hours, not days."
        primaryCta={{ label: "Start free trial", href: "#pricing" }}
        secondaryCta={{ label: "See the general ledger ↓", href: "#pl" }}
        visual={<FinanceLedgerStub />}
      />

      <ModuleConnects current="FIN" />

      <IndexGrid title="What's in the ledger" items={capabilities} />

      <FeatureSection
        id="pl"
        eyebrow="Financial Reporting"
        title="Your P&L, always up to date"
        description="Every transaction across POS, inventory, and CRM flows into the general ledger automatically. Get a real-time profit & loss statement, balance sheet, and cash flow report at any time."
        bullets={[
          { text: "Real-time P&L with drill-down to individual transactions" },
          { text: "Balance sheet auto-reconciled from live module data" },
          { text: "Cash flow forecast built from outstanding invoices and bills" },
          { text: "IFRS and GAAP-compliant chart of accounts included" },
        ]}
      >
        <FinancePlMock />
      </FeatureSection>

      <FeatureSection
        id="invoices"
        eyebrow="Invoicing & AR"
        title="Get paid faster with smart invoicing"
        description="Create professional invoices in seconds, schedule automatic payment reminders, and track outstanding AR by customer age band. Integrates with Stripe and direct bank transfers."
        bullets={[
          { text: "Branded invoice templates with custom payment terms" },
          { text: "Auto-reminders at 7, 14, and 30 days past due" },
          {
            text: "Online payment portal — customers pay with card or bank transfer",
          },
          { text: "Aged receivables report with one-click chaser emails" },
        ]}
        reverse
        dark
      >
        <FinanceInvoicesMock />
      </FeatureSection>

      <FeatureSection
        id="expenses"
        eyebrow="Expense Management"
        title="Every expense captured, categorised, and approved"
        description="Staff submit expenses from mobile. Managers approve with one click. Receipts are OCR-scanned and matched to vendor bills. Every transaction posts to the GL automatically."
        bullets={[
          { text: "Mobile receipt capture with automatic OCR extraction" },
          { text: "Multi-level approval workflows by amount and department" },
          { text: "Per-diem and mileage claim templates with HMRC/IRS rates" },
          { text: "Real-time budget vs. actual tracking by cost centre" },
        ]}
      >
        <FinanceExpenseMock />
      </FeatureSection>

      <LedgerCardGrid
        eyebrow="Enterprise-grade accounting"
        title="Trusted by finance teams at growing businesses"
        cards={includedCards}
      />

      <div id="pricing">
        <PricingCTA />
      </div>
    </main>
  );
}
