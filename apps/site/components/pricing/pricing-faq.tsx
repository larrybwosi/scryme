import { colors, fonts } from "@/lib/scryme-tokens";

export interface FaqItem {
  q: string;
  a: string;
}

export function PricingFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="flex flex-col">
        {items.map((item, i) => (
          <div
            key={item.q}
            className={`flex gap-5 py-6 ${i < items.length - 1 ? "border-b border-dashed" : ""}`}
            style={{ borderColor: colors.inkLine }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded border text-[11px]"
              style={{
                fontFamily: fonts.mono,
                borderColor: colors.brassLine,
                color: colors.brass,
              }}
            >
              Q{i + 1}
            </div>
            <div>
              <p
                className="mb-2 text-[14.5px] font-medium"
                style={{ color: colors.paper }}
              >
                {item.q}
              </p>
              <p
                className="text-[13.5px] leading-relaxed"
                style={{ color: colors.textMuted }}
              >
                {item.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
