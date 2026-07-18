import type { LucideIcon } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";

interface AboutStatsProps {
  stats: { icon: LucideIcon; value: string; label: string }[];
}

export function AboutStats({ stats }: AboutStatsProps) {
  return (
    <section
      className="border-y py-14"
      style={{ borderColor: colors.inkLine, background: colors.inkPanelAlt }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <div
          className="grid grid-cols-2 border-l border-t sm:grid-cols-4"
          style={{ borderColor: colors.inkLine }}
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2.5 border-b border-r px-4 py-8 text-center"
              style={{ borderColor: colors.inkLine }}
            >
              <Icon className="h-4.5 w-4.5" style={{ color: colors.brass }} />
              <p
                className="text-[1.9rem]"
                style={{ fontFamily: fonts.display, color: colors.paper }}
              >
                {value}
              </p>
              <p
                className="text-[10.5px] uppercase tracking-[0.08em]"
                style={{ fontFamily: fonts.mono, color: colors.textFaint }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
