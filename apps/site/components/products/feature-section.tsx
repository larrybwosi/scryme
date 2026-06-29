"use client";

import { type LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

interface Bullet {
  text: string;
}

interface FeatureSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: Bullet[];
  icon?: LucideIcon;
  reverse?: boolean;
  dark?: boolean;
  children?: React.ReactNode;
}

export function FeatureSection({
  eyebrow,
  title,
  description,
  bullets = [],
  reverse = false,
  dark = false,
  children,
}: FeatureSectionProps) {
  return (
    <section
      className={`py-24 ${dark ? "bg-surface-2" : "bg-background"}`}
    >
      <div
        className={`mx-auto max-w-6xl px-6 flex flex-col ${
          reverse ? "lg:flex-row-reverse" : "lg:flex-row"
        } items-center gap-16`}
      >
        {/* Text */}
        <div className="flex-1 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight text-balance mb-5">
            {title}
          </h2>
          <p className="text-base text-muted leading-relaxed mb-7">{description}</p>

          {bullets.length > 0 && (
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b.text} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                  <span className="text-sm text-muted">{b.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visual */}
        <div className="flex-1 w-full">{children}</div>
      </div>
    </section>
  );
}
