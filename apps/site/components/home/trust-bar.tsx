"use client";

import React from "react";

export function TrustBar({ brands }: { brands?: string[] }) {
  const brandList =
    brands && brands.length > 0
      ? brands
      : [
          "Westfield Retail Group",
          "Meridian Enterprise",
          "Fontaine Global",
          "Harlen & Co. Commerce",
          "Argent Industries",
          "Solis Distribution Network",
          "Kestrel Holdings",
        ];

  return (
    <section
      className="py-10 border-y border-border/80 bg-background"
      aria-label="Trusted by industry leaders"
    >
      <div className="container mx-auto px-4 text-center">
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-6">
          Powering multi-location enterprise commerce & retail operations worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {brandList.map((brand, i) => (
            <div key={brand} className="flex items-center gap-8">
              <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground/70 hover:text-foreground transition-colors cursor-default select-none">
                {brand}
              </span>
              {i !== brandList.length - 1 && (
                <span className="text-[var(--brass)] opacity-40 text-xs" aria-hidden="true">
                  ✦
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
