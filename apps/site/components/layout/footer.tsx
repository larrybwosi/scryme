"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles, Command } from "lucide-react";
import { modules } from "@/lib/scryme-tokens";

const company = [
  { name: "About Scryme", href: "/about" },
  { name: "Careers", href: "/careers" },
  { name: "Scryme Journal", href: "/blog" },
  { name: "Product Changelog", href: "/changelog" },
];

const resources = [
  { name: "POS App Downloads", href: "/download" },
  { name: "Documentation", href: "/docs" },
  { name: "Ecosystem Integrations", href: "/integrations" },
  { name: "Platform Status", href: "/status" },
];

const legal = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Cookie Preferences", href: "/cookies" },
  { name: "Security Overview", href: "/security" },
];

export function Footer() {
  return (
    <footer
      className="border-t border-border/80 bg-background text-foreground transition-colors"
      aria-label="Site footer"
    >
      <div className="container mx-auto py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand & Description (4 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start space-y-5">
            <Link
              href="/"
              className="flex items-center gap-3 font-semibold text-xl tracking-tight group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--brass)] text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
                <Command size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Scryme
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm text-pretty">
              The high-performance commerce platform built to unify multi-branch POS, stock inventory, financial accounting, and automated online storefronts.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-[var(--brass-dim)] border border-[var(--brass-line)] text-[var(--brass)]">
              <ShieldCheck size={14} />
              <span>Enterprise Grade • 99.99% Uptime SLA</span>
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-[var(--brass)] transition-colors pt-2 group"
            >
              <span>Explore Enterprise Plans</span>
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Nav Columns (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Platform Suite
              </h3>
              <ul className="space-y-3">
                {modules.map((item) => (
                  <li key={item.code}>
                    <Link
                      href={item.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                {company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                {resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="border-t border-border/60 py-6">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <p>© {new Date().getFullYear()} Scryme Technologies Inc. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            {legal.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
