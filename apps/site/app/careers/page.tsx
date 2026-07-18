import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Careers — Join Scryme Technologies",
  description:
    "Join Scryme Technologies and help us shape the next generation of offline-first POS systems and integrated enterprise B2B software.",
  alternates: {
    canonical: "/careers",
  },
};

const openRoles = [
  {
    title: "Senior Rust / Systems Engineer",
    team: "Core Platform",
    location: "Accra, Ghana (Hybrid) / London, UK (Remote)",
    desc: "Help us optimize our local database synchronization engines and scale our multi-tenant Zitadel / better-auth cluster architectures.",
  },
  {
    title: "Senior Product Designer",
    team: "Product & UI",
    location: "London, UK / Remote",
    desc: "Establish high-fidelity dark ledger-ink theme patterns and help standardize interactive widgets for our CRM and POS suites.",
  },
  {
    title: "Enterprise Solutions Architect",
    team: "Customer Success",
    location: "Global Remote",
    desc: "Guide mid-market wholesalers and retail franchises through workspace provisioning and data migration to our unified ledger platform.",
  },
];

export default function CareersPage() {
  return (
    <main
      style={{ background: colors.inkBg }}
      className="min-h-screen py-24 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <Eyebrow>Join the Team</Eyebrow>
        <h1
          className="mb-8 mt-4 text-4xl sm:text-5xl font-semibold"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Build the operating system for global operations
        </h1>
        <p
          className="text-xl leading-relaxed mb-16"
          style={{ color: colors.textMuted }}
        >
          Scryme was founded to empower independent businesses with
          high-fidelity operational tools. We are a fast-growing, product-led
          team building reliable, offline-first architectures. If you love
          deep-tech engineering and real-world operations, check out our open
          roles below.
        </p>

        <h2
          className="text-2xl font-bold mb-8"
          style={{ color: colors.paper, fontFamily: fonts.display }}
        >
          Open Positions
        </h2>

        <div className="space-y-6 mb-24">
          {openRoles.map((role) => (
            <div
              key={role.title}
              className="p-6 rounded-lg border transition-all hover:bg-[rgba(241,233,216,0.02)]"
              style={{
                background: colors.inkPanel,
                borderColor: colors.inkLine,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: colors.textPrimary, fontFamily: fonts.body }}
                >
                  {role.title}
                </h3>
                <span
                  className="text-xs font-mono px-2.5 py-1 rounded bg-[#0E1626] border"
                  style={{ color: colors.brass, borderColor: colors.inkLine }}
                >
                  {role.location}
                </span>
              </div>
              <p
                className="text-sm font-mono mb-4"
                style={{ color: colors.textFaint }}
              >
                Department: {role.team}
              </p>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: colors.textMuted }}
              >
                {role.desc}
              </p>
              <a
                href="mailto:careers@scryme.tech"
                className="inline-block text-xs font-semibold hover:underline"
                style={{ color: colors.brass, fontFamily: fonts.mono }}
              >
                Apply for this position →
              </a>
            </div>
          ))}
        </div>

        <PricingCTA
          title="Don't see a role that fits?"
          description="We are always looking for ambitious engineers, product thinkers, and operators. Send us your resume and a short note."
          primaryCta={{
            label: "Send spontaneous application",
            href: "mailto:careers@scryme.tech",
          }}
          secondaryCta={{ label: "View values", href: "/about" }}
        />
      </div>
    </main>
  );
}
