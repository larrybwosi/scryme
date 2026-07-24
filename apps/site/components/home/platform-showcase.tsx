"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout, ShoppingCart, Package, ShieldAlert } from "lucide-react";
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
}));

function StatusChip({
  tone,
  label,
}: {
  tone: "positive" | "warn" | "negative";
  label: string;
}) {
  const map = {
    positive: colors.ledgerGreen,
    warn: colors.brass,
    negative: colors.ledgerRust,
  };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded animate-pulse"
      style={{
        background: `${map[tone]}22`,
        color: map[tone],
        fontFamily: fonts.mono,
      }}
    >
      {label}
    </span>
  );
}

function CRMMockUI() {
  const columns = [
    {
      title: "Store Drafts",
      count: 4,
      intensity: 0.28,
      cards: [
        { name: "Urban Threads Shop", company: "Retail Theme v2", value: "Draft" },
        { name: "Veloce Wholesalers", company: "B2B Bulk Portal", value: "Draft" },
        { name: "Solaris Botanicals", company: "Minimal Peach", value: "Review" },
      ],
    },
    {
      title: "Ready to Sync",
      count: 2,
      intensity: 0.5,
      cards: [
        { name: "Apex Sports Hub", company: "Performance Dark", value: "Ready" },
        { name: "Glow Cosmetics", company: "Elegance Pink", value: "Ready" },
      ],
    },
    {
      title: "Publishing Channels",
      count: 3,
      intensity: 0.74,
      cards: [
        { name: "Meridian Boutique", company: "Custom Subdomain", value: "Deploying" },
        { name: "Kestrel Outlet", company: "Custom Domain", value: "Propagating" },
      ],
    },
    {
      title: "Live Storefronts",
      count: 42,
      intensity: 1,
      cards: [
        { name: "Fontaine Direct", company: "Custom Domain", value: "Active" },
        { name: "Solis Distributors", company: "Wholesale Portal", value: "Active" },
      ],
    },
  ];

  return (
    <div className="flex gap-3 h-full overflow-hidden">
      {columns.map((col) => (
        <div key={col.title} className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between px-1">
            <span
              className="text-xs font-semibold truncate"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              {col.title}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: `${colors.brass}${Math.round(
                  col.intensity * 40 + 15,
                )
                  .toString(16)
                  .padStart(2, "0")}`,
                color: colors.brass,
                fontFamily: fonts.mono,
              }}
            >
              {col.count}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {col.cards.map((card) => (
              <div
                key={card.name}
                className="rounded-lg p-2.5"
                style={{
                  background: colors.inkPanel,
                  border: `1px solid ${colors.inkLine}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: `rgba(200,154,75,${col.intensity})`,
                      color:
                        col.intensity > 0.6 ? colors.inkBg : colors.textPrimary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {card.name[0]}
                  </div>
                  <span
                    className="text-xs font-medium truncate"
                    style={{
                      color: colors.textPrimary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {card.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs truncate"
                    style={{ color: colors.textFaint, fontFamily: fonts.body }}
                  >
                    {card.company}
                  </span>
                  <span
                    className="text-xs font-semibold shrink-0 ml-1"
                    style={{
                      color: colors.ledgerGreen,
                      fontFamily: fonts.mono,
                    }}
                  >
                    {card.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col gap-2">
        <div
          className="text-xs font-semibold px-1 mb-1 uppercase tracking-wider"
          style={{ color: colors.textFaint, fontFamily: fonts.mono }}
        >
          Register Cart (Branch B)
        </div>
        {items.map((item) => (
          <div
            key={item.sku}
            className="flex items-center gap-3 rounded-lg p-2.5"
            style={{
              background: colors.inkPanel,
              border: `1px solid ${colors.inkLine}`,
            }}
          >
            <div
              className="w-8 h-8 rounded-md shrink-0"
              style={{ background: `${colors.ledgerGreen}22` }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-medium truncate"
                style={{ color: colors.textPrimary, fontFamily: fonts.body }}
              >
                {item.name}
              </div>
              <div
                className="text-xs"
                style={{ color: colors.textFaint, fontFamily: fonts.mono }}
              >
                {item.sku} &middot; Qty {item.qty}
              </div>
            </div>
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: colors.textPrimary, fontFamily: fonts.mono }}
            >
              ${(item.qty * item.price).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="w-44 flex flex-col gap-3">
        <div
          className="rounded-lg p-3 flex flex-col gap-2"
          style={{
            background: colors.inkPanel,
            border: `1px solid ${colors.inkLine}`,
          }}
        >
          <div
            className="flex justify-between text-xs"
            style={{ color: colors.textMuted, fontFamily: fonts.mono }}
          >
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div
            className="flex justify-between text-xs"
            style={{ color: colors.textMuted, fontFamily: fonts.mono }}
          >
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div
            className="border-t pt-2 flex justify-between text-sm font-bold"
            style={{
              borderColor: colors.inkLine,
              color: colors.textPrimary,
              fontFamily: fonts.mono,
            }}
          >
            <span>Total Bill</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        <button
          className="w-full py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
          style={{
            background: colors.ledgerGreen,
            color: colors.inkBg,
            fontFamily: fonts.body,
          }}
        >
          Swipe / Tap Card
        </button>
        <button
          className="w-full py-2 rounded-lg text-xs font-medium"
          style={{
            background: "transparent",
            border: `1px solid ${colors.inkLine}`,
            color: colors.textMuted,
            fontFamily: fonts.body,
          }}
        >
          Split Payment
        </button>
      </div>
    </div>
  );
}

function InventoryMockUI() {
  const rows = [
    {
      sku: "CHR-109",
      name: "Premium Ergonomic Chair",
      branch: "Branch A (Westfield)",
      stock: 14,
      low: false,
    },
    {
      sku: "CHR-109",
      name: "Premium Ergonomic Chair",
      branch: "Branch B (Solis)",
      stock: 3,
      low: true,
    },
    {
      sku: "KBD-044",
      name: "Wireless Mech Keyboard",
      branch: "Branch A (Westfield)",
      stock: 45,
      low: false,
    },
    {
      sku: "KBD-044",
      name: "Wireless Mech Keyboard",
      branch: "Branch B (Solis)",
      stock: 0,
      low: true,
    },
    {
      sku: "HDP-081",
      name: "Noise-Cancel Headphones",
      branch: "Branch B (Solis)",
      stock: 29,
      low: false,
    },
  ];

  return (
    <div className="flex flex-col gap-2 h-full">
      <div
        className="grid gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider"
        style={{
          gridTemplateColumns: "80px 1.5fr 1.2fr 80px 60px",
          background: colors.inkPanel,
          color: colors.textFaint,
          fontFamily: fonts.mono,
        }}
      >
        <span>SKU</span>
        <span>Product Name</span>
        <span>Store Branch</span>
        <span>Stock</span>
        <span>Status</span>
      </div>
      {rows.map((row) => (
        <div
          key={`${row.sku}-${row.branch}`}
          className="grid gap-2 px-3 py-2.5 rounded-lg items-center"
          style={{
            gridTemplateColumns: "80px 1.5fr 1.2fr 80px 60px",
            background: colors.inkPanelAlt,
            border: `1px solid ${colors.inkLine}`,
          }}
        >
          <span
            className="text-xs"
            style={{ color: "#7C93B0", fontFamily: fonts.mono }}
          >
            {row.sku}
          </span>
          <span
            className="text-xs truncate"
            style={{ color: colors.textPrimary, fontFamily: fonts.body }}
          >
            {row.name}
          </span>
          <span
            className="text-xs truncate"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            {row.branch}
          </span>
          <span
            className="text-xs font-semibold"
            style={{
              color: row.stock === 0 ? colors.ledgerRust : (row.low ? colors.brass : colors.textPrimary),
              fontFamily: fonts.mono,
            }}
          >
            {row.stock} units
          </span>
          <StatusChip
            tone={row.stock === 0 ? "negative" : (row.low ? "warn" : "positive")}
            label={row.stock === 0 ? "Out" : (row.low ? "Low" : "OK")}
          />
        </div>
      ))}
    </div>
  );
}

function FinanceMockUI() {
  const metrics = [
    { label: "Branch A Sales", value: "$184,320", change: "+14.2%", up: true },
    { label: "Branch B Sales", value: "$96,150", change: "+8.5%", up: true },
    { label: "Online Sales", value: "$61,380", change: "+24.8%", up: true },
    { label: "Total Revenue", value: "$341,850", change: "+15.3%", up: true },
  ];

  const recentTransfers = [
    {
      id: "TR-0921",
      detail: "Stock: Branch A ➔ Branch B",
      qty: "150 units",
      status: "completed" as const,
    },
    {
      id: "TR-0922",
      detail: "Stock: Main WH ➔ Branch A",
      qty: "400 units",
      status: "pending" as const,
    },
    {
      id: "TR-0923",
      detail: "Stock: Branch B ➔ Branch A",
      qty: "50 units",
      status: "completed" as const,
    },
  ];

  const statusTone = {
    completed: "positive",
    pending: "warn",
  } as const;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg p-2.5"
            style={{
              background: colors.inkPanel,
              border: `1px solid ${colors.inkLine}`,
            }}
          >
            <div
              className="text-xs mb-1 truncate"
              style={{ color: colors.textFaint, fontFamily: fonts.body }}
            >
              {m.label}
            </div>
            <div
              className="text-xs font-bold"
              style={{ color: colors.textPrimary, fontFamily: fonts.mono }}
            >
              {m.value}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{
                color: m.up ? colors.ledgerGreen : colors.ledgerRust,
                fontFamily: fonts.mono,
              }}
            >
              {m.change}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <div
          className="text-xs font-semibold mb-2 uppercase tracking-wider"
          style={{ color: colors.textFaint, fontFamily: fonts.mono }}
        >
          Branch Stock Transfers (Central Management)
        </div>
        <div className="flex flex-col gap-1.5">
          {recentTransfers.map((tr) => (
            <div
              key={tr.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg"
              style={{
                background: colors.inkPanel,
                border: `1px solid ${colors.inkLine}`,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-xs"
                  style={{ color: colors.brass, fontFamily: fonts.mono }}
                >
                  {tr.id}
                </span>
                <span
                  className="text-xs"
                  style={{ color: colors.textMuted, fontFamily: fonts.body }}
                >
                  {tr.detail}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold"
                  style={{ color: colors.textPrimary, fontFamily: fonts.mono }}
                >
                  {tr.qty}
                </span>
                <StatusChip tone={statusTone[tr.status]} label={tr.status} />
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
  const activeAccent =
    tabs.find((t) => t.id === activeTab)?.accent ?? colors.brass;

  return (
    <section
      className="py-24"
      style={{ background: colors.inkBg }}
      aria-labelledby="showcase-heading"
    >
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: colors.brass, fontFamily: fonts.mono }}
          >
            The workspace
          </span>
          <h2
            id="showcase-heading"
            className="mt-3 text-3xl sm:text-4xl font-medium text-balance"
            style={{ color: colors.textPrimary, fontFamily: fonts.display }}
          >
            Unified central data, four high-performance channels
          </h2>
          <p
            className="mt-4 text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            Customer websites receive orders. Registers check out guests. Central office tracks stock transfers and performance. Everything updates seamlessly at sub-second latency.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 pl-3 pr-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                )}
                style={
                  active
                    ? { background: tab.accent, color: colors.inkBg }
                    : {
                        background: colors.inkPanel,
                        color: colors.textMuted,
                        border: `1px solid ${colors.inkLine}`,
                      }
                }
                aria-selected={active}
              >
                <Icon size={15} />
                <span
                  className="text-xs font-semibold tracking-wider"
                  style={{ fontFamily: fonts.mono }}
                >
                  {tab.code}
                </span>
                <span
                  className="hidden sm:inline"
                  style={{ fontFamily: fonts.body }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mock UI panel */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: colors.inkPanelAlt,
            border: `1px solid ${colors.inkLine}`,
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3 border-b"
            style={{ background: "#080D18", borderColor: colors.inkLine }}
          >
            <div className="flex gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "#ff5f57" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "#febc2e" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "#28c840" }}
              />
            </div>
            <div
              className="flex-1 mx-4 rounded h-6 flex items-center px-3 text-xs"
              style={{
                background: colors.inkPanel,
                color: colors.textFaint,
                fontFamily: fonts.mono,
              }}
            >
              app.scryme.tech/{activeTab.toLowerCase()}
            </div>
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              animate={{ background: activeAccent }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6 min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
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
