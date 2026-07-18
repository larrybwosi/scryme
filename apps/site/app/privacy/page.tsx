import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

export const metadata: Metadata = {
  title: "Privacy Policy — Scryme Enterprise",
  description:
    "Learn how Scryme Technologies handles and protects your organizational data, transactions, and user identity information.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main
      style={{ background: colors.inkBg }}
      className="min-h-screen py-24 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <Eyebrow>Legal & Compliance</Eyebrow>
        <h1
          className="mb-8 mt-4 text-4xl sm:text-5xl font-semibold"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Privacy Policy
        </h1>
        <p
          className="text-sm font-mono mb-12"
          style={{ color: colors.textFaint }}
        >
          Last updated: October 24, 2025
        </p>

        <div
          className="space-y-8 text-base leading-relaxed"
          style={{ color: colors.textMuted, fontFamily: fonts.body }}
        >
          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              1. Information We Collect
            </h2>
            <p className="mb-4">
              Scryme Technologies Ltd. (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects
              information required to provide, configure, and maintain our
              enterprise B2B operating systems. This includes business accounts,
              operational records, transactional events, customer contact
              information, employee schedules, and audit trail records.
            </p>
            <p>
              When user sessions are established under better-auth or OIDC
              structures like Zitadel, we process cryptographically secure
              session records, user emails, active organization IDs, and B2B
              customer identifiers.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              2. How We Use Your Data
            </h2>
            <p className="mb-4">
              All processed data is utilized strictly to run customer
              operations, resolve database synchronization conflicts using CRDT
              structures, perform automatic workspace provisioning, and deliver
              integrated platform features like point of sale (POS)
              offline-first sync.
            </p>
            <p>
              We do not sell, rent, or trade your enterprise or customer data to
              third-party advertisers. All telemetry data processed via Next.js
              routes is strictly anonymous or is routed cleanly with monitoring
              filters like Sentry and PostHog to maintain security.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              3. Data Retention & Hosting
            </h2>
            <p>
              Operational records and customer databases are stored securely in
              high-availability environments. B2B storefront database tables are
              backed up regularly, and sensitive credentials like encryption
              keys and secret hashes are kept securely isolated.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              4. Contact Us
            </h2>
            <p>
              For privacy requests or localized compliance concerns, please
              contact our legal and data protection team at{" "}
              <span style={{ color: colors.brass }}>privacy@scryme.tech</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
