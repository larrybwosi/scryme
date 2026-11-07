import { createSiteSeo } from '../lib/seo'
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  Anchor,
  Calendar,
  Check,
  ChevronDown,
  Compass,
  FileText,
  Gauge,
  GitFork,
  Grid,
  Landmark,
  Network,
  PlusCircle,
  Radio,
  Shield,
  ShieldCheck,
  Terminal,
  Truck,
  Warehouse,
  Watch,
  Bot,
} from 'lucide-react'

export const Route = createFileRoute('/locations')({
  head: () => createSiteSeo({
    title: "Multi-Store & Regional Warehouse Topology | Scryme ERP",
    description: "Manage decentralized retail networks, distribution centers, and consignment locations with unified real-time governance.",
    pathname: "/locations",
    ogType: 'product',
    keywords: ["Multi-Store Management","Branch Topology","Regional Warehouses","Store Locations ERP"],
  }),
  component: WarehousesComponent,
})

const COMMAND_CENTER_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmudR7LyAbUNOkUEHdOXlJ70sqMSxKpkpxAx74w3Ot-jplREGOMiL44MuTCJ5x_0WE24Wgb9N-KURh4JGWwEY7ARoqHNZQNqfjsdxMiJfmMz38QgWblM15CfstgSZ9sTzaQNXLQTX5GAgxG4sC2sg2uAdoqLE0U-t6hOLa9EfqwIuQqZZ_8eXDj7nV-D_Dp0vQxmnhJ1UNNj-GBAsly8pVWuIpxQYFzMUdoDKLBw'

interface FacilityNode {
  id: string
  name: string
  badge: string
  coords: string
  country: string
  latency: string
  capacity: string
  capacityRaw: number
  volume: string
  bays: string
  agv: string
  crossDock: string
  region: 'emea' | 'americas' | 'apac'
}

const FACILITIES: FacilityNode[] = [
  {
    id: 'rotterdam',
    name: 'Rotterdam Mega-Hub 01',
    badge: 'BONDED TERMINAL',
    coords: '51.9244° N, 4.4777° E • Maasvlakte II Sector 4B',
    country: 'NL',
    latency: '3.8ms',
    capacity: '84.2%',
    capacityRaw: 84.2,
    volume: '420,000 m³ / 500,000 m³',
    bays: '48 / 48 Open',
    agv: '142 Units',
    crossDock: '1.8h',
    region: 'emea',
  },
  {
    id: 'newark',
    name: 'Newark Intermodal Depot',
    badge: 'CUSTOMS BONDED',
    coords: '40.6895° N, 74.1745° W • NJ Terminal 2',
    country: 'USA',
    latency: '5.2ms',
    capacity: '72.1%',
    capacityRaw: 72.1,
    volume: '310,000 m³ / 430,000 m³',
    bays: '36 / 36 Open',
    agv: '98 Units',
    crossDock: '2.1h',
    region: 'americas',
  },
  {
    id: 'tuas',
    name: 'Singapore Tuas Terminal',
    badge: 'FREE TRADE ZONE',
    coords: '1.2902° N, 103.8519° E • Tuas Finger 3',
    country: 'SGP',
    latency: '4.1ms',
    capacity: '91.4%',
    capacityRaw: 91.4,
    volume: '550,000 m³ / 600,000 m³',
    bays: '64 / 64 Open',
    agv: '210 Units',
    crossDock: '1.5h',
    region: 'apac',
  },
  {
    id: 'ohi',
    name: 'Tokyo Ohi Depot',
    badge: 'HIGH-AUTOMATION',
    coords: '35.6120° N, 139.7528° E • Shinagawa Wharf',
    country: 'JPN',
    latency: '6.0ms',
    capacity: '64.8%',
    capacityRaw: 64.8,
    volume: '280,000 m³ / 430,000 m³',
    bays: '24 / 24 Open',
    agv: '85 Units',
    crossDock: '2.4h',
    region: 'apac',
  },
  {
    id: 'panama',
    name: 'Panama Colón Free Zone',
    badge: 'CANAL RE-EXP',
    coords: '9.3598° N, 79.9015° W • Atlantic Ingress',
    country: 'PAN',
    latency: '9.4ms',
    capacity: '79.3%',
    capacityRaw: 79.3,
    volume: '390,000 m³ / 490,000 m³',
    bays: '32 / 32 Open',
    agv: '115 Units',
    crossDock: '2.0h',
    region: 'americas',
  },
]

