"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useOpenPanel } from "@openpanel/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const webUrl =
  process.env.NEXT_PUBLIC_WEB_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://app.scryme.tech";

const highlights = [
  "No credit card required to start",
  "Full access to all 6 core operating modules",
  "Dedicated enterprise onboarding specialist",
  "99.99% guaranteed uptime SLA",
];

const statement = [
  { label: "Active Businesses", value: "4,200+" },
  { label: "Daily Processing Volume", value: "$3.8M+" },
  { label: "Avg Revenue Lift (90 days)", value: "+28%" },
  { label: "Customer Satisfaction", value: "4.9 / 5" },
];

export interface PricingCTAProps {
  title?: React.ReactNode;
  description?: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

export function PricingCTA({
  title,
  description,
  primaryCta,
  secondaryCta,
}: PricingCTAProps = {}) {
  const op = useOpenPanel();
  const displayTitle = title || "The Ledger Grows With Your Business";
  const displayDescription =
    description ||
    "Start your 30-day free trial today. Connect your physical registers and automated e-commerce storefronts in minutes.";
  const displayPrimaryCta = primaryCta || { label: "Try Scryme Free", href: `${webUrl}/sign-up` };
  const displaySecondaryCta = secondaryCta || { label: "View Pricing Plans", href: "/pricing" };

  const handleCtaClick = (label: string, href: string) => {
    try {
      op.track("cta_clicked", {
        location: "closing_statement",
        cta_label: label,
        destination: href,
      });
    } catch (e) {
      // Ignore tracking errors
    }
  };

  return (
    <section className="py-20 lg:py-28 bg-[var(--site-dark)] text-white relative overflow-hidden border-t border-border/80">
      <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16">
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            <Badge variant="brass" size="md">
              <Sparkles size={12} className="text-[var(--brass)]" />
              Scale Your Commerce Operations
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              {displayTitle}
            </h2>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl">
              {displayDescription}
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 w-full max-w-xl">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                  <CheckCircle2 size={16} className="text-[var(--brass)] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <Button
                variant="brass"
                size="lg"
                href={displayPrimaryCta.href}
                icon={<ArrowRight size={16} />}
                onClick={() => handleCtaClick(displayPrimaryCta.label, displayPrimaryCta.href)}
              >
                {displayPrimaryCta.label}
              </Button>
              <Button
                variant="outline"
                size="lg"
                href={displaySecondaryCta.href}
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => handleCtaClick(displaySecondaryCta.label, displaySecondaryCta.href)}
              >
                {displaySecondaryCta.label}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
            <Card variant="dark" className="p-8 border-[var(--site-dark-border)] bg-[var(--site-dark-surface)]/80 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--brass)]">
                  Platform Ledger Metrics
                </span>
                <span className="text-xs font-mono text-white/50">YTD {new Date().getFullYear()}</span>
              </div>

              <div className="space-y-4">
                {statement.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-white/70">{label}</span>
                    <span className="font-mono font-bold text-white text-base">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
