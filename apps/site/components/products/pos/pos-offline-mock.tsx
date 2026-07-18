import { colors, fonts } from "@/lib/scryme-tokens";

const queue = [
  { id: "T-2209", detail: "3 items · $41.00 cash", status: "synced" as const },
  { id: "T-2210", detail: "1 item · $18.50 card", status: "synced" as const },
  { id: "T-2213", detail: "5 items · $96.40 split", status: "queued" as const },
  { id: "T-2214", detail: "3 items · $74.75 card", status: "queued" as const },
];

const statusStyle = {
  synced: { color: colors.ledgerGreen, label: "SYNCED" },
  queued: { color: colors.ledgerRust, label: "QUEUED" },
};

export function PosOfflineMock() {
  return (
    <div
      className="rounded-md border py-1"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5 text-[10.5px] uppercase tracking-[0.05em]"
        style={{ fontFamily: fonts.mono, color: colors.textFaint }}
      >
        <span>Local queue</span>
        <span>CRDT merge · no conflicts</span>
      </div>
      {queue.map((row, i) => {
        const s = statusStyle[row.status];
        return (
          <div
            key={row.id}
            className={`flex items-center justify-between px-5 py-3 ${i < queue.length - 1 ? "border-b border-dashed" : ""}`}
            style={{ borderColor: colors.inkLine }}
          >
            <div>
              <div className="text-[13px]" style={{ color: colors.paper }}>
                {row.id}
              </div>
              <div
                className="mt-0.5 text-[11px]"
                style={{ color: colors.textMuted }}
              >
                {row.detail}
              </div>
            </div>
            <span
              className="flex items-center gap-1.5 text-[10px] tracking-[0.05em]"
              style={{ fontFamily: fonts.mono, color: s.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
