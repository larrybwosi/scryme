import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Inbox,
  Landmark,
  QrCode,
  RefreshCw,
  Route as RouteIcon,
  Scan,
  ShieldCheck,
  Shuffle,
  Terminal,
  Truck,
  Wallet,
  Wand2,
} from 'lucide-react'

export const Route = createFileRoute('/stock-operations')({
  component: StockOperationsComponent,
})

const HERO_OPS_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7OTwhrqkyTND2B3nSJAK6XV3p30-mK_eQApv_7H6ghgpUf-OlUI17nF9ZDkdy76wlqgfkqg2E4Ys2zfT0yMIwbu86do88Wg9l2h8_WWfH7RzWbt4jXyi58Konu1PvG2-I-pq_did0Gt3TWBqLq8PM2Wl4CSKuum32NT17pSNyjuMVwRKwevCnPtZYgqoW3kpNgM4AIqfJrRA4e3-hUQgFvi6YO3R6pfLm9ZEgcQ'
const CASE_EXECUTIVE_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCFHGdh7pkFwPLBoFB6lqtbEKiFolNLQ9QpgW3d7AryIhZzpYfzlPcMumBbr0-UEs1i01oK2ZS_MY53BIU-NrALqZMOoaVijBfWPMUprYX0yoWMQGL_IV3QbVNbFnOKpDcZpgbDqjkoT_KBb0QdGIk3dswK8oPg3YeH997hAoSDHAa8GQf2IeWBKP-VNiBr-DlDTEJEoFysOKPO7filodDcAp-PSgb_796W8tHqRA'

/* ---------- 1. Operational Live Pulse Ribbon ---------- */

