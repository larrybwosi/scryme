"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

const highlights = [
  "No credit card required to start",
  "Full access to all modules",
  "Dedicated onboarding specialist",
  "99.9% uptime SLA guarantee",
];

export function PricingCTA() {
  return (
    <section className="py-28 bg-primary relative overflow-hidden">
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 flex flex-col lg:flex-row items-center gap-14">
        {/* Copy */}
        <div className="flex-1 text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70 mb-4">
            Get started today
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight text-balance mb-6">
            The ERP that grows <br className="hidden lg:block" />
            with your business
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-lg mx-auto lg:mx-0 text-pretty">
            Start your 30-day free trial. No complex setup — your first store is
            live in minutes. Upgrade, downgrade or cancel at any time.
          </p>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <CheckCircle className="w-4 h-4 shrink-0 text-primary-foreground" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground text-primary px-6 py-3 text-sm font-semibold shadow hover:bg-primary-foreground/90 transition-colors"
            >
              View pricing <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/40 text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary-foreground/10 transition-colors"
            >
              Talk to sales
            </Link>
          </div>
        </div>

        {/* Stats card */}
        <div className="flex-1 w-full max-w-md">
          <div className="rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm p-8 space-y-6">
            {[
              { label: "Businesses on Scryme", value: "4,200+" },
              { label: "Transactions processed daily", value: "$3.8M+" },
              { label: "Avg. revenue lift after 90 days", value: "+28%" },
              { label: "Customer satisfaction score", value: "4.9 / 5" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between border-b border-primary-foreground/10 pb-5 last:border-0 last:pb-0">
                <span className="text-sm text-primary-foreground/70">{label}</span>
                <span className="text-2xl font-bold text-primary-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
