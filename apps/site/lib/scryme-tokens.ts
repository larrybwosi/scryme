// Scryme design tokens — "The Operating Ledger"
//
// Grounding idea: Scryme's job is to take four separate operational streams
// (CRM/Storefronts, POS, Inventory, Finance) and reconcile them into one continuous
// record. The visual system is built around a ledger/manifest, not a
// generic SaaS dashboard.
//
// Fonts (add to app/layout.tsx via next/font/google, or a <link> in <head>):
//
//   import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
//
//   const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400","500","600"] });
//   const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400","500"] });
//   const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
//
//   <body className={`${fraunces.variable} ${plexMono.variable} ${inter.variable}`}>
//
// If you'd rather not touch layout.tsx yet, the components below fall back
// to literal font-family strings so they render correctly either way.

export const colors = {
  inkBg: "var(--ink-bg, #0B1220)", // primary background — deep ledger-ink navy
  inkPanel: "var(--ink-panel, #121B2E)", // raised surfaces / rows
  inkPanelAlt: "var(--ink-panel-alt, #0E1626)",
  inkLine: "var(--ink-line, rgba(241,233,216,0.09))", // hairline rules on dark
  paper: "var(--paper, #F1E9D8)", // warm paper — used sparingly, never as a full section bg
  brass: "var(--brass, #C89A4B)", // primary accent — replaces the generic indigo
  brassDim: "var(--brass-dim, rgba(200,154,75,0.16))",
  brassLine: "var(--brass-line, rgba(200,154,75,0.35))",
  ledgerGreen: "var(--ledger-green, #4B9073)", // positive / synced entries
  ledgerRust: "var(--ledger-rust, #B4553A)", // pending / attention entries
  textPrimary: "var(--text-primary, #F1E9D8)",
  textMuted: "var(--text-muted, rgba(241,233,216,0.56))",
  textFaint: "var(--text-faint, rgba(241,233,216,0.32))",
};

export const fonts = {
  display: "var(--font-display), Fraunces, 'Times New Roman', serif",
  mono: "var(--font-mono), 'IBM Plex Mono', ui-monospace, monospace",
  body: "var(--font-body), Inter, system-ui, sans-serif",
};

export type ModuleCode = "CRM" | "POS" | "INV" | "FIN" | "HR" | "BI";

export const modules: {
  code: ModuleCode;
  name: string;
  description: string;
  connectsTo: ModuleCode[];
  href: string;
  accent: string;
}[] = [
  {
    code: "CRM",
    name: "Storefronts & CRM",
    description:
      "Create and manage customer-facing storefront websites for your clients, beautifully synced with inventory and central operations.",
    connectsTo: ["FIN", "INV"],
    href: "/products/crm",
    accent: "#C89A4B",
  },
  {
    code: "POS",
    name: "Integrated Point of Sale",
    description:
      "Ring up transactions offline-first, with stock and revenue reconciled across multiple branches the split second a shift closes.",
    connectsTo: ["INV", "FIN"],
    href: "/products/pos",
    accent: "#4B9073",
  },
  {
    code: "INV",
    name: "Stock & Inventory Management",
    description:
      "Advanced stock management across warehouses and branches, with automated reorders and instant digital storefront stock syncing.",
    connectsTo: ["POS", "FIN"],
    href: "/products/inventory",
    accent: "#7C93B0",
  },
  {
    code: "FIN",
    name: "Central Management & ERP",
    description:
      "Manage several branches, global accounting, consolidated reporting, and multi-store configurations from one master dashboard.",
    connectsTo: ["CRM", "POS", "INV"],
    href: "/products/finance",
    accent: "#B4553A",
  },
  {
    code: "HR",
    name: "Multi-Branch Workforce",
    description:
      "Orchestrate staffing, shifts, and registers across several branches with centralized corporate policy and permission controls.",
    connectsTo: ["FIN"],
    href: "/products/hr",
    accent: "#9A7FB0",
  },
  {
    code: "BI",
    name: "Performance Analytics",
    description:
      "Analyze branch growth, inventory turnover, and conversion metrics in real-time to scale business performance with precision.",
    connectsTo: ["CRM", "POS", "INV", "FIN", "HR"],
    href: "/products/analytics",
    accent: "#4E7FB5",
  },
];
