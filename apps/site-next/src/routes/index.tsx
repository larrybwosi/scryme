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

/* ---------- small shared pieces ---------- */

function PingDot({ className = '' }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d2ff3a] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d2ff3a]" />
    </span>
  )
}

function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`font-mono text-[10px] font-bold uppercase tracking-widest text-[#d2ff3a] ${className}`}
    >
      {children}
    </span>
  )
}

/* ---------- 1. hero ---------- */

function Hero() {
  return (
    <section className="relative w-full overflow-hidden px-4 pb-20 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-sm bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10">
            <PingDot />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#d2ff3a]">
              Scryme ERP OS v3.2 • Unified Operational Kernel
            </span>
          </div>
          <div
            className="font-mono hidden items-center gap-2 rounded-full px-3 py-1 text-[11px] sm:inline-flex bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10 text-[var(--text-muted)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            <span>180+ NODES SYNCHRONIZED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <h1 className="font-serif max-w-4xl text-4xl font-normal leading-[1.08] tracking-tight sm:text-6xl md:text-7xl dark:text-white light:text-[#090a0b]">
              Can one smarter engine scale your entire enterprise?
            </h1>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <p className="font-sans text-base leading-relaxed text-[var(--text-muted)]">
              Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship
              intelligence, and decoupled catalog engines across an immutable sub-millisecond mesh. Zero fragmented
              connectors.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
                className="group inline-flex items-center justify-center rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] hover:shadow-[0_0_20px_rgba(210,255,58,0.4)] transition-all transform active:scale-95"
              >
                <span>Start 14-Day Enterprise Trial</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-1" />
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-full px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border border-white/15 dark:border-white/15 light:border-black/15 hover:bg-white/10 transition"
              >
                View Transparent Pricing
              </Link>
            </div>
          </div>
        </div>

        <div className="group relative mt-4 w-full overflow-hidden rounded-2xl glass-panel shadow-2xl border-white/10">
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
            <img
              alt="Autonomous Global Operations Command Headquarters"
              src={HERO_IMG}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01] opacity-90"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#090a0b]/90 via-[#090a0b]/30 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-end md:p-8">
              <div className="flex max-w-xl flex-col gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#d2ff3a]">
                  Global Control Substrate
                </span>
                <p className="font-sans text-sm sm:text-base font-semibold text-white">
                  Autonomous Global Operations Command • Sub-12ms Telemetry Fabric across 180+ Enterprise Nodes
                </p>
              </div>
              <div
                className="flex items-center gap-3 self-start rounded-xl px-4 py-2 shadow-lg backdrop-blur-md sm:self-auto glass-panel border-white/10"
              >
                <Gauge className="h-4 w-4 text-[#d2ff3a]" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Sync State
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
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

/* ---------- 2. pillars ---------- */

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
    badge: 'Catalog Cloud & Headless CMS',
    stat: '38ms P95 Latency',
    title: 'Catalog Cloud Edge Engine',
    body: 'Synchronize multi-brand marketing pages, regional localized product catalogs, and custom customer portals directly from your ERP core without re-authoring content or managing brittle webhooks.',
    cta: 'Explore Catalog Cloud & Headless CMS',
    href: '/cms',
  },
]

