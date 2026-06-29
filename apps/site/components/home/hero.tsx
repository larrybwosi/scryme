"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  LayoutDashboard,
  Users2,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
} from "lucide-react";

function MockDashboard() {
  const bars = [40, 55, 45, 70, 52, 78, 60, 85, 68, 92, 80, 100];
  const transactions = [
    { name: "Westfield Retail", amount: "+$4,320", time: "2m ago", status: "success" },
    { name: "Meridian Corp", amount: "+$12,800", time: "14m ago", status: "success" },
    { name: "Fontaine Group", amount: "+$7,150", time: "1h ago", status: "success" },
    { name: "Harlen & Co.", amount: "+$2,940", time: "2h ago", status: "pending" },
  ];

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border"
      style={{
        background: "#0a0f1e",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 32px 64px -12px rgba(0,0,0,0.7)",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: "#060b17", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <div
          className="flex-1 mx-3 rounded h-5 flex items-center px-3 text-xs font-mono"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)" }}
        >
          app.scryme.io/dashboard
        </div>
      </div>

      {/* App layout */}
      <div className="flex" style={{ height: "340px" }}>
        {/* Sidebar */}
        <nav
          className="flex flex-col items-center py-4 gap-1 shrink-0"
          style={{ width: "48px", background: "#060b17", borderRight: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[
            { Icon: LayoutDashboard, active: true },
            { Icon: Users2, active: false },
            { Icon: ShoppingCart, active: false },
            { Icon: Package, active: false },
            { Icon: DollarSign, active: false },
            { Icon: TrendingUp, active: false },
          ].map(({ Icon, active }, i) => (
            <button
              key={i}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
              style={{
                background: active ? "rgba(79,70,229,0.2)" : "transparent",
                color: active ? "#818cf8" : "rgba(255,255,255,0.3)",
              }}
              aria-label={`Nav item ${i + 1}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </nav>

        {/* Main content */}
        <div className="flex-1 overflow-hidden p-3 flex flex-col gap-3">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-semibold">Good morning, Alex</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Wednesday, {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "#4f46e5" }}>
              A
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Revenue", value: "$284.9K", delta: "+12.5%", color: "#10b981" },
              { label: "Customers", value: "3,847", delta: "+8.2%", color: "#10b981" },
              { label: "Orders", value: "142", delta: "+23.1%", color: "#10b981" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg p-2.5"
                style={{ background: "#0f1929", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {kpi.label}
                </div>
                <div className="text-sm font-bold text-white">{kpi.value}</div>
                <div className="text-xs mt-0.5 font-medium" style={{ color: kpi.color }}>
                  {kpi.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div
            className="rounded-lg p-3 flex-1"
            style={{ background: "#0f1929", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                Revenue Trend
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Last 12 months
              </span>
            </div>
            <svg viewBox="0 0 216 56" fill="none" className="w-full">
              {bars.map((h, i) => (
                <rect
                  key={i}
                  x={i * 18 + 1}
                  y={56 - (h / 100) * 48}
                  width={14}
                  height={(h / 100) * 48}
                  rx={2}
                  fill={
                    i === bars.length - 1
                      ? "#4f46e5"
                      : `rgba(79,70,229,${0.15 + (i / bars.length) * 0.35})`
                  }
                />
              ))}
            </svg>
          </div>

          {/* Recent transactions */}
          <div
            className="rounded-lg"
            style={{ background: "#0f1929", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="px-3 py-2 flex items-center justify-between border-b"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                Recent Transactions
              </span>
            </div>
            {transactions.map((tx) => (
              <div
                key={tx.name}
                className="flex items-center justify-between px-3 py-1.5"
              >
                <div>
                  <div className="text-xs text-white font-medium">{tx.name}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {tx.time}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: "#10b981" }}>
                    {tx.amount}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: tx.status === "success" ? "rgba(16,185,129,0.15)" : "rgba(251,191,36,0.15)",
                      color: tx.status === "success" ? "#10b981" : "#fbbf24",
                    }}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16"
      style={{ background: "var(--site-dark)" }}
      aria-label="Hero"
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 60% 40%, rgba(79,70,229,0.12) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="container mx-auto relative py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Text */}
          <div className="flex-1 max-w-xl lg:max-w-none lg:w-[52%] text-center lg:text-left">
            {/* Badge */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 mb-6"
            >
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                style={{
                  background: "rgba(79,70,229,0.15)",
                  borderColor: "rgba(79,70,229,0.35)",
                  color: "#a5b4fc",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#818cf8" }}
                />
                Enterprise Platform v4.1
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white text-balance"
            >
              Run Every Part of Your{" "}
              <span style={{ color: "#818cf8" }}>Business</span> From One
              Platform
            </motion.h1>

            {/* Subheading */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-6 text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Scryme unifies CRM, Point of Sale, Inventory, and Finance into
              one enterprise platform — giving every team a real-time, single
              source of truth.
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "#4f46e5",
                  boxShadow: "0 0 0 0 rgba(79,70,229,0), 0 4px 16px -2px rgba(79,70,229,0.5)",
                }}
              >
                Start Free Trial
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                Request a Demo
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-8 flex items-center gap-3 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((l) => (
                  <div
                    key={l}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                    style={{
                      background: "#4f46e5",
                      borderColor: "var(--site-dark)",
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div
                  className="text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Trusted by{" "}
                  <span className="text-white font-semibold">500+</span>{" "}
                  businesses worldwide
                </div>
                <div className="flex gap-0.5 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill="#fbbf24">
                      <path d="M5 0.5L6.18 3.41H9.26L6.77 5.2L7.95 8.11L5 6.27L2.05 8.11L3.23 5.2L0.74 3.41H3.82L5 0.5Z" />
                    </svg>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Mock dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-[48%] lg:shrink-0"
          >
            <MockDashboard />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          aria-hidden="true"
        >
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Scroll to explore
          </span>
          <div
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.5)" }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
