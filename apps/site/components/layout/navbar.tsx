"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  BookText,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Store,
  Terminal,
  FileText,
  Puzzle,
  Activity,
  Sparkles,
  ArrowRight,
  Users,
  BarChart3,
  Globe2,
  Cpu,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { captureCtaClicked } from "@/lib/posthog-tracking";
import { colors, fonts, modules } from "@/lib/scryme-tokens";
import { ThemeToggle } from "./theme-toggle";

const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";

function captureNavigationCta(
  ctaLabel: string,
  destination: string,
  ctaType: "signin" | "signup" | "primary" | "secondary",
) {
  captureCtaClicked("navigation_cta_clicked", {
    location: "navbar",
    cta_label: ctaLabel,
    destination,
    cta_type: ctaType,
  });
}

const solutionLinks = [
  {
    name: "Multi-Branch Retail",
    description: "Unify POS, inventory balances, and register shifts across physical stores.",
    href: "/products/inventory",
    icon: Store,
  },
  {
    name: "Offline-First Commerce",
    description: "Continue ringing transactions during network outages with zero data loss.",
    href: "/products/pos",
    icon: Cpu,
  },
  {
    name: "Automated Storefronts",
    description: "Launch client e-commerce websites automatically synced with stock.",
    href: "/products/crm",
    icon: Globe2,
  },
  {
    name: "Enterprise ERP & Ledger",
    description: "Consolidated multi-store reporting, global audit trails, and financial balance sheets.",
    href: "/products/finance",
    icon: Layers,
  },
];

