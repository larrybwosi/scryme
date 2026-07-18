import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

export const metadata: Metadata = {
  title: "Platform Security — Scryme Enterprise",
  description:
    "Learn how Scryme Technologies protects B2B transactions, OIDC sessions, Zitadel integrations, and offline-first terminal databases.",
  alternates: {
    canonical: "/security",
  },
};

export default function SecurityPage() {
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
          Platform Security
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
              1. B2B Authentication & SSO
            </h2>
            <p>
              Scryme enforces strict identity separation at the tenant level.
              All authentication is managed via Zitadel SSO OIDC redirects or
              secure local session tokens processed directly into our isolated
              PostgreSQL database. Standard organizational scopes (like{" "}
              <code>org_info</code> and <code>membership</code>) safeguard all
              API actions.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              2. Data Encryption
            </h2>
            <p className="mb-4">
              Our B2B platform incorporates military-grade encryption practices
              across all layers of operations:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <strong>Data in Transit:</strong> All web, desktop, and API
                communication is strictly forced over TLS 1.3 protocol.
              </li>
              <li>
                <strong>Data at Rest:</strong> Database rows containing
                sensitive tokens, passwords, or transaction records are
                encrypted using AES-256 keys.
              </li>
              <li>
                <strong>Tauri-based POS local storage:</strong> Offline-first
                databases operating locally are encrypted and locked using host
                credentials.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              3. Secure Webhook Delivery
            </h2>
            <p>
              When Scryme triggers notifications, approvals, or channel events
              to Slack or third-party webhooks, payload schemas are
              cryptographically signed using shared secrets. This prevents
              webhook spoofing and replay attacks.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              4. Reporting Vulnerabilities
            </h2>
            <p>
              If your security researchers identify any platform
              vulnerabilities, please submit detailed reproduction reports
              directly to our response desk at{" "}
              <span style={{ color: colors.brass }}>security@scryme.tech</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
