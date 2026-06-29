"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Users2,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const products = [
  {
    name: "CRM",
    description: "Customer relationships & sales pipeline",
    href: "/products/crm",
    icon: Users2,
  },
  {
    name: "Point of Sale",
    description: "Retail & wholesale transactions",
    href: "/products/pos",
    icon: ShoppingCart,
  },
  {
    name: "Inventory",
    description: "Real-time stock & warehouse management",
    href: "/products/inventory",
    icon: Package,
  },
  {
    name: "Finance",
    description: "Accounting, invoicing & reporting",
    href: "/products/finance",
    icon: DollarSign,
  },
];

const navLinks = [
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change or resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto flex items-center h-16 gap-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-primary"
            )}
          >
            <Building2 size={16} className="text-primary-foreground" />
          </div>
          <span
            className={cn(
              "text-xl font-bold tracking-tight transition-colors",
              scrolled ? "text-foreground" : "text-white"
            )}
          >
            Scryme
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 flex-1">
          {/* Products dropdown */}
          <div className="relative group">
            <button
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                scrolled
                  ? "text-foreground hover:bg-accent hover:text-accent-foreground"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
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
                  productsOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            <div
              className={cn(
                "absolute top-full left-0 mt-1 w-72 rounded-xl border border-border bg-card shadow-lg p-2",
                "transition-all duration-200",
                productsOpen
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              )}
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
              role="menu"
            >
              {products.map((product) => {
                const Icon = product.icon;
                return (
                  <Link
                    key={product.name}
                    href={product.href}
                    role="menuitem"
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group/item"
                    onClick={() => setProductsOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-primary/15 transition-colors">
                      <Icon size={15} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {product.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
              <div className="mt-2 pt-2 border-t border-border px-3 pb-1">
                <Link
                  href="/products"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  onClick={() => setProductsOpen(false)}
                >
                  View all products
                  <BarChart3 size={11} />
                </Link>
              </div>
            </div>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                scrolled
                  ? "text-foreground hover:bg-accent hover:text-accent-foreground"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <Link
            href="/login"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              scrolled
                ? "text-foreground hover:bg-accent"
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            Sign in
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            style={{ boxShadow: "var(--shadow-primary)" }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className={cn(
            "lg:hidden ml-auto p-2 rounded-md transition-colors",
            scrolled
              ? "text-foreground hover:bg-accent"
              : "text-white hover:bg-white/10"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden border-t border-border bg-card/95 backdrop-blur-md",
          "transition-all duration-300 overflow-hidden",
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="container mx-auto py-4 flex flex-col gap-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
            Products
          </div>
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <Link
                key={product.name}
                href={product.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {product.name}
                </span>
              </Link>
            );
          })}

          <div className="border-t border-border my-2" />

          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          <div className="border-t border-border mt-2 pt-4 flex flex-col gap-2">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-center text-foreground border border-border hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
