import type { Metadata } from "next";
import Link from "next/link";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { PricingCTA } from "@/components/home/pricing-cta";
import { PageBuilder } from "@/components/sections/page-builder";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("integrations");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Integrations — Connect Your Ecosystem",
    fallbackDescription:
      "Connect Scryme Technologies with other external services.",
    canonicalPath: "/integrations",
  });
}

const integrations = [
  {
    name: "Windmill Automated Flows",
    category: "Automation",
    desc: "Trigger custom operations, automated tasks, and synchronization engines natively through Windmill orchestration.",
  },
  {
    name: "RabbitMQ Message Streams",
    category: "Communication",
    desc: "Subscribe to RabbitMQ event brokers for point of sale receipts, stock alerts, and webhook notifications.",
  },
  {
    name: "Scryme Chat & Messaging",
    category: "Collaboration",
    desc: "Unify department channels, message webhooks, and team communication through our secure M2M API clients.",
  },
];

export default async function IntegrationsPage() {
  const cmsPage = await getCmsPage("integrations");
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
        <Eyebrow>Consolidated Platform</Eyebrow>
        <h1
          className="mb-8 mt-4 text-4xl sm:text-5xl font-semibold"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Built-in Integrations
        </h1>
        <p
          className="text-xl leading-relaxed mb-16"
          style={{ color: colors.textMuted }}
        >
          Scryme was designed to operate as a central ledger inside your broader
          technology infrastructure. Leverage native, verified integrations with
          enterprise identity, message queues, and execution runtimes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {integrations.map((i) => (
            <div
              key={i.name}
              className="p-8 rounded-xl border flex flex-col justify-between hover:bg-[rgba(241,233,216,0.01)] transition-colors"
              style={{
                background: colors.inkPanel,
                borderColor: colors.inkLine,
              }}
            >
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase mb-3 block text-[#C89A4B]">
                  {i.category}
                </span>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: colors.textPrimary, fontFamily: fonts.body }}
                >
                  {i.name}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: colors.textMuted }}
                >
                  {i.desc}
                </p>
              </div>
              <Link
                href="/docs"
                className="text-xs font-semibold hover:underline font-mono text-[#C89A4B]"
              >
                Configuration Guide →
              </Link>
            </div>
          ))}
        </div>

        <PricingCTA
          title="Consolidate Your Operations"
          description="Build custom connections using standard webhook listeners or export to raw formats dynamically."
          primaryCta={{ label: "View API Reference", href: "/api" }}
          secondaryCta={{ label: "Platform Documentation", href: "/docs" }}
        />
      </div>
    </main>
  );
}
