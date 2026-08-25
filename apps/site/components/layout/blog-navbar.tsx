"use client";

import Link from "next/link";
import { BookOpen, ArrowLeft, ArrowUpRight } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { ThemeToggle } from "./theme-toggle";

export function BlogNavbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 backdrop-blur-md"
      style={{
        background: "var(--navbar-bg-scrolled, rgba(11, 18, 32, 0.85))",
        borderColor: colors.inkLine,
      }}
    >
      <nav className="container mx-auto flex items-center justify-between h-16 gap-4 px-4 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] rounded-lg p-1"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: colors.brass,
                boxShadow: "0 0 16px rgba(200, 154, 75, 0.25)",
              }}
            >
              <BookOpen size={16} style={{ color: colors.inkBg }} />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-semibold tracking-tight"
                style={{ color: colors.textPrimary, fontFamily: fonts.display }}
              >
                Scryme Journal
              </span>
              <span
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border"
                style={{
                  color: colors.brass,
                  borderColor: colors.brassLine,
                  background: colors.brassDim,
                  fontFamily: fonts.mono,
                }}
              >
                EDITORIAL
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Links & CTAs */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-[rgba(241,233,216,0.05)]"
            style={{
              color: colors.textMuted,
              borderColor: colors.inkLine,
              fontFamily: fonts.mono,
            }}
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Back to Platform</span>
            <span className="sm:hidden">Platform</span>
          </Link>

          <ThemeToggle />

          <Link
            href="/demo"
            className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: colors.brass,
              color: colors.inkBg,
              fontFamily: fonts.body,
              boxShadow: "0 4px 12px rgba(200,154,75,0.2)",
            }}
          >
            <span>Book Demo</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
