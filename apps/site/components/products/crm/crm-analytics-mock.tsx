import { colors, fonts } from "@/lib/scryme-tokens";

const stats = [
  { num: "$2.4M", label: "Forecast, Q3" },
  { num: "38%", label: "Win rate" },
  { num: "21d", label: "Avg. cycle" },
];

export function CrmAnalyticsMock() {
  return (
    <div
      className="rounded-md border p-6"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      <div className="mb-5.5 flex flex-wrap gap-7">
        {stats.map((s) => (
          <div key={s.label}>
            <div
              className="text-[26px]"
              style={{ fontFamily: fonts.display, color: colors.paper }}
            >
              {s.num}
            </div>
            <div
              className="text-[10px] uppercase tracking-[0.05em]"
              style={{ fontFamily: fonts.mono, color: colors.textFaint }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 460 160" className="h-auto w-full">
        <polygon
          points="0,120 40,108 80,96 120,84 160,74 200,58 240,66 280,48 320,40 360,30 400,22 440,14 440,160 0,160"
          fill="rgba(200,154,75,0.10)"
        />
        <polyline
          points="0,120 40,108 80,96 120,84 160,74 200,58 240,66 280,48 320,40 360,30 400,22 440,14"
          fill="none"
          stroke={colors.brass}
          strokeWidth={2}
        />
        <polyline
          points="0,132 40,124 80,118 120,110 160,104 200,96 240,100 280,90 320,86 360,80 400,76 440,70"
          fill="none"
          stroke="rgba(241,233,216,0.28)"
          strokeWidth={1.4}
          strokeDasharray="3 4"
        />
        <line
          x1="0"
          y1="140"
          x2="460"
          y2="140"
          stroke={colors.inkLine}
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
