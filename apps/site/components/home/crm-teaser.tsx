import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { colors, fonts, modules } from "@/lib/scryme-tokens";

const accent = modules.find((m) => m.code === "CRM")!.accent;

const highlights = [
  "Visual sales pipeline with drag-and-drop staging",
  "Automated lead scoring and follow-up sequences",
  "360° customer profiles with full interaction history",
  "Email campaigns, segments, and A/B testing",
  "Every closed deal posts straight to the finance ledger",
];

function CRMKanban() {
  const columns = [
    {
      title: "Leads",
      intensity: 0.25,
      cards: [
        { name: "Arjun Mehta", company: "Vantage Corp", value: "$24K" },
        { name: "Sarah Okonkwo", company: "TerraLogix", value: "$18K" },
      ],
    },
    {
      title: "Qualified",
      intensity: 0.48,
      cards: [
        { name: "Elena Vasquez", company: "Meridian Grp.", value: "$47K" },
      ],
    },
    {
      title: "Proposal",
      intensity: 0.72,
      cards: [
        { name: "Nkechi Adeyemi", company: "Argent Ind.", value: "$95K" },
        { name: "Jake Thornton", company: "Kestrel LLC", value: "$63K" },
      ],
    },
    {
      title: "Won",
      intensity: 1,
      cards: [{ name: "Priya Sharma", company: "Solis Dist.", value: "$112K" }],
    },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${colors.inkLine}`,
        background: colors.inkPanelAlt,
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "#080D18",
          borderBottom: `1px solid ${colors.inkLine}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: accent }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: colors.textPrimary, fontFamily: fonts.body }}
          >
            Sales Pipeline
          </span>
        </div>
        <span
          className="text-xs"
          style={{ color: colors.textFaint, fontFamily: fonts.mono }}
        >
          Q4 2026
        </span>
      </div>

      <div className="flex gap-3 p-4 overflow-x-auto scrollbar-none">
        {columns.map((col) => (
          <div key={col.title} className="flex-1 min-w-[130px]">
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: `rgba(200,154,75,${col.intensity})` }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: colors.textPrimary, fontFamily: fonts.body }}
              >
                {col.title}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.cards.map((card) => (
                <div
                  key={card.name}
                  className="rounded-lg p-2.5"
                  style={{
                    background: colors.inkPanel,
                    border: `1px solid ${colors.inkLine}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: `rgba(200,154,75,${col.intensity})`,
                        color:
                          col.intensity > 0.6
                            ? colors.inkBg
                            : colors.textPrimary,
                        fontFamily: fonts.body,
                      }}
                    >
                      {card.name[0]}
                    </div>
                    <span
                      className="text-xs font-medium truncate"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: fonts.body,
                      }}
                    >
                      {card.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs truncate"
                      style={{
                        color: colors.textFaint,
                        fontFamily: fonts.body,
                      }}
                    >
                      {card.company}
                    </span>
                    <span
                      className="text-xs font-semibold shrink-0 ml-1"
                      style={{
                        color: colors.ledgerGreen,
                        fontFamily: fonts.mono,
                      }}
                    >
                      {card.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: `1px solid ${colors.inkLine}` }}
      >
        <span
          className="text-xs"
          style={{ color: colors.textFaint, fontFamily: fonts.mono }}
        >
          Pipeline total
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: colors.ledgerGreen, fontFamily: fonts.mono }}
        >
          $359,000
        </span>
      </div>
    </div>
  );
}

export function CRMTeaser() {
  return (
    <section
      className="py-24"
      style={{ background: colors.inkPanelAlt }}
      aria-labelledby="crm-teaser-heading"
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text left */}
          <div className="flex-1 max-w-lg">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{
                background: `${accent}1A`,
                border: `1px solid ${accent}55`,
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: accent, fontFamily: fonts.mono }}
              >
                CRM
              </span>
            </div>
            <h2
              id="crm-teaser-heading"
              className="text-3xl sm:text-4xl font-medium text-balance"
              style={{ color: colors.textPrimary, fontFamily: fonts.display }}
            >
              Close more deals with an intelligent sales pipeline
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              Scryme CRM gives your sales team complete visibility into every
              deal — from first contact to closed contract, with every won deal
              reconciled against the same ledger Finance reads from.
            </p>

            <ul className="mt-7 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: accent }}
                  />
                  <span
                    className="text-sm"
                    style={{
                      color: colors.textPrimary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/products/crm"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: accent,
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
            >
              Explore CRM
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Kanban right */}
          <div className="flex-1 w-full max-w-xl">
            <CRMKanban />
          </div>
        </div>
      </div>
    </section>
  );
}
