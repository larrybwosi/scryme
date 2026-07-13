"use client";

import { motion } from "framer-motion";
import { colors, fonts } from "@/lib/scryme-tokens";

const stats = [
  {
    value: "500+",
    label: "Enterprise businesses",
    sublabel: "across 12 countries",
  },
  {
    value: "$2B+",
    label: "Transactions processed",
    sublabel: "annually on the platform",
  },
  {
    value: "99.9%",
    label: "Platform uptime SLA",
    sublabel: "guaranteed & monitored",
  },
  {
    value: "24/7",
    label: "Expert support",
    sublabel: "dedicated account teams",
  },
];

export function StatsStrip() {
  return (
    <section
      className="py-20"
      style={{ background: colors.inkPanelAlt }}
      aria-label="Platform statistics"
    >
      <div className="container mx-auto">
        <div
          className="flex items-center justify-center gap-2 mb-10"
          aria-hidden="true"
        >
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: colors.textFaint, fontFamily: fonts.mono }}
          >
            Totals — as of today
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                delay: i * 0.08,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={
                i !== 0 ? "text-center lg:border-l lg:pl-4" : "text-center"
              }
              style={i !== 0 ? { borderColor: colors.inkLine } : undefined}
            >
              <div
                className="text-4xl lg:text-5xl font-semibold tracking-tight mb-2 tabular-nums"
                style={{ color: colors.brass, fontFamily: fonts.mono }}
              >
                {stat.value}
              </div>
              <div
                className="text-sm font-medium mb-0.5"
                style={{ color: colors.textPrimary, fontFamily: fonts.body }}
              >
                {stat.label}
              </div>
              <div
                className="text-xs"
                style={{ color: colors.textFaint, fontFamily: fonts.mono }}
              >
                {stat.sublabel}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
