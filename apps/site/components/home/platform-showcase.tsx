"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users2, ShoppingCart, Package, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "crm", label: "CRM", icon: Users2 },
  { id: "pos", label: "Point of Sale", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "finance", label: "Finance", icon: DollarSign },
];

function CRMMockUI() {
  const columns = [
    {
      title: "Leads",
      count: 8,
      color: "#6366f1",
      cards: [
        { name: "Arjun Mehta", company: "Vantage Corp", value: "$24K" },
        { name: "Sarah Okonkwo", company: "TerraLogix", value: "$18K" },
        { name: "Liu Wei", company: "Sunridge Ltd.", value: "$32K" },
      ],
    },
    {
      title: "Qualified",
      count: 5,
      color: "#0891b2",
      cards: [
        { name: "Elena Vasquez", company: "Meridian Grp.", value: "$47K" },
        { name: "Tom Hargreaves", company: "Fontaine Co.", value: "$29K" },
      ],
    },
    {
      title: "Proposal",
      count: 3,
      color: "#d97706",
      cards: [
        { name: "Nkechi Adeyemi", company: "Argent Ind.", value: "$95K" },
        { name: "Jake Thornton", company: "Kestrel LLC", value: "$63K" },
      ],
    },
    {
      title: "Closed Won",
      count: 12,
      color: "#059669",
      cards: [
        { name: "Priya Sharma", company: "Solis Dist.", value: "$112K" },
        { name: "Carlos Ruiz", company: "Westfield", value: "$84K" },
      ],
    },
  ];

  return (
    <div className="flex gap-3 h-full overflow-hidden">
      {columns.map((col) => (
        <div key={col.title} className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between px-1">
            <span
              className="text-xs font-semibold"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {col.title}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: `${col.color}22`,
                color: col.color,
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
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: col.color }}
                  >
                    {card.name[0]}
                  </div>
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {card.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs truncate"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {card.company}
                  </span>
                  <span
                    className="text-xs font-semibold shrink-0 ml-1"
                    style={{ color: "#10b981" }}
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
    { name: "Premium Laptop", sku: "LAP-001", qty: 1, price: 1299.0 },
    { name: "Wireless Mouse", sku: "MS-042", qty: 2, price: 49.99 },
    { name: "USB-C Hub", sku: "HUB-011", qty: 1, price: 89.99 },
    { name: "Monitor Stand", sku: "STD-007", qty: 1, price: 149.0 },
  ];
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="flex gap-4 h-full">
      {/* Items */}
      <div className="flex-1 flex flex-col gap-2">
        <div
          className="text-xs font-semibold px-1 mb-1"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          CART ITEMS
        </div>
        {items.map((item) => (
          <div
            key={item.sku}
            className="flex items-center gap-3 rounded-lg p-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-8 h-8 rounded-md shrink-0"
              style={{ background: "rgba(79,70,229,0.2)" }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-medium truncate"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {item.name}
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {item.sku} &middot; Qty {item.qty}
              </div>
            </div>
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              ${(item.qty * item.price).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="w-44 flex flex-col gap-3">
        <div
          className="rounded-lg p-3 flex flex-col gap-2"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div
            className="border-t pt-2 flex justify-between text-sm font-bold"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              color: "white",
            }}
          >
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        <button
          className="w-full py-2.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "#4f46e5" }}
        >
          Process Payment
        </button>
        <button
          className="w-full py-2 rounded-lg text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
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
    { sku: "LAP-001", name: "Premium Laptop 15\"", warehouse: "Main WH", stock: 142, low: false },
    { sku: "PHN-023", name: "Smartphone Pro Max", warehouse: "Branch A", stock: 8, low: true },
    { sku: "TAB-011", name: "Tablet 11\" WiFi", warehouse: "Main WH", stock: 67, low: false },
    { sku: "HDP-005", name: "Noise-Cancel Headphones", warehouse: "Branch B", stock: 3, low: true },
    { sku: "CAM-034", name: "4K Action Camera", warehouse: "Main WH", stock: 29, low: false },
  ];

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Table header */}
      <div
        className="grid gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
        style={{
          gridTemplateColumns: "80px 1fr 100px 80px 60px",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <span>SKU</span>
        <span>Product</span>
        <span>Warehouse</span>
        <span>Stock</span>
        <span>Status</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.sku}
          className="grid gap-2 px-3 py-2.5 rounded-lg items-center"
          style={{
            gridTemplateColumns: "80px 1fr 100px 80px 60px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span className="text-xs font-mono" style={{ color: "#818cf8" }}>
            {row.sku}
          </span>
          <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
            {row.name}
          </span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            {row.warehouse}
          </span>
          <span className="text-xs font-semibold" style={{ color: row.low ? "#fbbf24" : "rgba(255,255,255,0.7)" }}>
            {row.stock} units
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded text-center"
            style={{
              background: row.low ? "rgba(251,191,36,0.15)" : "rgba(16,185,129,0.15)",
              color: row.low ? "#fbbf24" : "#10b981",
            }}
          >
            {row.low ? "Low" : "OK"}
          </span>
        </div>
      ))}
    </div>
  );
}

function FinanceMockUI() {
  const metrics = [
    { label: "Revenue", value: "$284,920", change: "+12.5%", up: true },
    { label: "Expenses", value: "$98,450", change: "+4.2%", up: false },
    { label: "Net Profit", value: "$186,470", change: "+18.3%", up: true },
    { label: "AR Balance", value: "$42,300", change: "-8.1%", up: true },
  ];

  const recentInvoices = [
    { id: "INV-0841", client: "Fontaine Group", amount: "$12,800", status: "paid" },
    { id: "INV-0842", client: "Meridian Corp", amount: "$6,450", status: "pending" },
    { id: "INV-0843", client: "TerraLogix", amount: "$24,000", status: "overdue" },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg p-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {m.label}
            </div>
            <div className="text-xs font-bold text-white">{m.value}</div>
            <div
              className="text-xs mt-0.5"
              style={{ color: m.up ? "#10b981" : "#f87171" }}
            >
              {m.change}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <div
          className="text-xs font-semibold mb-2"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          RECENT INVOICES
        </div>
        <div className="flex flex-col gap-1.5">
          {recentInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono" style={{ color: "#818cf8" }}>
                  {inv.id}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {inv.client}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white">{inv.amount}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background:
                      inv.status === "paid"
                        ? "rgba(16,185,129,0.15)"
                        : inv.status === "pending"
                        ? "rgba(251,191,36,0.15)"
                        : "rgba(248,113,113,0.15)",
                    color:
                      inv.status === "paid"
                        ? "#10b981"
                        : inv.status === "pending"
                        ? "#fbbf24"
                        : "#f87171",
                  }}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const mockUIs: Record<string, React.ReactNode> = {
  crm: <CRMMockUI />,
  pos: <POSMockUI />,
  inventory: <InventoryMockUI />,
  finance: <FinanceMockUI />,
};

export function PlatformShowcase() {
  const [activeTab, setActiveTab] = useState("crm");

  return (
    <section
      className="py-24"
      style={{ background: "var(--site-dark)" }}
      aria-labelledby="showcase-heading"
    >
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4"
            style={{
              background: "rgba(79,70,229,0.1)",
              borderColor: "rgba(79,70,229,0.25)",
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>
              Live Preview
            </span>
          </div>
          <h2
            id="showcase-heading"
            className="text-3xl sm:text-4xl font-extrabold text-white text-balance"
          >
            One platform, infinite possibilities
          </h2>
          <p
            className="mt-4 text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Switch between modules and see how Scryme gives each department
            exactly what they need — all from a single login.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "text-white"
                    : "hover:bg-white/5"
                )}
                style={
                  activeTab === tab.id
                    ? {
                        background: "#4f46e5",
                        boxShadow: "0 4px 16px -4px rgba(79,70,229,0.5)",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                }
                aria-selected={activeTab === tab.id}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mock UI panel */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#0a0f1e",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 64px -16px rgba(0,0,0,0.6)",
          }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-5 py-3 border-b"
            style={{
              background: "#060b17",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
            </div>
            <div
              className="flex-1 mx-4 rounded h-6 flex items-center px-3 text-xs font-mono"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              app.scryme.io/{activeTab}
            </div>
          </div>

          {/* Content */}
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
