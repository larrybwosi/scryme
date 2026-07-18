import type { ReactNode } from "react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

interface FeatureSectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: { text: string }[];
  children: ReactNode;
  reverse?: boolean;
  dark?: boolean;
}

export function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  children,
  reverse = false,
  dark = false,
}: FeatureSectionProps) {
  return (
    <section
      id={id}
      className="border-b py-24"
      style={{
        borderColor: colors.inkLine,
        background: dark ? colors.inkPanelAlt : "transparent",
      }}
    >
      <div
        className={`mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:gap-18 ${
          reverse ? "lg:grid-cols-[1.1fr_0.9fr]" : "lg:grid-cols-[0.9fr_1.1fr]"
        }`}
      >
        <div className={reverse ? "lg:order-2" : "lg:order-1"}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h3
            className="mt-4 text-[1.7rem] leading-[1.14] sm:text-[2.15rem]"
            style={{ fontFamily: fonts.display, color: colors.paper }}
          >
            {title}
          </h3>
          <p
            className="mt-4 max-w-[46ch] text-[15.5px]"
            style={{ color: colors.textMuted }}
          >
            {description}
          </p>
          <ul className="mt-6 flex flex-col gap-3.5">
            {bullets.map((b) => (
              <li
                key={b.text}
                className="flex items-start gap-3 text-[14.5px]"
                style={{ color: colors.textMuted }}
              >
                <span
                  className="mt-0.5 text-xs"
                  style={{ fontFamily: fonts.mono, color: colors.brass }}
                >
                  §
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        </div>
        <div className={reverse ? "lg:order-1" : "lg:order-2"}>{children}</div>
      </div>
    </section>
  );
}
