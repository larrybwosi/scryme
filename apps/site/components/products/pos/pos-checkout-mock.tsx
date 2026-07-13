import { colors, fonts } from "@/lib/scryme-tokens";

const items = [
  {
    sku: "SKU-88213",
    name: "Premium Coffee Beans 1kg",
    qty: 2,
    price: "$24.00",
  },
  { sku: "SKU-88240", name: "Stainless Travel Mug", qty: 1, price: "$18.50" },
  { sku: "SKU-88109", name: "Cold Brew Concentrate", qty: 3, price: "$32.25" },
];

const tenders = [
  { label: "Card ····4471", amt: "$52.00" },
  { label: "Cash", amt: "$22.75" },
];

export function PosCheckoutMock() {
  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3.5 text-[10.5px] uppercase tracking-[0.05em]"
        style={{
          fontFamily: fonts.mono,
          color: colors.textFaint,
          borderColor: colors.inkLine,
        }}
      >
        <span>Ticket · T-2214</span>
        <span style={{ color: colors.brass }}>Scanning</span>
      </div>

      <div className="px-5 py-3">
        {items.map((item, i) => (
          <div
            key={item.sku}
            className={`flex items-center justify-between py-3 text-[13px] ${
              i < items.length - 1 ? "border-b border-dashed" : ""
            }`}
            style={{ borderColor: colors.inkLine }}
          >
            <div>
              <div style={{ color: colors.paper }}>{item.name}</div>
              <div
                className="mt-0.5 text-[10.5px]"
                style={{ fontFamily: fonts.mono, color: colors.textFaint }}
              >
                {item.sku} · qty {item.qty}
              </div>
            </div>
            <div style={{ fontFamily: fonts.mono, color: colors.textMuted }}>
              {item.price}
            </div>
          </div>
        ))}
      </div>

      <div
        className="border-t px-5 py-3.5"
        style={{ borderColor: colors.inkLine }}
      >
        <div className="mb-2.5 flex items-center justify-between text-[13px]">
          <span style={{ color: colors.textMuted }}>Total</span>
          <span
            style={{
              fontFamily: fonts.mono,
              color: colors.paper,
              fontSize: 16,
            }}
          >
            $74.75
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tenders.map((t) => (
            <span
              key={t.label}
              className="rounded border px-2.5 py-1 text-[10.5px]"
              style={{
                fontFamily: fonts.mono,
                borderColor: colors.brassLine,
                color: colors.brass,
              }}
            >
              {t.label} · {t.amt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
