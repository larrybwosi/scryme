import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";
import { ShieldCheck, Lock, Key, Server } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("security");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Platform Security — Scryme Enterprise",
    fallbackDescription:
      "Learn how Scryme Technologies protects transactions, sessions, and offline-first terminal databases.",
    canonicalPath: "/security",
  });
}

const securityPillars = [
  {
    title: "1. B2B Authentication & Tenant Scoping",
    desc: "Scryme enforces strict identity isolation at the database level. All tenant API calls validate organizational scopes and membership claims prior to executing mutations.",
    icon: Key,
  },
  {
    title: "2. End-to-End Encryption Standards",
    desc: "Data in transit is strictly enforced via TLS 1.3. Databases at rest and local offline POS terminals utilize AES-256 encryption keys.",
    icon: Lock,
  },
  {
    title: "3. Cryptographic Webhook Signing",
    desc: "All outbound webhook streams and system alerts are signed using HMAC secrets to eliminate spoofing and replay attacks.",
    icon: Server,
  },
  {
    title: "4. Continuous Monitoring & Uptime",
    desc: "24/7 automated monitoring tracks ledger health, latency spikes, and security anomalies in real time.",
    icon: ShieldCheck,
  },
];

export default async function SecurityPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <SectionHeader
          eyebrow="Platform Integrity"
          title="Enterprise Security Architecture"
          description="How Scryme safeguards multi-tenant commerce, payment transactions, and terminal data."
          align="left"
        />

        <div className="space-y-6">
          {securityPillars.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--brass-dim)] border border-[var(--brass-line)] text-[var(--brass)] flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{p.title}</h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-13">
                  {p.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
