import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Gauge,
  MonitorSmartphone,
  RefreshCw,
  Terminal,
  X,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCEcL6RQ6LruIwODktib1Z-LtAxbtJdLE_O7f1exFDsOc7JvSDz-k9MKgGrYPAdoe9EY_QgL8sN7K_t0jZNVXOUz4mAu0gbuNSyQ7SifZwM8g-jrhEVfJP3SymEuoxeNApEO1pZuMzI0agi683zEbZ6Ubvu-LFu8toq30QpFrZEovSpAYDvx-oj5W4auHNRvuYQidD6at9cfhTQ57t0E2OwlhyOFaXV7svyQ3c8M5FVSplYNGb1tg8'
const BOARDROOM_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9ZM4bZ8DDOQzSju9oaCfN9nNGo89aQ11vBih0-9nmagA83FfZx-7i-OnYk6ctmvJc7p7o5sRLtJXLPKHNXVmlNdUnwd5S2s7W43zRJmTkkUCT4ZRM8V8J1pSA3Zj8h-4srMdJ50ilYbBV_aHnjFHudRudTggYduNejOFL6R3-BC7-N0T53Y9QSlIYbjeESVKH3_YkNeuLFpOKRamFYPJN4bH3fmpVqwjqBzQIS4ddURFD2FXULIE'

/* ---------- Small Shared Components ---------- */

function PingDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#bef529] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#bef529]" />
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
      {children}
    </span>
  )
}

/* ---------- 1. Hero Section ---------- */

