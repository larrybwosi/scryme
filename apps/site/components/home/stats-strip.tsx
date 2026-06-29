"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "500+", label: "Enterprise businesses", sublabel: "across 12 countries" },
  { value: "$2B+", label: "Transactions processed", sublabel: "annually on the platform" },
  { value: "99.9%", label: "Platform uptime SLA", sublabel: "guaranteed & monitored" },
  { value: "24/7", label: "Expert support", sublabel: "dedicated account teams" },
];

export function StatsStrip() {
  return (
    <section
      className="py-20"
      style={{ background: "var(--primary)" }}
      aria-label="Platform statistics"
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-white/90 mb-0.5">{stat.label}</div>
              <div className="text-xs text-white/60">{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
