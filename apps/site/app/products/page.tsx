import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { colors, fonts, modules as defaultModules } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { PricingCTA } from "@/components/home/pricing-cta";
import { getHomePageContent } from "../../lib/sanity";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Scale Suite — High-Performance Business Modules",
  description:
    "Explore Scryme's suite of integrated operational modules: Custom Storefronts, Point of Sale, Stock & Inventory, Central Management, Multi-Branch Workforce, and Performance Analytics.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Scryme Modules — High-Performance Suite",
    description:
      "Integrated POS, multi-branch syncing, advanced stock control, and automated client storefront websites.",
    url: "https://scryme.tech/products",
  },
};

export default async function ProductsPage() {
  const content = await getHomePageContent();
  const modulesList = content.modules && content.modules.length > 0 ? content.modules : defaultModules;

  return (
    <main style={{ background: colors.inkBg }} className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b pb-20 pt-32"
        style={{ borderColor: colors.inkLine }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: `repeating-linear-gradient(180deg, ${colors.inkLine} 0px, ${colors.inkLine} 1px, transparent 1px, transparent 64px)`,
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <Eyebrow center>Unified Modules</Eyebrow>
          <h1
            className="mb-7 mt-5 text-[2.6rem] leading-[1.08] sm:text-6xl"
            style={{
              fontFamily: fonts.display,
              color: colors.paper,
              letterSpacing: "-0.01em",
            }}
          >
            One engine.{" "}
            <em className="not-italic text-[#C89A4B]">Six core channels.</em>{" "}
            Infinite scale.
          </h1>
          <p
            className="mx-auto max-w-2xl text-xl leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            Scryme is built to deliver massive operational performance. We integrate e-commerce client storefronts, offline point-of-sale registers, and advanced multi-branch stock control into a single real-time synchronization system.
          </p>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modulesList.map((m) => (
            <div
              key={m.code}
              className="p-8 rounded-xl transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between"
              style={{
                background: colors.inkPanel,
                border: `1px solid ${colors.inkLine}`,
              }}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${m.accent}1A` }}
                  >
                    <span
                      className="text-xs font-semibold tracking-wider"
                      style={{ color: m.accent, fontFamily: fonts.mono }}
                    >
                      {m.code}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-semibold"
                    style={{
                      color: colors.textPrimary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {m.name}
                  </h3>
                </div>
                <p
                  className="text-sm leading-relaxed mb-8"
                  style={{ color: colors.textMuted, fontFamily: fonts.body }}
                >
                  {m.description}
                </p>
              </div>

              <Link
                href={m.href}
                className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: colors.brass, fontFamily: fonts.mono }}
              >
                Explore {m.code} Module
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <div id="pricing">
        <PricingCTA
          title="Ready to consolidate your stack?"
          description="Consolidate CRM, POS, Inventory, and Finance under a single billing account and a single source of truth."
          primaryCta={{ label: "Start free trial", href: "/pricing" }}
          secondaryCta={{ label: "Get started", href: "/contact" }}
        />
      </div>
    </main>
  );
}
