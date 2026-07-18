import type { LucideIcon } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";

interface CalloutRowProps {
  items: { icon: LucideIcon; title: string; description: string }[];
}

export function CalloutRow({ items }: CalloutRowProps) {
  return (
    <section
      className="border-b py-24"
      style={{ borderColor: colors.inkLine, background: colors.inkBg }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {items.map(({ icon: Icon, title, description }) => (
            <div key={title} className="space-y-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-md border"
                style={{
                  borderColor: colors.brassLine,
                  background: colors.brassDim,
                }}
              >
                <Icon className="h-5.5 w-5.5" style={{ color: colors.brass }} />
              </div>
              <h3
                className="text-xl"
                style={{ fontFamily: fonts.display, color: colors.paper }}
              >
                {title}
              </h3>
              <p
                className="leading-relaxed"
                style={{ color: colors.textMuted }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
