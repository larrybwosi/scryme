"use client";

import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { ThemeToggle } from "./theme-toggle";

export function BlogNavbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 backdrop-blur-md"
      style={{
        background: "var(--ink-bg, rgba(11,18,32,0.92))",
        borderColor: colors.inkLine,
      }}
    >
      <nav className="container mx-auto flex items-center justify-between h-16 gap-4 animate-fade-in">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
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
          <span className="hidden sm:inline-block text-xs uppercase tracking-widest" style={{ color: colors.textFaint, fontFamily: fonts.mono }}>
            · editorial
          </span>
        </div>

        {/* CTAs / ThemeToggle */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-85"
            style={{ color: colors.textMuted, fontFamily: fonts.mono }}
          >
            <ArrowLeft size={13} />
            Back to Platform
          </Link>
        </div>
      </nav>
    </header>
  );
}
