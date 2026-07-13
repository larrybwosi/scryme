import { colors, fonts } from "@/lib/scryme-tokens";

const expenses = [
  { name: "Sarah Chen", dept: "Sales", item: "Client lunch — Beacon", amount: "$142.00", category: "Entertainment" },
  { name: "Marcus Lee", dept: "Ops", item: "Warehouse supplies", amount: "$388.50", category: "Supplies" },
  { name: "Priya Nair", dept: "Finance", item: "Software renewal", amount: "$1,200.00", category: "Software" },
];

export function FinanceExpenseMock() {
  return (
    <div
      className="overflow-hidden rounded-md border shadow-xl"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div
        className="px-5 py-3.5 border-b"
        style={{ borderColor: colors.inkLine }}
      >
        <span className="text-xs font-semibold" style={{ color: colors.paper }}>
          Pending approvals
        </span>
      </div>
      <div className="px-4 py-4 space-y-3">
        {expenses.map((exp) => (
          <div
            key={exp.name}
            className="rounded border p-4"
            style={{
              background: colors.inkPanelAlt,
              borderColor: colors.inkLine,
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: colors.paper }}>
                  {exp.item}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                  {exp.name} · {exp.dept} · {exp.category}
                </p>
              </div>
              <span className="text-sm font-bold shrink-0" style={{ fontFamily: fonts.mono, color: colors.paper }}>
                {exp.amount}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 text-[11px] font-semibold rounded py-1.5 transition-colors"
                style={{
                  background: "rgba(75,144,115,0.12)",
                  color: colors.ledgerGreen,
                }}
              >
                Approve
              </button>
              <button
                className="flex-1 text-[11px] font-semibold rounded py-1.5 transition-colors"
                style={{
                  background: "rgba(180,85,58,0.12)",
                  color: colors.ledgerRust,
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
