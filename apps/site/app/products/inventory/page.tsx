import type { Metadata } from "next";
import { Package, Truck, AlertTriangle, BarChart2, RefreshCw, Globe, Lock, Layers } from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "Inventory Management — Scryme",
  description:
    "Scryme Inventory gives multi-location businesses real-time stock visibility, automated reorder triggers, and intelligent demand forecasting.",
};

const capabilities = [
  { icon: Package, label: "Multi-location Stock" },
  { icon: Truck, label: "Supplier Management" },
  { icon: AlertTriangle, label: "Reorder Alerts" },
  { icon: BarChart2, label: "Demand Forecasting" },
  { icon: RefreshCw, label: "Stock Transfers" },
  { icon: Globe, label: "Multi-warehouse" },
  { icon: Lock, label: "Audit Trails" },
  { icon: Layers, label: "Variant Tracking" },
];

export default function InventoryPage() {
  return (
    <main>
      <ProductHero
        eyebrow="Scryme Inventory"
        title="Real-time stock control across every location"
        description="Track every SKU, variant, and batch number across warehouses, stores, and in-transit. Scryme Inventory eliminates stockouts and overstocking with data-driven reorder automation."
        iconSlot={<Package className="w-8 h-8 text-white" />}
        accentColor="oklch(0.60 0.16 45)"
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

      {/* Feature 1 — Live stock dashboard */}
      <FeatureSection
        eyebrow="Live Stock Dashboard"
        title="Know exactly what you have — everywhere"
        description="One unified view of all stock across every warehouse, store, and in-transit shipment. Filter by location, supplier, category, or reorder status in seconds."
        bullets={[
          { text: "Real-time stock count updated on every POS sale and goods receipt" },
          { text: "Drill down from total on-hand to individual lot and serial numbers" },
          { text: "Stock valuation using FIFO, LIFO, or weighted-average costing" },
          { text: "CSV and API export for accountants and ERP integrations" },
        ]}
      >
        {/* Mock: stock table */}
        <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2">
            <span className="text-xs font-semibold text-foreground">Stock overview — all locations</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
              Live
            </span>
          </div>
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted px-1 mb-2">
              <span>Product</span>
              <span className="text-right">On Hand</span>
              <span className="text-right">Reserved</span>
              <span className="text-right">Available</span>
            </div>
            {[
              { name: "Coffee Beans 1kg", onHand: 842, reserved: 120, status: "ok" },
              { name: "Earl Grey Tea", onHand: 214, reserved: 60, status: "ok" },
              { name: "Travel Mug", onHand: 38, reserved: 12, status: "low" },
              { name: "French Press 600ml", onHand: 9, reserved: 7, status: "critical" },
              { name: "Cold Brew Conc.", onHand: 521, reserved: 85, status: "ok" },
            ].map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-4 gap-1 items-center rounded-lg px-1 py-2 border-b border-border/50 last:border-0"
              >
                <p className="text-xs text-foreground font-medium truncate">{row.name}</p>
                <p className="text-xs text-right text-foreground font-semibold">{row.onHand}</p>
                <p className="text-xs text-right text-muted">{row.reserved}</p>
                <div className="flex justify-end">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      row.status === "critical"
                        ? "bg-red-500/15 text-red-500"
                        : row.status === "low"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-emerald-500/15 text-emerald-500"
                    }`}
                  >
                    {row.onHand - row.reserved}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {/* Feature 2 — Demand forecasting */}
      <FeatureSection
        eyebrow="Demand Forecasting"
        title="Buy the right amount — every time"
        description="Scryme analyses 24 months of sales history, seasonality, and supplier lead times to recommend exactly when and how much to reorder — so you never overstock slow movers or run dry on bestsellers."
        bullets={[
          { text: "ML-based demand model trained on your actual sales data" },
          { text: "Seasonal and trend adjustments with manual override support" },
          { text: "Automatic purchase order generation for approved suppliers" },
          { text: "Cost simulation: see the cash impact of each reorder scenario" },
        ]}
        reverse
        dark
      >
        {/* Mock: forecast card */}
        <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-surface-2">
            <span className="text-xs font-semibold text-foreground">Reorder recommendations — this week</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            {[
              { name: "French Press 600ml", reorder: 50, cost: "$1,250", urgency: "urgent", days: 2 },
              { name: "Travel Mug", reorder: 80, cost: "$2,720", urgency: "soon", days: 6 },
              { name: "Cold Brew Conc.", reorder: 200, cost: "$3,800", urgency: "planned", days: 14 },
            ].map((item) => (
              <div key={item.name} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted">Suggested: {item.reorder} units · {item.cost}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.urgency === "urgent"
                        ? "bg-red-500/15 text-red-500"
                        : item.urgency === "soon"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    {item.urgency === "urgent" ? `${item.days}d left` : item.urgency === "soon" ? `${item.days}d left` : `${item.days}d`}
                  </span>
                </div>
                <button className="w-full text-[11px] font-semibold rounded-md bg-primary/10 text-primary py-1.5 hover:bg-primary/20 transition-colors">
                  Generate purchase order
                </button>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {/* Feature grid */}
      <section className="py-20 bg-surface-2 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Complete control
            </p>
            <h2 className="text-3xl font-bold text-foreground text-balance">
              From receiving dock to customer delivery
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Multi-warehouse Transfers", desc: "Initiate and track inter-location transfers with expected arrival dates and transit status." },
              { title: "Batch & Expiry Tracking", desc: "Mandatory lot numbers and expiry dates for food, pharma, and regulated goods." },
              { title: "Supplier Management", desc: "Store lead times, MOQs, and pricing tiers for each supplier. Compare quotes side by side." },
              { title: "Stock Adjustments", desc: "Audit-logged manual adjustments with reason codes for shrinkage, damage, or cycle counts." },
              { title: "Barcode & QR Printing", desc: "Print labels directly from the inventory module. Supports Zebra and standard label printers." },
              { title: "Cycle Count Workflow", desc: "Schedule rolling cycle counts by category. Mobile-friendly count entry with variance reporting." },
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
