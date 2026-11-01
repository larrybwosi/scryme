import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Gauge,
  MonitorSmartphone,
  RefreshCw,
  Terminal,
  User,
  X,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

/*
 * Fonts (add once, e.g. in __root.tsx head links or index.html):
 *   https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700
 *     &family=JetBrains+Mono:wght@500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap
 */

/* ---------- design tokens ---------- */

const C = {
  surface: '#faf9f6',
  white: '#ffffff',
  low: '#f4f3f0',
  mid: '#efeeeb',
  high: '#e9e8e5',
  primary: '#002116',
  primaryContainer: '#12372a',
  onSurface: '#1a1c1a',
  muted: '#414844',
  secondary: '#4d6700',
  lime: '#bef529',
  limeDim: '#a4d700',
  onLime: '#151f00',
  onPrimaryContainer: '#7ba190',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  tertiaryFixedDim: '#9dd2b3',
}

const SERIF = "font-['Newsreader',serif]"
const MONO = "font-['JetBrains_Mono',monospace]"
const SANS = "font-['Inter',sans-serif]"

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCEcL6RQ6LruIwODktib1Z-LtAxbtJdLE_O7f1exFDsOc7JvSDz-k9MKgGrYPAdoe9EY_QgL8sN7K_t0jZNVXOUz4mAu0gbuNSyQ7SifZwM8g-jrhEVfJP3SymEuoxeNApEO1pZuMzI0agi683zEbZ6Ubvu-LFu8toq30QpFrZEovSpAYDvx-oj5W4auHNRvuYQidD6at9cfhTQ57t0E2OwlhyOFaXV7svyQ3c8M5FVSplYNGb1tg8'
const BOARDROOM_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9ZM4bZ8DDOQzSju9oaCfN9nNGo89aQ11vBih0-9nmagA83FfZx-7i-OnYk6ctmvJc7p7o5sRLtJXLPKHNXVmlNdUnwd5S2s7W43zRJmTkkUCT4ZRM8V8J1pSA3Zj8h-4srMdJ50ilYbBV_aHnjFHudRudTggYduNejOFL6R3-BC7-N0T53Y9QSlIYbjeESVKH3_YkNeuLFpOKRamFYPJN4bH3fmpVqwjqBzQIS4ddURFD2FXULIE'

/* ---------- small shared pieces ---------- */

function PingDot({ className = '' }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ background: C.limeDim }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: C.lime }} />
    </span>
  )
}

function Dot({ color, size = 'h-1.5 w-1.5' }: { color: string; size?: string }) {
  return <span className={`inline-block shrink-0 rounded-full ${size}`} style={{ background: color }} />
}

function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`${MONO} text-[10px] font-bold uppercase tracking-widest ${className}`}
      style={{ color: C.secondary }}
    >
      {children}
    </span>
  )
}

/* ---------- header ---------- */

const SOLUTIONS = [
  ['Sales Automation', 'Revenue engines & pipeline velocity'],
  ['Multi-Location Inventory', 'Real-time node synchronisation'],
  ['360° CRM', 'Unified global partner telemetry'],
  ['Headless CMS', 'Decoupled omnichannel catalog'],
]