function LivePulseRibbon() {
  return (
    <section className="w-full border-b border-[#12372a]/20 bg-[#002116] px-4 py-2.5 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 font-mono text-[11px] md:flex-row">
        <div className="flex w-full items-center gap-3 overflow-x-auto pb-1 md:w-auto md:pb-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bef529] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#151f00]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#002116]" />
            Live Ingestion
          </span>
          <span className="tracking-wider text-[#7ba190]">KERNEL: v3.2_ACTIVE</span>
          <span className="text-white/30">/</span>
          <span className="text-white">
            REAL-TIME INGESTION: <strong className="text-[#bef529]">4,820 SKUs/SEC</strong>
          </span>
          <span className="text-white/30">/</span>
          <span className="text-white">
            DISPATCH ACCURACY: <strong className="text-[#bef529]">99.98%</strong>
          </span>
          <span className="text-white/30">/</span>
          <span className="text-[#7ba190]">ZERO-GHOST AUDIT: VERIFIED</span>
        </div>
        <div className="flex items-center gap-4 self-end text-[#2a4e3f] md:self-auto">
          <span>
            Inbound: <strong className="font-semibold text-white">184,200</strong> Units
          </span>
          <span className="text-white/20">•</span>
          <span>
            Dispatched: <strong className="font-semibold text-white">142,890</strong> Units
          </span>
          <span className="text-white/20">•</span>
          <span>
            In Transit: <strong className="font-semibold text-[#bef529]">38,400</strong>
          </span>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Editorial Solution Hero ---------- */

function Hero() {
  const scrollToConsole = () => {
    document.getElementById('console-simulator')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToStages = () => {
    document.getElementById('lifecycle-stages')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#faf9f6] px-4 py-16 md:px-8 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-12 lg:flex-row">
        {/* Hero Left Column */}
        <div className="flex flex-col items-start lg:w-7/12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c1c8c3]/30 bg-[#e9e8e5] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#414844]">
            <span className="h-2 w-2 rounded-full bg-[#a4d700]" />
            Operational Execution • Stock, Reception &amp; Fulfillment
          </div>
          <h1 className="mb-6 font-serif text-4xl font-normal leading-tight tracking-tight text-[#002116] sm:text-5xl lg:text-6xl">
            Frictionless stock execution from inbound loading dock to final-mile dispatch.
          </h1>
          <p className="mb-8 max-w-2xl font-sans text-base leading-relaxed text-[#414844] sm:text-lg">
            Coordinate gate-in reception, automated quarantine inspection, multi-node cross-docking, and high-velocity
            pick-pack deliveries with deterministic general ledger binding.
          </p>

          <div className="mb-12 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={scrollToConsole}
              className="inline-flex items-center justify-center rounded-lg bg-[#002116] px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#12372a] cursor-pointer"
            >
              <span className="mr-2.5 h-2 w-2 rounded-full bg-[#bef529]" />
              Open Stock Execution Console
            </button>
            <button
              type="button"
              onClick={scrollToStages}
              className="inline-flex items-center justify-center rounded-lg border border-[#c1c8c3]/60 bg-white px-5 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[#002116] transition-all hover:bg-[#f4f3f0] cursor-pointer"
            >
              <Terminal className="mr-2 h-4.5 w-4.5 text-[#002116]" />
              Explore ASN &amp; Manifest Schema
            </button>
            <a
              href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
              className="inline-flex items-center justify-center rounded-full bg-[#bef529] px-5 py-3 font-sans text-xs font-bold uppercase tracking-wider text-[#151f00] transition-all hover:bg-[#a4d700]"
            >
              Book Floor Operations Demo
            </a>
          </div>

          {/* Micro-stats strip */}
          <div className="grid w-full max-w-xl grid-cols-3 gap-6 border-t border-[#c1c8c3]/30 pt-6">
            <div>
              <div className="font-mono text-2xl font-bold text-[#002116]">0.12s</div>
              <div className="font-sans text-xs text-[#414844]">Gate-in scan to ledger</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-[#4d6700]">0.00%</div>
              <div className="font-sans text-xs text-[#414844]">Phantom stock variance</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-[#002116]">3.4x</div>
              <div className="font-sans text-xs text-[#414844]">Faster pallet turnaround</div>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="w-full lg:w-5/12">
          <div className="flex flex-col gap-5 rounded-xl border border-[#c1c8c3]/40 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#c1c8c3]/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#a4d700]" />
                <span className="font-sans text-sm font-semibold text-[#002116]">
                  Facility Node #ROT-04
                </span>
              </div>
              <span className="rounded bg-[#efeeeb] px-2 py-0.5 font-mono text-[11px] uppercase text-[#414844]">
                Rotterdam Port Hub
              </span>
            </div>
            <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-[#002116]">
              <img
                src={HERO_OPS_IMG}
                alt="High-tech automated logistics fulfillment center with robotic arms and barcode throughput"
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#002116] via-[#002116]/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[#bef529]">
                    Dock Execution Speed
                  </span>
                  <span className="font-serif text-2xl font-medium">18.4 Pallets / Min</span>
                </div>
                <span className="rounded bg-[#bef529] px-2.5 py-1 font-mono text-xs font-bold text-[#151f00]">
                  OPTIMAL FLOW
                </span>
              </div>
            </div>

            {/* Micro Workflow Telemetry */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between rounded bg-[#f4f3f0] p-2.5">
                <span className="flex items-center gap-2 text-[#414844]">
                  <Inbox className="h-4 w-4 text-[#002116]" />
                  Bay 03 ASN Validation
                </span>
                <span className="font-semibold text-[#002116]">100% Matched</span>
              </div>
              <div className="flex items-center justify-between rounded bg-[#f4f3f0] p-2.5">
                <span className="flex items-center gap-2 text-[#414844]">
                  <Shuffle className="h-4 w-4 text-[#002116]" />
                  Cross-Dock Bypass Lane
                </span>
                <span className="font-semibold text-[#4d6700]">412 SKUs Auto-Routed</span>
              </div>
              <div className="flex items-center justify-between rounded bg-[#f4f3f0] p-2.5">
                <span className="flex items-center gap-2 text-[#414844]">
                  <Wallet className="h-4 w-4 text-[#002116]" />
                  Ledger Capitalization
                </span>
                <span className="font-semibold text-[#002116]">Instant Commit (0.11s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. 4-Stage Operational Lifecycle Flow ---------- */

function LifecycleStages() {
  const stages = [
    {
      num: 'STAGE 01',
      icon: QrCode,
      title: 'Inbound Reception & QA Quarantine',
      body: 'Automated Advanced Shipping Notice (ASN) reconciliation. Bulk portal RFID gate scanning verifies entire pallets in seconds without unsealing cartons.',
      metricKey: 'Non-Conformance Tag:',
      metricVal: 'Auto-Isolate',
      metricValColor: 'text-[#ba1a1a]',
      statKey: 'Scan Resolution:',
      statVal: 'Bulk 900 Tags/Sec',
    },
    {
      num: 'STAGE 02',
      icon: ArrowLeftRight,
      title: 'Intelligent Transfers & Cross-Dock',
      body: 'Dynamic bay slotting powered by demand velocity. Immediate cross-docking diverts urgent backordered stock from inbound trailer straight to outbound staging.',
      metricKey: 'Cross-Dock Dwell Time:',
      metricVal: '0.0 Min Hold',
      metricValColor: 'text-[#4d6700]',
      statKey: 'Inter-Node Rebalance:',
      statVal: 'Automated Dispatch',
    },
    {
      num: 'STAGE 03',
      icon: Truck,
      title: 'Pick, Pack & Multi-Carrier Dispatch',
      body: 'Cluster and wave picking algorithms guide floor operators via optimized spatial paths. Instant multi-carrier rating, EDI manifest generation, and label stamping.',
      metricKey: 'Picker Travel Path:',
      metricVal: '-44% Reduced',
      metricValColor: 'text-[#4d6700]',
      statKey: 'Carrier API Dispatch:',
      statVal: '< 140ms Response',
    },
    {
      num: 'STAGE 04',
      icon: Landmark,
      title: 'Continuous Ledger Reconciliation',
      body: 'Every barcode tap posts double-entry journal logs in real-time. Inventory asset valuation synchronizes automatically with balance sheets without closing intervals.',
      metricKey: 'Audit Halts Needed:',
      metricVal: '0 Days / Year',
      metricValColor: 'text-[#4d6700]',
      statKey: 'Ledger Latency:',
      statVal: 'Deterministic 0.12s',
    },
  ]

  return (
    <section id="lifecycle-stages" className="w-full bg-[#f4f3f0] px-4 py-20 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
              Deterministic Pipeline
            </span>
            <h2 className="font-serif text-3xl font-normal tracking-tight text-[#002116] sm:text-4xl">
              The 4-Stage Stock Execution Engine
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm text-[#414844] leading-relaxed">
            Continuous mathematical validation at every inventory waypoint. Eliminates blind drop-offs and phantom
            variance before stock reaches storage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((stg) => {
            const IconComp = stg.icon
            return (
              <div
                key={stg.num}
                className="flex flex-col justify-between rounded-xl border border-[#c1c8c3]/30 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded bg-[#002116] px-2.5 py-0.5 font-mono text-xs font-bold text-[#a4d700]">
                      {stg.num}
                    </span>
                    <IconComp className="h-5 w-5 text-[#002116]" />
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-medium text-[#002116]">
                    {stg.title}
                  </h3>
                  <p className="mb-4 font-sans text-xs leading-relaxed text-[#414844]">
                    {stg.body}
                  </p>
                </div>
                <div className="space-y-1.5 border-t border-[#c1c8c3]/20 pt-4 font-mono text-[11px]">
                  <div className="flex justify-between text-[#414844]">
                    <span>{stg.metricKey}</span>
                    <strong className={`font-semibold ${stg.metricValColor}`}>
                      {stg.metricVal}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#414844]">
                    <span>{stg.statKey}</span>
                    <strong className="font-semibold text-[#002116]">{stg.statVal}</strong>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Interactive Console & Manifest Simulator ---------- */

const MANIFEST_BATCH_A = [
  {
    sku: 'SKU-9920-OPT',
    desc: 'Precision Optical Sensors (Grade A)',
    manifested: '1,200',
    scanned: '1,200',
    status: 'PASS',
    statusBg: 'bg-[#bef529] text-[#151f00]',
    dest: 'Zone B • Shelf 12-R',
    destColor: 'text-[#414844]',
    valuation: '$54,000.00',
    rowBg: 'hover:bg-[#f4f3f0]/60',
  },
  {
    sku: 'SKU-4412-TIT',
    desc: 'Titanium Structural Fasteners (M8)',
    manifested: '8,400',
    scanned: '8,400',
    status: 'PASS',
    statusBg: 'bg-[#bef529] text-[#151f00]',
    dest: 'Cross-Dock Bay 08 (#ORD-8821)',
    destColor: 'text-[#4d6700] font-semibold',
    valuation: '$67,200.00',
    rowBg: 'hover:bg-[#f4f3f0]/60',
  },
  {
    sku: 'SKU-1088-MCU',
    desc: 'Arm-Cortex Micro-controllers',
    manifested: '2,400',
    scanned: '2,392 (-8)',
    status: 'QA QUARANTINE',
    statusBg: 'bg-[#ba1a1a] text-white',
    dest: 'Quarantine Vault Q-02',
    destColor: 'text-[#ba1a1a]',
    valuation: '$63,000.00 (Escrow)',
    rowBg: 'bg-[#ffdad6]/20 hover:bg-[#ffdad6]/40',
  },
]

const MANIFEST_BATCH_B = [
  {
    sku: 'SKU-8810-SOL',
    desc: 'Solid State Relays (High Load)',
    manifested: '4,000',
    scanned: '4,000',
    status: 'PASS',
    statusBg: 'bg-[#bef529] text-[#151f00]',
    dest: 'Zone A • Shelf 04-B',
    destColor: 'text-[#414844]',
    valuation: '$92,000.00',
    rowBg: 'hover:bg-[#f4f3f0]/60',
  },
  {
    sku: 'SKU-3120-COP',
    desc: 'Conductive Copper Busbars',
    manifested: '1,800',
    scanned: '1,800',
    status: 'PASS',
    statusBg: 'bg-[#bef529] text-[#151f00]',
    dest: 'Cross-Dock Bay 04 (#ORD-9110)',
    destColor: 'text-[#4d6700] font-semibold',
    valuation: '$45,000.00',
    rowBg: 'hover:bg-[#f4f3f0]/60',
  },
]

function ConsoleSimulator() {
  const [batchToggle, setBatchToggle] = useState<boolean>(false)

  const activeRows = batchToggle ? MANIFEST_BATCH_B : MANIFEST_BATCH_A

  return (
    <section id="console-simulator" className="w-full bg-[#faf9f6] px-4 py-20 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#bef529]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[#414844]">
                Live Console Simulation • Inbound Bay 04
              </span>
            </div>
            <h2 className="font-serif text-3xl font-medium text-[#002116]">
              Pallet Manifest Execution Engine
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#414844]">
              Manifest: <strong className="text-[#002116]">#ASN-9042-ROT</strong>
            </span>
            <button
              type="button"
              onClick={() => setBatchToggle(!batchToggle)}
              className="flex items-center gap-1.5 rounded-lg border border-[#c1c8c3]/50 bg-[#efeeeb] px-3 py-1.5 font-sans text-xs font-semibold text-[#002116] transition-colors hover:bg-[#e3e2e0] cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-[#002116]" />
              Simulate Next Pallet
            </button>
          </div>
        </div>

        {/* Console Table Card */}
        <div className="overflow-hidden rounded-xl border border-[#c1c8c3]/40 bg-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c1c8c3]/30 bg-[#f4f3f0] p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="block font-sans text-[11px] font-bold uppercase text-[#414844]">
                  Carrier / Origin
                </span>
                <span className="font-sans text-xs font-semibold text-[#002116]">
                  Maersk Logistics • Rotterdam Terminal
                </span>
              </div>
              <div>
                <span className="block font-sans text-[11px] font-bold uppercase text-[#414844]">
                  Gate Status
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#4d6700]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" /> Gate-In Confirmed
                </span>
              </div>
              <div>
                <span className="block font-sans text-[11px] font-bold uppercase text-[#414844]">
                  Target Outbound Lane
                </span>
                <span className="font-sans text-xs font-semibold text-[#002116]">
                  Cross-Dock Bay 08 (Priority)
                </span>
              </div>
            </div>
            <div className="rounded bg-[#002116] px-3 py-1.5 font-mono text-xs text-white">
              LEDGER SYNC: <span className="text-[#bef529]">CAPITALIZED $184,200.00</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c1c8c3]/30 bg-[#efeeeb] font-mono text-[10px] font-bold uppercase tracking-wider text-[#414844]">
                  <th className="py-3 px-4">SKU / Serial</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Qty Manifested</th>
                  <th className="py-3 px-4">Scanned Qty</th>
                  <th className="py-3 px-4">QA Status</th>
                  <th className="py-3 px-4">Routing Destination</th>
                  <th className="py-3 px-4 text-right">Ledger Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c1c8c3]/20 font-sans text-sm">
                {activeRows.map((r) => (
                  <tr key={r.sku} className={`transition-colors ${r.rowBg}`}>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#002116]">
                      {r.sku}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1a1c1a]">{r.desc}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{r.manifested}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#002116]">
                      {r.scanned}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold ${r.statusBg}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-mono text-xs ${r.destColor}`}>
                      {r.dest}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-[#002116]">
                      {r.valuation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Terminal Footer Callout */}
          <div className="flex flex-col items-center justify-between gap-3 bg-[#002116] p-4 font-mono text-xs text-white md:flex-row">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#bef529]" />
              <span>
                DUAL-ENTRY BALANCED: Debit 1200 Inventory Raw ($184,200) • Credit Accounts Payable ($184,200)
              </span>
            </div>
            <div className="text-[#7ba190]">
              Commit ID: <code className="text-white">tx_98f4110b9a</code> (0.42s latency)
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. Core Capabilities Bento Grid ---------- */

function BentoCapabilities() {
  return (
    <section className="w-full bg-[#f4f3f0] px-4 py-20 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="max-w-2xl">
          <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
            High-Density Infrastructure
          </span>
          <h2 className="font-serif text-3xl font-normal tracking-tight text-[#002116] sm:text-4xl">
            Built for 24/7 High-Throughput Hubs
          </h2>
          <p className="mt-3 font-sans text-sm text-[#414844] leading-relaxed">
            Traditional ERPs batch inventory overnight. Scryme's reactive state engine executes every pick, transfer,
            and receipt instantaneously at the hardware edge.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1 (Span 2) */}
          <div className="flex flex-col justify-between rounded-xl border border-[#c1c8c3]/30 bg-white p-8 shadow-sm md:col-span-2">
            <div>
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#efeeeb] text-[#002116]">
                <Scan className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-serif text-2xl font-medium text-[#002116]">
                Serialized Bin-Level Traceability
              </h3>
              <p className="mb-6 max-w-xl font-sans text-sm text-[#414844] leading-relaxed">
                Every unit, carton, and pallet carries cryptographically signed lineage records. Full audit traceability
                includes precise ambient temperature sensor telemetry, batch production origin, and transit custody logs.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-[#c1c8c3]/20 pt-6 font-mono text-xs">
              <div>
                <span className="block text-[11px] text-[#414844]">SERIAL FORMAT</span>
                <span className="font-semibold text-[#002116]">GS1-128 / Datamatrix</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#414844]">TEMP MONITORING</span>
                <span className="font-semibold text-[#4d6700]">Active -18°C to +4°C</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#414844]">RECALL WINDOW</span>
                <span className="font-semibold text-[#002116]">&lt; 3.0 Seconds Global</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col justify-between rounded-xl border border-[#c1c8c3]/30 bg-white p-8 shadow-sm">
            <div>
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#efeeeb] text-[#002116]">
                <RouteIcon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-serif text-2xl font-medium text-[#002116]">
                Dynamic Wave &amp; Zone Picking
              </h3>
              <p className="mb-6 font-sans text-xs text-[#414844] leading-relaxed">
                Traveling salesperson algorithms optimize picker traversal paths in 3D aisle topologies. Reduces deadhead walking time by over 44%.
              </p>
            </div>
            <div className="rounded-lg bg-[#efeeeb] p-3 font-mono text-xs text-[#1a1c1a]">
              <span className="font-bold text-[#4d6700]">TRAVEL TIME SAVINGS:</span> 18.2 miles saved per picker / shift
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col justify-between rounded-xl border border-[#c1c8c3]/30 bg-white p-8 shadow-sm">
            <div>
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#efeeeb] text-[#002116]">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-serif text-2xl font-medium text-[#002116]">
                Carrier Matrix &amp; SLA Broker
              </h3>
              <p className="mb-6 font-sans text-xs text-[#414844] leading-relaxed">
                Real-time API rate shopping across FedEx, DHL, Maersk, and DB Schenker. Generates compliant cross-border customs declarations instantly.
              </p>
            </div>
            <div className="rounded-lg bg-[#efeeeb] p-3 font-mono text-xs text-[#1a1c1a]">
              <span className="font-bold text-[#002116]">SUPPORTED:</span> 120+ Global Freight &amp; Courier APIs
            </div>
          </div>

          {/* Card 4 (Span 2) */}
          <div className="flex flex-col justify-between rounded-xl border border-[#c1c8c3]/30 bg-white p-8 shadow-sm md:col-span-2">
            <div>
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#efeeeb] text-[#002116]">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-serif text-2xl font-medium text-[#002116]">
                Real-Time Discrepancy Auto-Mitigation
              </h3>
              <p className="mb-6 max-w-xl font-sans text-sm text-[#414844] leading-relaxed">
                When a handheld terminal detects a single unit count delta, Scryme automatically initiates targeted micro-counts on surrounding bin locations. Isolates discrepancies before invoices clear.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 border-t border-[#c1c8c3]/20 pt-6 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                <span className="text-[#1a1c1a]">Zero full-facility shutdowns required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                <span className="text-[#1a1c1a]">Algorithmic shrinkage attribution</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Executive Case Brief ---------- */

function ExecutiveCaseBrief() {
  return (
    <section className="w-full bg-[#faf9f6] px-4 py-20 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col overflow-hidden rounded-2xl border border-[#c1c8c3]/40 bg-white shadow-xl lg:flex-row">
        <div className="relative min-h-[380px] bg-[#002116] lg:w-1/2">
          <img
            src={CASE_EXECUTIVE_IMG}
            alt="Executive logistics director examining stock telemetry on a tablet in a modern office"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002116]/80 via-transparent to-transparent lg:hidden" />
        </div>
        <div className="flex flex-col justify-between p-8 lg:w-1/2 lg:p-12">
          <div>
            <span className="mb-4 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
              Enterprise Case Brief • North American Hub
            </span>
            <h3 className="mb-6 font-serif text-3xl font-normal leading-tight tracking-tight text-[#002116]">
              “We eliminated our 3-day quarterly stock takes entirely. Reception to dispatch cycle time fell by 65%.”
            </h3>
            <p className="mb-6 font-sans text-sm text-[#414844] leading-relaxed">
              Prior to deploying Scryme, dock cross-docking took 4 hours of paper manifest validation and physical
              reconciliations. With Scryme's continuous ledger synchronization, arriving pallets pass directly from sea
              container to interstate distribution routes in under 18 minutes.
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-[#c1c8c3]/30 pt-6">
            <div>
              <div className="font-sans text-sm font-bold text-[#002116]">Marcus Vance</div>
              <div className="font-sans text-xs text-[#414844]">
                SVP Global Supply &amp; Logistics, Avantace Group
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xl font-bold text-[#002116]">65%</span>
              <span className="block text-[10px] uppercase text-[#414844]">Turnaround Gain</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. Executive Technical FAQ ---------- */

const FAQS = [
  [
    'How does Scryme handle partial receipts and supplier short-shipments?',
    'The ASN gateway automatically creates a balanced debit/credit split: accepted units are capitalized into usable stock, while short-shipped quantities trigger an automated supplier debit note and purchase order discrepancy log without stopping the floor receipt workflow.',
  ],
  [
    'Can warehouse floor staff use consumer mobile devices or only rugged Android scanners?',
    'Scryme provides native zero-latency Progressive Web and Android APK clients with integrated camera decoding (Zebra, Honeywell, Datalogger, or standard iOS/Android cameras) with offline-first synchronization using local IndexedDB caching.',
  ],
  [
    'How does zero-ghost reconciliation eliminate manual quarterly cycle counts?',
    'Every inventory movement is treated as an immutable ledger transaction. Bayesian probability models trigger targeted spot checks only on high-velocity bins during picker downtime, providing continuous statistical proof of 99.98% inventory accuracy for external auditors.',
  ],
]

function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="w-full bg-[#f4f3f0] px-4 py-20 md:px-8">
      <div className="mx-auto max-w-4xl flex flex-col gap-10">
        <div className="text-center">
          <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
            Architectural Clarity
          </span>
          <h2 className="font-serif text-3xl font-normal tracking-tight text-[#002116] sm:text-4xl">
            Stock Execution Architecture FAQ
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div
                key={q}
                className="rounded-xl border border-[#c1c8c3]/30 bg-white p-6 shadow-sm transition-all"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-sans text-base font-semibold text-[#002116]"
                >
                  <span>{q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#4d6700]' : 'text-[#717974]'
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-4 border-t border-[#c1c8c3]/20 pt-4 font-sans text-sm leading-relaxed text-[#414844]">
                    {a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 8. Conversion Action CTA ---------- */

function FinalCta() {
  return (
    <section className="w-full bg-[#faf9f6] px-4 py-20 md:px-8">
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 rounded-2xl bg-[#002116] p-10 text-white shadow-2xl md:flex-row lg:p-16">
        <div className="relative z-10 max-w-2xl">
          <span className="mb-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
            Facility Onboarding
          </span>
          <h2 className="mb-4 font-serif text-3xl font-normal leading-tight md:text-4xl">
            Deploy Scryme Stock &amp; Inventory Execution across your facilities in 14 days.
          </h2>
          <p className="font-sans text-base leading-relaxed text-[#7ba190]">
            Pre-integrated with major ERP backbones, automated sorters, and global freight APIs. Experience instant
            double-entry ledger certainty on the warehouse floor.
          </p>
        </div>

        <div className="relative z-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="inline-flex items-center justify-center rounded-full bg-[#bef529] px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-[#151f00] shadow-md transition-all hover:bg-[#a4d700]"
          >
            Schedule Floor Walkthrough
          </a>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/10 px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/20"
          >
            Access Sandbox API
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Component Page ---------- */

function StockOperationsComponent() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#bef529] selection:text-[#151f00]">
      <Header />
      <main className="w-full pt-20">
        <LivePulseRibbon />
        <Hero />
        <LifecycleStages />
        <ConsoleSimulator />
        <BentoCapabilities />
        <ExecutiveCaseBrief />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}