import { colors, fonts } from "@/lib/scryme-tokens";

const items = [
  {
    name: "Premium Coffee Beans 1kg",
    sold: 24,
    stock: 76,
    status: "ok" as const,
  },
  {
    name: "Organic Earl Grey Tea",
    sold: 12,
    stock: 14,
    status: "low" as const,
  },
  { name: "Stainless Travel Mug", sold: 8, stock: 31, status: "ok" as const },
  {
    name: "French Press 600ml",
    sold: 5,
    stock: 3,
    status: "critical" as const,
  },
  { name: "Cold Brew Concentrate", sold: 19, stock: 52, status: "ok" as const },
];

const statusMap = {
  ok: { color: colors.ledgerGreen, label: "In stock" },
  low: { color: colors.brass, label: "Low stock" },
  critical: { color: colors.ledgerRust, label: "Reorder now" },
};

export function PosInventorySyncMock() {
  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3.5"
        style={{ borderColor: colors.inkLine }}
      >
        <span
          className="text-[13px] font-medium"
          style={{ color: colors.paper }}
        >
          Stock movement — today
        </span>
        <span
          className="flex items-center gap-1.5 text-[10px] tracking-[0.05em]"
          style={{ fontFamily: fonts.mono, color: colors.brass }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: colors.brass }}
          />
          LIVE
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {items.map((item) => {
          const s = statusMap[item.status];
          return (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded border px-3 py-2.5"
              style={{
                background: colors.inkPanelAlt,
                borderColor: colors.inkLine,
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[12.5px]"
                  style={{ color: colors.paper }}
                >
                  {item.name}
                </p>
                <p
                  className="text-[10.5px]"
                  style={{ fontFamily: fonts.mono, color: colors.textFaint }}
                >
                  {item.sold} sold today
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className="text-[12.5px] tabular-nums"
                  style={{ fontFamily: fonts.mono, color: colors.textPrimary }}
                >
                  {item.stock} left
                </p>
                <span className="text-[10.5px]" style={{ color: s.color }}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
