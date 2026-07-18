"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { captureCtaClicked } from "@/lib/posthog-tracking";
import { colors, fonts } from "@/lib/scryme-tokens";

const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";

const highlights = [
  "No credit card required to start",
  "Full access to all modules",
  "Dedicated onboarding specialist",
  "99.9% uptime SLA guarantee",
];

const statement = [
  { label: "Businesses on Scryme", value: "4,200+" },
  { label: "Transactions processed daily", value: "$3.8M+" },
  { label: "Avg. revenue lift after 90 days", value: "+28%" },
  { label: "Customer satisfaction score", value: "4.9 / 5" },
];

export interface PricingCTAProps {
  title?: React.ReactNode;
  description?: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

export function PricingCTA({
  title,
  description,
  primaryCta,
  secondaryCta,
}: PricingCTAProps = {}) {
  const displayTitle = title || (
    <>
      The ledger grows <br className="hidden lg:block" />
      with your business
    </>
  );
  const displayDescription =
    description ||
    "Start your 30-day free trial. No complex setup — your first store is live in minutes. Upgrade, downgrade, or cancel at any time.";
  const displayPrimaryCta = primaryCta || { label: "View pricing", href: "/pricing" };
  const displaySecondaryCta = secondaryCta || { label: "Talk to sales", href: "/contact" };

  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{ background: colors.paper }}
    >
      {/* faint ledger rule texture, ink-on-paper */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(${colors.inkBg} 1px, transparent 1px)`,
          backgroundSize: "100% 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 flex flex-col lg:flex-row items-center gap-14">
        {/* Copy */}
        <div className="flex-1 text-center lg:text-left">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: colors.ledgerRust, fontFamily: fonts.mono }}
          >
            Closing statement
          </p>
          <h2
            className="text-4xl md:text-5xl font-medium leading-[1.1] text-balance mb-6"
            style={{ color: colors.inkBg, fontFamily: fonts.display }}
          >
            {displayTitle}
          </h2>
          <p
            className="text-lg max-w-lg mx-auto lg:mx-0 text-pretty leading-relaxed"
            style={{ color: "var(--pricing-cta-text-muted)", fontFamily: fonts.body }}
          >
            {displayDescription}
          </p>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--pricing-cta-text-body)", fontFamily: fonts.body }}
              >
                <CheckCircle
                  className="w-4 h-4 shrink-0"
                  style={{ color: colors.ledgerRust }}
                />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
            <Link
              href={displayPrimaryCta.href}
              className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: colors.inkBg,
                color: colors.paper,
                fontFamily: fonts.body,
              }}
              onClick={() =>
                captureCtaClicked("homepage_cta_clicked", {
                  location: "closing_statement",
                  cta_label: displayPrimaryCta.label,
                  destination: displayPrimaryCta.href,
                  cta_type: "primary",
                })
              }
            >
              {displayPrimaryCta.label} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`${webUrl}/sign-up`}
              className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-colors"
              style={{
                border: "1px solid var(--pricing-cta-border-dim)",
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
              onClick={() =>
                captureCtaClicked("homepage_cta_clicked", {
                  location: "closing_statement",
                  cta_label: displaySecondaryCta.label,
                  destination: `${webUrl}/sign-up`,
                  cta_type: "secondary",
                })
              }
            >
              {displaySecondaryCta.label}
            </Link>
          </div>
        </div>

        {/* Statement card */}
        <div className="flex-1 w-full max-w-md">
          <div
            className="rounded-lg p-8"
            style={{
              background: "var(--pricing-cta-card-bg)",
              border: "1px solid var(--pricing-cta-card-border)",
            }}
          >
            <div
              className="flex items-center justify-between pb-4 mb-5 border-b"
              style={{ borderColor: "var(--pricing-cta-card-border)" }}
            >
              <span
                className="text-[11px] uppercase tracking-widest"
                style={{ color: colors.ledgerRust, fontFamily: fonts.mono }}
              >
                Statement — YTD
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--pricing-cta-text-faint)", fontFamily: fonts.mono }}
              >
                {new Date().getFullYear()}
              </span>
            </div>
            <div className="space-y-4">
              {statement.map(({ label, value }) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span
                    className="text-sm shrink-0"
                    style={{
                      color: "var(--pricing-cta-text-muted-alt)",
                      fontFamily: fonts.body,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    className="flex-1 border-b border-dotted translate-y-[-3px]"
                    style={{ borderColor: "var(--pricing-cta-border-dim)" }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-lg font-semibold shrink-0 tabular-nums"
                    style={{ color: colors.inkBg, fontFamily: fonts.mono }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
