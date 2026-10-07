"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CircleDot, ShieldCheck, Sparkles } from "lucide-react";
import { useOpenPanel } from "@openpanel/nextjs";
import { colors, fonts } from "@/lib/scryme-tokens";
import { HeroMedia, type HeroMediaData } from "./hero-media";

const webUrl =
  process.env.NEXT_PUBLIC_WEB_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://app.scryme.tech";

const capabilities = [
  "Offline-first POS",
  "Multi-branch control",
  "Live inventory",
  "Automated storefronts",
];

export function Hero({
  data,
}: {
  data?: {
    heroTitle: string;
    heroSubtitle: string;
    reconciledToday: number;
    heroImage?: HeroMediaData["image"];
    heroVideo?: HeroMediaData["video"];
  };
}) {
  const reduceMotion = useReducedMotion();
  const op = useOpenPanel();
  const title =
    data?.heroTitle ||
    "One operating system for every moving part of commerce.";
  const subtitle =
    data?.heroSubtitle ||
    "Scryme unifies sales, stock, customers, finance, and storefronts in one continuously reconciled record — built for operators scaling across channels and locations.";
  const total = data?.reconciledToday ?? 341850;

  const trackClick = (ctaName: string, destination: string) => {
    try {
      op.track("cta_clicked", {
        location: "hero",
        cta_name: ctaName,
        destination,
      });
    } catch (e) {
      // Ignore tracking errors
    }
  };

  return (
    <section
      className="relative overflow-hidden bg-inkBg pb-16 pt-28 sm:pb-24 sm:pt-36 lg:min-h-[900px] lg:pt-44"
      aria-labelledby="hero-title"
    >
      <div className="enterprise-grid absolute inset-0" aria-hidden="true" />
      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="flex max-w-2xl flex-col items-start gap-7">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex items-center gap-2 rounded-full border border-brassLine bg-brassDim px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brass"
            >
              <CircleDot size={12} aria-hidden="true" className="animate-pulse" />
              <span>The commerce operating ledger</span>
            </motion.div>
            <motion.h1
              id="hero-title"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.7 }}
              className="max-w-3xl text-balance font-sans text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-textPrimary sm:text-5xl lg:text-6xl"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.65 }}
              className="max-w-xl text-pretty font-sans text-base sm:text-lg leading-relaxed text-textMuted"
            >
              {subtitle}
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.6 }}
              className="flex flex-col gap-3.5 sm:flex-row w-full sm:w-auto"
            >
              <Link
                href={`${webUrl}/sign-up`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brass px-7 font-sans text-sm font-semibold text-inkBg transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/10 active:translate-y-0"
                onClick={() => trackClick("Try Scryme Free", `${webUrl}/sign-up`)}
              >
                <span>Try Scryme Free</span>
                <Sparkles size={16} aria-hidden="true" />
              </Link>
              <a
                href={`${webUrl}/sign-up`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-inkLine bg-inkPanel/60 px-7 font-sans text-sm font-semibold text-textPrimary transition-all hover:bg-inkPanel hover:border-brassLine"
                onClick={() => trackClick("Create Account", `${webUrl}/sign-up`)}
              >
                <span>Create Account</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </motion.div>
            <motion.ul
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.7 }}
              className="grid gap-x-6 gap-y-3 sm:grid-cols-2 pt-2"
              aria-label="Platform capabilities"
            >
              {capabilities.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 font-sans text-sm text-textMuted"
                >
                  <Check className="text-ledgerGreen shrink-0" size={16} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: 0.18,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative"
          >
            <HeroMedia image={data?.heroImage} video={data?.heroVideo} />
            <div className="relative -mt-6 mx-3 sm:mx-8 grid gap-px overflow-hidden rounded-xl border border-inkLine bg-inkLine shadow-2xl sm:grid-cols-3">
              <div className="bg-inkPanelAlt p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-textFaint">
                  Reconciled today
                </p>
                <p className="mt-1.5 font-mono text-xl font-semibold text-brass">
                  ${total.toLocaleString("en-US")}
                </p>
              </div>
              <div className="bg-inkPanelAlt p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-textFaint">
                  Systems online
                </p>
                <p className="mt-1.5 font-mono text-xl font-semibold text-textPrimary">
                  24 / 24
                </p>
              </div>
              <div className="bg-inkPanelAlt p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-textFaint">
                  Data integrity
                </p>
                <p className="mt-1.5 flex items-center gap-2 font-mono text-sm font-semibold text-ledgerGreen">
                  <ShieldCheck size={16} aria-hidden="true" /> Verified
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
