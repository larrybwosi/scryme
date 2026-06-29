import type { Metadata } from "next";
import { ShoppingCart, Monitor, Wifi, BarChart2, Package, Receipt, Shield, Repeat2 } from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { PosCheckoutMock } from "@/components/products/pos/pos-checkout-mock";
import { PosOfflineMock } from "@/components/products/pos/pos-offline-mock";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Point of Sale — Scryme",
  description:
    "Scryme POS is a desktop-class point-of-sale built on Tauri, designed for high-volume retail and wholesale with full offline support.",
};

const capabilities = [
  { icon: Monitor, label: "Desktop App (Tauri)" },
  { icon: Wifi, label: "Full Offline Mode" },
  { icon: Receipt, label: "Multi-tender" },
  { icon: Package, label: "Live Inventory Sync" },
  { icon: BarChart2, label: "Shift Reports" },
  { icon: Repeat2, label: "Returns & Exchanges" },
  { icon: Shield, label: "Role Permissions" },
  { icon: ShoppingCart, label: "Layaway & Credit" },
];

export default function PosPage() {
  return (
    <main>
      <ProductHero
        eyebrow="Scryme POS"
        title="A desktop POS that keeps selling — even offline"
        description="Built as a native desktop app (Tauri + React), Scryme POS gives your retail and wholesale staff a fast, reliable checkout experience that never depends on the internet."
        iconSlot={<ShoppingCart className="w-8 h-8 text-white" />}
        accentColor="oklch(0.60 0.18 160)"
      />

      {/* Capabilities */}
      <section className="py-10 bg-surface-2 border-y border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {capabilities.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted"
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 1 — Checkout */}
      <FeatureSection
        eyebrow="Checkout Experience"
        title="Blazing-fast checkout built for volume"
        description="Process a sale in under 5 seconds. Barcode scan, item search, or manual entry — all from a clean interface your staff can learn in minutes. Supports card, cash, mobile pay, and split tender."
        bullets={[
          { text: "Barcode, QR, and manual SKU product lookup" },
          { text: "Split payments across any combination of tender types" },
          { text: "Customer account lookup and store credit redemption" },
          { text: "One-tap discount codes and loyalty point application" },
        ]}
      >
        <PosCheckoutMock />
      </FeatureSection>

      {/* Feature 2 — Offline */}
      <FeatureSection
        eyebrow="Offline First"
        title="Internet down? You&apos;re still open"
        description="Scryme POS stores a complete local copy of inventory, pricing, and customer data. Transactions queue locally and auto-sync the moment connectivity returns — no data loss, ever."
        bullets={[
          { text: "Full SQLite database cached locally on every terminal" },
          { text: "Conflict-free sync using CRDT-based merge strategy" },
          { text: "Queue visibility lets managers see pending uploads in real time" },
          { text: "Supports up to 72 hours of uninterrupted offline operation" },
        ]}
        reverse
        dark
      >
        <PosOfflineMock />
      </FeatureSection>

      {/* Feature 3 — Inventory sync visual */}
      <FeatureSection
        eyebrow="Live Inventory Sync"
        title="Every sale updates stock in real time"
        description="Scryme POS is natively connected to the Inventory module. Every checkout immediately reflects on the warehouse stock count, reorder triggers, and supplier dashboards — no manual reconciliation."
        bullets={[
          { text: "Sub-second inventory deduction on each completed sale" },
          { text: "Low-stock alerts surfaced directly on the POS terminal" },
          { text: "Multi-location stock transfer initiated from the POS" },
          { text: "End-of-day reconciliation report auto-generated on close" },
        ]}
      >
        {/* inline mock panel */}
        <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2">
            <span className="text-xs font-semibold text-foreground">Stock movement — today</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
              Live
            </span>
          </div>
          <div className="px-4 py-4 space-y-2">
            {[
              { name: "Premium Coffee Beans 1kg", sold: 24, stock: 76, status: "ok" },
              { name: "Organic Earl Grey Tea", sold: 12, stock: 14, status: "low" },
              { name: "Stainless Travel Mug", sold: 8, stock: 31, status: "ok" },
              { name: "French Press 600ml", sold: 5, stock: 3, status: "critical" },
              { name: "Cold Brew Concentrate", sold: 19, stock: 52, status: "ok" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted">{item.sold} sold today</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{item.stock} left</p>
                  <span
                    className={`text-[10px] font-semibold ${
                      item.status === "critical"
                        ? "text-red-500"
                        : item.status === "low"
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {item.status === "critical" ? "Reorder now" : item.status === "low" ? "Low stock" : "In stock"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {/* Deep features grid */}
      <section className="py-20 bg-surface-2 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Built for serious retail
            </p>
            <h2 className="text-3xl font-bold text-foreground text-balance">
              Every edge case, already handled
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Multi-register Support",
                desc: "Run any number of terminals per location. Each syncs independently and merges conflict-free.",
              },
              {
                title: "Returns & Exchanges",
                desc: "Process full or partial returns with or without a receipt. Stock is automatically restocked.",
              },
              {
                title: "Layaway & Deposits",
                desc: "Accept partial payments with automatic hold on stock until balance is cleared.",
              },
              {
                title: "Shift Management",
                desc: "Open and close tills, assign floats, and generate shift reconciliation reports per cashier.",
              },
              {
                title: "Peripheral Support",
                desc: "Plug-and-play with Epson receipt printers, USB/Bluetooth barcode scanners, and cash drawers.",
              },
              {
                title: "Customer Display",
                desc: "Mirror line items to a second screen or tablet for transparent, branded customer-facing checkout.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-6 hover:border-primary/40 transition-colors"
              >
                <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingCTA />
    </main>
  );
}
