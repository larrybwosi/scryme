import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { PricingCTA } from "@/components/home/pricing-cta";
import { PageBuilder } from "@/components/sections/page-builder";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("changelog");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Product Changelog — Scryme Updates",
    fallbackDescription:
      "Review recent changes, performance improvements, and security updates published to Scryme's core modules.",
    canonicalPath: "/changelog",
  });
}

const logs = [
  {
    version: "v3.11.2",
    date: "August 04, 2025",
    title: "better-auth Session Cookies & Next.js ESM Resolvers",
    highlights: [
      "Enforced secure UUID generation and cookie mappings for portal sessions.",
      "Resolved import subpath errors under next-env with Sanity.io CMS.",
      "Updated telemetry boundaries across NestJS error boundaries to propagate Sentry alerts with metadata tags.",
    ],
  },
];

export default async function ChangelogPage() {
  const cmsPage = await getCmsPage("changelog");
  if (cmsPage?.sections?.length) {
    return (
      <main id="main-content">
        <PageBuilder sections={cmsPage.sections} />
      </main>
    );
  }

  return (
    <main
      style={{ background: colors.inkBg }}
      className="min-h-screen py-24 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <Eyebrow>Product History</Eyebrow>
        <h1
          className="mb-8 mt-4 text-4xl sm:text-5xl font-semibold"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Product Changelog
        </h1>
        <p
          className="text-xl leading-relaxed mb-16"
          style={{ color: colors.textMuted }}
        >
          We ship improvements, optimizations, and security patches to the
          Scryme Operating Ledger. Explore our chronological platform updates.
        </p>

        <div className="space-y-12 mb-24">
          {logs.map((log) => (
            <div
              key={log.version}
              className="relative pl-8 border-l border-[rgba(241,233,216,0.1)]"
            >
              <span
                className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border bg-[#0B1220]"
                style={{ borderColor: colors.brass }}
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-[#C89A4B] bg-[rgba(200,154,75,0.1)] px-2.5 py-1 rounded">
                    {log.version}
                  </span>
                  <h2
                    className="text-xl font-bold mt-2 sm:inline-block sm:mt-0 sm:ml-3"
                    style={{ color: colors.paper, fontFamily: fonts.display }}
                  >
                    {log.title}
                  </h2>
                </div>
                <span
                  className="text-xs font-mono"
                  style={{ color: colors.textFaint }}
                >
                  {log.date}
                </span>
              </div>
              <ul
                className="list-disc pl-6 space-y-2 mt-4 text-sm leading-relaxed"
                style={{ color: colors.textMuted }}
              >
                {log.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <PricingCTA
          title="Consolidate Your Software Stack"
          description="Consolidate CRM, POS, Inventory, and Finance under a single billing account."
          primaryCta={{ label: "Start Free Trial", href: "/pricing" }}
          secondaryCta={{ label: "API Reference", href: "/api" }}
        />
      </div>
    </main>
  );
}
