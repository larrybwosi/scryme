"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Users2,
  ShoppingCart,
  Package,
  DollarSign,
  UserCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    name: "Customer Relationship Management",
    shortName: "CRM",
    description:
      "Track every customer interaction, manage your sales pipeline, automate follow-ups, and close deals faster with an intelligent CRM built for growth.",
    icon: Users2,
    href: "/products/crm",
    color: "#4f46e5",
    colorBg: "rgba(79,70,229,0.08)",
  },
  {
    name: "Point of Sale",
    shortName: "POS",
    description:
      "Process retail and wholesale transactions with a lightning-fast, offline-capable POS system that syncs inventory in real time.",
    icon: ShoppingCart,
    href: "/products/pos",
    color: "#0891b2",
    colorBg: "rgba(8,145,178,0.08)",
  },
  {
    name: "Inventory Management",
    shortName: "Inventory",
    description:
      "Monitor stock levels across multiple warehouses, automate reorders, track serial numbers, and get real-time alerts on critical shortages.",
    icon: Package,
    href: "/products/inventory",
    color: "#059669",
    colorBg: "rgba(5,150,105,0.08)",
  },
  {
    name: "Financial Management",
    shortName: "Finance",
    description:
      "Streamline invoicing, expense tracking, bank reconciliation, and financial reporting with a full-featured accounting module designed for enterprise.",
    icon: DollarSign,
    href: "/products/finance",
    color: "#d97706",
    colorBg: "rgba(217,119,6,0.08)",
  },
  {
    name: "HR & Workforce",
    shortName: "HR",
    description:
      "Manage employees, attendance, leave, and payroll in one place. Automate compliance reporting and give your HR team the tools they need.",
    icon: UserCheck,
    href: "/products/hr",
    color: "#7c3aed",
    colorBg: "rgba(124,58,237,0.08)",
  },
  {
    name: "Business Analytics",
    shortName: "Analytics",
    description:
      "Turn your operational data into strategic insight with customizable dashboards, drill-down reports, and AI-powered forecasting tools.",
    icon: BarChart3,
    href: "/products/analytics",
    color: "#db2777",
    colorBg: "rgba(219,39,119,0.08)",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const Icon = feature.icon;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: (index % 3) * 0.1,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative bg-card border border-border rounded-xl p-6 flex flex-col hover:border-primary/30 hover:shadow-md transition-all duration-300"
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 shrink-0 transition-transform group-hover:scale-110 duration-300"
        style={{ background: feature.colorBg }}
      >
        <Icon size={20} style={{ color: feature.color }} />
      </div>

      {/* Content */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-semibold text-foreground">
          {feature.name}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {feature.description}
      </p>

      {/* Link */}
      <Link
        href={feature.href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold mt-5 transition-colors"
        style={{ color: feature.color }}
        aria-label={`Learn more about ${feature.name}`}
      >
        Learn more
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1 duration-200"
        />
      </Link>

      {/* Subtle hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 20% 20%, ${feature.colorBg}, transparent)`,
        }}
        aria-hidden="true"
      />
    </motion.article>
  );
}

export function FeaturesGrid() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section
      id="features"
      className="py-24 bg-background"
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Platform Modules
            </span>
          </div>
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl font-extrabold text-foreground text-balance"
          >
            Everything you need to run your business
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            Six deeply integrated modules that work seamlessly together — so
            data flows automatically from your storefront to your balance sheet.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={feature.shortName} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
