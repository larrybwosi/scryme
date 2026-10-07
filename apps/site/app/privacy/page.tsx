import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("privacy");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Privacy Policy — Scryme Enterprise",
    fallbackDescription:
      "Learn how Scryme Technologies handles and protects your organizational data, transactions, and user identity information.",
    canonicalPath: "/privacy",
  });
}

export default async function PrivacyPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <SectionHeader
          eyebrow="Data Protection & Privacy"
          title="Privacy Policy"
          description="Last updated: October 2025"
          align="left"
        />

        <Card className="p-8 sm:p-10 space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              1. Information We Collect
            </h2>
            <p className="mb-3">
              Scryme Technologies Ltd. (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects information required to provide, configure, and maintain our enterprise operating systems. This includes business accounts, operational records, transactional events, customer contact information, and audit trail logs.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              2. How We Use Your Data
            </h2>
            <p className="mb-3">
              All processed data is utilized strictly to execute commerce operations, resolve multi-branch database synchronization conflicts, perform workspace provisioning, and deliver integrated platform features.
            </p>
            <p>
              We do not sell or trade your enterprise or customer data to third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              3. Data Retention & Security
            </h2>
            <p>
              Operational records are stored securely in high-availability environments. Databases are backed up regularly, and sensitive credentials are encrypted using modern cryptographic standards.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              4. Contact Us
            </h2>
            <p>
              For privacy requests or compliance concerns, reach out to our team at{" "}
              <span className="text-[var(--brass)] font-semibold">privacy@scryme.tech</span>.
            </p>
          </section>
        </Card>
      </div>
    </main>
  );
}
