"use client";

import { useState } from "react";
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
  ExternalLink,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { colors, fonts, modules } from "@/lib/scryme-tokens";

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
    positive: { bg: "rgba(16, 185, 129, 0.12)", text: "#10B981", border: "rgba(16, 185, 129, 0.25)" },
    warn: { bg: "rgba(200, 154, 75, 0.12)", text: "#C89A4B", border: "rgba(200, 154, 75, 0.25)" },
    negative: { bg: "rgba(239, 68, 68, 0.12)", text: "#EF4444", border: "rgba(239, 68, 68, 0.25)" },
    info: { bg: "rgba(59, 130, 246, 0.12)", text: "#60A5FA", border: "rgba(59, 130, 246, 0.25)" },
  };
  const conf = map[tone];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border"
      style={{
        background: conf.bg,
        color: conf.text,
        borderColor: conf.border,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: conf.text }} />
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
        { name: "Solaris Botanicals", source: "Demo Request", value: "$8,900", time: "3h ago" },
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
        { name: "Kestrel Outlet", source: "Wholesale Portal", value: "$32,000", time: "3d ago" },
      ],
    },
    {
      title: "Active Accounts",
      count: 42,
      cards: [
        { name: "Fontaine Direct", source: "Custom Domain", value: "$120,000", time: "Active" },
        { name: "Solis Distributors", source: "B2B Multi-Store", value: "$210,000", time: "Active" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(241,233,216,0.08)]">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[rgba(241,233,216,0.4)]" />
            <input
              type="text"
              readOnly
              value="Filter contacts & deal stages..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#0B1220] border border-[rgba(241,233,216,0.1)] text-[rgba(241,233,216,0.6)] focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[#0B1220] border border-[rgba(241,233,216,0.1)] text-[rgba(241,233,216,0.8)] font-medium">
            <SlidersHorizontal size={13} />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#C89A4B] text-[#0B1220] font-semibold">
            <Plus size={13} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2.5 min-w-0 bg-[#0B1220]/60 p-3 rounded-xl border border-[rgba(241,233,216,0.06)]">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[#F1E9D8] truncate">{col.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#121B2E] border border-[rgba(241,233,216,0.1)] text-[#C89A4B]">
                {col.count}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.cards.map((card) => (
                <div
                  key={card.name}
                  className="group rounded-lg p-3 bg-[#121B2E] border border-[rgba(241,233,216,0.08)] hover:border-[rgba(200,154,75,0.3)] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#F1E9D8] truncate">{card.name}</span>
                    <span className="text-[10px] font-mono text-[rgba(241,233,216,0.4)]">{card.time}</span>
                  </div>
                  <p className="text-[11px] text-[rgba(241,233,216,0.6)] mb-2.5">{card.source}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(241,233,216,0.06)]">
                    <span className="text-xs font-mono font-semibold text-[#C89A4B]">{card.value}</span>
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
    { name: "Noise-Cancelling Headphones", sku: "HDP-081", qty: 1, price: 199.99 },
  ];
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="grid lg:grid-cols-12 gap-5 h-full">
      {/* Left Item Selector & Active Cart */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 pb-2 border-b border-[rgba(241,233,216,0.08)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#C89A4B]">
              REGISTER #03
            </span>
            <span className="text-xs text-[rgba(241,233,216,0.4)]">&bull;</span>
            <span className="text-xs font-medium text-[rgba(241,233,216,0.7)]">Westfield Branch</span>
          </div>
          <StatusBadge tone="positive" label="OFFLINE SYNC READY" />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.sku}
              className="flex items-center justify-between p-3 rounded-xl bg-[#0B1220] border border-[rgba(241,233,216,0.08)] hover:border-[rgba(200,154,75,0.2)] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.1)] flex items-center justify-center shrink-0">
                  <Package size={16} className="text-[#C89A4B]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F1E9D8] truncate">{item.name}</div>
                  <div className="text-[11px] font-mono text-[rgba(241,233,216,0.5)]">
                    {item.sku} &bull; ${item.price.toFixed(2)} each
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs font-mono font-semibold text-[rgba(241,233,216,0.8)]">
                  x{item.qty}
                </span>
                <span className="text-xs font-mono font-bold text-[#F1E9D8] min-w-[70px] text-right">
                  ${(item.qty * item.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Payment Terminal Panel */}
      <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-[#0B1220] border border-[rgba(241,233,216,0.1)] space-y-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[rgba(241,233,216,0.5)] block mb-3">
            Transaction Summary
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[rgba(241,233,216,0.7)] font-mono">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[rgba(241,233,216,0.7)] font-mono">
              <span>Tax (8% VAT)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-[rgba(241,233,216,0.1)] flex justify-between text-base font-mono font-bold text-[#F1E9D8]">
              <span>Total Payable</span>
              <span className="text-[#C89A4B]">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button className="w-full py-3 rounded-lg text-xs font-bold bg-[#10B981] text-[#0B1220] hover:bg-[#059669] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
            <CreditCard size={15} />
            <span>Process Card / Tap Payment</span>
          </button>
          <button className="w-full py-2.5 rounded-lg text-xs font-medium text-[rgba(241,233,216,0.8)] bg-[#121B2E] border border-[rgba(241,233,216,0.1)] hover:bg-[#1a263e] transition-colors">
            Split Payment / Cash
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryMockUI() {
  const rows = [
    { sku: "CHR-109", name: "Premium Ergonomic Chair", branch: "Branch A (Westfield)", stock: 14, low: false },
    { sku: "CHR-109", name: "Premium Ergonomic Chair", branch: "Branch B (Solis)", stock: 3, low: true },
    { sku: "KBD-044", name: "Wireless Mech Keyboard", branch: "Branch A (Westfield)", stock: 45, low: false },
    { sku: "KBD-044", name: "Wireless Mech Keyboard", branch: "Branch B (Solis)", stock: 0, low: true },
    { sku: "HDP-081", name: "Noise-Cancel Headphones", branch: "Branch B (Solis)", stock: 29, low: false },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between pb-2 border-b border-[rgba(241,233,216,0.08)]">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#C89A4B]">
          Multi-Branch Stock Balance Ledger
        </span>
        <StatusBadge tone="info" label="Auto-Sync Enabled" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(241,233,216,0.08)] text-[11px] font-mono uppercase text-[rgba(241,233,216,0.5)]">
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3">Product Title</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3">Balance</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(241,233,216,0.06)] text-xs">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#0B1220]/50 transition-colors">
                <td className="py-3 px-3 font-mono font-semibold text-[#C89A4B]">{row.sku}</td>
                <td className="py-3 px-3 font-semibold text-[#F1E9D8]">{row.name}</td>
                <td className="py-3 px-3 text-[rgba(241,233,216,0.7)]">{row.branch}</td>
                <td className="py-3 px-3 font-mono font-bold text-[#F1E9D8]">{row.stock} units</td>
                <td className="py-3 px-3 text-right">
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
    </div>
  );
}

function FinanceMockUI() {
  const metrics = [
    { label: "Westfield Branch Sales", value: "$184,320", change: "+14.2%" },
    { label: "Solis Branch Sales", value: "$96,150", change: "+8.5%" },
    { label: "Automated Storefront", value: "$61,380", change: "+24.8%" },
    { label: "Consolidated Total", value: "$341,850", change: "+15.3%" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="p-3.5 rounded-xl bg-[#0B1220] border border-[rgba(241,233,216,0.08)]">
            <span className="text-[11px] font-mono text-[rgba(241,233,216,0.5)] block mb-1 truncate">{m.label}</span>
            <div className="text-lg font-mono font-bold text-[#F1E9D8]">{m.value}</div>
            <span className="text-[10px] font-mono font-semibold text-emerald-400 mt-1 inline-block">{m.change} vs last month</span>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-[#0B1220] border border-[rgba(241,233,216,0.08)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(241,233,216,0.08)]">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#C89A4B]">
            Inter-Branch Stock Transfers & Audit Trail
          </span>
          <StatusBadge tone="positive" label="RECONCILED" />
        </div>

        <div className="space-y-2">
          {[
            { id: "TR-0921", desc: "Stock Transfer: Westfield ➔ Solis Branch", qty: "150 units", status: "Completed" },
            { id: "TR-0922", desc: "Stock Reception: Main WH ➔ Westfield Branch", qty: "400 units", status: "In Transit" },
          ].map((tr) => (
            <div key={tr.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.06)] text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#C89A4B]">{tr.id}</span>
                <span className="text-[rgba(241,233,216,0.8)]">{tr.desc}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-[#F1E9D8]">{tr.qty}</span>
                <StatusBadge tone={tr.status === "Completed" ? "positive" : "warn"} label={tr.status} />
              </div>
            </div>
          ))}
        </div>
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
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="py-24 relative overflow-hidden bg-[#070C15]" aria-labelledby="showcase-heading">
      {/* Background glow ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[rgba(200,154,75,0.04)] blur-[120px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brassLine bg-brassDim text-brass text-xs font-mono font-semibold uppercase tracking-widest">
            <Building2 size={13} />
            <span>Integrated Platform Engine</span>
          </div>
          <h2 id="showcase-heading" className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F1E9D8]" style={{ fontFamily: fonts.display }}>
            Unified workspace, zero sync delay.
          </h2>
          <p className="text-base sm:text-lg text-[rgba(241,233,216,0.7)] leading-relaxed">
            Every transaction, register shift, order intake, and stock transfer reflects in real time across your entire corporate ledger.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-[#121B2E] border-[#C89A4B] shadow-lg shadow-black/50 scale-[1.02]"
                    : "bg-[#0B1220]/60 border-[rgba(241,233,216,0.08)] hover:border-[rgba(200,154,75,0.3)] hover:bg-[#121B2E]/40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${
                    isSelected ? "bg-[#C89A4B] text-[#0B1220]" : "bg-[rgba(241,233,216,0.06)] text-[rgba(241,233,216,0.7)]"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5" style={{ color: isSelected ? colors.brass : colors.textFaint }}>
                  MODULE {tab.code}
                </span>
                <span className="text-sm font-bold text-[#F1E9D8] truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mock UI Workspace Container */}
        <div className="rounded-2xl overflow-hidden border border-[rgba(241,233,216,0.12)] bg-[#121B2E] shadow-2xl">
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(241,233,216,0.1)] bg-[#0B1220]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
                <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
              </div>
              <div className="ml-4 px-3 py-1 rounded-md bg-[#121B2E] border border-[rgba(241,233,216,0.08)] text-xs font-mono text-[rgba(241,233,216,0.6)] flex items-center gap-2">
                <span className="text-emerald-400">&bull;</span>
                <span>https://app.scryme.tech/{activeTab.toLowerCase()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[rgba(241,233,216,0.5)]">
              <RefreshCw size={12} className="animate-spin text-[#C89A4B]" />
              <span className="hidden sm:inline">LIVE LEDGER CONNECTION</span>
            </div>
          </div>

          {/* Dynamic Content Frame */}
          <div className="p-6 min-h-[380px] bg-[#121B2E]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {mockUIs[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
