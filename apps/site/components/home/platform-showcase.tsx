"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layout,
  ShoppingCart,
  Package,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Building2,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { MockFrame } from "@/components/ui/mock-frame";
import { Badge } from "@/components/ui/badge";
import { modules } from "@/lib/scryme-tokens";

const ICONS: Record<string, typeof Layout> = {
  CRM: Layout,
  POS: ShoppingCart,
  INV: Package,
  FIN: ShieldAlert,
};

const tabs = modules.slice(0, 4).map((m) => ({
  id: m.code,
  label: m.name,
  code: m.code,
  accent: m.accent,
  icon: ICONS[m.code],
  description: m.description,
}));

function StatusBadge({
  tone,
  label,
}: {
  tone: "positive" | "warn" | "negative" | "info";
  label: string;
}) {
  const map = {
    positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    negative: "bg-red-500/10 text-red-400 border-red-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${map[tone]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {label}
    </span>
  );
}

function CRMMockUI() {
  const columns = [
    {
      title: "Pipeline Lead Stage",
      count: 4,
      cards: [
        { name: "Urban Threads Store", source: "Online Sign-up", value: "$12,400", time: "10m ago" },
        { name: "Veloce Wholesalers", source: "Inbound Email", value: "$45,000", time: "1h ago" },
      ],
    },
    {
      title: "Contract Negotiating",
      count: 2,
      cards: [
        { name: "Apex Sports Hub", source: "Enterprise Lead", value: "$98,000", time: "4h ago" },
        { name: "Glow Cosmetics", source: "Partner Referral", value: "$24,500", time: "1d ago" },
      ],
    },
    {
      title: "Provisioned Storefronts",
      count: 3,
      cards: [
        { name: "Meridian Boutique", source: "Custom Domain", value: "$15,200", time: "2d ago" },
      ],
    },
    {
      title: "Active Accounts",
      count: 42,
      cards: [
        { name: "Fontaine Direct", source: "Custom Domain", value: "$120,000", time: "Active" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              readOnly
              value="Filter contacts & deal stages..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-background border border-border text-foreground focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--brass)] text-white font-semibold shadow-xs">
            <Plus size={13} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2.5 min-w-0 bg-black/20 p-3 rounded-xl border border-border/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-white truncate">{col.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-card border border-border text-[var(--brass)] font-bold">
                {col.count}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.cards.map((card) => (
                <div
                  key={card.name}
                  className="rounded-lg p-3 bg-card border border-border/80 hover:border-[var(--brass)]/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate">{card.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{card.time}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">{card.source}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-xs font-mono font-bold text-[var(--brass)]">{card.value}</span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <TrendingUp size={12} />
                      <span>92%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function POSMockUI() {
  const items = [
    { name: "Premium Ergonomic Chair", sku: "CHR-109", qty: 1, price: 299.0 },
    { name: "Wireless Mechanical Keyboard", sku: "KBD-044", qty: 2, price: 129.99 },
  ];
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="grid lg:grid-cols-12 gap-5 h-full">
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--brass)]">
              REGISTER #03
            </span>
            <span className="text-xs text-muted-foreground">&bull;</span>
            <span className="text-xs font-medium text-white">Westfield Branch</span>
          </div>
          <StatusBadge tone="positive" label="OFFLINE SYNC READY" />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.sku}
              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--brass-dim)] border border-[var(--brass-line)] flex items-center justify-center shrink-0">
                  <Package size={15} className="text-[var(--brass)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{item.name}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    {item.sku} &bull; ${item.price.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  x{item.qty}
                </span>
                <span className="text-xs font-mono font-bold text-white min-w-[70px] text-right">
                  ${(item.qty * item.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-card border border-border/80 space-y-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-3">
            Transaction Summary
          </span>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (8% VAT)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-between text-base font-bold text-white">
              <span>Total</span>
              <span className="text-[var(--brass)]">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button className="w-full py-3 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg">
          <CreditCard size={15} />
          <span>Process Card / Tap</span>
        </button>
      </div>
    </div>
  );
}

function InventoryMockUI() {
  const rows = [
    { sku: "CHR-109", name: "Premium Ergonomic Chair", branch: "Westfield Branch", stock: 14, low: false },
    { sku: "CHR-109", name: "Premium Ergonomic Chair", branch: "Solis Outlet", stock: 3, low: true },
    { sku: "KBD-044", name: "Wireless Mech Keyboard", branch: "Westfield Branch", stock: 45, low: false },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--brass)]">
          Multi-Branch Stock Balance Ledger
        </span>
        <StatusBadge tone="info" label="Auto-Sync Active" />
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/40 text-[11px] font-mono uppercase text-muted-foreground">
            <th className="py-2 px-3">SKU</th>
            <th className="py-2 px-3">Product Title</th>
            <th className="py-2 px-3">Location</th>
            <th className="py-2 px-3">Balance</th>
            <th className="py-2 px-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20 text-xs">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-white/5 transition-colors">
              <td className="py-2.5 px-3 font-mono font-semibold text-[var(--brass)]">{row.sku}</td>
              <td className="py-2.5 px-3 font-semibold text-white">{row.name}</td>
              <td className="py-2.5 px-3 text-muted-foreground">{row.branch}</td>
              <td className="py-2.5 px-3 font-mono font-bold text-white">{row.stock} units</td>
              <td className="py-2.5 px-3 text-right">
                <StatusBadge
                  tone={row.stock === 0 ? "negative" : row.low ? "warn" : "positive"}
                  label={row.stock === 0 ? "Out of Stock" : row.low ? "Low Stock" : "In Stock"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FinanceMockUI() {
  const metrics = [
    { label: "Westfield Branch Sales", value: "$184,320", change: "+14.2%" },
    { label: "Solis Outlet Sales", value: "$96,150", change: "+8.5%" },
    { label: "Automated Storefront", value: "$61,380", change: "+24.8%" },
    { label: "Consolidated Total", value: "$341,850", change: "+15.3%" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="p-3.5 rounded-xl bg-card border border-border/80">
            <span className="text-[11px] font-mono text-muted-foreground block mb-1 truncate">{m.label}</span>
            <div className="text-lg font-mono font-bold text-white">{m.value}</div>
            <span className="text-[10px] font-mono font-semibold text-emerald-400 mt-1 inline-block">{m.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const mockUIs: Record<string, React.ReactNode> = {
  CRM: <CRMMockUI />,
  POS: <POSMockUI />,
  INV: <InventoryMockUI />,
  FIN: <FinanceMockUI />,
};

export function PlatformShowcase() {
  const [activeTab, setActiveTab] = useState("CRM");

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-[var(--site-dark)] text-white">
      <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
        <SectionHeader
          eyebrow="Real-Time Workspace"
          title="Unified Operating Suite. Zero Sync Delays."
          description="Every store shift, customer order, inventory movement, and invoice posts immediately to the global ledger."
          align="center"
        />

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--site-dark-card)] border-[var(--brass)] shadow-lg scale-[1.02]"
                    : "bg-[var(--site-dark-surface)]/60 border-[var(--site-dark-border)] hover:border-white/20"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    isSelected ? "bg-[var(--brass)] text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5 text-[var(--brass)]">
                  MODULE {tab.code}
                </span>
                <span className="text-sm font-bold text-white truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mock UI Frame */}
        <MockFrame title={`Scryme Ledger Workspace — ${activeTab}`} variant="dark">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[360px]"
            >
              {mockUIs[activeTab]}
            </motion.div>
          </AnimatePresence>
        </MockFrame>
      </div>
    </section>
  );
}
