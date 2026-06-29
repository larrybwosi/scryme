"use client";

const stages = [
  {
    label: "Prospect",
    color: "bg-slate-500",
    deals: [
      { name: "Riviera Retail Group", value: "$48K", days: 2 },
      { name: "Metro Supplies Ltd.", value: "$22K", days: 5 },
    ],
  },
  {
    label: "Qualified",
    color: "bg-blue-500",
    deals: [
      { name: "Beacon Hardware", value: "$91K", days: 8 },
      { name: "Crestline Foods", value: "$34K", days: 3 },
    ],
  },
  {
    label: "Proposal",
    color: "bg-indigo-500",
    deals: [
      { name: "Halo Distribution", value: "$180K", days: 12 },
    ],
  },
  {
    label: "Won",
    color: "bg-emerald-500",
    deals: [
      { name: "Apex Wholesalers", value: "$260K", days: 1 },
      { name: "Pinnacle Goods", value: "$74K", days: 0 },
    ],
  },
];

export function CrmPipelineMock() {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2">
        <span className="text-xs font-semibold text-foreground">Sales Pipeline — Q3 2025</span>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        {stages.map((stage) => (
          <div key={stage.label} className="flex flex-col gap-2">
            {/* column header */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                {stage.label}
              </span>
            </div>
            {/* cards */}
            {stage.deals.map((deal) => (
              <div
                key={deal.name}
                className="rounded-lg bg-background border border-border px-3 py-2.5 shadow-sm"
              >
                <p className="text-xs font-semibold text-foreground leading-snug mb-1">
                  {deal.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary">{deal.value}</span>
                  <span className="text-[10px] text-muted">
                    {deal.days === 0 ? "Today" : `${deal.days}d ago`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