function Hero() {
  return (
    <section className="relative w-full overflow-hidden px-4 pb-20 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9e8e5] px-3 py-1.5 shadow-sm">
            <PingDot />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#002116]">
              Scryme ERP OS v3.2 • Unified Operational Kernel
            </span>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#f4f3f0] px-2.5 py-1 font-mono text-[11px] text-[#414844] sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d6700]" />
            <span>180+ NODES SYNCHRONIZED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <h1 className="font-serif max-w-4xl text-4xl font-normal leading-[1.08] tracking-tight text-[#002116] sm:text-6xl md:text-7xl">
              Can one smarter engine scale your entire enterprise?
            </h1>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <p className="font-sans text-base leading-relaxed text-[#414844]">
              Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship
              intelligence, and decoupled catalog engines across an immutable sub-millisecond mesh. Zero fragmented
              connectors.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
                className="group inline-flex items-center justify-center rounded-lg bg-[#002116] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#12372a] hover:shadow-lg"
              >
                <span className="mr-2.5 h-2 w-2 rounded-full bg-[#bef529] transition-transform group-hover:scale-125" />
                <span>Start 14-Day Enterprise Trial</span>
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-lg bg-[#e9e8e5] px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#002116] transition-colors hover:bg-[#e3e2e0]"
              >
                Schedule Enterprise Demo
              </Link>
            </div>
          </div>
        </div>

        <div className="group relative mt-4 w-full overflow-hidden rounded-2xl bg-[#e3e2e0] shadow-xl">
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
            <img
              alt="Autonomous Global Operations Command Headquarters"
              src={HERO_IMG}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002116]/90 via-[#002116]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-end md:p-8">
              <div className="flex max-w-xl flex-col gap-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
                  Global Control Substrate
                </span>
                <p className="font-sans text-sm font-semibold text-white sm:text-base">
                  Autonomous Global Operations Command • Sub-12ms Telemetry Fabric across 180+ Enterprise Nodes
                </p>
              </div>
              <div className="flex items-center gap-3 self-start rounded-xl bg-white/80 px-4 py-2 text-[#1a1c1a] shadow-sm backdrop-blur-md sm:self-auto">
                <Gauge className="h-4 w-4 text-[#4d6700]" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#414844]">
                    Sync State
                  </span>
                  <span className="font-mono text-xs font-bold text-[#002116]">
                    0.008s Consensus
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Core Pillars ---------- */

const PILLARS = [
  {
    label: 'Pillar 01 / Commercial',
    badge: '12ms Ledger Settlement',
    stat: '+42% Win-Rate Velocity',
    title: 'Sales Automation & RevOps',
    body: 'Compress enterprise sales cycles from months to days. Automate multi-currency proposals, dynamic discount margin guardrails, and real-time inventory reservation right from the live sales pipeline.',
    cta: 'Explore Sales Automation & RevOps',
    href: '/sales',
  },
  {
    label: 'Pillar 02 / Logistics',
    badge: '184 Global Nodes Synced',
    stat: '0.02% Incident Rate',
    title: 'Smart Multi-Location Inventory',
    body: 'Track millions of physical units across distributed 3PL networks, regional fulfillment hubs, and retail stores with sub-second RFID and barcode ingestion. Never lose inventory to phantom stockouts.',
    cta: 'Explore Multi-Location Inventory Hub',
    href: '/inventory',
  },
  {
    label: 'Pillar 03 / Intelligence',
    badge: 'Unified Account Graph',
    stat: '89.4% Net Retention',
    title: '360° Relationship CRM',
    body: 'Turn fragmented customer conversations, contract proposals, support escalations, and fulfillment statuses into a unified real-time reactive customer graph with sub-minute churn prediction.',
    cta: 'Explore 360° Relationship CRM',
    href: '/crm',
  },
  {
    label: 'Pillar 04 / Omnichannel',
    badge: 'GraphQL v3.4 Ready',
    stat: '38ms P95 Latency',
    title: 'Headless CMS & Catalog Cloud',
    body: 'Synchronize multi-brand marketing pages, regional localized product catalogs, and custom customer portals directly from your ERP core without re-authoring content or managing brittle webhooks.',
    cta: 'Explore Headless CMS & Catalog Cloud',
    href: '/cms',
  },
]

function Pillars() {
  return (
    <section className="w-full bg-[#f4f3f0] px-4 py-20 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Eyebrow>01 // Architectural Pillars</Eyebrow>
              <span className="h-px w-8 bg-[#c1c8c3]" />
            </div>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-[#002116] sm:text-4xl md:text-5xl">
              Four specialized engines. Zero operational friction.
            </h2>
          </div>
          <p className="font-sans max-w-md text-sm leading-relaxed text-[#414844]">
            Explore the modular, single-state systems powering multinational enterprises. Every action updates the
            kernel in sub-millisecond real time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="group relative flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#414844]">
                    {p.label}
                  </span>
                  <span className="font-mono inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3 py-1 text-xs font-medium text-[#002116]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4d6700]" />
                    {p.badge}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-serif text-3xl text-[#002116] md:text-4xl font-normal">
                    {p.stat}
                  </span>
                  <h3 className="font-serif text-2xl font-medium text-[#002116]">
                    {p.title}
                  </h3>
                </div>
                <p className="font-sans text-sm leading-relaxed text-[#414844]">
                  {p.body}
                </p>
              </div>
              <div className="mt-6 pt-8">
                <Link
                  to={p.href}
                  className="font-sans inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#002116] transition-colors group-hover:text-[#4d6700]"
                >
                  <span>{p.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-[#efeeeb] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#002116] text-white">
                <Terminal className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#002116]">
                  Model Context Protocol (MCP) &amp; APIs
                </span>
                <span className="text-xs text-[#414844]">
                  Stream programmatic ERP state to Claude, GPT-4, and custom AI agents.
                </span>
              </div>
            </div>
            <Link
              to="/developers/apps"
              aria-label="Developer Console"
              className="shrink-0 rounded-lg bg-white p-2.5 text-[#002116] transition-colors hover:bg-[#002116] hover:text-white"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-[#efeeeb] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#bef529] text-[#151f00]">
                <MonitorSmartphone className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#002116]">
                  Native Mobile Operations Hub
                </span>
                <span className="text-xs text-[#414844]">
                  Real-time floor scans, inventory audit adjustments, and pipeline approvals on iOS &amp; Android.
                </span>
              </div>
            </div>
            <Link
              to="/payments"
              aria-label="Payments Architecture"
              className="shrink-0 rounded-lg bg-white p-2.5 text-[#002116] transition-colors hover:bg-[#002116] hover:text-white"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Paradigm Shift ---------- */

function Paradigm() {
  const legacy = [
    ['9 Disconnected Vendor Silos', 'Separate CRM, warehouse, ledger, eCommerce, and catalog databases constantly drifting apart.'],
    ['15+ Minute Cron Job Sync Delays', 'Orders accepted against already depleted inventories during flash spikes and seasonal promotions.'],
    ['$184k / Year In Brittle Middleware', 'Full-time engineers required solely to patch custom webhooks and debug failed Zapier-style flows.'],
  ]
  const kernel = [
    ['1 Single Operational State Engine', 'Every department interacts with a unified ledger. When inventory sells, finance and sales instantly reflect it.'],
    ['<12ms Deterministic Telemetry', 'Sub-second atomic state consistency across global nodes with zero phantom stockouts.'],
    ['Zero Middleware Tax', 'Native modules communicate through zero-overhead internal bus, eliminating middleware maintenance.'],
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="flex flex-col gap-16">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Eyebrow>02 // Paradigm Shift</Eyebrow>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-[#002116] sm:text-4xl md:text-5xl">
              Stop paying the middleware tax on broken operational data.
            </h2>
            <p className="font-sans text-base leading-relaxed text-[#414844]">
              Enterprise systems failed because they bolted isolated SaaS point solutions together with duct-tape
              webhooks. When data is replicated across 9 different vendors, truth becomes obsolete within 15 minutes.
            </p>
            <div className="flex flex-col gap-3 rounded-xl bg-[#f4f3f0] p-5">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-[18px] w-[18px] text-[#ba1a1a]" />
                <span className="font-sans text-sm font-semibold text-[#002116]">
                  The True Cost of Legacy SaaS Sprawl
                </span>
              </div>
              <p className="font-sans text-xs text-[#414844] leading-relaxed">
                The average $100M+ enterprise spends $184,000 annually maintaining API sync scripts, reconciling
                ledger mismatches, and investigating phantom inventory orders.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl bg-[#e9e8e5] shadow-xl">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  alt="Senior enterprise leadership reviewing real-time global supply chain telemetry"
                  src={BOARDROOM_IMG}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="flex flex-col items-start justify-between gap-4 bg-white p-6 sm:flex-row sm:items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#002116]">
                    Executive Visibility Room
                  </span>
                  <span className="text-xs text-[#414844]">
                    Cross-node revenue &amp; logistics consensus active
                  </span>
                </div>
                <div className="font-mono flex items-center gap-2 text-xs font-semibold text-[#4d6700]">
                  <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                  ZERO SYNCHRONIZATION DELAY
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-2xl bg-[#e9e8e5] p-8">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#414844]">
                The Conventional Pattern
              </span>
              <span className="font-mono rounded bg-[#ffdad6] px-2.5 py-1 text-xs font-semibold text-[#93000a]">
                Legacy Sprawl
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {legacy.map(([t, d]) => (
                <div key={t} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#ba1a1a]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#002116]">{t}</span>
                    <span className="text-xs text-[#414844] leading-relaxed">{d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#002116] p-8 text-white shadow-xl">
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
                Scryme Unified Kernel
              </span>
              <span className="font-mono rounded-full bg-[#bef529] px-2.5 py-1 text-xs font-bold text-[#151f00]">
                Sub-12ms Mesh
              </span>
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              {kernel.map(([t, d]) => (
                <div key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#bef529]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{t}</span>
                    <span className="text-xs text-[#7ba190] leading-relaxed">{d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Metrics & Case Study ---------- */

function MetricsAndCase() {
  const metrics = [
    ['Annual GMV Managed', '$1.2B+', 'Governed with zero reconciliation drift'],
    ['Global Sync Latency', '12ms', 'Across multi-cloud regions'],
    ['Guaranteed SLA', '99.999%', 'Mission-critical redundancy standard'],
    ['Ledger Recon Reduction', '88%', 'Eliminating manual accounting friction'],
  ]
  const deploy = [
    ['Fulfillment Nodes:', '42 Facilities'],
    ['SKU Catalog Scale:', '4.2M SKUs'],
    ['Migration Timeframe:', '31 Business Days'],
  ]

  return (
    <section className="w-full bg-[#f4f3f0] px-4 py-20 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {metrics.map(([k, v, d]) => (
            <div key={k} className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#414844]">
                {k}
              </span>
              <span className="font-serif text-3xl font-normal text-[#002116] md:text-4xl">
                {v}
              </span>
              <span className="font-sans text-xs text-[#414844]">{d}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-10 rounded-3xl bg-white p-8 shadow-md lg:flex-row md:p-12">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="font-mono rounded-full bg-[#bef529] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#151f00]">
                Customer Spotlight
              </span>
              <span className="font-sans text-sm font-semibold text-[#002116]">
                Veloce Global Logistics AG
              </span>
            </div>
            <blockquote className="font-serif text-xl font-medium leading-snug text-[#002116] sm:text-2xl md:text-3xl">
              "Migrating to Scryme’s single-kernel architecture collapsed our reconciliation cycle from 3 days to
              literally 4 seconds. Our ops teams in Zurich and Singapore are finally looking at the exact same ledger
              numbers without questioning data freshness."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="font-sans flex h-12 w-12 items-center justify-center rounded-full bg-[#002116] text-sm font-bold text-white">
                ER
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#002116]">Elena Rostova</span>
                <span className="text-xs text-[#414844]">
                  Chief Operating Officer, Veloce Global Logistics
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl bg-[#f4f3f0] p-6 lg:w-80">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#414844]">
              Deployment Summary
            </span>
            <div className="flex flex-col gap-3">
              {deploy.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[#414844]">{k}</span>
                  <span className="font-mono font-semibold text-[#002116]">{v}</span>
                </div>
              ))}
            </div>
            <Link
              to="/crm"
              className="mt-2 rounded-lg bg-[#002116] py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#12372a]"
            >
              Read Full Case Study
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. FAQ Accordion ---------- */

const FAQS = [
  [
    'How does Scryme guarantee sub-12ms sync across disparate regions without data conflicts?',
    'Scryme uses an immutable state mesh powered by multi-raft consensus protocols. Rather than relying on traditional delayed database replications, ledger events are serialized into deterministic operational blocks with CRDT-backed delta resolution, preventing phantom inventory allocations and sales race conditions.',
  ],
  [
    'Can we gradually migrate existing data from SAP, NetSuite, or legacy custom ERPs?',
    'Yes. Scryme features bidirectional Shadow Sync adapters. You can deploy our Sales Automation or Multi-Location Inventory module first, running in parallel with your legacy core while our zero-loss ETL pipelines mirror real-time records until full migration sign-off.',
  ],
  [
    'What are the Model Context Protocol (MCP) capabilities for our AI development teams?',
    'Scryme exposes secure, enterprise-scoped MCP endpoints. Internal AI assistants and autonomous workflows can query customer credit risk, forecast warehouse restock thresholds, or generate draft contracts with full role-based access control and immutable audit trails.',
  ],
  [
    'What security certifications and data residency guarantees are provided?',
    'Scryme is SOC 2 Type II and ISO/IEC 27001 certified. We support dedicated sovereign VPC instances across Frankfurt, Zurich, Northern Virginia, Singapore, and Tokyo with TLS 1.3 in-transit and AES-256 field-level encryption at rest.',
  ],
]

function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="mx-auto max-w-4xl px-4 py-24 md:px-8">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>03 // Architectural Inquiries</Eyebrow>
          <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-[#002116] sm:text-4xl md:text-5xl">
            Frequently asked questions by enterprise engineering &amp; leadership
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div
                key={q}
                className="overflow-hidden rounded-xl bg-[#f4f3f0] transition-all duration-200"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-bold text-[#002116]"
                >
                  <span>{q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#4d6700]' : 'text-[#717974]'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 font-sans text-sm leading-relaxed text-[#414844]">
                    {a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Bottom Conversion CTA ---------- */

function FinalCta() {
  return (
    <section className="w-full bg-[#002116] px-4 py-20 text-white md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 py-10 text-center">
        <div className="font-mono inline-flex items-center gap-2 rounded-full bg-[#12372a] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
          Autonomous Enterprise Orchestration
        </div>
        <h2 className="font-serif max-w-3xl text-3xl font-normal leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
          Reclaim command of your global operations today.
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-[#7ba190]">
          Speak directly with a Principal Enterprise Solutions Architect or spin up an isolated staging sandbox loaded
          with your sample catalog and node taxonomy.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="inline-flex items-center justify-center rounded-xl bg-[#bef529] px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#151f00] shadow-lg transition-all hover:bg-[#a4d700] hover:shadow-xl"
          >
            Start 14-Day Enterprise Trial
          </a>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-xl bg-[#12372a] px-8 py-4 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#003923]"
          >
            Schedule Architecture Review
          </Link>
        </div>
        <div className="font-mono mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#7ba190]">
          {['NO LEGACY CONNECTORS NEEDED', 'DEDICATED SOVEREIGN HOSTING', '99.999% RUNTIME SLA'].map((t, i) => (
            <span key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" />
              {t}
              {i < 2 && <span className="ml-4 text-white/30">•</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page Layout ---------- */

function HomeComponent() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#bef529] selection:text-[#151f00]">
      <Header />
      <main className="w-full pt-20">
        <Hero />
        <Pillars />
        <Paradigm />
        <MetricsAndCase />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}