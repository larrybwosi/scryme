import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingCTA } from "@/components/home/pricing-cta";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";
import { ArrowRight, Puzzle, Workflow, Zap } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("integrations");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Integrations — Connect Your Ecosystem",
    fallbackDescription:
      "Connect Scryme Technologies with other external services and automation flows.",
    canonicalPath: "/integrations",
  });
}

const integrations = [
  {
    name: "Windmill Automated Flows",
    category: "Automation",
    desc: "Trigger custom operations, automated tasks, and synchronization engines natively through Windmill orchestration.",
    icon: Workflow,
  },
  {
    name: "RabbitMQ Message Streams",
    category: "Communication",
    desc: "Subscribe to RabbitMQ event brokers for point of sale receipts, stock alerts, and webhook notifications.",
    icon: Zap,
  },
  {
    name: "Scryme Chat & Messaging",
    category: "Collaboration",
    desc: "Unify department channels, message webhooks, and team communication through our secure M2M API clients.",
    icon: Puzzle,
  },
];

export default async function IntegrationsPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <SectionHeader
          eyebrow="Consolidated Platform"
          title="Built-In Platform Integrations"
          description="Scryme was designed to operate as a central ledger inside your broader technology infrastructure. Leverage native, verified integrations with enterprise identity, message queues, and execution runtimes."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.name} className="flex flex-col justify-between p-6">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[var(--brass-dim)] border border-[var(--brass-line)] text-[var(--brass)] flex items-center justify-center mb-4">
                    <Icon size={18} />
                  </div>
                  <Badge variant="brass" size="sm" className="mb-3">
                    {item.category}
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--brass)] hover:underline"
                >
                  <span>Configuration Guide</span>
                  <ArrowRight size={12} />
                </Link>
              </Card>
            );
          })}
        </div>

        <PricingCTA
          title="Consolidate Your Ecosystem"
          description="Build custom connections using standard webhook listeners or export to raw formats dynamically."
          primaryCta={{ label: "View API Reference", href: "/api" }}
          secondaryCta={{ label: "Platform Documentation", href: "/docs" }}
        />
      </div>
    </main>
  );
}
