import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

interface LedgerCardGridProps {
  eyebrow: string;
  title: string;
  cards: { tag: string; title: string; desc: string }[];
}

export function LedgerCardGrid({ eyebrow, title, cards }: LedgerCardGridProps) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <Eyebrow center>{eyebrow}</Eyebrow>
          <h2
            className="mt-4 text-[1.7rem] sm:text-[2.3rem]"
            style={{ fontFamily: fonts.display, color: colors.paper }}
          >
            {title}
          </h2>
        </div>
        <div
          className="grid grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: colors.inkLine, borderColor: colors.inkLine }}
        >
          {cards.map((card) => (
            <div
              key={card.title}
              className="p-7.5 transition-colors hover:bg-[#121B2E]"
              style={{ background: colors.inkBg }}
            >
              <div
                className="mb-4 flex h-8 w-8 items-center justify-center rounded border text-[11px]"
                style={{
                  fontFamily: fonts.mono,
                  borderColor: colors.brassLine,
                  color: colors.brass,
                }}
              >
                {card.tag}
              </div>
              <h4
                className="mb-2 text-[14.5px] font-semibold"
                style={{ color: colors.paper }}
              >
                {card.title}
              </h4>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: colors.textMuted }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