/* ---------- 1. Telemetry Top Bar ---------- */

function TelemetryBar() {
  const nodes = [
    'Rotterdam Mega-Hub 01: 99.8%',
    'Newark Port: 99.4%',
    'Singapore Tuas: 99.9%',
    'Tokyo Ohi: 100%',
  ]

  return (
    <section className="w-full bg-[var(--bg-secondary)] py-2.5 px-4 md:px-8 border-b border-[var(--border-subtle)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 font-mono text-xs text-[var(--text-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#12372a] px-2 py-0.5 text-[10px] uppercase tracking-widest text-white font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bef529] animate-pulse" />
            Live Node Feed
          </span>
          <span className="tracking-tight text-[var(--text-main)] font-semibold">
            NETWORK MESH: 184 GLOBAL FACILITIES
          </span>
          <span className="text-[var(--border-prominent)]">/</span>
          <span>14 TIER-1 REGIONS</span>
          <span className="text-[var(--border-prominent)]">/</span>
          <span className="text-[var(--text-main)] font-semibold">SYNC CONSENSUS: 11.2ms</span>
          <span className="text-[var(--border-prominent)]">/</span>
          <span>ACTIVE 3PL BRIDGES: 1,420</span>
        </div>
        <div className="hidden items-center gap-4 text-[11px] xl:flex">
          {nodes.map((node) => (
            <div key={node} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#bef529]" />
              <span className="text-[var(--text-main)] font-medium">{node}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Hero Section ---------- */

function Hero() {
  const scrollToConsole = () => {
    document.getElementById('live-console')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="w-full px-4 pt-10 pb-12 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex max-w-4xl flex-col gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
            <Network className="h-3.5 w-3.5 text-[#4d6700] dark:text-[#d2ff3a]" />
            Core Infrastructure • Multi-Location &amp; Warehouse Network
          </div>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-[var(--text-main)] sm:text-5xl md:text-6xl leading-[1.08]">
            Orchestrate 180+ global fulfillment facilities as a single in-memory cluster.
          </h1>
          <p className="font-sans text-base text-[var(--text-muted)] max-w-3xl leading-relaxed sm:text-lg">
            Eliminate regional inventory blindspots. Scryme’s distributed warehouse topology coordinates bonded terminals,
            automated 3PL depots, and micro-fulfillment nodes with sub-second ACID synchronization, predictive cross-dock routing,
            and automated customs landed cost engines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={scrollToConsole}
            className="inline-flex items-center justify-center rounded-lg bg-[#bef529] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#151f00] shadow-sm hover:bg-[#a4d700] transition-all cursor-pointer"
          >
            <Compass className="mr-2 h-4.5 w-4.5" />
            Launch Interactive Warehouse Map
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-[#002116] dark:bg-[#d2ff3a] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white dark:text-[#090a0b] shadow-md hover:bg-[#12372a] dark:hover:bg-[#c7f32c] transition-all cursor-pointer"
          >
            <span className="mr-2 h-2 w-2 rounded-full bg-[#bef529] dark:bg-[#002116]" />
            Schedule Facility Architecture Audit
          </button>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <FileText className="h-4.5 w-4.5" />
            Network Topology Whitepaper (PDF)
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl glass-panel p-6 shadow-sm">
            <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              <span>Global Topology Nodes</span>
              <Warehouse className="h-5 w-5 text-[var(--text-main)]" />
            </div>
            <div className="mt-4">
              <span className="font-serif text-3xl font-medium text-[var(--text-main)]">184 Active</span>
              <p className="font-sans text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Tier-1 automated bonded maritime depots, high-density cross-docks &amp; hubs.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 font-mono text-xs text-[#4d6700] dark:text-[#d2ff3a]">
              <span>100% Multi-Tenant Isolation</span>
              <span>+18 Added YTD</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl glass-panel p-6 shadow-sm">
            <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              <span>Consensus Latency</span>
              <Gauge className="h-5 w-5 text-[var(--text-main)]" />
            </div>
            <div className="mt-4">
              <span className="font-serif text-3xl font-medium text-[var(--text-main)]">11.2ms Median</span>
              <p className="font-sans text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Real-time bin-level reconciliation across Europe, Americas &amp; Asia-Pacific.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 font-mono text-xs text-[#4d6700] dark:text-[#d2ff3a]">
              <span>RAFT-based Node Cluster</span>
              <span>Zero Lock Stalls</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl glass-panel p-6 shadow-sm">
            <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              <span>Variance &amp; Shrinkage</span>
              <ShieldCheck className="h-5 w-5 text-[var(--text-main)]" />
            </div>
            <div className="mt-4">
              <span className="font-serif text-3xl font-medium text-[var(--text-main)]">$0 Ghost Stock</span>
              <p className="font-sans text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Autonomous RFID dock scanning eliminates discrepancies between yard &amp; WMS.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 font-mono text-xs text-[#4d6700] dark:text-[#d2ff3a]">
              <span>SOC1/SOC2 Audited</span>
              <span>99.998% Ledger Delta</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Interactive Topology Console ---------- */

function TopologyConsole() {
  const [activeTab, setActiveTab] = useState<'all' | 'emea' | 'americas' | 'apac'>('all')
  const [selectedId, setSelectedId] = useState<string>('rotterdam')

  const filteredFacilities = FACILITIES.filter((f) => {
    if (activeTab === 'all') return true
    return f.region === activeTab
  })

  const currentFacility =
    FACILITIES.find((f) => f.id === selectedId) || FACILITIES[0]

  return (
    <section id="live-console" className="w-full px-4 py-16 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Live Console
            </span>
            <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] mt-1">
              Multi-Facility Inspection &amp; Live Telemetry
            </h2>
            <p className="font-sans text-sm text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
              Direct telemetry stream from individual autonomous warehouse nodes, storage capacity meters, and dynamic load-balancing routing decisions.
            </p>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-1">
            {[
              { id: 'all', label: 'All Global (184)' },
              { id: 'emea', label: 'EMEA (52)' },
              { id: 'americas', label: 'Americas (78)' },
              { id: 'apac', label: 'APAC (54)' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`rounded-lg px-3.5 py-1.5 font-sans text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 rounded-2xl glass-panel p-6 shadow-md lg:grid-cols-12">
          {/* Left Node Detail Panel */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#12372a] text-white">
                  <Anchor className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-base font-semibold text-[var(--text-main)]">
                      {currentFacility.name}
                    </span>
                    <span className="rounded-full bg-[#bef529] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#151f00]">
                      {currentFacility.badge}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {currentFacility.coords}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 font-mono text-xs">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-[var(--text-muted)]">GATE LATENCY</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {currentFacility.latency}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-[var(--text-muted)]">ACTIVE BAYS</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {currentFacility.bays}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Capacity Metric
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-normal text-[var(--text-main)]">
                    {currentFacility.capacity}
                  </span>
                  <span className="font-mono text-[11px] font-medium text-[#4d6700] dark:text-[#d2ff3a]">
                    Optimal
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-full rounded-full bg-[#002116] dark:bg-[#d2ff3a] transition-all duration-500"
                    style={{ width: `${currentFacility.capacityRaw}%` }}
                  />
                </div>
                <span className="mt-2 block font-sans text-xs text-[var(--text-muted)]">
                  {currentFacility.volume}
                </span>
              </div>

              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Autonomous AGV Fleet
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-normal text-[var(--text-main)]">
                    {currentFacility.agv}
                  </span>
                  <span className="font-mono text-[11px] font-medium text-[#4d6700] dark:text-[#d2ff3a]">
                    Active
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div className="h-full w-[96%] rounded-full bg-[#a4d700]" />
                </div>
                <span className="mt-2 block font-sans text-xs text-[var(--text-muted)]">
                  6 Charging • 0 Faults
                </span>
              </div>

              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Cross-Dock Velocity
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-normal text-[var(--text-main)]">
                    {currentFacility.crossDock}
                  </span>
                  <span className="font-mono text-[11px] font-medium text-[#4d6700] dark:text-[#d2ff3a]">
                    -28% vs SLA
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div className="h-full w-[72%] rounded-full bg-[#002116] dark:bg-[#d2ff3a]" />
                </div>
                <span className="mt-2 block font-sans text-xs text-[var(--text-muted)]">
                  Inbound to Departed Container
                </span>
              </div>
            </div>

            {/* SVG Interactive Mesh Map */}
            <div className="flex flex-col gap-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
                  Facility Link Mesh &amp; Feeder Satellites
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  TOPOLOGY: LEVEL-4 ADAPTIVE
                </span>
              </div>
              <div className="relative flex h-56 w-full items-center justify-center rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] p-3">
                <svg
                  className="h-full w-full text-[var(--text-main)]"
                  fill="none"
                  viewBox="0 0 680 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M40 20 H640 M40 60 H640 M40 100 H640 M40 140 H640 M40 180 H640"
                    stroke="currentColor"
                    strokeDasharray="2 4"
                    strokeOpacity="0.12"
                  />
                  <path
                    d="M100 20 V180 M220 20 V180 M340 20 V180 M460 20 V180 M580 20 V180"
                    stroke="currentColor"
                    strokeDasharray="2 4"
                    strokeOpacity="0.12"
                  />

                  <path d="M140 100 L340 50" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
                  <path d="M140 100 L340 150" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
                  <path d="M340 50 L540 80" stroke="currentColor" strokeOpacity="0.8" strokeWidth="2.5" />
                  <path d="M340 150 L540 120" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
                  <path d="M340 50 L340 150" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.25" strokeWidth="1.5" />

                  <circle cx="440" cy="65" fill="#bef529" r="4" />
                  <circle cx="240" cy="75" fill="#bef529" r="3" />

                  <g className="cursor-pointer">
                    <circle cx="140" cy="100" fill="currentColor" fillOpacity="0.1" r="16" />
                    <circle cx="140" cy="100" fill="#12372a" r="6" />
                    <text fill="currentColor" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="middle" x="140" y="132">
                      Le Havre Ingest
                    </text>
                    <text fill="gray" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="140" y="144">
                      3.4ms
                    </text>
                  </g>

                  <g className="cursor-pointer">
                    <circle cx="340" cy="50" fill="#12372a" r="22" />
                    <circle cx="340" cy="50" fill="#bef529" r="8" />
                    <text fill="currentColor" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="340" y="24">
                      ROTTERDAM 01 [PRIMARY]
                    </text>
                    <text fill="#bef529" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="340" y="86">
                      MASTER CONSENSUS
                    </text>
                  </g>

                  <g className="cursor-pointer">
                    <circle cx="340" cy="150" fill="currentColor" fillOpacity="0.1" r="16" />
                    <circle cx="340" cy="150" fill="#12372a" r="6" />
                    <text fill="currentColor" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="middle" x="340" y="178">
                      Antwerp Spillover
                    </text>
                    <text fill="#bef529" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="340" y="190">
                      Auto-Balancing Active
                    </text>
                  </g>

                  <g className="cursor-pointer">
                    <circle cx="540" cy="80" fill="currentColor" fillOpacity="0.1" r="18" />
                    <circle cx="540" cy="80" fill="#12372a" r="6" />
                    <text fill="currentColor" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="middle" x="540" y="108">
                      Düsseldorf Rail Hub
                    </text>
                    <text fill="gray" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="540" y="120">
                      2.1ms • High Inbound
                    </text>
                  </g>

                  <g className="cursor-pointer">
                    <circle cx="540" cy="120" fill="currentColor" fillOpacity="0.1" r="12" />
                    <circle cx="540" cy="120" fill="gray" r="4" />
                    <text fill="gray" fontFamily="Inter" fontSize="9" fontWeight="500" textAnchor="middle" x="540" y="144">
                      Frankfurt AutoStore
                    </text>
                  </g>
                </svg>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-main)]">
                <GitFork className="mt-0.5 h-4 w-4 shrink-0 text-[#4d6700] dark:text-[#d2ff3a]" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-[var(--text-main)]">In-Flight Re-Route Protocol Triggered: </span>
                  Predictive vessel delay detection at Maasvlakte II auto-redirected 1,800 unit pallets to Antwerp Spillover hub, reducing terminal wait time by 4.2 hours.
                </div>
              </div>
            </div>
          </div>

          {/* Right Facility Directory List */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-bold text-[var(--text-main)]">Facility Directory</span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">SYNCED: RECENTLY</span>
            </div>

            <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto pr-1">
              {filteredFacilities.map((fac) => {
                const isSelected = fac.id === selectedId
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => setSelectedId(fac.id)}
                    className={`flex flex-col gap-2 rounded-xl p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-tertiary)] border border-[var(--border-prominent)]'
                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                        <span className="font-sans text-xs font-semibold text-[var(--text-main)]">
                          {fac.name}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        {fac.country}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-sans text-xs text-[var(--text-muted)]">
                      <span>{fac.volume.split('/')[0]} • {fac.bays.split('/')[0]} Bays</span>
                      <span className="font-mono font-medium text-[var(--text-main)]">
                        {fac.latency} Latency
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-auto flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">
                Node Provisioning
              </span>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Spin up a new container depot or 3PL warehouse node with automated API pairing in under 12 minutes.
              </p>
              <button
                type="button"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-[#002116] dark:bg-[#d2ff3a] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-[#090a0b] hover:bg-[#12372a] dark:hover:bg-[#c7f32c] transition-colors cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Provision Pop-up Node
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Command Center Spotlight ---------- */

function CommandSpotlight() {
  return (
    <section className="w-full px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-xl lg:col-span-7">
            <img
              src={COMMAND_CENTER_IMG}
              alt="Senior logistics directors analyzing real-time global supply chain telemetry inside an ultra-modern command center"
              className="h-[440px] w-full object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#002116]/95 via-[#002116]/40 to-transparent p-6 text-white">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#bef529] px-2 py-0.5 font-mono text-[10px] font-bold text-[#151f00]">
                  LUMINA GLOBAL COMMAND
                </span>
                <span className="text-xs opacity-90">
                  London &amp; Rotterdam Integrated Logistics Office
                </span>
              </div>
              <p className="mt-1 max-w-xl text-xs text-[#efeeeb] leading-relaxed">
                Global operations team reviewing autonomous cargo shifts across European rail corridors directly within Scryme ERP OS.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
              <Network className="h-4 w-4" />
              Autonomous Node Orchestration
            </div>
            <h2 className="font-serif text-3xl font-medium leading-snug tracking-tight text-[var(--text-main)] md:text-4xl">
              Designed for executive transparency and dock-level agility.
            </h2>
            <p className="font-sans text-base leading-relaxed text-[var(--text-muted)]">
              Traditional enterprise ERPs silo warehouse stock behind batch updates and day-end reconcile runs. Scryme maintains an active distributed ledger with continuous RAFT consensus across all physical nodes.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#bef529] text-[#151f00]">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="block font-sans text-sm font-bold text-[var(--text-main)]">
                    Instantaneous Yard-to-Ledger Commit
                  </span>
                  <span className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
                    Gate scans instantly reserve available inventory for outbound sales pipelines worldwide.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#bef529] text-[#151f00]">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="block font-sans text-sm font-bold text-[var(--text-main)]">
                    Multi-Legal Entity Custody Tracking
                  </span>
                  <span className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
                    Segregate parent and subsidiary inventory inside shared physical storage without risk of commingling.
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

/* ---------- 5. Four Pillars Bento Grid ---------- */

function FourPillars() {
  const pillars = [
    {
      num: '01',
      icon: Shield,
      iconBg: 'bg-[#002116] dark:bg-[#d2ff3a] text-white dark:text-[#090a0b]',
      title: 'Geofenced Perimeter & Zone Rules',
      body: 'Enforce automated RFID loading dock gates, ISO-certified cleanroom ingress policies, Hazmat quarantine isolation, and cold-chain temperature telemetry at micro-zone granularity.',
      tags: ['IoT BLE Gates', 'Sub-Zero Cold Chain', 'Hazard Separation Engine'],
    },
    {
      num: '02',
      icon: GitFork,
      iconBg: 'bg-[#bef529] text-[#151f00]',
      title: 'Algorithmic Multi-Hop Freight Balancing',
      body: 'Continuously correlates ocean vessel AIS tracking, storm paths, and terminal congestion indices to dynamically reroute feeder truck transfers before regional warehouses suffer stockouts.',
      tags: ['AIS Vessel Telemetry', 'Predictive Re-Docking', 'Deadhead Truck Reduction'],
    },
    {
      num: '03',
      icon: Network,
      iconBg: 'bg-[var(--bg-tertiary)] text-[var(--text-main)]',
      title: 'Unified 3PL & Partner Ingest Mesh',
      body: 'Incorporate external logistics partners—Kuehne+Nagel, DSV, DHL Supply Chain—into your native ERP ledger via instant LLRP, MQTT, and secure Webhook pipelines with zero batch CSV uploads.',
      tags: ['MQTT Fast-Ingest', 'EDI 856 / 940 Streamer', 'Zero-Day Partner Onboarding'],
    },
    {
      num: '04',
      icon: Landmark,
      iconBg: 'bg-[#12372a] text-white',
      title: 'Bonded Customs & Sovereign Landed Cost',
      body: 'Maintains dual-currency valuation ledgers and customs-bonded duty deferment tracking. Automatically accounts for HS codes, preferential tariff schemes, and cross-border intra-company transfer pricing.',
      tags: ['Dual-Currency Ledger', 'Tariff Harmonization', 'Automated ATA Carnet'],
    },
  ]

  return (
    <section className="w-full bg-[var(--bg-secondary)] px-4 py-20 md:px-8 border-y border-[var(--border-subtle)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Engineered For Resilience
          </span>
          <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl md:text-5xl">
            Four pillars of distributed warehouse topology.
          </h2>
          <p className="font-sans text-base text-[var(--text-muted)] leading-relaxed">
            Built from the ground up to unify disparate facility architectures, autonomous equipment fleets, and sovereign boundary rules.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {pillars.map((p) => {
            const IconComp = p.icon
            return (
              <div
                key={p.title}
                className="flex flex-col justify-between rounded-2xl glass-panel p-8 shadow-sm transition-shadow hover:shadow-md hover:border-[#d2ff3a]/40"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${p.iconBg}`}>
                      <IconComp className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                      PILLAR // {p.num}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                    {p.title}
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                    {p.body}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[var(--border-subtle)]">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Hardware Ecosystem ---------- */

function HardwareEcosystem() {
  const hardware = [
    {
      icon: Radio,
      title: 'Zebra Fixed RFID',
      desc: 'FX9600 Multi-Dock Readers (LLRP Protocol)',
    },
    {
      icon: Truck,
      title: 'Honeywell Terminals',
      desc: 'Thor CV41 Vehicle Mount Computer Units',
    },
    {
      icon: Bot,
      title: 'Dematic & KION',
      desc: 'Automated Guided Vehicle Fleet Control',
    },
    {
      icon: Grid,
      title: 'Swisslog AutoStore',
      desc: 'High-Density Cubic Grid Pick Automation',
    },
    {
      icon: Watch,
      title: 'ProGlove Wearables',
      desc: 'Hands-Free BLE Ring Barcode Scanners',
    },
  ]

  return (
    <section className="w-full px-4 py-20 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Physical Edge Layer
            </span>
            <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] mt-1">
              Certified Warehouse Hardware Ecosystem
            </h2>
            <p className="font-sans text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
              Plug-and-play drivers and firmware sync for mission-critical automation platforms.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#4d6700] dark:text-[#d2ff3a]">
            <span className="h-2 w-2 rounded-full bg-[#bef529]" />
            <span>100% HARDWARE PROTOCOL COMPLIANT</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {hardware.map((item) => {
            const IconComponent = item.icon
            return (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-xl glass-panel p-4 transition-colors hover:border-[#d2ff3a]/40"
              >
                <IconComponent className="h-7 w-7 text-[var(--text-main)]" />
                <span className="font-sans text-sm font-bold text-[var(--text-main)]">
                  {item.title}
                </span>
                <span className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
                  {item.desc}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. FAQ Section ---------- */

const FAQS = [
  [
    'How does Scryme handle inventory consensus during deep sea or regional offline network cuts?',
    'Every physical warehouse node operates an edge-resident Raft consensus state replica. In the event of an undersea fiber rupture or local WAN disruption, the facility transitions seamlessly to Local Autonomous Mode. Pallet moves, bin relocations, and outbound truck dispatches continue without stoppage. As soon as connectivity is restored, our differential CRDT vector clock engine reconciles transaction sequences with zero data collision.',
  ],
  [
    'Can multi-entity corporate structures share a single physical bonded terminal?',
    'Yes. Scryme incorporates native cryptographic multi-tenancy. Multiple corporate subsidiaries, joint ventures, or licensed distribution arms can utilize identical racking facilities while strictly isolating statutory ledgers, customs filings, tax IDs, and billing balances.',
  ],
  [
    'How rapidly can seasonal pop-up or overflow cross-docks be integrated?',
    'Using our declarative topology manifests, operations engineers can provision a temporary overflow facility in under 12 minutes. Handheld mobile scanners pair via QR configuration code, immediately linking local workers to the central allocation queue without local server installations.',
  ],
]

function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="w-full bg-[var(--bg-secondary)] px-4 py-20 md:px-8 border-y border-[var(--border-subtle)]">
      <div className="mx-auto max-w-4xl flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Technical Specifications
          </span>
          <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
            Frequently Asked Architectural Questions
          </h2>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Rigorous engineering answers for CTOs and VP of Logistics leaders.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div
                key={q}
                className="rounded-xl glass-panel p-5 shadow-sm transition-all overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-sans text-sm font-bold text-[var(--text-main)]"
                >
                  <span>{q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#4d6700] dark:text-[#d2ff3a]' : 'text-[var(--text-muted)]'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 font-sans text-xs leading-relaxed text-[var(--text-muted)]">
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

/* ---------- 8. Bottom Conversion Banner ---------- */

function FinalCta() {
  return (
    <section className="w-full px-4 py-20 md:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#002116] p-8 text-white shadow-xl md:p-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#bef529] opacity-10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
              Connect Your Physical Operations
            </span>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl">
              Ready to interconnect your global warehousing footprint?
            </h2>
            <p className="font-sans text-base text-[#7ba190] leading-relaxed">
              Speak directly with our enterprise systems architects to evaluate node topology migration, existing WMS integrations, and live high-volume benchmarks.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center shrink-0">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-[#bef529] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#151f00] shadow-md hover:bg-[#a4d700] transition-all cursor-pointer"
            >
              <Calendar className="mr-2 h-4.5 w-4.5" />
              Book Architecture Session
            </button>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-[#12372a] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#003923] transition-all cursor-pointer"
            >
              <Terminal className="mr-2 h-4.5 w-4.5" />
              Review Technical Specs
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Component Page ---------- */

function WarehousesComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#bef529] selection:text-[#151f00] transition-colors">
      <Header />
      <main className="w-full">
        <TelemetryBar />
        <Hero />
        <TopologyConsole />
        <CommandSpotlight />
        <FourPillars />
        <HardwareEcosystem />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