function Header() {
  const link = 'text-sm transition-colors hover:text-[#1a1c1a]'
  return (
    <header
      className="fixed top-0 z-50 w-full backdrop-blur-xl"
      style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 8px rgba(18,55,42,0.04)' }}
    >
      <div className="flex h-20 w-full items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2">
            <span className={`${SERIF} text-[28px] font-medium tracking-tight`} style={{ color: C.primary }}>
              Scryme
            </span>
            <span
              className="flex items-center gap-1.5 rounded-full border px-2 py-0.5"
              style={{ background: C.low, borderColor: 'rgba(18,55,42,0.1)' }}
            >
              <PingDot />
              <span className={`${MONO} text-[10px] font-medium uppercase tracking-wider`} style={{ color: C.muted }}>
                ERP OS 3.2
              </span>
            </span>
          </a>

          <nav className={`${SANS} hidden items-center gap-6 lg:flex`} style={{ color: C.muted }}>
            <div className="group relative py-2">
              <button className="flex cursor-pointer items-center gap-1 text-sm transition-colors group-hover:text-[#002116]">
                Solutions
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div
                  className="flex w-72 flex-col gap-1 rounded-xl border bg-white p-2"
                  style={{
                    borderColor: 'rgba(18,55,42,0.1)',
                    boxShadow: '0 20px 48px rgba(18,55,42,0.12), 0 4px 12px rgba(18,55,42,0.04)',
                  }}
                >
                  {SOLUTIONS.map(([t, d]) => (
                    <a key={t} href="#" className="flex flex-col rounded-lg px-2 py-2 transition-colors hover:bg-[#f4f3f0]">
                      <span className="text-sm font-semibold" style={{ color: C.onSurface }}>
                        {t}
                      </span>
                      <span className="text-xs" style={{ color: C.muted }}>
                        {d}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <a href="#" className={link}>Platform</a>
            <a href="#" className={link}>Architecture</a>
            <Link to="/pricing" className={link}>Pricing</Link>
            <a href="#" className={link}>Resources</a>
            <a href="#" className={link}>Enterprise</a>
          </nav>
        </div>

        <div className={`${SANS} flex items-center gap-4`}>
          <a href="#" className="hidden px-2 py-1.5 text-sm transition-colors hover:text-[#002116] sm:inline-flex" style={{ color: C.muted }}>
            Log In
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#12372a]"
            style={{ background: C.primary, boxShadow: '0 1px 3px rgba(18,55,42,0.03), 0 4px 16px rgba(18,55,42,0.02)' }}
          >
            <span className="mr-2 h-1.5 w-1.5 rounded-full" style={{ background: C.lime }} />
            Book Demo
          </a>
          <a
            href="https://app.scryme.tech/signup"
            className="hidden items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-[#a4d700] xl:inline-flex"
            style={{ background: C.lime, color: C.onLime }}
          >
            Start Free Trial
          </a>
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: C.primary }}>
            <User className="h-[18px] w-[18px] text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}

/* ---------- 1. hero ---------- */

function Hero() {
  return (
    <section className="relative w-full overflow-hidden px-4 pb-20 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm" style={{ background: C.high }}>
            <PingDot />
            <span className={`${MONO} text-[11px] font-semibold uppercase tracking-wider`} style={{ color: C.primary }}>
              Scryme ERP OS v3.2 • Unified Operational Kernel
            </span>
          </div>
          <div
            className={`${MONO} hidden items-center gap-2 rounded-full px-2.5 py-1 text-[11px] sm:inline-flex`}
            style={{ background: C.low, color: C.muted }}
          >
            <Dot color={C.secondary} />
            <span>180+ NODES SYNCHRONIZED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <h1
              className={`${SERIF} max-w-4xl text-[38px] font-normal leading-[44px] tracking-tight md:text-[56px] md:leading-[64px]`}
              style={{ color: C.primary }}
            >
              Can one smarter engine scale your entire enterprise?
            </h1>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <p className={`${SANS} text-base leading-relaxed`} style={{ color: C.muted }}>
              Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship
              intelligence, and decoupled catalog engines across an immutable sub-millisecond mesh. Zero fragmented
              connectors.
            </p>
            <div className={`${SANS} flex flex-wrap items-center gap-3`}>
              <a
                href="https://app.scryme.tech/signup"
                className="group inline-flex items-center justify-center rounded-lg px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#12372a] hover:shadow-lg"
                style={{ background: C.primary }}
              >
                <span
                  className="mr-2.5 h-2 w-2 rounded-full transition-transform group-hover:scale-125"
                  style={{ background: C.lime }}
                />
                Start 14-Day Enterprise Trial
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-[#e3e2e0]"
                style={{ background: C.high, color: C.primary }}
              >
                Schedule Enterprise Demo
              </a>
            </div>
          </div>
        </div>

        <div className="group relative mt-4 w-full overflow-hidden rounded-2xl shadow-xl" style={{ background: '#e3e2e0' }}>
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
            <img
              alt="Autonomous Global Operations Command Headquarters"
              src={HERO_IMG}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,33,22,0.9), rgba(0,33,22,0.2), transparent)' }}
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-end md:p-8">
              <div className="flex max-w-xl flex-col gap-1">
                <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.lime }}>
                  Global Control Substrate
                </span>
                <p className={`${SANS} text-base font-semibold text-white`}>
                  Autonomous Global Operations Command • Sub-12ms Telemetry Fabric across 180+ Enterprise Nodes
                </p>
              </div>
              <div
                className="flex items-center gap-3 self-start rounded-xl px-4 py-2 shadow-sm backdrop-blur-md sm:self-auto"
                style={{ background: 'rgba(255,255,255,0.8)', color: C.onSurface }}
              >
                <Gauge className="h-4 w-4" style={{ color: C.secondary }} />
                <div className="flex flex-col">
                  <span className={`${MONO} text-[10px] uppercase tracking-wider`} style={{ color: C.muted }}>
                    Sync State
                  </span>
                  <span className={`${MONO} text-xs font-semibold`} style={{ color: C.primary }}>
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
    badgeDot: C.secondary,
    stat: '+42% Win-Rate Velocity',
    title: 'Sales Automation & RevOps',
    body: 'Compress enterprise sales cycles from months to days. Automate multi-currency proposals, dynamic discount margin guardrails, and real-time inventory reservation right from the live sales pipeline.',
    cta: 'Explore Sales Automation & RevOps',
  },
  {
    label: 'Pillar 02 / Logistics',
    badge: '184 Global Nodes Synced',
    badgeDot: C.lime,
    stat: '0.02% Incident Rate',
    title: 'Smart Multi-Location Inventory',
    body: 'Track millions of physical units across distributed 3PL networks, regional fulfillment hubs, and retail stores with sub-second RFID and barcode ingestion. Never lose inventory to phantom stockouts.',
    cta: 'Explore Multi-Location Inventory Hub',
  },
  {
    label: 'Pillar 03 / Intelligence',
    badge: 'Unified Account Graph',
    badgeDot: C.tertiaryFixedDim,
    stat: '89.4% Net Retention',
    title: '360° Relationship CRM',
    body: 'Turn fragmented customer conversations, contract proposals, support escalations, and fulfillment statuses into a unified real-time reactive customer graph with sub-minute churn prediction.',
    cta: 'Explore 360° Relationship CRM',
  },
  {
    label: 'Pillar 04 / Omnichannel',
    badge: 'GraphQL v3.4 Ready',
    badgeDot: C.lime,
    stat: '38ms P95 Latency',
    title: 'Headless CMS & Catalog Cloud',
    body: 'Synchronize multi-brand marketing pages, regional localized product catalogs, and custom customer portals directly from your ERP core without re-authoring content or managing brittle webhooks.',
    cta: 'Explore Headless CMS & Catalog Cloud',
  },
]

