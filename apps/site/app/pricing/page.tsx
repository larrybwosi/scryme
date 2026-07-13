import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { PricingPlans, type Plan } from "@/components/pricing/pricing-plans";
import {
  PricingComparison,
  type ComparisonRow,
} from "@/components/pricing/pricing-comparison";
import { PricingFaq, type FaqItem } from "@/components/pricing/pricing-faq";

export const metadata: Metadata = {
  title: "Pricing — Simple, Transparent Plans for Every Business",
  description:
    "Explore Scryme pricing plans. Start with a 30-day free trial. Scale from independent retail to enterprise wholesale with our flexible CRM, POS, and Inventory modules.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing — Scryme",
    description:
      "Simple, transparent pricing for every stage of your business. Start free, scale as you grow.",
    url: "https://scryme.co/pricing",
  },
};

const plans: Plan[] = [
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

const comparisonRows: ComparisonRow[] = [
  {
    feature: "POS terminals",
    starter: "1",
    growth: "Up to 5",
    enterprise: "Unlimited",
  },
  {
    feature: "Store locations",
    starter: "1",
    growth: "Up to 3",
    enterprise: "Unlimited",
  },
  {
    feature: "SKU limit",
    starter: "500",
    growth: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "CRM contacts",
    starter: false,
    growth: "2,500",
    enterprise: "Unlimited",
  },
  { feature: "Finance module", starter: false, growth: true, enterprise: true },
  {
    feature: "Demand forecasting",
    starter: false,
    growth: true,
    enterprise: true,
  },
  { feature: "API access", starter: false, growth: true, enterprise: true },
  {
    feature: "Custom integrations",
    starter: false,
    growth: false,
    enterprise: true,
  },
  { feature: "Dedicated CSM", starter: false, growth: false, enterprise: true },
  { feature: "Custom SLA", starter: false, growth: false, enterprise: true },
  {
    feature: "On-premise deployment",
    starter: false,
    growth: false,
    enterprise: true,
  },
];

const faqItems: FaqItem[] = [
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
];

export default function PricingPage() {
  return (
    <main className="pb-32 pt-24" style={{ background: colors.inkBg }}>
      {/* Header */}
      <div className="mx-auto mb-16 max-w-3xl px-6 text-center">
        <Eyebrow center>Pricing</Eyebrow>
        <h1
          className="mb-5 mt-4 text-[2.6rem] leading-[1.08] sm:text-5xl"
          style={{
            fontFamily: fonts.display,
            color: colors.paper,
            letterSpacing: "-0.01em",
          }}
        >
          Simple pricing. No surprises.
        </h1>
        <p
          className="text-lg leading-relaxed"
          style={{ color: colors.textMuted }}
        >
          Every plan includes a 30-day free trial with full feature access. No
          credit card required.
        </p>
      </div>

      <PricingPlans plans={plans} />

      {/* Comparison table */}
      <div className="mx-auto mt-24 max-w-6xl px-6">
        <h2
          className="mb-10 text-center text-2xl"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Full feature comparison
        </h2>
      </div>
      <PricingComparison rows={comparisonRows} />

      {/* FAQ */}
      <div className="mx-auto mt-24 max-w-3xl px-6">
        <h2
          className="mb-10 text-center text-2xl"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Frequently asked questions
        </h2>
      </div>
      <PricingFaq items={faqItems} />
    </main>
  );
}
