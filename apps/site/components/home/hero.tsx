"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { colors, fonts } from "@/lib/scryme-tokens";

type Entry = {
  code: "POS" | "CRM" | "INV" | "FIN";
  label: string;
  amount: string;
  time: string;
};

const ENTRIES: Entry[] = [
  {
    code: "POS",
    label: "Westfield Retail — Register 3",
    amount: "+$4,320.00",
    time: "09:14:02",
  },
  {
    code: "CRM",
    label: "Meridian Corp — deal closed",
    amount: "+$12,800.00",
    time: "09:13:41",
  },
  {
    code: "INV",
    label: "Fontaine Group — restock #A19",
    amount: "−214 units",
    time: "09:13:12",
  },
  {
    code: "FIN",
    label: "Harlen & Co. — invoice paid",
    amount: "+$2,940.00",
    time: "09:12:58",
  },
  {
    code: "POS",
    label: "Corvale Retail — Register 1",
    amount: "+$980.40",
    time: "09:12:30",
  },
  {
    code: "CRM",
    label: "Aldrich Ltd — renewal signed",
    amount: "+$18,200.00",
    time: "09:11:47",
  },
  {
    code: "INV",
    label: "Nordway Supply — shipment received",
    amount: "+860 units",
    time: "09:11:03",
  },
  {
    code: "FIN",
    label: "Priam Studio — expense logged",
    amount: "−$640.00",
    time: "09:10:22",
  },
];

const CODE_COLOR: Record<Entry["code"], string> = {
  POS: colors.ledgerGreen,
  CRM: colors.brass,
  INV: "#7C93B0",
  FIN: colors.ledgerRust,
};

function LedgerRow({ entry }: { entry: Entry }) {
  return (
    <div
      className="flex items-center gap-3 shrink-0 px-4 py-2 rounded-md"
      style={{
        background: colors.inkPanel,
        border: `1px solid ${colors.inkLine}`,
      }}
    >
      <span
        className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded"
        style={{
          fontFamily: fonts.mono,
          color: CODE_COLOR[entry.code],
          background: `${CODE_COLOR[entry.code]}1F`,
        }}
      >
        {entry.code}
      </span>
      <span
        className="text-xs whitespace-nowrap"
        style={{ color: colors.textMuted, fontFamily: fonts.body }}
      >
        {entry.label}
      </span>
      <span
        className="text-xs whitespace-nowrap font-medium"
        style={{ color: colors.textPrimary, fontFamily: fonts.mono }}
      >
        {entry.amount}
      </span>
      <span
        className="text-[10px] whitespace-nowrap"
        style={{ color: colors.textFaint, fontFamily: fonts.mono }}
      >
        {entry.time}
      </span>
    </div>
  );
}

function LedgerTape() {
  const prefersReducedMotion = useReducedMotion();
  const row = [...ENTRIES, ...ENTRIES];

  return (
    <div
      className="relative overflow-hidden py-2"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
      aria-hidden="true"
    >
      <motion.div
        className="flex gap-2 w-max"
        animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      >
        {row.map((entry, i) => (
          <LedgerRow key={i} entry={entry} />
        ))}
      </motion.div>
    </div>
  );
}

function ReconciledTotal() {
  const [value, setValue] = useState(261480);
  const target = 284900;
  const frame = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const from = 261480;
    const duration = 2200;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => frame.current && cancelAnimationFrame(frame.current);
  }, []);

  return (
    <div
      className="flex flex-col items-start sm:items-end shrink-0 pl-0 sm:pl-6 sm:border-l"
      style={{ borderColor: colors.inkLine }}
    >
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: colors.textFaint, fontFamily: fonts.mono }}
      >
        Reconciled today
      </span>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={{ color: colors.brass, fontFamily: fonts.mono }}
      >
        ${value.toLocaleString("en-US")}
      </span>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16"
      style={{ background: colors.inkBg }}
      aria-label="Hero"
    >
      {/* faint ledger-line texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${colors.inkLine} 1px, transparent 1px)`,
          backgroundSize: "100% 44px",
          maskImage:
            "linear-gradient(180deg, transparent, black 20%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent, black 20%, black 70%, transparent)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% 22%, ${colors.brassDim} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="container mx-auto relative py-20 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full border"
            style={{
              borderColor: colors.brassLine,
              background: colors.brassDim,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: colors.brass }}
            />
            <span
              className="text-[11px] font-medium uppercase tracking-widest"
              style={{ color: colors.brass, fontFamily: fonts.mono }}
            >
              The Operating Ledger
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.08] tracking-tight text-balance"
            style={{ color: colors.textPrimary, fontFamily: fonts.display }}
          >
            Every sale, deal, and shipment.{" "}
            <span style={{ color: colors.brass, fontStyle: "italic" }}>
              One reconciled record.
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            Scryme merges CRM, Point of Sale, Inventory, and Finance into a
            single ledger — so nothing you run your business on ever needs
            reconciling by hand again.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-4 justify-center"
          >
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: colors.brass,
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
            >
              Start free trial
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-all"
              style={{
                background: "transparent",
                border: `1px solid ${colors.inkLine}`,
                color: colors.textPrimary,
                fontFamily: fonts.body,
              }}
            >
              Request a demo
            </Link>
          </motion.div>
        </div>

        {/* Signature element: the reconciliation tape */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 lg:mt-20 rounded-xl overflow-hidden"
          style={{
            background: colors.inkPanelAlt,
            border: `1px solid ${colors.inkLine}`,
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: colors.inkLine }}
          >
            <span
              className="text-[11px] uppercase tracking-widest"
              style={{ color: colors.textFaint, fontFamily: fonts.mono }}
            >
              Live across CRM · POS · Inventory · Finance
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: colors.ledgerGreen }}
              />
              <span
                className="text-[11px]"
                style={{ color: colors.textFaint, fontFamily: fonts.mono }}
              >
                syncing
              </span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch">
            <div className="flex-1 min-w-0 flex items-center py-3 pl-2">
              <LedgerTape />
            </div>
            <div className="px-5 py-4 sm:py-3 flex items-center">
              <ReconciledTotal />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
