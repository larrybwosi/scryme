import { fonts, colors } from "@/lib/scryme-tokens";

export function Eyebrow({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] ${
        center ? "justify-center" : ""
      }`}
      style={{ fontFamily: fonts.mono, color: colors.brass }}
    >
      <span
        className="inline-block h-px w-3.5"
        style={{ background: colors.brass }}
      />
      {children}
    </span>
  );
}
