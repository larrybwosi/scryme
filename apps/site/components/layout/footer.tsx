"use client";

import Link from "next/link";
import { BookText, ArrowRight } from "lucide-react";
import { colors, fonts, modules } from "@/lib/scryme-tokens";

const otherLinks = {
  company: {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Blog", href: "/blog" },
      { name: "Press", href: "/press" },
      { name: "Contact", href: "/contact" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/api" },
      { name: "Integrations", href: "/integrations" },
      { name: "Status", href: "/status" },
      { name: "Changelog", href: "/changelog" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Security", href: "/security" },
    ],
  },
};

export function Footer() {
  return (
    <footer
      style={{ background: colors.inkBg, color: colors.textPrimary }}
      aria-label="Site footer"
    >
      <div className="container mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: colors.brass }}
              >
                <BookText size={16} style={{ color: colors.inkBg }} />
              </div>
              <span
                className="text-xl font-medium tracking-tight"
                style={{ color: colors.textPrimary, fontFamily: fonts.display }}
              >
                Scryme
              </span>
            </Link>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              One ledger for CRM, Point of Sale, Inventory, and Finance — every
              entry reconciled the moment it's made, so every team reads from
              the same record.
            </p>

            <div className="w-full max-w-sm">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: colors.textFaint, fontFamily: fonts.mono }}
              >
                Product updates
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    background: colors.inkPanel,
                    border: `1px solid ${colors.inkLine}`,
                    color: colors.textPrimary,
                    fontFamily: fonts.body,
                  }}
                  aria-label="Email for product updates"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md transition-opacity hover:opacity-90 shrink-0"
                  style={{ background: colors.brass, color: colors.inkBg }}
                  aria-label="Subscribe"
                >
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </div>

          {/* Products column — reuses the manifest's ticker codes */}
          <div className="text-center md:text-left">
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: colors.textFaint, fontFamily: fonts.mono }}
            >
              Products
            </h3>
            <ul className="space-y-2.5">
              {modules.map((m) => (
                <li key={m.code}>
                  <Link
                    href={m.href}
                    className="text-sm transition-colors inline-flex items-center gap-2 justify-center md:justify-start hover:opacity-100"
                    style={{ color: colors.textMuted, fontFamily: fonts.body }}
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: m.accent, fontFamily: fonts.mono }}
                    >
                      {m.code}
                    </span>
                    {m.name.split(" ").slice(0, 2).join(" ")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Other link columns */}
          {Object.values(otherLinks).map((section) => (
            <div key={section.title} className="text-center md:text-left">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: colors.textFaint, fontFamily: fonts.mono }}
              >
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{
                        color: colors.textMuted,
                        fontFamily: fonts.body,
                      }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: `1px solid ${colors.inkLine}` }}>
        <div className="container mx-auto py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs"
            style={{ color: colors.textFaint, fontFamily: fonts.mono }}
          >
            &copy; {new Date().getFullYear()} Scryme Technologies Ltd. All
            rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Security"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-xs transition-colors"
                style={{ color: colors.textFaint, fontFamily: fonts.body }}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