const resourceLinks = [
  {
    name: "Developer Portal & Auth",
    description: "Manage V3 API keys, 'Sign in with Scryme' OAuth credentials, and webhooks.",
    href: "/developer",
    icon: Lock,
  },
  {
    name: "Documentation",
    description: "Guides and architecture specs for deploying Scryme.",
    href: "/docs",
    icon: FileText,
  },
  {
    name: "API Reference",
    description: "Full OpenAPI specs, webhooks, and REST/M2M client SDKs.",
    href: "/api",
    icon: Terminal,
  },
  {
    name: "Ecosystem Integrations",
    description: "Native connections to Windmill flows, RabbitMQ streams, and identity.",
    href: "/integrations",
    icon: Puzzle,
  },
  {
    name: "Product Changelog",
    description: "Latest releases, platform enhancements, and engine updates.",
    href: "/changelog",
    icon: Sparkles,
  },
  {
    name: "Platform Status",
    description: "Real-time engine uptime, latency, and service availability.",
    href: "/status",
    icon: Activity,
  },
  {
    name: "Scryme Journal",
    description: "Editorial articles on retail engineering and business scale.",
    href: "/blog",
    icon: BookText,
  },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"products" | "solutions" | "resources" | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<"products" | "solutions" | "resources" | null>("products");

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const handleOpenMenu = useCallback((menu: "products" | "solutions" | "resources") => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setActiveMenu(menu);
  }, []);

  const handleCloseMenu = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  }, []);

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

  // Handle outside click and Escape key dismissal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "var(--navbar-bg-scrolled)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? `1px solid ${colors.inkLine}`
          : "1px solid transparent",
      }}
    >
      <nav
        ref={navRef}
        className="container mx-auto flex items-center h-16 gap-6 px-4 lg:px-8"
        aria-label="Main Navigation"
      >
        {/* Brand & Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] rounded-lg p-1"
          onClick={() => {
            setActiveMenu(null);
            setMobileOpen(false);
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: `linear-[#C89A4B], ${colors.brass}`,
              backgroundColor: colors.brass,
              boxShadow: "0 0 16px rgba(200, 154, 75, 0.25)",
            }}
          >
            <BookText size={17} style={{ color: colors.inkBg }} />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: colors.textPrimary, fontFamily: fonts.display }}
            >
              Scryme
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
              ENTERPRISE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1 flex-1 ml-4">
          {/* Products Mega Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleOpenMenu("products")}
            onMouseLeave={handleCloseMenu}
          >
            <button
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B]",
                activeMenu === "products" ? "text-[#F1E9D8]" : "text-[rgba(241,233,216,0.7)] hover:text-[#F1E9D8]"
              )}
              style={{ fontFamily: fonts.body }}
              onClick={() => setActiveMenu(activeMenu === "products" ? null : "products")}
              aria-expanded={activeMenu === "products"}
              aria-haspopup="true"
            >
              Products
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  activeMenu === "products" && "rotate-180 text-[#C89A4B]"
                )}
              />
            </button>

            {/* Products Mega Dropdown Container */}
            <div
              className={cn(
                "absolute top-full left-0 mt-2 w-[780px] rounded-2xl p-6 transition-all duration-200 grid grid-cols-12 gap-6",
                activeMenu === "products"
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              )}
              style={{
                background: colors.inkPanelAlt,
                border: `1px solid ${colors.inkLine}`,
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.85)",
              }}
              role="menu"
            >
              {/* Product Modules Grid (8 cols) */}
              <div className="col-span-8 grid grid-cols-2 gap-3">
                <div
                  className="col-span-2 text-[11px] font-semibold uppercase tracking-widest pb-1 border-b"
                  style={{ color: colors.textFaint, borderColor: colors.inkLine, fontFamily: fonts.mono }}
                >
                  Core Operating Suite
                </div>
                {modules.map((product) => (
                  <Link
                    key={product.code}
                    href={product.href}
                    role="menuitem"
                    className="flex items-start gap-3 p-2.5 rounded-xl transition-all hover:bg-[rgba(241,233,216,0.04)] hover:scale-[1.01]"
                    onClick={() => setActiveMenu(null)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${product.accent}1F`, border: `1px solid ${product.accent}33` }}
                    >
                      <span
                        className="text-[10px] font-bold tracking-wider"
                        style={{ color: product.accent, fontFamily: fonts.mono }}
                      >
                        {product.code}
                      </span>
                    </div>
                    <div>
                      <div
                        className="text-xs font-semibold"
                        style={{ color: colors.textPrimary, fontFamily: fonts.body }}
                      >
                        {product.name}
                      </div>
                      <div
                        className="text-[11px] mt-0.5 leading-snug line-clamp-2"
                        style={{ color: colors.textMuted, fontFamily: fonts.body }}
                      >
                        {product.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Enterprise Callout Panel (4 cols) */}
              <div
                className="col-span-4 rounded-xl p-4 flex flex-col justify-between border"
                style={{
                  background: "linear-gradient(135deg, rgba(200,154,75,0.08) 0%, rgba(18,27,46,0.6) 100%)",
                  borderColor: colors.brassLine,
                }}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider mb-2 text-[#C89A4B]">
                    <ShieldCheck size={13} />
                    Platform Engine
                  </div>
                  <h4
                    className="text-sm font-semibold mb-1.5"
                    style={{ color: colors.textPrimary, fontFamily: fonts.display }}
                  >
                    Scryme Operating Ledger v3.0
                  </h4>
                  <p
                    className="text-[11px] leading-relaxed mb-4"
                    style={{ color: colors.textMuted, fontFamily: fonts.body }}
                  >
                    Real-time reconciliation across physical retail branches, inventory stock, and automated digital storefronts.
                  </p>
                </div>

                <Link
                  href="/products"
                  className="inline-flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-lg transition-colors bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859]"
                  onClick={() => setActiveMenu(null)}
                >
                  <span>View All Modules</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* Solutions Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleOpenMenu("solutions")}
            onMouseLeave={handleCloseMenu}
          >
            <button
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B]",
                activeMenu === "solutions" ? "text-[#F1E9D8]" : "text-[rgba(241,233,216,0.7)] hover:text-[#F1E9D8]"
              )}
              style={{ fontFamily: fonts.body }}
              onClick={() => setActiveMenu(activeMenu === "solutions" ? null : "solutions")}
              aria-expanded={activeMenu === "solutions"}
              aria-haspopup="true"
            >
              Solutions
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  activeMenu === "solutions" && "rotate-180 text-[#C89A4B]"
                )}
              />
            </button>

            <div
              className={cn(
                "absolute top-full left-0 mt-2 w-[520px] rounded-2xl p-5 transition-all duration-200 grid grid-cols-2 gap-3",
                activeMenu === "solutions"
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              )}
              style={{
                background: colors.inkPanelAlt,
                border: `1px solid ${colors.inkLine}`,
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.85)",
              }}
              role="menu"
            >
              <div
                className="col-span-2 text-[11px] font-semibold uppercase tracking-widest pb-1 border-b"
                style={{ color: colors.textFaint, borderColor: colors.inkLine, fontFamily: fonts.mono }}
              >
                Capabilities & Use Cases
              </div>
              {solutionLinks.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    role="menuitem"
                    className="flex items-start gap-3 p-2.5 rounded-xl transition-all hover:bg-[rgba(241,233,216,0.04)]"
                    onClick={() => setActiveMenu(null)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: colors.brassDim, border: `1px solid ${colors.brassLine}` }}
                    >
                      <IconComponent size={15} style={{ color: colors.brass }} />
                    </div>
                    <div>
                      <div
                        className="text-xs font-semibold"
                        style={{ color: colors.textPrimary, fontFamily: fonts.body }}
                      >
                        {item.name}
                      </div>
                      <div
                        className="text-[11px] mt-0.5 leading-relaxed"
                        style={{ color: colors.textMuted, fontFamily: fonts.body }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Resources Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleOpenMenu("resources")}
            onMouseLeave={handleCloseMenu}
          >
            <button
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B]",
                activeMenu === "resources" ? "text-[#F1E9D8]" : "text-[rgba(241,233,216,0.7)] hover:text-[#F1E9D8]"
              )}
              style={{ fontFamily: fonts.body }}
              onClick={() => setActiveMenu(activeMenu === "resources" ? null : "resources")}
              aria-expanded={activeMenu === "resources"}
              aria-haspopup="true"
            >
              Resources
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  activeMenu === "resources" && "rotate-180 text-[#C89A4B]"
                )}
              />
            </button>

            <div
              className={cn(
                "absolute top-full left-0 mt-2 w-[540px] rounded-2xl p-5 transition-all duration-200 grid grid-cols-2 gap-3",
                activeMenu === "resources"
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              )}
              style={{
                background: colors.inkPanelAlt,
                border: `1px solid ${colors.inkLine}`,
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.85)",
              }}
              role="menu"
            >
              <div
                className="col-span-2 text-[11px] font-semibold uppercase tracking-widest pb-1 border-b"
                style={{ color: colors.textFaint, borderColor: colors.inkLine, fontFamily: fonts.mono }}
              >
                Developer Hub & Community
              </div>
              {resourceLinks.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    role="menuitem"
                    className="flex items-start gap-3 p-2.5 rounded-xl transition-all hover:bg-[rgba(241,233,216,0.04)]"
                    onClick={() => setActiveMenu(null)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(241,233,216,0.06)", border: `1px solid ${colors.inkLine}` }}
                    >
                      <IconComponent size={15} style={{ color: colors.paper }} />
                    </div>
                    <div>
                      <div
                        className="text-xs font-semibold"
                        style={{ color: colors.textPrimary, fontFamily: fonts.body }}
                      >
                        {item.name}
                      </div>
                      <div
                        className="text-[11px] mt-0.5 leading-relaxed"
                        style={{ color: colors.textMuted, fontFamily: fonts.body }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <Link
            href="/pricing"
            className="px-3 py-2 rounded-md text-sm font-medium text-[rgba(241,233,216,0.7)] hover:text-[#F1E9D8] transition-colors"
            style={{ fontFamily: fonts.body }}
            onClick={() => setActiveMenu(null)}
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="px-3 py-2 rounded-md text-sm font-medium text-[rgba(241,233,216,0.7)] hover:text-[#F1E9D8] transition-colors"
            style={{ fontFamily: fonts.body }}
            onClick={() => setActiveMenu(null)}
          >
            About
          </Link>
        </div>

        {/* Right Action Bar */}
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          {/* Platform Uptime Indicator */}
          <Link
            href="/status"
            className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs transition-colors hover:bg-[rgba(241,233,216,0.05)] border"
            style={{
              borderColor: colors.inkLine,
              color: colors.textMuted,
              fontFamily: fonts.mono,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">Engine Operational</span>
          </Link>

          <ThemeToggle />

          <Link
            href={`${webUrl}/login`}
            className="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors text-[rgba(241,233,216,0.8)] hover:text-[#F1E9D8]"
            style={{ fontFamily: fonts.body }}
            onClick={() => captureNavigationCta("Sign in", `${webUrl}/login`, "signin")}
          >
            Sign in
          </Link>

          <Link
            href="/demo"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: colors.brass,
              color: colors.inkBg,
              fontFamily: fonts.body,
              boxShadow: "0 4px 14px rgba(200,154,75,0.25)",
            }}
            onClick={() => captureNavigationCta("Book a demo", "/demo", "primary")}
          >
            <span>Book a Demo</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="lg:hidden ml-auto p-2 rounded-lg transition-colors hover:bg-[rgba(241,233,216,0.05)]"
          style={{ color: colors.textPrimary }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close main navigation menu" : "Open main navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "lg:hidden overflow-y-auto transition-all duration-300 border-t",
          mobileOpen ? "max-h-[calc(100vh-64px)] opacity-100 py-6" : "max-h-0 opacity-0 py-0"
        )}
        style={{
          background: "var(--mobile-menu-bg, #0B1220)",
          backdropFilter: "blur(16px)",
          borderColor: colors.inkLine,
        }}
        aria-hidden={!mobileOpen}
      >
        <div className="container mx-auto px-6 flex flex-col gap-6">
          {/* Mobile Accordion Controls */}
          <div className="flex flex-col gap-2">
            {/* Products Accordion */}
            <button
              className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider py-2"
              style={{ color: colors.brass, fontFamily: fonts.mono }}
              onClick={() => setMobileAccordion(mobileAccordion === "products" ? null : "products")}
            >
              <span>Products Suite</span>
              <ChevronDown
                size={15}
                className={cn("transition-transform", mobileAccordion === "products" && "rotate-180")}
              />
            </button>
            {mobileAccordion === "products" && (
              <div className="grid grid-cols-1 gap-2 pl-2 border-l" style={{ borderColor: colors.inkLine }}>
                {modules.map((m) => (
                  <Link
                    key={m.code}
                    href={m.href}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(241,233,216,0.04)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                      style={{ color: m.accent, background: `${m.accent}1F` }}
                    >
                      {m.code}
                    </span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {m.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Solutions Accordion */}
            <button
              className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider py-2 mt-2"
              style={{ color: colors.brass, fontFamily: fonts.mono }}
              onClick={() => setMobileAccordion(mobileAccordion === "solutions" ? null : "solutions")}
            >
              <span>Solutions</span>
              <ChevronDown
                size={15}
                className={cn("transition-transform", mobileAccordion === "solutions" && "rotate-180")}
              />
            </button>
            {mobileAccordion === "solutions" && (
              <div className="grid grid-cols-1 gap-2 pl-2 border-l" style={{ borderColor: colors.inkLine }}>
                {solutionLinks.map((s) => (
                  <Link
                    key={s.name}
                    href={s.href}
                    className="p-2 text-sm font-medium text-[rgba(241,233,216,0.8)] hover:text-[#F1E9D8]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Resources Accordion */}
            <button
              className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider py-2 mt-2"
              style={{ color: colors.brass, fontFamily: fonts.mono }}
              onClick={() => setMobileAccordion(mobileAccordion === "resources" ? null : "resources")}
            >
              <span>Resources</span>
              <ChevronDown
                size={15}
                className={cn("transition-transform", mobileAccordion === "resources" && "rotate-180")}
              />
            </button>
            {mobileAccordion === "resources" && (
              <div className="grid grid-cols-1 gap-2 pl-2 border-l" style={{ borderColor: colors.inkLine }}>
                {resourceLinks.map((r) => (
                  <Link
                    key={r.name}
                    href={r.href}
                    className="p-2 text-sm font-medium text-[rgba(241,233,216,0.8)] hover:text-[#F1E9D8]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Static Nav Links */}
            <div className="flex flex-col gap-1 mt-4 pt-4 border-t" style={{ borderColor: colors.inkLine }}>
              <Link
                href="/pricing"
                className="py-2 text-sm font-medium text-[#F1E9D8]"
                onClick={() => setMobileOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="py-2 text-sm font-medium text-[#F1E9D8]"
                onClick={() => setMobileOpen(false)}
              >
                About Scryme
              </Link>
            </div>
          </div>

          {/* Mobile Footer CTAs */}
          <div className="flex flex-col gap-3 pt-4 border-t" style={{ borderColor: colors.inkLine }}>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-mono uppercase text-[rgba(241,233,216,0.6)]">Theme Mode</span>
              <ThemeToggle />
            </div>

            <Link
              href={`${webUrl}/login`}
              className="w-full text-center py-2.5 rounded-lg text-sm font-medium border text-[#F1E9D8]"
              style={{ borderColor: colors.inkLine }}
              onClick={() => {
                captureNavigationCta("Sign in", `${webUrl}/login`, "signin");
                setMobileOpen(false);
              }}
            >
              Sign in to Console
            </Link>

            <Link
              href="/demo"
              className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-[#C89A4B] text-[#0B1220]"
              onClick={() => {
                captureNavigationCta("Book a demo", "/demo", "primary");
                setMobileOpen(false);
              }}
            >
              Book an Enterprise Demo
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
