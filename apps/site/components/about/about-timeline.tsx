import { colors, fonts } from "@/lib/scryme-tokens";

interface AboutTimelineProps {
  entries: { year: string; milestone: string }[];
}

export function AboutTimeline({ entries }: AboutTimelineProps) {
  return (
    <div
      className="w-full rounded-md border p-8"
      style={{ borderColor: colors.inkLine, background: colors.inkPanel }}
    >
      {entries.map((entry, i) => (
        <div key={entry.year} className="flex gap-5">
          <div className="flex flex-col items-center">
            <span
              className="whitespace-nowrap text-xs"
              style={{
                fontFamily: fonts.mono,
                color: colors.brass,
                fontWeight: 500,
              }}
            >
              {entry.year}
            </span>
            {i < entries.length - 1 && (
              <div
                className="mt-2 w-px flex-1"
                style={{ background: colors.inkLine }}
              />
            )}
          </div>
          <p
            className="pb-6 text-sm leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            {entry.milestone}
          </p>
        </div>
      ))}
    </div>
  );
}
