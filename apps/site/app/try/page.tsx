"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Store,
  Globe2,
  Users,
  Layers,
  Zap,
  ShieldCheck,
  Check,
  Monitor,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { useOpenPanel } from "@openpanel/nextjs";
import { colors, fonts } from "@/lib/scryme-tokens";

const defaultWebUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://app.scryme.tech";

const webUrl =
  process.env.NEXT_PUBLIC_WEB_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  defaultWebUrl;

const tryModes = [
  {
    id: "pos",
    name: "Offline-First POS & Retail",
    icon: Store,
    badge: "RETAIL & PHARMACY",
    tagline: "Instant barcode scan, register management, and local offline sync.",
    description:
      "Experience our zero-latency register built for high-throughput retail stores. Continue ringing transactions during network outages with local SQLite auto-reconciliation.",
    highlights: [
      "Sub-second barcode scanning & inventory lookup",
      "Offline sync engine with automatic background catch-up",
      "Thermal printer receipt & barcode label generation",
      "Petty cash tracking and register shift closures",
    ],
    ctaText: "Launch POS Trial",
    ctaHref: `${webUrl}/sign-up?mode=pos`,
  },
  {
    id: "crm",
    name: "CRM & Automated Outreach",
    icon: Users,
    badge: "CRM & MARKETING",
    tagline: "Customer pipeline, automated marketing, and lead scoring.",
    description:
      "Unify customer contact histories, automated SMS/email outreach campaigns, and deal stages directly linked to customer purchase history.",
    highlights: [
      "Automated customer segmentation and tagging",
      "Omnichannel chat and SMS campaign triggers",
      "Lead scoring and deal pipeline stage tracking",
      "Multi-member permission controls",
    ],
    ctaText: "Launch CRM Trial",
    ctaHref: `${webUrl}/sign-up?mode=crm`,
  },
  {
    id: "storefront",
    name: "Automated E-Commerce Storefront",
    icon: Globe2,
    badge: "E-COMMERCE",
    tagline: "Instant client storefront websites synchronized with stock.",
    description:
      "Auto-generate responsive client-facing e-commerce storefronts that pull live stock balances, accept online payments, and route orders to physical branch queues.",
    highlights: [
      "Real-time inventory stock synchronization",
      "Automated order queue routing to nearest branch",
      "Custom domain and branding customization",
      "Secure checkout with multi-currency payment gateways",
    ],
    ctaText: "Launch Storefront Trial",
    ctaHref: `${webUrl}/sign-up?mode=storefront`,
  },
  {
    id: "erp",
    name: "Enterprise ERP & Multi-Branch",
    icon: Layers,
    badge: "ENTERPRISE",
    tagline: "Multi-store consolidation, stock transfers, and financial ledger.",
    description:
      "Centralized corporate suite for multi-branch operators. Monitor real-time sales across branches, initiate stock transfer receipts, and generate consolidated P&L statements.",
    highlights: [
      "Consolidated multi-branch financial balance sheets",
      "Batch expiry & purchase order stock reception",
      "Global audit log & role-based permissions",
      "Webhooks, REST APIs, and automated reporting",
    ],
    ctaText: "Launch ERP Trial",
    ctaHref: `${webUrl}/sign-up?mode=erp`,
  },
];

const guarantees = [
  "No credit card required to start",
  "Instant workspace setup in under 60 seconds",
  "30 days full access to all enterprise modules",
  "Unlimited team members & locations during trial",
];