function Pillars() {
  return (
    <section className="w-full px-4 py-20 md:px-8" style={{ background: C.low }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Eyebrow>01 // Architectural Pillars</Eyebrow>
              <span className="h-px w-8" style={{ background: '#c1c8c3' }} />
            </div>
            <h2
              className={`${SERIF} text-[30px] font-normal leading-9 tracking-tight md:text-[40px] md:leading-[48px]`}
              style={{ color: C.primary }}
            >
              Four specialized engines. Zero operational friction.
            </h2>
          </div>
          <p className={`${SANS} max-w-md text-sm leading-5`} style={{ color: C.muted }}>
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
                  <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
                    {p.label}
                  </span>
                  <span
                    className={`${MONO} inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium`}
                    style={{ background: C.mid, color: C.primary }}
                  >
                    <Dot color={p.badgeDot} />
                    {p.badge}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`${SERIF} text-[30px] leading-9 md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
                    {p.stat}
                  </span>
                  <h3 className={`${SERIF} text-[22px] font-medium leading-7`} style={{ color: C.primary }}>
                    {p.title}
                  </h3>
                </div>
                <p className={`${SANS} text-sm leading-relaxed`} style={{ color: C.muted }}>
                  {p.body}
                </p>
              </div>
              <div className="mt-6 pt-8">
                <a
                  href="#"
                  className={`${SANS} inline-flex items-center gap-2 text-sm font-semibold transition-colors group-hover:text-[#4d6700]`}
                  style={{ color: C.primary }}
                >
                  {p.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              Icon: Terminal,
              bg: C.primary,
              fg: '#ffffff',
              t: 'Model Context Protocol (MCP) & APIs',
              d: 'Stream programmatic ERP state to Claude, GPT-4, and custom AI agents.',
            },
            {
              Icon: MonitorSmartphone,
              bg: C.lime,
              fg: C.onLime,
              t: 'Native Mobile Operations Hub',
              d: 'Real-time floor scans, inventory audit adjustments, and pipeline approvals on iOS & Android.',
            },
          ].map(({ Icon, bg, fg, t, d }) => (
            <div key={t} className="flex items-center justify-between gap-4 rounded-xl p-6" style={{ background: C.mid }}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg" style={{ background: bg, color: fg }}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={`${SANS} flex flex-col`}>
                  <span className="text-sm font-semibold" style={{ color: C.primary }}>
                    {t}
                  </span>
                  <span className="text-xs" style={{ color: C.muted }}>
                    {d}
                  </span>
                </div>
              </div>
              <a
                href="#"
                aria-label={t}
                className="shrink-0 rounded-lg bg-white p-2.5 transition-colors hover:bg-[#002116] hover:text-white"
                style={{ color: C.primary }}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
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
    <section className="w-full px-4 py-24 md:px-8" style={{ background: C.surface }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Eyebrow>02 // Paradigm Shift</Eyebrow>
            <h2
              className={`${SERIF} text-[30px] font-normal leading-tight tracking-tight md:text-[40px]`}
              style={{ color: C.primary }}
            >
              Stop paying the middleware tax on broken operational data.
            </h2>
            <p className={`${SANS} text-base leading-relaxed`} style={{ color: C.muted }}>
              Enterprise systems failed because they bolted isolated SaaS point solutions together with duct-tape
              webhooks. When data is replicated across 9 different vendors, truth becomes obsolete within 15 minutes.
            </p>
            <div className="flex flex-col gap-3 rounded-xl p-5" style={{ background: C.low }}>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-[18px] w-[18px]" style={{ color: C.error }} />
                <span className={`${SANS} text-sm font-semibold`} style={{ color: C.primary }}>
                  The True Cost of Legacy SaaS Sprawl
                </span>
              </div>
              <p className={`${SANS} text-xs`} style={{ color: C.muted }}>
                The average $100M+ enterprise spends $184,000 annually maintaining API sync scripts, reconciling
                ledger mismatches, and investigating phantom inventory orders.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ background: C.high }}>
              <div className="aspect-[16/10] w-full">
                <img
                  alt="Senior enterprise leadership reviewing real-time global supply chain telemetry in modern boardroom"
                  src={BOARDROOM_IMG}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="flex flex-col items-start justify-between gap-4 bg-white p-6 sm:flex-row sm:items-center">
                <div className={`${SANS} flex flex-col`}>
                  <span className="text-sm font-semibold" style={{ color: C.primary }}>
                    Executive Visibility Room
                  </span>
                  <span className="text-xs" style={{ color: C.muted }}>
                    Cross-node revenue &amp; logistics consensus active
                  </span>
                </div>
                <div className={`${MONO} flex items-center gap-2 text-xs font-semibold`} style={{ color: C.secondary }}>
                  <Dot color={C.lime} size="h-2 w-2" />
                  ZERO SYNCHRONIZATION DELAY
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-2xl p-8" style={{ background: C.high }}>
            <div className="flex items-center justify-between">
              <span className={`${SANS} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
                The Conventional Pattern
              </span>
              <span
                className={`${MONO} rounded px-2.5 py-1 text-xs font-semibold`}
                style={{ background: C.errorContainer, color: C.onErrorContainer }}
              >
                Legacy Sprawl
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {legacy.map(([t, d]) => (
                <div key={t} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0" style={{ color: C.error }} />
                  <div className={`${SANS} flex flex-col`}>
                    <span className="text-sm font-semibold" style={{ color: C.primary }}>
                      {t}
                    </span>
                    <span className="text-xs" style={{ color: C.muted }}>
                      {d}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 text-white shadow-xl"
            style={{ background: C.primary }}
          >
            <div className="relative z-10 flex items-center justify-between">
              <span className={`${SANS} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.lime }}>
                Scryme Unified Kernel
              </span>
              <span
                className={`${MONO} rounded-full px-2.5 py-1 text-xs font-bold`}
                style={{ background: C.secondary, color: '#ffffff' }}
              >
                Sub-12ms Mesh
              </span>
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              {kernel.map(([t, d]) => (
                <div key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: C.lime }} />
                  <div className={`${SANS} flex flex-col`}>
                    <span className="text-sm font-semibold text-white">{t}</span>
                    <span className="text-xs" style={{ color: C.onPrimaryContainer }}>
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
    <section className="w-full px-4 py-20 md:px-8" style={{ background: C.low }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {metrics.map(([k, v, d]) => (
            <div key={k} className="flex flex-col gap-2 rounded-2xl bg-white p-6">
              <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
                {k}
              </span>
              <span className={`${SERIF} text-[30px] leading-9 md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
                {v}
              </span>
              <span className={`${SANS} text-xs`} style={{ color: C.muted }}>
                {d}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-10 rounded-3xl bg-white p-8 shadow-md md:p-12 lg:flex-row">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`${MONO} rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider`}
                style={{ background: C.lime, color: C.onLime }}
              >
                Customer Spotlight
              </span>
              <span className={`${SANS} text-sm font-semibold`} style={{ color: C.primary }}>
                Veloce Global Logistics AG
              </span>
            </div>
            <blockquote className={`${SERIF} text-[22px] font-medium leading-snug md:text-[28px]`} style={{ color: C.primary }}>
              "Migrating to Scryme’s single-kernel architecture collapsed our reconciliation cycle from 3 days to
              literally 4 seconds. Our ops teams in Zurich and Singapore are finally looking at the exact same ledger
              numbers without questioning data freshness."
            </blockquote>
            <div className="flex items-center gap-4">
              <div
                className={`${SANS} flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white`}
                style={{ background: C.primary }}
              >
                ER
              </div>
              <div className={`${SANS} flex flex-col`}>
                <span className="text-sm font-semibold" style={{ color: C.primary }}>
                  Elena Rostova
                </span>
                <span className="text-xs" style={{ color: C.muted }}>
                  Chief Operating Officer, Veloce Global Logistics
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl p-6 lg:w-80" style={{ background: C.low }}>
            <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
              Deployment Summary
            </span>
            <div className="flex flex-col gap-3">
              {deploy.map(([k, v]) => (
                <div key={k} className={`${SANS} flex items-center justify-between text-sm`}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span className={`${MONO} font-semibold`} style={{ color: C.primary }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <a
              href="#"
              className={`${SANS} mt-2 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#12372a]`}
              style={{ background: C.primary }}
            >
              Read Full Case Study
            </a>
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
    <section className="w-full px-4 py-24 md:px-8" style={{ background: C.surface }}>
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>03 // Architectural Inquiries</Eyebrow>
          <h2
            className={`${SERIF} text-[30px] font-normal leading-9 tracking-tight md:text-[40px] md:leading-[48px]`}
            style={{ color: C.primary }}
          >
            Frequently asked questions by enterprise engineering &amp; leadership
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q} className="overflow-hidden rounded-xl transition-all duration-200" style={{ background: C.low }}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className={`${SANS} flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold`}
                  style={{ color: C.primary }}
                >
                  <span>{q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {isOpen && (
                  <div className={`${SANS} px-6 pb-5 text-sm leading-relaxed`} style={{ color: C.muted }}>
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
    <section className="w-full px-4 py-20 text-white md:px-8" style={{ background: C.primary }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 py-10 text-center">
        <div
          className={`${MONO} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest`}
          style={{ background: C.primaryContainer, color: C.lime }}
        >
          Autonomous Enterprise Orchestration
        </div>
        <h2
          className={`${SERIF} max-w-3xl text-[30px] font-normal leading-[1.1] tracking-tight md:text-[56px]`}
        >
          Reclaim command of your global operations today.
        </h2>
        <p className={`${SANS} max-w-2xl text-base leading-relaxed`} style={{ color: C.onPrimaryContainer }}>
          Speak directly with a Principal Enterprise Solutions Architect or spin up an isolated staging sandbox loaded
          with your sample catalog and node taxonomy.
        </p>
        <div className={`${SANS} mt-2 flex flex-wrap items-center justify-center gap-4`}>
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-sm font-bold shadow-lg transition-all hover:bg-[#a4d700] hover:shadow-xl"
            style={{ background: C.lime, color: C.onLime }}
          >
            Start 14-Day Enterprise Trial
          </a>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#003923]"
            style={{ background: C.primaryContainer }}
          >
            Schedule Architecture Review
          </Link>
        </div>
        <div
          className={`${MONO} mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs`}
          style={{ color: C.onPrimaryContainer }}
        >
          {['NO LEGACY CONNECTORS NEEDED', 'DEDICATED SOVEREIGN HOSTING', '99.999% RUNTIME SLA'].map((t, i) => (
            <span key={t} className="flex items-center gap-6">
              {i > 0 && <span>•</span>}
              <span className="flex items-center gap-1.5">
                <Dot color={C.lime} />
                {t}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- footer ---------- */

function SiteFooter() {
  const cols: [string, string[]][] = [
    ['Solutions', ['Sales Automation', 'Multi-Location Inventory', '360° CRM Intelligence', 'Headless CMS Gateway', 'Automated Procurement']],
    ['Platform', ['Core Kernel', 'Global Architecture', 'SOC2 & Sovereignty', 'Audit Telemetry', 'Ecosystem Hub']],
    ['Governance', ['Privacy Architecture', 'Terms of Provisioning', 'Enterprise SLA (99.99%)', 'ISO/IEC 27001 Standard', 'Data Residency Matrix']],
  ]
  return (
    <footer className="w-full border-t" style={{ background: C.low, borderColor: 'rgba(18,55,42,0.05)' }}>
      <div className="w-full px-4 py-10 md:px-8">
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className={`${SERIF} text-[22px] font-medium tracking-tight`} style={{ color: C.primary }}>
                Scryme
              </span>
              <span
                className={`${SANS} rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest`}
                style={{ background: C.mid, color: C.muted }}
              >
                Core Suite
              </span>
            </div>
            <p className={`${SANS} max-w-sm text-sm`} style={{ color: C.muted }}>
              High-fidelity enterprise operating kernel coordinating sales velocity, multi-node inventories, and
              multi-tenant telemetry with sub-millisecond precision.
            </p>
            <div
              className={`${MONO} flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[13px]`}
              style={{ borderColor: 'rgba(18,55,42,0.1)', color: C.muted }}
            >
              <Dot color={C.lime} size="h-2 w-2" />
              99.99% Operational - All global regions live
            </div>
          </div>

          {cols.map(([h, links]) => (
            <div key={h} className="flex flex-col gap-2">
              <span className={`${SANS} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.onSurface }}>
                {h}
              </span>
              {links.map((l) => (
                <a key={l} href="#" className={`${SANS} text-xs transition-colors hover:text-[#1a1c1a]`} style={{ color: C.muted }}>
                  {l}
                </a>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <span className={`${SANS} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.onSurface }}>
              Dispatch
            </span>
            <p className={`${SANS} text-xs`} style={{ color: C.muted }}>
              Executive analysis, kernel release logs, and architectural briefs delivered weekly.
            </p>
            <form className="mt-1 flex items-center" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="executive@enterprise.com"
                className={`${SANS} h-10 w-full min-w-0 rounded-l-lg border bg-white px-3 text-xs outline-none placeholder:text-[#414844]/60 focus:border-[#002116]`}
                style={{ borderColor: 'rgba(193,200,195,0.6)', color: C.onSurface }}
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-10 items-center justify-center rounded-r-lg px-3 text-white transition-colors hover:bg-[#12372a]"
                style={{ background: C.primary }}
              >
                <ArrowRight className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
        </div>

        <div
          className="flex flex-col items-center justify-between gap-2 border-t pt-4 md:flex-row"
          style={{ borderColor: 'rgba(18,55,42,0.1)' }}
        >
          <span className={`${SANS} text-xs`} style={{ color: C.muted }}>
            © 2026 Scryme ERP AG. All rights reserved. Registered Enterprise OS.
          </span>
          <div className={`${MONO} flex items-center gap-4 text-[11px]`} style={{ color: C.muted }}>
            <span>NODE_LATENCY: 12ms</span>
            <span>TLS 1.3 / ENCRYPTED</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ---------- page ---------- */

function HomeComponent() {
  return (
    <div
      className={`${SANS} min-h-screen antialiased selection:bg-[#bef529] selection:text-[#526d00]`}
      style={{ background: C.surface, color: C.onSurface }}
    >
      <Header />
      <main className="w-full pt-20">
        <Hero />
        <Pillars />
        <Paradigm />
        <MetricsAndCase />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}