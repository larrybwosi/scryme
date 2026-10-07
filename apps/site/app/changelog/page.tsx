import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { PricingCTA } from "@/components/home/pricing-cta";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";
import { Sparkles } from "lucide-react";

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
    date: "August 2025",
    title: "Session Authentication & High-Performance ESM Resolvers",
    highlights: [
      "Enforced secure UUID generation and cookie mappings for portal sessions.",
      "Resolved import subpath errors under next-env with Sanity.io CMS.",
      "Updated telemetry boundaries across NestJS error boundaries to propagate Sentry alerts with metadata tags.",
    ],
  },
];

export default async function ChangelogPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <SectionHeader
          eyebrow="Release History"
          title="Product Changelog"
          description="Continuous updates, performance enhancements, and security releases published across the Scryme platform."
          align="left"
        />

        <div className="relative border-l-2 border-border/80 pl-6 space-y-10 mb-20 ml-2">
          {logs.map((log) => (
            <div key={log.version} className="relative">
              <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[var(--brass)] border-4 border-background" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="brass" size="sm">
                    <Sparkles size={12} className="text-[var(--brass)]" />
                    {log.version}
                  </Badge>
                  <h2 className="text-lg font-bold text-foreground">
                    {log.title}
                  </h2>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{log.date}</span>
              </div>

              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {log.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <PricingCTA
          title="Stay Updated With Modern Commerce"
          description="Consolidate CRM, POS, Inventory, and Finance under a single operating platform."
          primaryCta={{ label: "Start Free Trial", href: "/pricing" }}
          secondaryCta={{ label: "Platform Documentation", href: "/docs" }}
        />
      </div>
    </main>
  );
}
