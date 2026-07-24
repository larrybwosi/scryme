import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { PricingComparison } from "@/components/pricing/pricing-comparison";
import { PricingFaq } from "@/components/pricing/pricing-faq";
import { getPricingPageContent } from "../../lib/sanity";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Pricing — Simple, Transparent Plans to Scale Your Business",
  description:
    "Explore Scryme pricing plans. Scale from independent retail to enterprise multi-branch operations with our integrated POS, custom storefront websites, and advanced stock tracking.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing — Scryme",
    description:
      "Simple, transparent pricing designed to enhance your performance and scale your business.",
    url: "https://scryme.tech/pricing",
  },
};

export default async function PricingPage() {
  const content = await getPricingPageContent();

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
          {content.heroTitle}
        </h1>
        <p
          className="text-lg leading-relaxed"
          style={{ color: colors.textMuted }}
        >
          {content.heroSubtitle}
        </p>
      </div>

      <PricingPlans plans={content.plans} />

      {/* Comparison table */}
      <div className="mx-auto mt-24 max-w-6xl px-6">
        <h2
          className="mb-10 text-center text-2xl"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Full feature comparison
        </h2>
      </div>
      <PricingComparison rows={content.comparisonRows} />

      {/* FAQ */}
      <div className="mx-auto mt-24 max-w-3xl px-6">
        <h2
          className="mb-10 text-center text-2xl"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Frequently asked questions
        </h2>
      </div>
      <PricingFaq items={content.faqItems} />
    </main>
  );
}
