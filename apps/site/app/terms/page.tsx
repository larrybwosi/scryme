import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

export const metadata: Metadata = {
  title: "Terms of Service — Scryme Enterprise",
  description:
    "Review Scryme Technologies' Terms of Service governing access, licensing, and B2B portal usage.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
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
          Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p>
              By establishing an account, running our Tauri-based desktop POS,
              or integrating our B2B APIs, your organization agrees to be fully
              bound by these Terms of Service. If you do not agree, please do
              not access or use the Scryme operating platform.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              2. Accounts & Platform Licenses
            </h2>
            <p className="mb-4">
              We grant your organization a non-exclusive, non-transferable,
              revocable license to access our cloud-hosted services and run
              terminal modules according to your active subscription plan.
            </p>
            <p>
              You are responsible for keeping all administrator credentials,
              Zitadel SSO client secrets, better-auth session tokens, and
              webhook URLs securely managed. Unauthorized bypass attempts may
              result in immediate account termination.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              3. Service Level Agreement & Offline Capability
            </h2>
            <p>
              While Scryme&#39s offline-first POS includes CRDT database
              synchronization to sustain local retail transactions without
              internet connectivity, cloud-hosted ledgers are subject to
              standard network availability. We strive for a 99.9% uptime metric
              for enterprise core modules.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              4. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the
              laws of Ghana and relevant international B2B software compliance
              standards.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
