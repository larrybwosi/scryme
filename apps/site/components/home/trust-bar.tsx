"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Zap, Globe2, Building } from "lucide-react";

export function TrustBar({ brands }: { brands?: string[] }) {
  const reduceMotion = useReducedMotion();
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

  const highlights = [
    { icon: Globe2, label: "99.99% Uptime SLA", detail: "Global Multi-Branch Architecture" },
    { icon: Zap, label: "< 50ms Realtime Sync", detail: "Zero Stock Collisions" },
    { icon: ShieldCheck, label: "Offline-First Engine", detail: "Uninterrupted POS Checkout" },
    { icon: Building, label: "Enterprise Certified", detail: "Multi-Location Governance" },
  ];

  return (
    <section
      className="py-12 border-y border-border/70 bg-card/60 backdrop-blur-md relative overflow-hidden"
      aria-label="Trusted by industry leaders"
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Metric Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 mb-8 border-b border-border/50">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/60 hover:border-[var(--brass)]/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--brass-dim)] border border-[var(--brass-line)] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[var(--brass)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{item.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Brand Logos Carousel Header */}
        <div className="text-center">
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Powering multi-location enterprise commerce & retail operations worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {brandList.map((brand, i) => (
              <motion.div
                key={brand}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="flex items-center gap-8"
              >
                <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground/80 hover:text-foreground transition-colors cursor-default select-none">
                  {brand}
                </span>
                {i !== brandList.length - 1 && (
                  <span className="text-[var(--brass)] opacity-40 text-xs" aria-hidden="true">
                    ✦
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
