import { colors, fonts } from "@/lib/scryme-tokens";

const invoices = [
  { id: "INV-1042", company: "Beacon Hardware", amount: "$18,400", due: "Overdue 12d", status: "overdue" },
  { id: "INV-1049", company: "Metro Supplies", amount: "$9,800", due: "Overdue 3d", status: "overdue" },
  { id: "INV-1051", company: "Crestline Foods", amount: "$22,100", due: "Due in 7d", status: "pending" },
  { id: "INV-1054", company: "Apex Wholesalers", amount: "$14,300", due: "Due in 14d", status: "pending" },
  { id: "INV-1038", company: "Riviera Retail", amount: "$31,600", due: "Paid Jul 1", status: "paid" },
];

export function FinanceInvoicesMock() {
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
          Outstanding invoices
        </span>
        <span className="text-xs font-bold" style={{ color: colors.ledgerRust }}>
          $48,200 overdue
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-3 rounded border px-3 py-2.5"
            style={{
              background: colors.inkPanelAlt,
              borderColor: colors.inkLine,
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: colors.paper }}>
                {inv.company}
              </p>
              <p className="text-[10px]" style={{ fontFamily: fonts.mono, color: colors.textFaint }}>
                {inv.id}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold" style={{ fontFamily: fonts.mono, color: colors.paper }}>
                {inv.amount}
              </p>
              <p
                className="text-[10px] font-semibold"
                style={{
                  fontFamily: fonts.mono,
                  color:
                    inv.status === "overdue"
                      ? colors.ledgerRust
                      : inv.status === "pending"
                        ? colors.brass
                        : colors.ledgerGreen,
                }}
              >
                {inv.due}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
