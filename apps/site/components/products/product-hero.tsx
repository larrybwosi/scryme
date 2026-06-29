"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ProductHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Pass the icon as JSX, e.g. <Users className="w-8 h-8 text-white" /> */
  iconSlot: React.ReactNode;
  accentColor: string;
  ctaHref?: string;
}

export function ProductHero({
  eyebrow,
  title,
  description,
  iconSlot,
  accentColor,
  ctaHref = "/pricing",
}: ProductHeroProps) {
  return (
    <section className="relative overflow-hidden bg-surface-1 pt-32 pb-20">
      {/* grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: accentColor }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg"
          style={{ background: accentColor }}
        >
          {iconSlot}
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-muted mb-3">
          {eyebrow}
        </p>

        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight text-balance mb-6">
          {title}
        </h1>

        <p className="text-xl text-muted max-w-2xl mx-auto text-pretty leading-relaxed mb-10">
          {description}
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Start free trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg border border-border text-foreground px-6 py-3 text-sm font-semibold hover:bg-surface-2 transition-colors"
          >
            Request a demo
          </Link>
        </div>
      </div>
    </section>
  );
}
