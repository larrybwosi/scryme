"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, BookText, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { captureCtaClicked } from "@/lib/posthog-tracking";
import { colors, fonts, modules } from "@/lib/scryme-tokens";

const productLinks = modules.slice(0, 4);

const navLinks = [
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
];

const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";

function captureNavigationCta(
  ctaLabel: string,
  destination: string,
  ctaType: "signin" | "signup",
) {
  captureCtaClicked("navigation_cta_clicked", {
    location: "navbar",
    cta_label: ctaLabel,
    destination,
    cta_type: ctaType,
  });
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(11,18,32,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled
          ? `1px solid ${colors.inkLine}`
          : "1px solid transparent",
      }}
    >
      <nav className="container mx-auto flex items-center h-16 gap-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => setMobileOpen(false)}
        >
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

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 flex-1">
          <div className="relative">
            <button
              className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
              onClick={() => setProductsOpen(!productsOpen)}
              aria-expanded={productsOpen}
              aria-haspopup="true"
            >
              Products
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  productsOpen && "rotate-180",
                )}
              />
            </button>

            <div
              className="absolute top-full left-0 mt-1 w-80 rounded-xl p-2 transition-all duration-200"
              style={{
                background: colors.inkPanelAlt,
                border: `1px solid ${colors.inkLine}`,
                boxShadow: "0 24px 48px -12px rgba(0,0,0,0.6)",
                opacity: productsOpen ? 1 : 0,
                transform: productsOpen ? "translateY(0)" : "translateY(-8px)",
                pointerEvents: productsOpen ? "auto" : "none",
              }}
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
              role="menu"
            >
              {productLinks.map((product) => (
                <Link
                  key={product.code}
                  href={product.href}
                  role="menuitem"
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[rgba(241,233,216,0.04)]"
                  onClick={() => setProductsOpen(false)}
                >
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${product.accent}1A` }}
                  >
                    <span
                      className="text-[10px] font-semibold tracking-wider"
                      style={{ color: product.accent, fontFamily: fonts.mono }}
                    >
                      {product.code}
                    </span>
                  </div>
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: fonts.body,
                      }}
                    >
                      {product.name}
                    </div>
                    <div
                      className="text-xs mt-0.5 leading-relaxed"
                      style={{
                        color: colors.textFaint,
                        fontFamily: fonts.body,
                      }}
                    >
                      {product.description}
                    </div>
                  </div>
                </Link>
              ))}
              <div
                className="mt-2 pt-2 px-3 pb-1"
                style={{ borderTop: `1px solid ${colors.inkLine}` }}
              >
                <Link
                  href="/products"
                  className="text-xs font-medium hover:underline flex items-center gap-1"
                  style={{ color: colors.brass, fontFamily: fonts.mono }}
                  onClick={() => setProductsOpen(false)}
                >
                  View all modules
                  <ArrowUpRight size={11} />
                </Link>
              </div>
            </div>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <Link
            href={`${webUrl}/login`}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
            onClick={() =>
              captureNavigationCta("Sign in", `${webUrl}/login`, "signin")
            }
          >
            Sign in
          </Link>
          <Link
            href={`${webUrl}/sign-up`}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              background: colors.brass,
              color: colors.inkBg,
              fontFamily: fonts.body,
            }}
            onClick={() =>
              captureNavigationCta("Get started", `${webUrl}/sign-up`, "signup")
            }
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden ml-auto p-2 rounded-md transition-colors"
          style={{ color: colors.textPrimary }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className="lg:hidden overflow-y-auto transition-all duration-300"
        style={{
          background: "rgba(11,18,32,0.97)",
          backdropFilter: "blur(10px)",
          borderTop: `1px solid ${colors.inkLine}`,
          maxHeight: mobileOpen ? "calc(100vh - 64px)" : 0,
          opacity: mobileOpen ? 1 : 0,
        }}
        aria-hidden={!mobileOpen}
      >
        <div className="container mx-auto py-4 flex flex-col gap-1">
          <div
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1"
            style={{ color: colors.textFaint, fontFamily: fonts.mono }}
          >
            Products
          </div>
          {productLinks.map((product) => (
            <Link
              key={product.code}
              href={product.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[rgba(241,233,216,0.04)]"
              onClick={() => setMobileOpen(false)}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${product.accent}1A` }}
              >
                <span
                  className="text-[9px] font-semibold"
                  style={{ color: product.accent, fontFamily: fonts.mono }}
                >
                  {product.code}
                </span>
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: colors.textPrimary, fontFamily: fonts.body }}
              >
                {product.name}
              </span>
            </Link>
          ))}

          <div
            className="my-2"
            style={{ borderTop: `1px solid ${colors.inkLine}` }}
          />

          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: colors.textPrimary, fontFamily: fonts.body }}
              onClick={() => setMobileOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          <div
            className="mt-2 pt-4 flex flex-col gap-2"
            style={{ borderTop: `1px solid ${colors.inkLine}` }}
          >
            <Link
              href={`${webUrl}/login`}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-center transition-colors"
              style={{
                color: colors.textPrimary,
                border: `1px solid ${colors.inkLine}`,
                fontFamily: fonts.body,
              }}
              onClick={() => {
                captureNavigationCta("Sign in", `${webUrl}/login`, "signin");
                setMobileOpen(false);
              }}
            >
              Sign in
            </Link>
            <Link
              href={`${webUrl}/sign-up`}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-center transition-opacity hover:opacity-90"
              style={{
                background: colors.brass,
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
              onClick={() => {
                captureNavigationCta("Get started", `${webUrl}/sign-up`, "signup");
                setMobileOpen(false);
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
