"use client";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const values = [42, 58, 51, 72, 84, 90, 110];
const max = Math.max(...values);

export function CrmAnalyticsMock() {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2">
        <span className="text-xs font-semibold text-foreground">Revenue by pipeline stage</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
          +31% YoY
        </span>
      </div>

      <div className="px-5 py-5">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pipeline value", value: "$1.4M" },
            { label: "Win rate", value: "68%" },
            { label: "Avg. deal size", value: "$92K" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-surface-2 border border-border px-3 py-3">
              <p className="text-[10px] text-muted mb-1">{label}</p>
              <p className="text-lg font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-28">
          {months.map((month, i) => {
            const pct = (values[i] / max) * 100;
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[10px] text-muted">{month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
