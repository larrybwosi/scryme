import { colors, fonts } from "@/lib/scryme-tokens";

const rows = [
  { label: "Cash on Hand", value: "$342,100.00" },
  { label: "Accounts Receivable", value: "$48,200.00" },
  { label: "Accounts Payable", value: "$18,400.00" },
  { label: "Next close", value: "Month-end (30th)" },
];

export function FinanceLedgerStub() {
  return (
    <div
      className="rounded-md border p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div
        className="flex items-baseline justify-between border-b pb-3.5"
        style={{ borderColor: colors.inkLine }}
      >
        <div>
          <div
            className="text-[11px]"
            style={{ fontFamily: fonts.mono, color: colors.textFaint }}
          >
            LEDGER-01
          </div>
          <div
            className="text-lg"
            style={{ fontFamily: fonts.display, color: colors.paper }}
          >
            Operating Ledger
          </div>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 text-[10.5px] tracking-[0.04em]"
          style={{
            fontFamily: fonts.mono,
            borderColor: colors.brassLine,
            color: colors.brass,
          }}
        >
          BALANCED
        </span>
      </div>

      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b border-dashed py-2.5 text-[13.5px]"
          style={{ borderColor: colors.inkLine }}
        >
          <span style={{ color: colors.textMuted }}>{row.label}</span>
          <span style={{ fontFamily: fonts.mono, color: colors.textPrimary }}>
            {row.value}
          </span>
        </div>
      ))}

      <div
        className="mt-4 flex items-center gap-2.5 border-t pt-4"
        style={{ borderColor: colors.inkLine }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: colors.ledgerGreen,
            boxShadow: "0 0 0 3px rgba(75,144,115,0.18)",
          }}
        />
        <span
          className="text-[11px] tracking-[0.04em]"
          style={{ fontFamily: fonts.mono, color: colors.ledgerGreen }}
        >
          SYNCED — 4 OPERATIONAL STREAMS CONNECTED
        </span>
      </div>
    </div>
  );
}
