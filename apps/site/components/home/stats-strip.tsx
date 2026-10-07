"use client";

import React from "react";
import { motion } from "framer-motion";

export function StatsStrip({
  stats,
}: {
  stats?: Array<{ value: string; label: string; sublabel: string }>;
}) {
  const statList =
    stats && stats.length > 0
      ? stats
      : [
          {
            value: "500+",
            label: "Enterprise Businesses",
            sublabel: "Active across 12 countries",
          },
          {
            value: "$2B+",
            label: "Annual Gross Volume",
            sublabel: "Processed through Scryme POS & web",
          },
          {
            value: "99.99%",
            label: "Uptime SLA",
            sublabel: "24/7 Monitored infrastructure",
          },
          {
            value: "<100ms",
            label: "Register Sync Speed",
            sublabel: "Multi-branch transaction posting",
          },
        ];

  return (
    <section
      className="py-16 sm:py-20 bg-muted/40 border-y border-border/80"
      aria-label="Platform scale statistics"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <p className="text-center text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-10">
          Scryme Platform Metrics & Scale
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statList.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/80 shadow-xs"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-[var(--brass)] mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {stat.sublabel}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
