"use client";

import { CreditCard, Banknote, Smartphone, X } from "lucide-react";

const cartItems = [
  { name: "Premium Coffee Beans 1kg", sku: "BEV-001", qty: 2, price: 28.5 },
  { name: "Organic Earl Grey Tea", sku: "BEV-014", qty: 1, price: 14.99 },
  { name: "Stainless Travel Mug", sku: "ACC-102", qty: 1, price: 34.0 },
];

const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.qty, 0);
const tax = subtotal * 0.08;
const total = subtotal + tax;

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function PosCheckoutMock() {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 shadow-xl overflow-hidden max-w-md mx-auto lg:mx-0">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-2">
        <span className="text-xs font-semibold text-foreground">
          POS Terminal — Register #1
        </span>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* cart */}
      <div className="px-4 py-3 space-y-2">
        {cartItems.map((item) => (
          <div
            key={item.sku}
            className="flex items-center justify-between gap-3 rounded-lg bg-background border border-border px-3 py-2.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
              <p className="text-[10px] text-muted">{item.sku} · qty {item.qty}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {fmt(item.price * item.qty)}
              </span>
              <X className="w-3 h-3 text-muted cursor-pointer" />
            </div>
          </div>
        ))}
      </div>

      {/* totals */}
      <div className="px-4 pb-3 space-y-1.5 border-t border-border pt-3">
        {[
          { label: "Subtotal", value: fmt(subtotal) },
          { label: "Tax (8%)", value: fmt(tax) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-xs text-muted">
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2 mt-2">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      {/* payment methods */}
      <div className="px-4 pb-4 pt-2 grid grid-cols-3 gap-2">
        {[
          { icon: CreditCard, label: "Card" },
          { icon: Banknote, label: "Cash" },
          { icon: Smartphone, label: "Mobile" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-3 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* charge button */}
      <div className="px-4 pb-5">
        <button className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Charge {fmt(total)}
        </button>
      </div>
    </div>
  );
}
