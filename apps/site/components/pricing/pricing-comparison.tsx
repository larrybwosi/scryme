import { Check, Minus } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";

export interface ComparisonRow {
  feature: string;
  starter: string | boolean;
  growth: string | boolean;
  enterprise: string | boolean;
}

function Cell({ value }: { value: string | boolean }) {
  if (value === false) {
    return (
      <Minus className="mx-auto h-4 w-4" style={{ color: colors.textFaint }} />
    );
  }
  if (value === true) {
    return (
      <Check className="mx-auto h-4 w-4" style={{ color: colors.brass }} />
    );
  }
  return (
    <span
      className="text-[13px]"
      style={{ fontFamily: fonts.mono, color: colors.textPrimary }}
    >
      {value}
    </span>
  );
}

export function PricingComparison({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <div
        className="overflow-hidden rounded-md border"
        style={{ borderColor: colors.inkLine }}
      >
        <div
          className="grid grid-cols-4 border-b px-6 py-4"
          style={{
            background: colors.inkPanelAlt,
            borderColor: colors.inkLine,
          }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: fonts.mono, color: colors.textFaint }}
          >
            Feature
          </span>
          {["Starter", "Growth", "Enterprise"].map((p) => (
            <span
              key={p}
              className="text-center text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: fonts.mono, color: colors.brass }}
            >
              {p}
            </span>
          ))}
        </div>
        {rows.map((row, i) => (
          <div
            key={row.feature}
            className="grid grid-cols-4 border-b px-6 py-4 last:border-0"
            style={{
              borderColor: colors.inkLine,
              background: i % 2 === 0 ? colors.inkBg : colors.inkPanel,
            }}
          >
            <span className="text-[13.5px]" style={{ color: colors.textMuted }}>
              {row.feature}
            </span>
            <div className="text-center">
              <Cell value={row.starter} />
            </div>
            <div className="text-center">
              <Cell value={row.growth} />
            </div>
            <div className="text-center">
              <Cell value={row.enterprise} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
