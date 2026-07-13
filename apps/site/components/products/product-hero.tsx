import type { ReactNode } from "react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

interface Cta {
  label: string;
  href: string;
}

interface ProductHeroProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  /** Optional right-column visual (e.g. a ledger stub). Falls back to a centered layout without it. */
  visual?: ReactNode;
}

export function ProductHero({
  eyebrow,
  title,
  description,
  primaryCta = { label: "Start free trial", href: "#" },
  secondaryCta,
  visual,
}: ProductHeroProps) {
  return (
    <header
      className="relative overflow-hidden border-b py-24"
      style={{ borderColor: colors.inkLine, background: colors.inkBg }}
    >
      {/* faint ledger rule texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `repeating-linear-gradient(180deg, ${colors.inkLine} 0px, ${colors.inkLine} 1px, transparent 1px, transparent 64px)`,
        }}
      />

      <div
        className={`relative mx-auto max-w-6xl px-6 ${
          visual
            ? "grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]"
            : "max-w-3xl text-center"
        }`}
      >
        <div>
          <Eyebrow center={!visual}>{eyebrow}</Eyebrow>
          <h1
            className="mt-5 text-[2.4rem] leading-[1.06] sm:text-[3rem] lg:text-[3.6rem]"
            style={{
              fontFamily: fonts.display,
              fontWeight: 500,
              color: colors.paper,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>
          <p
            className={`mt-5 text-[16.5px] ${visual ? "max-w-[46ch]" : "mx-auto max-w-[50ch]"}`}
            style={{ color: colors.textMuted }}
          >
            {description}
          </p>
          <div
            className={`mt-8 flex flex-wrap items-center gap-4 ${visual ? "" : "justify-center"}`}
          >
            <a
              href={primaryCta.href}
              className="inline-block rounded-[2px] px-5 py-3 text-[13px] transition-transform hover:-translate-y-px"
              style={{
                fontFamily: fonts.mono,
                background: colors.brass,
                color: colors.inkBg,
              }}
            >
              {primaryCta.label} →
            </a>
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className="border-b px-1 py-3 text-[13px] transition-colors"
                style={{
                  fontFamily: fonts.mono,
                  color: colors.textMuted,
                  borderColor: colors.inkLine,
                }}
              >
                {secondaryCta.label}
              </a>
            )}
          </div>
        </div>

        {visual && <div>{visual}</div>}
      </div>
    </header>
  );
}
