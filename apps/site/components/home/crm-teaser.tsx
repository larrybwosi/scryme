import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { colors, fonts, modules } from "@/lib/scryme-tokens";

const accent = modules.find((m) => m.code === "CRM")!.accent;

const highlights = [
  "Stunning consumer-facing storefront websites built instantly",
  "Real-time catalog, pricing, and stock sync with your central database",
  "Integrated CRM to capture customer emails and purchase histories",
  "Flexible e-commerce layouts optimized for conversion and speed",
  "Every order posts directly to central inventory and billing ledgers",
];

function CRMKanban() {
  const columns = [
    {
      title: "Store Drafts",
      intensity: 0.25,
      cards: [
        { name: "Westfield Storefront", company: "Premium Theme", value: "Active" },
        { name: "TerraLogix B2B Portal", company: "Wholesale Layout", value: "Review" },
      ],
    },
    {
      title: "Syncing Catalog",
      intensity: 0.48,
      cards: [
        { name: "Meridian Storefront", company: "Modern Dark", value: "Syncing" },
      ],
    },
    {
      title: "Live Storefronts",
      intensity: 0.72,
      cards: [
        { name: "Argent Direct", company: "Clean Light", value: "Live" },
        { name: "Kestrel Outlet", company: "Sleek Mono", value: "Live" },
      ],
    },
    {
      title: "Orders Flowing",
      intensity: 1,
      cards: [{ name: "Solis Shop", company: "Classic Theme", value: "1.4k Orders" }],
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
            Storefront & Website Management
          </span>
        </div>
        <span
          className="text-xs"
          style={{ color: colors.textFaint, fontFamily: fonts.mono }}
        >
          Centralized
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
          Total Live Storefronts
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: colors.ledgerGreen, fontFamily: fonts.mono }}
        >
          2,548 Stores
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
                Storefronts & CRM
              </span>
            </div>
            <h2
              id="crm-teaser-heading"
              className="text-3xl sm:text-4xl font-medium text-balance"
              style={{ color: colors.textPrimary, fontFamily: fonts.display }}
            >
              Launch beautiful, high-converting customer storefronts
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              Scryme enables you to create and manage stunning customer-facing storefront websites instantly. Build robust digital layouts for your clients, fully synchronized in real-time with your central stock levels, integrated POS registers, and consolidated customer data.
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
              Explore Storefronts & CRM
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
