import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("terms");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Terms of Service — Scryme Enterprise",
    fallbackDescription:
      "Review Scryme Technologies' Terms of Service governing access, licensing, and B2B portal usage.",
    canonicalPath: "/terms",
  });
}

export default async function TermsPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <SectionHeader
          eyebrow="Legal & Governance"
          title="Terms of Service"
          description="Last updated: October 2025"
          align="left"
        />

        <Card className="p-8 sm:p-10 space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By establishing an account, running our desktop POS applications, or integrating our B2B APIs, your organization agrees to be fully bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              2. Accounts & Platform Licenses
            </h2>
            <p className="mb-3">
              We grant your organization a non-exclusive, non-transferable, revocable license to access our cloud-hosted services and run terminal modules according to your active subscription plan.
            </p>
            <p>
              You are responsible for keeping all administrator credentials, session tokens, and M2M API keys securely managed.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              3. Service Level Agreement & Offline Capability
            </h2>
            <p>
              While Scryme&#39;s offline-first POS includes local database synchronization to sustain retail transactions without internet connectivity, cloud-hosted ledgers are subject to standard network availability with a 99.99% uptime target.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              4. Governing Law
            </h2>
            <p>
              These terms are governed by international B2B software compliance standards and relevant jurisdiction frameworks.
            </p>
          </section>
        </Card>
      </div>
    </main>
  );
}
