"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CircleDot, ShieldCheck } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { HeroMedia, type HeroMediaData } from "./hero-media";

const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";

const capabilities = ["Offline-first POS", "Multi-branch control", "Live inventory", "Automated storefronts"];

export function Hero({ data }: { data?: { heroTitle: string; heroSubtitle: string; reconciledToday: number; heroImage?: HeroMediaData["image"]; heroVideo?: HeroMediaData["video"] } }) {
  const reduceMotion = useReducedMotion();
  const title = data?.heroTitle || "One operating system for every moving part of commerce.";
  const subtitle = data?.heroSubtitle || "Scryme unifies sales, stock, customers, finance, and storefronts in one continuously reconciled record — built for operators scaling across channels and locations.";
  const total = data?.reconciledToday ?? 341850;

  return (
    <section className="relative overflow-hidden bg-inkBg pb-16 pt-28 sm:pb-24 sm:pt-36 lg:min-h-[900px] lg:pt-44" aria-labelledby="hero-title">
      <div className="enterprise-grid absolute inset-0" aria-hidden="true" />
      <div className="container relative mx-auto">
        <div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="flex max-w-2xl flex-col items-start gap-7">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex items-center gap-2 rounded-full border border-brassLine bg-brassDim px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">
              <CircleDot aria-hidden="true" />
              The commerce operating ledger
            </motion.div>
            <motion.h1 id="hero-title" initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7 }} className="max-w-3xl text-balance font-sans text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-textPrimary sm:text-6xl lg:text-7xl">
              {title}
            </motion.h1>
            <motion.p initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.65 }} className="max-w-xl text-pretty font-sans text-lg leading-relaxed text-textMuted sm:text-xl">
              {subtitle}
            </motion.p>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.6 }} className="flex flex-col gap-3 sm:flex-row">
              <Link href={`${webUrl}/sign-up`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brass px-6 font-sans text-sm font-semibold text-inkBg transition-transform hover:-translate-y-0.5">
                Start free <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-md border border-inkLine bg-inkPanel/50 px-6 font-sans text-sm font-semibold text-textPrimary transition-colors hover:bg-inkPanel">
                Book an enterprise demo
              </Link>
            </motion.div>
            <motion.ul initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32, duration: 0.7 }} className="grid gap-x-6 gap-y-3 sm:grid-cols-2" aria-label="Platform capabilities">
              {capabilities.map((item) => <li key={item} className="flex items-center gap-2 font-sans text-sm text-textMuted"><Check className="text-ledgerGreen" aria-hidden="true" />{item}</li>)}
            </motion.ul>
          </div>

          <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative">
            <HeroMedia image={data?.heroImage} video={data?.heroVideo} />
            <div className="relative -mt-6 mx-4 grid gap-px overflow-hidden rounded-lg border border-inkLine bg-inkLine shadow-2xl sm:mx-8 sm:grid-cols-3">
              <div className="bg-inkPanelAlt p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-textFaint">Reconciled today</p><p className="mt-2 font-mono text-xl font-semibold text-brass">${total.toLocaleString("en-US")}</p></div>
              <div className="bg-inkPanelAlt p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-textFaint">Systems online</p><p className="mt-2 font-mono text-xl font-semibold text-textPrimary">24 / 24</p></div>
              <div className="bg-inkPanelAlt p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-textFaint">Data integrity</p><p className="mt-2 flex items-center gap-2 font-mono text-sm font-semibold text-ledgerGreen"><ShieldCheck aria-hidden="true" /> Verified</p></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