function Pillars() {
  return (
    <section className="w-full px-4 py-20 md:px-8 border-t border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.01]">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Eyebrow>01 // Architectural Pillars</Eyebrow>
              <span className="h-px w-8 bg-[#d2ff3a]/40" />
            </div>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight sm:text-4xl md:text-5xl dark:text-white light:text-[#090a0b]">
              Four specialized engines. Zero operational friction.
            </h2>
          </div>
          <p className="font-sans max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
            Explore the modular, single-state systems powering multinational enterprises. Every action updates the
            kernel in sub-millisecond real time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="glass-panel group relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 hover:border-[#d2ff3a]/50 hover:shadow-2xl"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {p.label}
                  </span>
                  <span className="font-mono inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-white/5 border border-white/10 text-[#d2ff3a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d2ff3a]" />
                    {p.badge}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-serif text-3xl md:text-4xl text-[#d2ff3a]">
                    {p.stat}
                  </span>
                  <h3 className="font-serif text-2xl font-medium dark:text-white light:text-[#090a0b]">
                    {p.title}
                  </h3>
                </div>
                <p className="font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                  {p.body}
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <Link
                  to={p.href}
                  className="font-sans inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline transition-colors"
                >
                  <span>{p.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="glass-panel flex items-center justify-between gap-4 rounded-2xl p-6 border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d2ff3a]/10 text-[#d2ff3a]">
                <Terminal className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold dark:text-white light:text-[#090a0b]">
                  Model Context Protocol (MCP) & Developer APIs
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Stream programmatic ERP state to Claude, GPT-4, and custom AI agents.
                </span>
              </div>
            </div>
            <Link
              to="/developers/apps"
              aria-label="Developer Console"
              className="shrink-0 rounded-xl p-3 bg-white/5 border border-white/10 hover:border-[#d2ff3a] text-[#d2ff3a] transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass-panel flex items-center justify-between gap-4 rounded-2xl p-6 border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#10b981]">
                <MonitorSmartphone className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold dark:text-white light:text-[#090a0b]">
                  Omnichannel Payments & POS Reconciliation
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Instant M-Pesa STK Push, card settlement, and automated general ledger posting.
                </span>
              </div>
            </div>
            <Link
              to="/payments"
              aria-label="Payments Architecture"
              className="shrink-0 rounded-xl p-3 bg-white/5 border border-white/10 hover:border-[#10b981] text-[#10b981] transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. paradigm shift ---------- */

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
    <section className="w-full px-4 py-24 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Eyebrow>02 // Paradigm Shift</Eyebrow>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight sm:text-4xl md:text-5xl dark:text-white light:text-[#090a0b]">
              Stop paying the middleware tax on broken operational data.
            </h2>
            <p className="font-sans text-base leading-relaxed text-[var(--text-muted)]">
              Enterprise systems failed because they bolted isolated SaaS point solutions together with duct-tape
              webhooks. When data is replicated across 9 different vendors, truth becomes obsolete within 15 minutes.
            </p>
            <div className="glass-panel flex flex-col gap-3 rounded-2xl p-5 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-[18px] w-[18px] text-amber-400" />
                <span className="font-sans text-sm font-semibold text-amber-300">
                  The True Cost of Legacy SaaS Sprawl
                </span>
              </div>
              <p className="font-sans text-xs text-amber-200/80 leading-relaxed">
                The average $100M+ enterprise spends $184,000 annually maintaining API sync scripts, reconciling
                ledger mismatches, and investigating phantom inventory orders.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl glass-panel shadow-2xl border-white/10">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  alt="Senior enterprise leadership reviewing real-time global supply chain telemetry"
                  src={BOARDROOM_IMG}
                  className="h-full w-full object-cover object-center opacity-85"
                />
              </div>
              <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-sm font-bold dark:text-white light:text-[#090a0b]">
                    Executive Visibility Room
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Cross-node revenue &amp; logistics consensus active
                  </span>
                </div>
                <div className="font-mono flex items-center gap-2 text-xs font-semibold text-[#10b981]">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
                  ZERO SYNCHRONIZATION DELAY
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="glass-panel flex flex-col gap-6 rounded-3xl p-8 border-red-500/20">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                The Conventional Pattern
              </span>
              <span className="font-mono rounded-full px-2.5 py-1 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                Legacy Sprawl
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {legacy.map(([t, d]) => (
                <div key={t} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold dark:text-white light:text-[#090a0b]">
                      {t}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {d}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel-elevated relative flex flex-col gap-6 overflow-hidden rounded-3xl p-8 border-[#d2ff3a]/40 shadow-2xl">
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#d2ff3a]">
                Scryme Unified Kernel
              </span>
              <span className="font-mono rounded-full px-3 py-1 text-xs font-bold bg-[#d2ff3a]/20 text-[#d2ff3a] border border-[#d2ff3a]/40">
                Sub-12ms Mesh
              </span>
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              {kernel.map(([t, d]) => (
                <div key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d2ff3a]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold dark:text-white light:text-[#090a0b]">{t}</span>
                    <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {d}
                    </span>
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

/* ---------- 4. metrics + case study ---------- */

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
    <section className="w-full px-4 py-20 md:px-8 border-t border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.01]">
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {metrics.map(([k, v, d]) => (
            <div key={k} className="glass-panel flex flex-col gap-2 rounded-2xl p-6 border-white/10">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                {k}
              </span>
              <span className="font-serif text-3xl md:text-4xl font-bold text-[#d2ff3a]">
                {v}
              </span>
              <span className="font-sans text-xs text-[var(--text-muted)]">
                {d}
              </span>
            </div>
          ))}
        </div>

        <div className="glass-panel flex flex-col items-center justify-between gap-10 rounded-3xl p-8 md:p-12 lg:flex-row border-white/10">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#d2ff3a] text-[#090a0b]">
                Customer Spotlight
              </span>
              <span className="font-sans text-sm font-semibold dark:text-white light:text-[#090a0b]">
                Veloce Global Logistics AG
              </span>
            </div>
            <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed dark:text-white light:text-[#090a0b]">
              "Migrating to Scryme’s single-kernel architecture collapsed our reconciliation cycle from 3 days to
              literally 4 seconds. Our ops teams in Zurich and Singapore are finally looking at the exact same ledger
              numbers without questioning data freshness."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="font-sans flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold bg-[#d2ff3a] text-[#090a0b]">
                ER
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold dark:text-white light:text-[#090a0b]">
                  Elena Rostova
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Chief Operating Officer, Veloce Global Logistics
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel flex w-full shrink-0 flex-col gap-4 rounded-2xl p-6 lg:w-80 border-white/10">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#d2ff3a]">
              Deployment Summary
            </span>
            <div className="flex flex-col gap-3">
              {deploy.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{k}</span>
                  <span className="font-mono font-bold dark:text-white light:text-[#090a0b]">
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/crm"
              className="mt-2 rounded-xl py-2.5 text-center text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition-colors"
            >
              Explore 360° CRM Case Study
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. FAQ accordion ---------- */

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
    <section className="w-full px-4 py-24 md:px-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>03 // Architectural Inquiries</Eyebrow>
          <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight sm:text-4xl md:text-5xl dark:text-white light:text-[#090a0b]">
            Frequently asked questions by enterprise engineering &amp; leadership
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q} className="glass-panel overflow-hidden rounded-2xl border-white/10 transition-all duration-200">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-bold dark:text-white light:text-[#090a0b]"
                >
                  <span>{q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#d2ff3a]' : 'text-slate-400'}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm leading-relaxed text-[var(--text-muted)] border-t border-white/5 pt-3">
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

/* ---------- 6. bottom CTA ---------- */

function FinalCta() {
  return (
    <section className="w-full px-4 py-20 md:px-8 max-w-7xl mx-auto text-center">
      <div className="glass-panel-elevated p-10 md:p-16 rounded-3xl relative overflow-hidden">
        <div className="font-mono inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#d2ff3a]/20 text-[#d2ff3a] border border-[#d2ff3a]/30 mb-6">
          Autonomous Enterprise Orchestration
        </div>
        <h2 className="font-serif max-w-3xl mx-auto text-3xl md:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight dark:text-white light:text-[#090a0b] mb-6">
          Reclaim command of your global operations today.
        </h2>
        <p className="max-w-2xl mx-auto text-base text-[var(--text-muted)] leading-relaxed mb-8">
          Speak directly with a Principal Enterprise Solutions Architect or spin up an isolated staging sandbox loaded
          with your sample catalog and node taxonomy.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] hover:shadow-[0_0_25px_rgba(210,255,58,0.4)] transition-all"
          >
            Start 14-Day Enterprise Trial
          </a>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-wider border border-white/20 dark:border-white/20 light:border-black/20 hover:bg-white/10 transition-colors"
          >
            Schedule Architecture Review
          </Link>
        </div>
        <div className="font-mono mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
          {['NO LEGACY CONNECTORS NEEDED', 'DEDICATED SOVEREIGN HOSTING', '99.999% RUNTIME SLA'].map((t, i) => (
            <span key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d2ff3a]" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- page ---------- */

function HomeComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />
      <main className="w-full">
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
