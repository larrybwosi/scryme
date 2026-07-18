import { colors, fonts } from "@/lib/scryme-tokens";

export function TrustBar({ brands }: { brands?: string[] }) {
  const brandList = brands && brands.length > 0 ? brands : [
    "Westfield Retail",
    "Meridian Corp",
    "Fontaine Group",
    "Harlen & Co.",
    "Argent Industries",
    "Solis Distributors",
    "Kestrel Holdings",
  ];

  return (
    <section
      className="py-10"
      style={{
        background: colors.inkBg,
        borderTop: `1px solid ${colors.inkLine}`,
        borderBottom: `1px solid ${colors.inkLine}`,
      }}
      aria-label="Trusted by"
    >
      <div className="container mx-auto">
        <p
          className="text-center text-[11px] font-semibold uppercase tracking-widest mb-7"
          style={{ color: colors.textFaint, fontFamily: fonts.mono }}
        >
          On the ledger — enterprise teams across industries
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
          {brandList.map((brand, i) => (
            <span key={brand} className="flex items-center gap-3">
              <span
                className="text-sm font-medium tracking-tight"
                style={{ color: colors.textMuted, fontFamily: fonts.body }}
              >
                {brand}
              </span>
              {i !== brandList.length - 1 && (
                <span
                  aria-hidden="true"
                  style={{ color: colors.brass, opacity: 0.5 }}
                >
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
