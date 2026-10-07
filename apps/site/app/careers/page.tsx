import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PricingCTA } from "@/components/home/pricing-cta";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";
import { ArrowRight, MapPin } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("careers");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Careers — Join Scryme Technologies",
    fallbackDescription:
      "Join Scryme Technologies and help us shape the next generation of offline-first POS systems and integrated enterprise B2B software.",
    canonicalPath: "/careers",
  });
}

const openRoles = [
  {
    title: "Senior Rust / Systems Engineer",
    team: "Core Platform Engine",
    location: "Accra / London (Hybrid / Remote)",
    desc: "Help us optimize local SQLite database sync engines and scale our multi-tenant distributed ledger cluster architectures.",
  },
  {
    title: "Senior Product Designer",
    team: "Product & Design System",
    location: "London / Remote",
    desc: "Design high-fidelity component patterns, desktop POS interfaces, and standardize interactive design tokens.",
  },
  {
    title: "Enterprise Solutions Architect",
    team: "Customer Success",
    location: "Global Remote",
    desc: "Guide mid-market wholesalers and retail franchises through workspace provisioning and data migration to our unified ledger platform.",
  },
];

export default async function CareersPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <SectionHeader
          eyebrow="Careers at Scryme"
          title="Build the Operating Ledger for Global Commerce"
          description="Scryme was founded to empower ambitious business operators with high-fidelity, resilient tools. We are a fast-growing team building reliable, offline-first architectures."
          align="center"
        />

        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6">Open Opportunities</h2>
          <div className="space-y-4">
            {openRoles.map((role) => (
              <Card key={role.title} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-foreground">{role.title}</h3>
                  <Badge variant="brass" size="sm">
                    <MapPin size={12} className="text-[var(--brass)]" />
                    {role.location}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground mb-3">
                  Team: {role.team}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                  {role.desc}
                </p>
                <Button variant="brass" size="sm" href="mailto:careers@scryme.tech" icon={<ArrowRight size={14} />}>
                  Apply for Role
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <PricingCTA
          title="Don't See a Direct Match?"
          description="We are always eager to connect with ambitious systems engineers, product designers, and commerce specialists."
          primaryCta={{
            label: "Send Spontaneous Application",
            href: "mailto:careers@scryme.tech",
          }}
          secondaryCta={{ label: "View Company Values", href: "/about" }}
        />
      </div>
    </main>
  );
}
