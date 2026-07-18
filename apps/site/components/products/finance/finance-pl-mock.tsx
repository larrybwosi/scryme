import { colors, fonts } from "@/lib/scryme-tokens";

export function FinancePlMock() {
  return (
    <div
      className="overflow-hidden rounded-md border shadow-xl"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: colors.inkLine }}
      >
        <span className="text-xs font-semibold" style={{ color: colors.paper }}>
          P&amp;L — June 2025
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(75,144,115,0.15)",
            color: colors.ledgerGreen,
          }}
        >
          Net profit +18%
        </span>
      </div>
      <div className="px-5 py-4 space-y-2">
        {[
          { label: "Gross Revenue", value: "$284,500", positive: true, bold: false },
          { label: "Cost of Goods Sold", value: "($142,200)", positive: false, bold: false },
          { label: "Gross Profit", value: "$142,300", positive: true, bold: true },
          { label: "Operating Expenses", value: "($61,400)", positive: false, bold: false },
          { label: "EBITDA", value: "$80,900", positive: true, bold: false },
          { label: "Depreciation & Amort.", value: "($4,200)", positive: false, bold: false },
          { label: "Net Profit", value: "$76,700", positive: true, bold: true },
        ].map(({ label, value, positive, bold }) => (
          <div
            key={label}
            className="flex items-center justify-between px-2 py-1.5 rounded"
            style={{
              background: bold ? colors.inkPanelAlt : "transparent",
              border: bold ? `1px solid ${colors.inkLine}` : "none",
            }}
          >
            <span
              className="text-xs"
              style={{
                fontFamily: bold ? fonts.mono : fonts.body,
                fontWeight: bold ? 600 : 400,
                color: bold ? colors.paper : colors.textMuted,
              }}
            >
              {label}
            </span>
            <span
              className="text-xs font-bold"
              style={{
                fontFamily: fonts.mono,
                color: positive ? colors.ledgerGreen : colors.ledgerRust,
                fontSize: bold ? "13px" : "12px",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
