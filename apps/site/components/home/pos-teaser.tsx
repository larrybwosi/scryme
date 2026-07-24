import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { colors, fonts, modules } from "@/lib/scryme-tokens";

const accent = modules.find((m) => m.code === "POS")!.accent;

const highlights = [
  "True offline-first architecture — never stop ringing up sales",
  "Real-time multi-branch stock levels update globally with every checkout",
  "Integrated barcode scanning and rapid payment-handling workflows",
  "Accept cash, cards, mobile payments, and split multi-tender tickets",
  "Automatic synchronization to Central Management ERP the second cash drawers reconcile",
];

function POSCheckout() {
  const cartItems = [
    { name: "Premium Ergonomic Chair", sku: "CHR-109", qty: 1, price: 299.0 },
    { name: "Wireless Mechanical Keyboard", sku: "KBD-044", qty: 2, price: 129.99 },
    { name: "Active Noise-Cancelling Headphones", sku: "HDP-081", qty: 1, price: 199.99 },
  ];
  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${colors.inkLine}`,
        background: colors.inkPanelAlt,
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "#080D18",
          borderBottom: `1px solid ${colors.inkLine}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: accent }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: colors.textPrimary, fontFamily: fonts.body }}
          >
            POS Terminal — Branch B (Solis Hub)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: accent }}
          />
          <span
            className="text-xs"
            style={{ color: colors.textFaint, fontFamily: fonts.mono }}
          >
            online
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* Cart */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: colors.textFaint, fontFamily: fonts.mono }}
          >
            Branch Stock: 42 Units Left
          </div>
          {cartItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{
                background: colors.inkPanel,
                border: `1px solid ${colors.inkLine}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-md shrink-0"
                style={{ background: `${accent}22` }}
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

        {/* Summary */}
        <div
          className="sm:w-48 p-4 flex flex-col gap-3"
          style={{ borderLeft: `1px solid ${colors.inkLine}` }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: colors.textFaint, fontFamily: fonts.mono }}
          >
            Bill Summary
          </div>
          <div className="flex flex-col gap-1.5">
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
              className="flex justify-between text-sm font-bold pt-2 border-t"
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

          <div className="flex flex-col gap-2 pt-2">
            <button
              className="w-full py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
              style={{
                background: accent,
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
            >
              Card / Tap Terminal
            </button>
            <button
              className="w-full py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: "transparent",
                border: `1px solid ${colors.inkLine}`,
                color: colors.textMuted,
                fontFamily: fonts.body,
              }}
            >
              Cash Drawer
            </button>
            <button
              className="w-full py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: "transparent",
                border: `1px solid ${colors.inkLine}`,
                color: colors.textMuted,
                fontFamily: fonts.body,
              }}
            >
              Mobile Money
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function POSTeaser() {
  return (
    <section
      className="py-24"
      style={{ background: colors.inkBg }}
      aria-labelledby="pos-teaser-heading"
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
          {/* Text right */}
          <div className="flex-1 max-w-lg">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{
                background: `${accent}1A`,
                border: `1px solid ${accent}55`,
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: accent, fontFamily: fonts.mono }}
              >
                POS
              </span>
            </div>
            <h2
              id="pos-teaser-heading"
              className="text-3xl sm:text-4xl font-medium text-balance"
              style={{ color: colors.textPrimary, fontFamily: fonts.display }}
            >
              An integrated POS system built for high-performance retail
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              Whether you manage a single warehouse store, or scale several branches across various regions, every purchase made offline or online updates your stock levels instantly. Zero lag, zero human error, maximum operational speed.
            </p>

            <ul className="mt-7 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: accent }}
                  />
                  <span
                    className="text-sm"
                    style={{
                      color: colors.textPrimary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/products/pos"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: accent,
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
            >
              Explore Integrated POS
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* POS UI left */}
          <div className="flex-1 w-full max-w-xl">
            <POSCheckout />
          </div>
        </div>
      </div>
    </section>
  );
}
