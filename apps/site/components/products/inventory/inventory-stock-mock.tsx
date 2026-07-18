import { colors, fonts } from "@/lib/scryme-tokens";

const rows = [
  { name: "Coffee Beans 1kg", onHand: 842, reserved: 120, status: "ok" },
  { name: "Earl Grey Tea", onHand: 214, reserved: 60, status: "ok" },
  { name: "Travel Mug", onHand: 38, reserved: 12, status: "low" },
  { name: "French Press 600ml", onHand: 9, reserved: 7, status: "critical" },
  { name: "Cold Brew Conc.", onHand: 521, reserved: 85, status: "ok" },
];

export function InventoryStockMock() {
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
          Stock overview — all locations
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(75,144,115,0.15)",
            color: colors.ledgerGreen,
          }}
        >
          Live
        </span>
      </div>
      <div className="px-4 py-3">
        <div
          className="grid grid-cols-4 gap-1 text-[10px] font-semibold uppercase tracking-wider px-1 mb-2 border-b pb-2"
          style={{
            fontFamily: fonts.mono,
            color: colors.textFaint,
            borderColor: colors.inkLine,
          }}
        >
          <span>Product</span>
          <span className="text-right">On Hand</span>
          <span className="text-right">Reserved</span>
          <span className="text-right">Available</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-4 gap-1 items-center px-1 py-2 border-b last:border-0"
            style={{
              borderColor: colors.inkLine,
            }}
          >
            <p className="text-xs font-medium truncate" style={{ color: colors.paper }}>
              {row.name}
            </p>
            <p className="text-xs text-right font-semibold" style={{ fontFamily: fonts.mono, color: colors.paper }}>
              {row.onHand}
            </p>
            <p className="text-xs text-right" style={{ fontFamily: fonts.mono, color: colors.textMuted }}>
              {row.reserved}
            </p>
            <div className="flex justify-end">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  fontFamily: fonts.mono,
                  background:
                    row.status === "critical"
                      ? "rgba(180,85,58,0.15)"
                      : row.status === "low"
                        ? "rgba(200,154,75,0.15)"
                        : "rgba(75,144,115,0.15)",
                  color:
                    row.status === "critical"
                      ? colors.ledgerRust
                      : row.status === "low"
                        ? colors.brass
                        : colors.ledgerGreen,
                }}
              >
                {row.onHand - row.reserved}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
