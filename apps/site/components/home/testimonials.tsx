"use client";

import { colors, fonts } from "@/lib/scryme-tokens";

const testimonials = [
  {
    quote:
      "Scryme replaced four separate systems we were running. Our operations team now has a single dashboard for everything — inventory, POS, CRM, and finance. The ROI in the first quarter alone paid for the full-year subscription.",
    name: "Amara Diallo",
    title: "Chief Operating Officer",
    company: "Fontaine Group",
    ticker: "FTN",
    initials: "AD",
  },
  {
    quote:
      "We run 23 retail branches across three regions. Before Scryme, reconciling end-of-day sales was a half-day job. Now it takes minutes. The multi-branch inventory visibility alone is a game changer.",
    name: "Marcus Chen",
    title: "Head of Retail Operations",
    company: "Westfield Retail Holdings",
    ticker: "WRH",
    initials: "MC",
  },
  {
    quote:
      "The CRM pipeline gave our sales team a new level of accountability. We went from guessing what was in the pipeline to having real-time data on every deal. Deal velocity improved 40% in our first six months.",
    name: "Sophia Hargreaves",
    title: "VP of Sales",
    company: "Meridian Corp",
    ticker: "MRD",
    initials: "SH",
  },
];

export function Testimonials() {
  return (
    <section
      className="py-24"
      style={{ background: colors.inkBg }}
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: colors.brass, fontFamily: fonts.mono }}
          >
            On the record
          </span>
          <h2
            id="testimonials-heading"
            className="mt-3 text-3xl sm:text-4xl font-medium text-balance"
            style={{ color: colors.textPrimary, fontFamily: fonts.display }}
          >
            Trusted by industry leaders
          </h2>
          <p
            className="mt-4 text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            Businesses across retail, wholesale, and distribution rely on Scryme
            every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="group rounded-xl p-7 flex flex-col transition-colors duration-300"
              style={{
                background: colors.inkPanelAlt,
                border: `1px solid ${colors.inkLine}`,
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-[28px] leading-none"
                  style={{
                    color: colors.brass,
                    fontFamily: fonts.display,
                    fontStyle: "italic",
                  }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded tracking-wider"
                  style={{
                    color: colors.brass,
                    background: colors.brassDim,
                    fontFamily: fonts.mono,
                  }}
                >
                  {t.ticker}
                </span>
              </div>

              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: colors.textMuted, fontFamily: fonts.body }}
              >
                {t.quote}
              </p>

              <footer
                className="mt-6 flex items-center gap-3 pt-5 border-t"
                style={{ borderColor: colors.inkLine }}
              >
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{
                    color: colors.brass,
                    border: `1px solid ${colors.brassLine}`,
                    fontFamily: fonts.mono,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <cite
                    className="not-italic text-sm font-semibold block"
                    style={{
                      color: colors.textPrimary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {t.name}
                  </cite>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: colors.textFaint, fontFamily: fonts.body }}
                  >
                    {t.title}, {t.company}
                  </div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