export default function TryPage() {
  const [selectedMode, setSelectedMode] = useState("pos");
  const op = useOpenPanel();

  const activeMode = tryModes.find((m) => m.id === selectedMode) || tryModes[0];

  const trackAction = (ctaName: string, modeId: string, href: string) => {
    try {
      op.track("try_page_cta_clicked", {
        cta_name: ctaName,
        selected_mode: modeId,
        destination: href,
      });
    } catch (e) {
      // Ignore tracking errors
    }
  };

  return (
    <div
      className="min-h-screen pt-28 pb-24 text-textPrimary"
      style={{
        background: `radial-gradient(circle at 50% 10%, rgba(200, 154, 75, 0.08) 0%, ${colors.inkBg} 70%)`,
        fontFamily: fonts.body,
      }}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Header Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brassLine bg-brassDim text-brass text-xs font-mono font-semibold uppercase tracking-widest">
            <Sparkles size={14} />
            <span>Interactive Platform Experience</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-textPrimary text-balance"
            style={{ fontFamily: fonts.display }}
          >
            Try Scryme in action, zero friction.
          </h1>
          <p className="text-lg text-textMuted leading-relaxed text-pretty">
            Experience how Scryme unifies POS, inventory, e-commerce storefronts, and CRM into one continuous real-time ledger. Pick a workflow below and launch your workspace immediately.
          </p>
        </div>

        {/* Workflow Mode Switcher Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {tryModes.map((mode) => {
            const IconComp = mode.icon;
            const isSelected = mode.id === selectedMode;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  try {
                    op.track("try_mode_selected", { mode_id: mode.id });
                  } catch (e) {}
                }}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-[#121B2E] border-[#C89A4B] shadow-lg shadow-black/40 scale-[1.02]"
                    : "bg-[#0B1220]/70 border-[rgba(241,233,216,0.1)] hover:border-[rgba(200,154,75,0.4)] hover:bg-[#121B2E]/50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    isSelected
                      ? "bg-[#C89A4B] text-[#0B1220]"
                      : "bg-[rgba(241,233,216,0.06)] text-[rgba(241,233,216,0.7)]"
                  }`}
                >
                  <IconComp size={20} />
                </div>
                <span
                  className="text-xs font-mono font-semibold uppercase tracking-wider mb-1"
                  style={{
                    color: isSelected ? colors.brass : colors.textFaint,
                  }}
                >
                  {mode.badge}
                </span>
                <span
                  className="text-sm font-bold truncate w-full"
                  style={{
                    color: isSelected ? colors.paper : colors.textMuted,
                  }}
                >
                  {mode.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Workflow Spotlight Card */}
        <div className="p-8 lg:p-10 rounded-2xl bg-[#121B2E] border border-[rgba(241,233,216,0.12)] shadow-2xl grid lg:grid-cols-12 gap-8 items-center mb-16">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C89A4B]">
              <Zap size={14} />
              <span>{activeMode.badge} WORKFLOW</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#F1E9D8]"
              style={{ fontFamily: fonts.display }}
            >
              {activeMode.name}
            </h2>
            <p className="text-base text-[rgba(241,233,216,0.8)] leading-relaxed">
              {activeMode.description}
            </p>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[rgba(241,233,216,0.5)] block">
                Key Features You Will Try:
              </span>
              <ul className="grid sm:grid-cols-2 gap-2.5">
                {activeMode.highlights.map((highlight, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-[rgba(241,233,216,0.85)]"
                  >
                    <CheckCircle2
                      size={15}
                      className="text-[#C89A4B] shrink-0 mt-0.5"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href={activeMode.ctaHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-all shadow-lg shadow-[#C89A4B]/20"
                onClick={() =>
                  trackAction(activeMode.ctaText, activeMode.id, activeMode.ctaHref)
                }
              >
                <span>{activeMode.ctaText}</span>
                <ArrowRight size={16} />
              </a>

              <a
                href={`${webUrl}/login`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-[rgba(241,233,216,0.8)] hover:text-[#F1E9D8] hover:bg-[#0B1220] border border-[rgba(241,233,216,0.12)] transition-colors"
                onClick={() =>
                  trackAction("Sign In Existing", activeMode.id, `${webUrl}/login`)
                }
              >
                <span>Sign in to existing store</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-xl bg-[#0B1220] border border-[rgba(241,233,216,0.08)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(241,233,216,0.08)]">
              <div className="flex items-center gap-2 text-xs font-mono text-[rgba(241,233,216,0.6)]">
                <Monitor size={14} className="text-[#C89A4B]" />
                <span>ENVIRONMENT: WEB & TAURI POS</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.08)]">
                <span className="text-[11px] font-mono uppercase text-[#C89A4B] block mb-1">
                  1. Instant Provisioning
                </span>
                <p className="text-xs text-[rgba(241,233,216,0.7)]">
                  Your organization and branch location are generated with sample inventory items & taxes pre-loaded.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.08)]">
                <span className="text-[11px] font-mono uppercase text-[#C89A4B] block mb-1">
                  2. Cross-Device Access
                </span>
                <p className="text-xs text-[rgba(241,233,216,0.7)]">
                  Access from desktop browser, mobile browser, or download native desktop POS binaries for Windows, macOS, or Linux.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.08)]">
                <span className="text-[11px] font-mono uppercase text-[#C89A4B] block mb-1">
                  3. Full Feature Access
                </span>
                <p className="text-xs text-[rgba(241,233,216,0.7)]">
                  30 days unlimited access to multi-store POS, CRM pipelines, e-commerce storefronts, and automated email/SMS.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/download"
                className="text-xs font-semibold text-[#C89A4B] hover:underline inline-flex items-center gap-1.5"
                onClick={() =>
                  trackAction("Download Native Desktop Apps", activeMode.id, "/download")
                }
              >
                <Smartphone size={14} />
                <span>Need native desktop binaries instead? Download POS App</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Guarantees Strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-xl bg-[#0B1220]/60 border border-[rgba(241,233,216,0.08)]">
          {guarantees.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-[rgba(241,233,216,0.8)]">
              <ShieldCheck size={16} className="text-[#C89A4B] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
