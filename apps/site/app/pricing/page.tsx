import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Minus, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Scryme",
  description:
    "Simple, transparent pricing for every stage of your business. Start free, scale as you grow.",
};

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    tagline: "For independent retailers getting started",
    cta: "Start free trial",
    href: "/signup",
    highlight: false,
    features: [
      "1 POS terminal",
      "1 store location",
      "Up to 500 SKUs",
      "Basic inventory tracking",
      "Daily sales reports",
      "Email support",
      null,
      null,
      null,
    ],
  },
  {
    name: "Growth",
    price: "$149",
    period: "/mo",
    tagline: "For growing businesses with multiple staff",
    cta: "Start free trial",
    href: "/signup",
    highlight: true,
    badge: "Most popular",
    features: [
      "Up to 5 POS terminals",
      "Up to 3 locations",
      "Unlimited SKUs",
      "Full inventory + transfers",
      "CRM — up to 2,500 contacts",
      "Finance module",
      "Demand forecasting",
      "Priority support",
      null,
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For large retailers and wholesale operations",
    cta: "Talk to sales",
    href: "/contact",
    highlight: false,
    features: [
      "Unlimited POS terminals",
      "Unlimited locations",
      "Unlimited SKUs",
      "Full inventory + transfers",
      "CRM — unlimited contacts",
      "Finance module",
      "Demand forecasting",
      "Dedicated success manager",
      "Custom SLA & onboarding",
    ],
  },
];

const comparisonRows = [
  { feature: "POS terminals", starter: "1", growth: "Up to 5", enterprise: "Unlimited" },
  { feature: "Store locations", starter: "1", growth: "Up to 3", enterprise: "Unlimited" },
  { feature: "SKU limit", starter: "500", growth: "Unlimited", enterprise: "Unlimited" },
  { feature: "CRM contacts", starter: false, growth: "2,500", enterprise: "Unlimited" },
  { feature: "Finance module", starter: false, growth: true, enterprise: true },
  { feature: "Demand forecasting", starter: false, growth: true, enterprise: true },
  { feature: "API access", starter: false, growth: true, enterprise: true },
  { feature: "Custom integrations", starter: false, growth: false, enterprise: true },
  { feature: "Dedicated CSM", starter: false, growth: false, enterprise: true },
  { feature: "Custom SLA", starter: false, growth: false, enterprise: true },
  { feature: "On-premise deployment", starter: false, growth: false, enterprise: true },
];

function CellValue({ value }: { value: string | boolean | null | undefined }) {
  if (value === false || value == null) {
    return <Minus className="w-4 h-4 text-muted mx-auto" />;
  }
  if (value === true) {
    return <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />;
  }
  return <span className="text-sm text-foreground">{value as string}</span>;
}

export default function PricingPage() {
  return (
    <main className="pt-24 pb-32">
      {/* Header */}
      <div className="mx-auto max-w-3xl px-6 text-center mb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Pricing
        </p>
        <h1 className="text-5xl font-bold text-foreground tracking-tight text-balance mb-5">
          Simple pricing. No surprises.
        </h1>
        <p className="text-lg text-muted text-pretty leading-relaxed">
          Every plan includes a 30-day free trial with full feature access. No credit card required.
        </p>
      </div>

      {/* Plans */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                plan.highlight
                  ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-border bg-surface-1"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted mb-1.5">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted">{plan.tagline}</p>
              </div>

              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border text-foreground hover:bg-surface-2"
                }`}
              >
                {plan.cta} {plan.highlight && <ArrowRight className="w-4 h-4" />}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feat, i) =>
                  feat ? (
                    <li key={i} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted">{feat}</span>
                    </li>
                  ) : (
                    <li key={i} className="flex items-center gap-2.5 opacity-30">
                      <Minus className="w-4 h-4 shrink-0 text-muted" />
                      <span className="text-sm text-muted">—</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="mx-auto max-w-6xl px-6 mt-24">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          Full feature comparison
        </h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 bg-surface-2 border-b border-border px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Feature</span>
            {["Starter", "Growth", "Enterprise"].map((p) => (
              <span key={p} className="text-xs font-semibold text-center text-foreground">
                {p}
              </span>
            ))}
          </div>
          {comparisonRows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-4 px-6 py-4 border-b border-border last:border-0 ${
                i % 2 === 0 ? "bg-background" : "bg-surface-1"
              }`}
            >
              <span className="text-sm text-muted">{row.feature}</span>
              <div className="text-center">
                <CellValue value={row.starter} />
              </div>
              <div className="text-center">
                <CellValue value={row.growth} />
              </div>
              <div className="text-center">
                <CellValue value={row.enterprise} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-6 mt-24">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-5">
          {[
            {
              q: "Can I change plans at any time?",
              a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing cycle.",
            },
            {
              q: "What happens after the 30-day trial?",
              a: "At the end of your trial, you choose a plan and enter payment details. If you decide not to continue, your data is retained for 60 days before deletion.",
            },
            {
              q: "Is there a setup or onboarding fee?",
              a: "No setup fees on Starter or Growth. Enterprise customers receive guided onboarding as part of their package at no extra cost.",
            },
            {
              q: "Can I run Scryme POS without an internet connection?",
              a: "Yes. The POS desktop app stores a full local copy of your data and syncs automatically when connectivity returns. There is no minimum uptime requirement.",
            },
            {
              q: "Do you offer discounts for annual billing?",
              a: "Yes — annual billing saves 20% compared to monthly. Contact sales or switch from your account settings after sign-up.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-surface-1 p-6">
              <p className="text-sm font-semibold text-foreground mb-2">{q}</p>
              <p className="text-sm text-muted leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
