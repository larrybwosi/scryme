import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

interface AboutValuesProps {
  eyebrow: string;
  title: string;
  values: { tag: string; title: string; desc: string }[];
}

export function AboutValues({ eyebrow, title, values }: AboutValuesProps) {
  return (
    <section
      className="border-t py-24"
      style={{ borderColor: colors.inkLine, background: colors.inkPanelAlt }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <Eyebrow center>{eyebrow}</Eyebrow>
          <h2
            className="mt-4 text-[1.9rem] sm:text-[2.3rem]"
            style={{ fontFamily: fonts.display, color: colors.paper }}
          >
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-md border p-7 transition-colors"
              style={{
                borderColor: colors.inkLine,
                background: colors.inkPanel,
              }}
            >
              <div
                className="mb-4 flex h-8 w-8 items-center justify-center rounded border text-[11px]"
                style={{
                  fontFamily: fonts.mono,
                  borderColor: colors.brassLine,
                  color: colors.brass,
                }}
              >
                {v.tag}
              </div>
              <h3
                className="mb-2.5 text-base font-semibold"
                style={{ color: colors.paper }}
              >
                {v.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: colors.textMuted }}
              >
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
