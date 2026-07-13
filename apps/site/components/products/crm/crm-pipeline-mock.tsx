import { colors, fonts } from "@/lib/scryme-tokens";

const columns = [
  {
    label: "Qualified · 6",
    deals: [
      { id: "D-04799", name: "Hallowell Corp", amt: "$12,400" },
      { id: "D-04803", name: "Marchetti Foods", amt: "$8,150" },
      { id: "D-04811", name: "Osei Textiles", amt: "$21,000" },
    ],
  },
  {
    label: "Proposal · 4",
    deals: [
      { id: "D-04788", name: "Rundgren Steel", amt: "$54,900" },
      { id: "D-04795", name: "Kester Labs", amt: "$17,300" },
    ],
  },
  {
    label: "Negotiation · 3",
    deals: [
      { id: "D-04821", name: "Norrbom & Vale", amt: "$84,200" },
      { id: "D-04790", name: "Vantage Rail", amt: "$39,600" },
    ],
  },
];

export function CrmPipelineMock() {
  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div
        className="grid grid-cols-3 border-b"
        style={{ borderColor: colors.inkLine }}
      >
        {columns.map((col, i) => (
          <div
            key={col.label}
            className={`px-4 py-3.5 text-[10.5px] uppercase tracking-[0.05em] ${i < 2 ? "border-r" : ""}`}
            style={{
              fontFamily: fonts.mono,
              color: colors.textFaint,
              borderColor: colors.inkLine,
            }}
          >
            {col.label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3">
        {columns.map((col, i) => (
          <div
            key={col.label}
            className={`flex flex-col gap-2.5 p-3 ${i < 2 ? "border-r" : ""}`}
            style={{ borderColor: colors.inkLine }}
          >
            {col.deals.map((deal) => (
              <div
                key={deal.id}
                className="rounded border px-3 py-2.5 text-xs"
                style={{
                  background: colors.inkPanelAlt,
                  borderColor: colors.inkLine,
                }}
              >
                <div
                  className="mb-1.5 font-medium"
                  style={{ color: colors.paper }}
                >
                  {deal.name}
                </div>
                <div
                  className="flex justify-between text-[10.5px]"
                  style={{ fontFamily: fonts.mono, color: colors.textFaint }}
                >
                  <span>{deal.id}</span>
                  <span style={{ color: colors.ledgerGreen }}>{deal.amt}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
