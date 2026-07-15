import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { captureCtaClicked } from "@/lib/posthog-tracking";
import { colors, fonts } from "@/lib/scryme-tokens";

export interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  cta: string;
  href: string;
  highlight: boolean;
  badge?: string;
  features: (string | null)[];
}

export function PricingPlans({ plans }: { plans: Plan[] }) {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="relative flex flex-col gap-6 rounded-md border p-8"
            style={{
              borderColor: plan.highlight ? colors.brassLine : colors.inkLine,
              background: plan.highlight ? colors.brassDim : colors.inkPanel,
              boxShadow: plan.highlight
                ? "0 24px 48px -24px rgba(200,154,75,0.25)"
                : "none",
            }}
          >
            {plan.badge && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-3 py-1 text-[10.5px] tracking-[0.04em]"
                style={{
                  fontFamily: fonts.mono,
                  background: colors.brass,
                  borderColor: colors.brass,
                  color: colors.inkBg,
                }}
              >
                {plan.badge.toUpperCase()}
              </span>
            )}

            <div>
              <p
                className="mb-2.5 text-[11px] uppercase tracking-[0.14em]"
                style={{ fontFamily: fonts.mono, color: colors.brass }}
              >
                {plan.name}
              </p>
              <div className="mb-2 flex items-end gap-1.5">
                <span
                  className="text-4xl"
                  style={{ fontFamily: fonts.display, color: colors.paper }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className="mb-1.5 text-sm"
                    style={{ color: colors.textFaint }}
                  >
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {plan.tagline}
              </p>
            </div>

            <Link
              href={plan.href}
              className="inline-flex items-center justify-center gap-2 rounded-[2px] px-5 py-3 text-[13px] transition-transform hover:-translate-y-px"
              style={{
                fontFamily: fonts.mono,
                background: plan.highlight ? colors.brass : "transparent",
                border: plan.highlight ? "none" : `1px solid ${colors.inkLine}`,
                color: plan.highlight ? colors.inkBg : colors.textPrimary,
              }}
              onClick={() =>
                captureCtaClicked("pricing_plan_cta_clicked", {
                  location: "pricing_grid",
                  cta_label: plan.cta,
                  destination: plan.href,
                  cta_type: "plan",
                  plan_name: plan.name,
                })
              }
            >
              {plan.cta}
              {plan.highlight && <ArrowRight className="h-3.5 w-3.5" />}
            </Link>

            <ul
              className="flex flex-col gap-3 border-t pt-1"
              style={{ borderColor: colors.inkLine }}
            >
              {plan.features.map((feat, i) =>
                feat ? (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 pt-2 text-[13.5px]"
                    style={{ color: colors.textMuted }}
                  >
                    <span
                      className="mt-0.5 text-xs"
                      style={{ fontFamily: fonts.mono, color: colors.brass }}
                    >
                      §
                    </span>
                    {feat}
                  </li>
                ) : (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 pt-2 text-[13.5px]"
                    style={{ color: colors.textFaint }}
                  >
                    <span
                      className="mt-0.5 text-xs"
                      style={{ fontFamily: fonts.mono }}
                    >
                      —
                    </span>
                    not included
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
