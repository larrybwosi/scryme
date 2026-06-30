import type { Metadata } from "next";
import { DollarSign, FileText, TrendingUp, CreditCard, Repeat, BarChart2, Lock, Globe } from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { StructuredData } from "@/components/seo/structured-data";
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
    description: "Connect POS, inventory, and CRM for automated Posting. Close your month in hours, not days.",
    url: "https://scryme.co/products/finance",
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

export default function FinancePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Scryme Finance",
    description: "Scryme Finance automates bookkeeping, invoicing, and financial reporting for retail and wholesale businesses — no accountant required for day-to-day operations.",
    brand: {
      "@type": "Brand",
      name: "Scryme",
    },
    offers: {
      "@type": "Offer",
      url: "https://scryme.co/products/finance",
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
        name: "Finance",
        item: "https://scryme.co/products/finance",
      },
    ],
  };

  return (
    <main>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />
      <ProductHero
        eyebrow="Scryme Finance"
        title="Books that balance themselves"
        description="Scryme Finance connects directly to your POS, inventory, and CRM — so every sale, purchase order, and expense is posted automatically. Close your month in hours, not days."
        iconSlot={<DollarSign className="w-8 h-8 text-white" />}
        accentColor="oklch(0.62 0.15 145)"
      />

      {/* Capabilities */}
      <section className="py-10 bg-surface-2 border-y border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {capabilities.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted"
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 1 — P&L Dashboard */}
      <FeatureSection
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
        {/* Mock: P&L snapshot */}
        <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2">
            <span className="text-xs font-semibold text-foreground">P&L — June 2025</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              Net profit +18%
            </span>
          </div>
          <div className="px-5 py-4 space-y-2">
            {[
              { label: "Gross Revenue", value: "$284,500", positive: true, bold: false },
              { label: "Cost of Goods Sold", value: "($142,200)", positive: false, bold: false },
              { label: "Gross Profit", value: "$142,300", positive: true, bold: true },
              { label: "Operating Expenses", value: "($61,400)", positive: false, bold: false },
              { label: "EBITDA", value: "$80,900", positive: true, bold: false },
              { label: "Depreciation & Amort.", value: "($4,200)", positive: false, bold: false },
              { label: "Net Profit", value: "$76,700", positive: true, bold: true },
            ].map(({ label, value, positive, bold }) => (
              <div
                key={label}
                className={`flex items-center justify-between px-2 py-1.5 rounded ${bold ? "bg-surface-2 border border-border" : ""}`}
              >
                <span className={`text-xs ${bold ? "font-semibold text-foreground" : "text-muted"}`}>{label}</span>
                <span className={`text-xs font-bold ${positive ? "text-emerald-500" : "text-red-400"} ${bold ? "text-sm" : ""}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {/* Feature 2 — Invoicing */}
      <FeatureSection
        eyebrow="Invoicing & AR"
        title="Get paid faster with smart invoicing"
        description="Create professional invoices in seconds, schedule automatic payment reminders, and track outstanding AR by customer age band. Integrates with Stripe and direct bank transfers."
        bullets={[
          { text: "Branded invoice templates with custom payment terms" },
          { text: "Auto-reminders at 7, 14, and 30 days past due" },
          { text: "Online payment portal — customers pay with card or bank transfer" },
          { text: "Aged receivables report with one-click chaser emails" },
        ]}
        reverse
        dark
      >
        {/* Mock: invoice list */}
        <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2">
            <span className="text-xs font-semibold text-foreground">Outstanding invoices</span>
            <span className="text-xs font-bold text-red-400">$48,200 overdue</span>
          </div>
          <div className="px-4 py-3 space-y-2">
            {[
              { id: "INV-1042", company: "Beacon Hardware", amount: "$18,400", due: "Overdue 12d", status: "overdue" },
              { id: "INV-1049", company: "Metro Supplies", amount: "$9,800", due: "Overdue 3d", status: "overdue" },
              { id: "INV-1051", company: "Crestline Foods", amount: "$22,100", due: "Due in 7d", status: "pending" },
              { id: "INV-1054", company: "Apex Wholesalers", amount: "$14,300", due: "Due in 14d", status: "pending" },
              { id: "INV-1038", company: "Riviera Retail", amount: "$31,600", due: "Paid Jul 1", status: "paid" },
            ].map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{inv.company}</p>
                  <p className="text-[10px] text-muted">{inv.id}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{inv.amount}</p>
                  <p
                    className={`text-[10px] font-semibold ${
                      inv.status === "overdue" ? "text-red-500" : inv.status === "pending" ? "text-amber-500" : "text-emerald-500"
                    }`}
                  >
                    {inv.due}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {/* Feature 3 — Expense management */}
      <FeatureSection
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
        {/* Mock: expense approval */}
        <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-surface-2">
            <span className="text-xs font-semibold text-foreground">Pending approvals</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            {[
              { name: "Sarah Chen", dept: "Sales", item: "Client lunch — Beacon Hardware", amount: "$142.00", category: "Entertainment" },
              { name: "Marcus Lee", dept: "Ops", item: "Warehouse supplies — Staples", amount: "$388.50", category: "Supplies" },
              { name: "Priya Nair", dept: "Finance", item: "Accounting software renewal", amount: "$1,200.00", category: "Software" },
            ].map((exp) => (
              <div key={exp.name} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{exp.item}</p>
                    <p className="text-[10px] text-muted">{exp.name} · {exp.dept} · {exp.category}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground shrink-0">{exp.amount}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 text-[11px] font-semibold rounded-md bg-emerald-500/10 text-emerald-500 py-1.5 hover:bg-emerald-500/20 transition-colors">
                    Approve
                  </button>
                  <button className="flex-1 text-[11px] font-semibold rounded-md bg-red-500/10 text-red-500 py-1.5 hover:bg-red-500/20 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {/* Deep features grid */}
      <section className="py-20 bg-surface-2 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Enterprise-grade accounting
            </p>
            <h2 className="text-3xl font-bold text-foreground text-balance">
              Trusted by finance teams at growing businesses
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Multi-currency", desc: "Transact in any currency. Exchange rates updated automatically from open banking feeds." },
              { title: "Tax Compliance", desc: "VAT, GST, and sales tax calculation with jurisdiction-aware rules. One-click tax returns." },
              { title: "Bank Reconciliation", desc: "Auto-match bank statement lines to posted transactions. Exceptions flagged for manual review." },
              { title: "Fixed Asset Register", desc: "Track equipment, vehicles, and property with auto-calculated depreciation schedules." },
              { title: "Intercompany Transactions", desc: "Post eliminations and intercompany charges across subsidiaries with consolidated reporting." },
              { title: "Audit Trail", desc: "Every entry is timestamped and user-attributed. Immutable audit log exportable for compliance." },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-6 hover:border-primary/40 transition-colors"
              >
                <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingCTA />
    </main>
  );
}
