import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Documentation — Scryme Operating System",
  description:
    "Read our comprehensive documentation covering workspace configuration, offline database sync, Zitadel OIDC configurations, and terminal hardware setups.",
  alternates: {
    canonical: "/docs",
  },
};

const docSections = [
  {
    title: "1. Workspace Onboarding",
    items: [
      {
        name: "Getting Started with the Hub",
        desc: "Initialize your workspace, declare warehouse locations, and map active business branches.",
      },
      {
        name: "Zitadel SSO Configuration",
        desc: "Integrate corporate identity providers and set up customized role-based access control.",
      },
    ],
  },
  {
    title: "2. Terminal & POS Deployments",
    items: [
      {
        name: "Tauri Desktop App Installation",
        desc: "Download and provision local terminal databases on Windows, macOS, or Linux hardware.",
      },
      {
        name: "CRDT Offline Reconciliation",
        desc: "Learn how Scryme's local replication engines auto-resolve checkout conflicts when reconnecting.",
      },
    ],
  },
  {
    title: "3. Finance & Invoicing",
    items: [
      {
        name: "Syncing the General Ledger",
        desc: "Establish ledger links so sales, workforce timesheets, and supply costs write to one table.",
      },
      {
        name: "Setting up B2B Portals",
        desc: "Invite corporate buyers, define catalog visibility rules, and configure terms-of-payment options.",
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <main
      style={{ background: colors.inkBg }}
      className="min-h-screen py-24 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <Eyebrow>Developer & Admin Center</Eyebrow>
        <h1
          className="mb-8 mt-4 text-4xl sm:text-5xl font-semibold"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Scryme Platform Documentation
        </h1>
        <p
          className="text-xl leading-relaxed mb-16"
          style={{ color: colors.textMuted }}
        >
          Complete step-by-step documentation for enterprise managers, system
          administrators, and systems integrators running the Scryme Operating
          Ledger.
        </p>

        <div className="space-y-12 mb-24">
          {docSections.map((section) => (
            <div key={section.title}>
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: colors.paper, fontFamily: fonts.display }}
              >
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    className="p-6 rounded-lg border hover:bg-[rgba(241,233,216,0.01)] transition-colors"
                    style={{
                      background: colors.inkPanel,
                      borderColor: colors.inkLine,
                    }}
                  >
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: fonts.body,
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: colors.textMuted }}
                    >
                      {item.desc}
                    </p>
                    <a
                      href="#"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: colors.brass, fontFamily: fonts.mono }}
                    >
                      Read article →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <PricingCTA
          title="Looking for the API?"
          description="Build custom programmatic loops with our standard OpenAPI endpoints. Fully typed and generated with Orval SDKs."
          primaryCta={{ label: "View API Reference", href: "/api" }}
          secondaryCta={{
            label: "Explore Integrations",
            href: "/integrations",
          }}
        />
      </div>
    </main>
  );
}
