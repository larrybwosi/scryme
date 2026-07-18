import { colors, fonts } from "@/lib/scryme-tokens";

const items = [
  { name: "French Press 600ml", reorder: 50, cost: "$1,250", urgency: "urgent", days: 2 },
  { name: "Travel Mug", reorder: 80, cost: "$2,720", urgency: "soon", days: 6 },
  { name: "Cold Brew Conc.", reorder: 200, cost: "$3,800", urgency: "planned", days: 14 },
];

export function InventoryForecastMock() {
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
          Reorder recommendations — this week
        </span>
      </div>
      <div className="px-4 py-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="rounded border p-4"
            style={{
              background: colors.inkPanelAlt,
              borderColor: colors.inkLine,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: colors.paper }}>
                  {item.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                  Suggested: {item.reorder} units · {item.cost}
                </p>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  fontFamily: fonts.mono,
                  background:
                    item.urgency === "urgent"
                      ? "rgba(180,85,58,0.15)"
                      : item.urgency === "soon"
                        ? "rgba(200,154,75,0.15)"
                        : "rgba(74,144,226,0.15)",
                  color:
                    item.urgency === "urgent"
                      ? colors.ledgerRust
                      : item.urgency === "soon"
                        ? colors.brass
                        : "#4A90E2",
                }}
              >
                {item.urgency === "urgent" ? `${item.days}d left` : item.urgency === "soon" ? `${item.days}d left` : `${item.days}d`}
              </span>
            </div>
            <button
              className="w-full text-[11px] font-semibold rounded py-1.5 transition-colors"
              style={{
                background: "rgba(200,154,75,0.12)",
                color: colors.brass,
              }}
            >
              Generate purchase order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
