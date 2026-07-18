"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";

export function BlogFooter() {
  return (
    <footer
      className="border-t py-12 md:py-16 animate-fade-in"
      style={{
        background: "var(--ink-bg, #0B1220)",
        borderColor: colors.inkLine,
        color: colors.textPrimary,
      }}
      aria-label="Blog footer"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo / Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: colors.brass }}
              >
                <BookOpen size={16} style={{ color: "var(--ink-bg, #0B1220)" }} />
              </div>
              <span
                className="text-lg font-medium tracking-tight"
                style={{ color: colors.textPrimary, fontFamily: fonts.display }}
              >
                Scryme Journal
              </span>
            </Link>
            <p
              className="text-sm leading-relaxed max-w-sm"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              Expert guides, field notes, and engineering insights on scaling retail,
              automating CRM pipelines, and running high-performance commerce systems.
            </p>
          </div>

          {/* Editorial column */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: colors.textFaint, fontFamily: fonts.mono }}
            >
              Journal Sections
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-sm hover:underline" style={{ color: colors.textMuted }}>
                  Latest Articles
                </Link>
              </li>
              <li>
                <Link href="/products/pos" className="text-sm hover:underline" style={{ color: colors.textMuted }}>
                  POS & Checkout
                </Link>
              </li>
              <li>
                <Link href="/products/crm" className="text-sm hover:underline" style={{ color: colors.textMuted }}>
                  CRM & Automation
                </Link>
              </li>
              <li>
                <Link href="/products/finance" className="text-sm hover:underline" style={{ color: colors.textMuted }}>
                  Finance & Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter column */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: colors.textFaint, fontFamily: fonts.mono }}
            >
              Subscribe to Journal
            </h3>
            <p className="text-xs leading-relaxed mb-3" style={{ color: colors.textMuted }}>
              Get our monthly digest on commerce operations, delivered directly to your inbox.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="journal@example.com"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-md text-xs outline-none border"
                style={{
                  background: "var(--ink-panel, #121B2E)",
                  borderColor: colors.inkLine,
                  color: colors.textPrimary,
                  fontFamily: fonts.body,
                }}
                aria-label="Email for journal newsletter"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md transition-opacity hover:opacity-90 shrink-0 flex items-center justify-center cursor-pointer"
                style={{ background: colors.brass, color: "var(--ink-bg, #0B1220)" }}
                aria-label="Subscribe"
              >
                <ArrowRight size={13} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: colors.inkLine }}>
          <p
            className="text-xs"
            style={{ color: colors.textFaint, fontFamily: fonts.mono }}
          >
            &copy; {new Date().getFullYear()} Scryme Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs hover:underline" style={{ color: colors.textFaint, fontFamily: fonts.body }}>
              Commercial Site
            </Link>
            <Link href="/privacy" className="text-xs hover:underline" style={{ color: colors.textFaint, fontFamily: fonts.body }}>
              Privacy
            </Link>
            <Link href="/terms" className="text-xs hover:underline" style={{ color: colors.textFaint, fontFamily: fonts.body }}>
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
