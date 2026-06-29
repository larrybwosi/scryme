import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const highlights = [
  "Works offline — never lose a sale due to connectivity",
  "Real-time inventory deduction on every transaction",
  "Multi-tender: cash, card, M-Pesa, split payments",
  "Customer loyalty points and discount management",
  "Multi-branch, multi-currency, multi-tax support",
];

function POSCheckout() {
  const cartItems = [
    { name: "Laptop Stand Adjustable", qty: 1, price: 149.0 },
    { name: "Wireless Keyboard", qty: 2, price: 89.99 },
    { name: "USB-C Hub 7-in-1", qty: 1, price: 69.99 },
  ];
  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      {/* POS header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--site-dark)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs font-semibold text-white">POS Terminal — Branch A</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Online
          </span>
        </div>
      </div>

      {/* Split layout */}
      <div
        className="flex flex-col sm:flex-row"
        style={{ background: "var(--muted)" }}
      >
        {/* Cart */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Cart
          </div>
          {cartItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 bg-card rounded-lg px-3 py-2.5"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="w-8 h-8 rounded-md shrink-0"
                style={{ background: "oklch(0.95 0.02 265)" }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">Qty: {item.qty}</div>
              </div>
              <span className="text-xs font-semibold text-foreground shrink-0">
                ${(item.qty * item.price).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div
          className="sm:w-48 p-4 flex flex-col gap-3"
          style={{
            borderLeft: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Summary
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div
              className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border"
            >
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div className="flex flex-col gap-2 pt-2">
            <button className="w-full py-2.5 rounded-lg text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
              Card / Tap
            </button>
            <button className="w-full py-2 rounded-lg text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors">
              Cash
            </button>
            <button className="w-full py-2 rounded-lg text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors">
              M-Pesa
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
      style={{ background: "oklch(0.97 0.005 265)" }}
      aria-labelledby="pos-teaser-heading"
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
          {/* Text right */}
          <div className="flex-1 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Point of Sale
              </span>
            </div>
            <h2
              id="pos-teaser-heading"
              className="text-3xl sm:text-4xl font-extrabold text-foreground text-balance"
            >
              A POS system built for the pace of modern retail
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Whether you run a single store or a chain of 50 branches, Scryme
              POS keeps your checkouts fast, your inventory accurate, and your
              customers happy.
            </p>

            <ul className="mt-7 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={16}
                    className="text-primary shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/products/pos"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ boxShadow: "var(--shadow-primary)" }}
            >
              Explore POS
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
