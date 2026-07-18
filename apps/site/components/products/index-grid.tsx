import type { LucideIcon } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

interface IndexGridProps {
  title: string;
  items: { icon: LucideIcon; label: string }[];
}

export function IndexGrid({ title, items }: IndexGridProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <Eyebrow>{title}</Eyebrow>
        <div
          className="mt-7 grid grid-cols-2 border-l border-t sm:grid-cols-4"
          style={{ borderColor: colors.inkLine }}
        >
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 border-b border-r px-4.5 py-5 transition-colors hover:bg-[#0E1626]"
              style={{ borderColor: colors.inkLine }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: colors.brass }}
              />
              <span
                className="text-[13.5px]"
                style={{ color: colors.textMuted }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
