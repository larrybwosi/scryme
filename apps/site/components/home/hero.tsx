"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck, Sparkles, CircleDot } from "lucide-react";
import { useOpenPanel } from "@openpanel/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroMedia, type HeroMediaData } from "./hero-media";

const webUrl =
  process.env.NEXT_PUBLIC_WEB_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://app.scryme.tech";

const capabilities = [
  "Offline-first POS terminal sync",
  "Multi-branch stock reconciliation",
  "Live automated e-commerce storefronts",
  "Unified financial balance sheet & ledger",
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
      className="relative overflow-hidden bg-background pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40"
      aria-labelledby="hero-title"
    >
      <div className="enterprise-grid absolute inset-0 pointer-events-none opacity-30" aria-hidden="true" />
      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="brass" size="md">
                <CircleDot size={12} className="animate-pulse text-[var(--brass)]" />
                The Enterprise Commerce Operating Ledger
              </Badge>
            </motion.div>

            <motion.h1
              id="hero-title"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] text-balance"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.6 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl text-pretty"
            >
              {subtitle}
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2"
            >
              <Button
                size="lg"
                variant="brass"
                href={`${webUrl}/sign-up`}
                icon={<Sparkles size={18} />}
                onClick={() => trackClick("Try Scryme Free", `${webUrl}/sign-up`)}
              >
                Try Scryme Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                href="/products"
                icon={<ArrowRight size={18} />}
                onClick={() => trackClick("Explore Platform", "/products")}
              >
                Explore Platform
              </Button>
            </motion.div>

            <motion.ul
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-4 text-xs sm:text-sm font-medium text-muted-foreground"
            >
              {capabilities.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[var(--ledger-green)]/15 text-[var(--ledger-green)] flex items-center justify-center shrink-0">
                    <Check size={11} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Right Hero Media Showcase */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative rounded-2xl p-2 bg-gradient-to-b from-border/80 to-border/30 border shadow-2xl">
              <HeroMedia image={data?.heroImage} video={data?.heroVideo} />
            </div>

            {/* Live Metrics Overlay Card */}
            <div className="mt-4 grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border shadow-lg text-card-foreground">
              <div className="bg-card p-3 sm:p-4 text-center sm:text-left">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Reconciled Today
                </p>
                <p className="mt-1 font-mono text-base sm:text-lg font-bold text-[var(--brass)]">
                  ${total.toLocaleString("en-US")}
                </p>
              </div>
              <div className="bg-card p-3 sm:p-4 text-center sm:text-left">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Systems Online
                </p>
                <p className="mt-1 font-mono text-base sm:text-lg font-bold text-foreground">
                  24 / 24 Active
                </p>
              </div>
              <div className="bg-card p-3 sm:p-4 text-center sm:text-left">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Data Integrity
                </p>
                <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 font-mono text-xs sm:text-sm font-semibold text-[var(--ledger-green)]">
                  <ShieldCheck size={14} /> Verified
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
