"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

const footerLinks = {
  products: {
    title: "Products",
    links: [
      { name: "CRM", href: "/products/crm" },
      { name: "Point of Sale", href: "/products/pos" },
      { name: "Inventory", href: "/products/inventory" },
      { name: "Finance", href: "/products/finance" },
      { name: "Analytics", href: "/products/analytics" },
    ],
  },
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
      className="text-white"
      style={{ background: "var(--site-dark)" }}
      aria-label="Site footer"
    >
      {/* Main footer content */}
      <div className="container mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
                <Building2 size={16} className="text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Scryme
              </span>
            </Link>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: "var(--site-dark-muted)" }}
            >
              The enterprise platform that unifies your CRM, Point of Sale,
              Inventory, and Finance — giving every team a single source of
              truth.
            </p>

            {/* Newsletter CTA */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--site-dark-muted)" }}
              >
                Product updates
              </p>
              <form
                className="flex gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 px-3 py-2 rounded-md text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-primary"
                  style={{
                    background: "var(--site-dark-surface)",
                    border: "1px solid var(--site-dark-border)",
                  }}
                  aria-label="Email for product updates"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shrink-0"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-white">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: "var(--site-dark-muted)" }}
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
      <div
        className="border-t"
        style={{ borderColor: "var(--site-dark-border)" }}
      >
        <div className="container mx-auto py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs"
            style={{ color: "var(--site-dark-muted)" }}
          >
            &copy; {new Date().getFullYear()} Scryme Technologies Ltd. All
            rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Security"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-xs transition-colors hover:text-white"
                style={{ color: "var(--site-dark-muted)" }}
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
