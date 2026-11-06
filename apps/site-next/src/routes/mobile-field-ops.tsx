import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  AlertTriangle,
  ArrowRight,
  Battery,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  Download,
  Fingerprint,
  HardHat,
  Lock,
  Package,
  Receipt,
  RefreshCw,
  Router,
  Scan,
  Shield,
  ShieldCheck,
  Signal,
  Smartphone,
  Terminal,
  UserCheck,
  Verified,
  Wifi,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/mobile-field-ops')({
  component: MobileFieldOpsComponent,
})

/* ---------- 1. Live Telemetry Stream Ribbon ---------- */

function LiveTelemetryTicker() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-secondary)] py-2.5 px-4 shadow-sm md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-[var(--text-muted)]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bef529] px-2 py-0.5 font-semibold tracking-wider text-[#151f00]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#002116]" />
            FIELD RUNTIME v3.4 ACTIVE
          </span>
          <span className="hidden text-[#c1c8c3] md:inline">/</span>
          <span className="flex items-center gap-1 text-[#1a1c1a]">
            <Smartphone className="h-3.5 w-3.5 text-[var(--text-main)]" />
            42,180 HANDHELDS ONLINE
          </span>
        </div>
        <div className="hidden items-center gap-6 lg:flex">
          <div className="flex items-center gap-1.5">
            <span className="text-[#c1c8c3]">BUFFER:</span>
            <span className="font-semibold text-[var(--text-main)]">ZERO DRIFT (CRDT-L3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#c1c8c3]">SYNC LATENCY:</span>
            <span className="font-semibold text-[var(--text-main)]">8.2ms p99</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#c1c8c3]">BIOMETRIC POLICY:</span>
            <span className="font-semibold text-[var(--text-main)]">100% ENFORCED</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[#c1c8c3] sm:inline">EDGE NODES:</span>
          <span className="rounded bg-[#e3e2e0] px-2 py-0.5 text-[#1a1c1a]">London Gateway</span>
          <span className="rounded bg-[#e3e2e0] px-2 py-0.5 text-[#1a1c1a]">Rotterdam Terminal</span>
          <span className="rounded bg-[#e3e2e0] px-2 py-0.5 text-[#1a1c1a]">Munich R&amp;D</span>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Editorial Hero Section ---------- */

function Hero() {
  const scrollToSimulator = () => {
    document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToBuilds = () => {
    document.getElementById('builds')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section data-scroll-reveal="fade-in" className="relative w-full overflow-hidden bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Text Column */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-main)]">
              <Wifi className="h-3.5 w-3.5 text-[var(--text-main)]" />
              Core Pillar 08 • Mobile Devices &amp; Field Operations
            </div>
            <h1 className="max-w-2xl font-serif text-4xl font-normal leading-tight text-[var(--text-main)] sm:text-5xl lg:text-[40px] lg:leading-[48px]">
              Full-spectrum enterprise ERP execution in the palm of every field operator.
            </h1>
            <p className="max-w-xl font-sans text-base text-[var(--text-muted)]">
              Empower warehouse floor staff, project site engineers, and regional sales reps with offline-first native mobile power. Seamlessly orchestrate shift scheduling, project milestone signoffs, dockside barcode/RFID receiving, and sub-second inventory/sales tracking without tethering to a desk.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={scrollToSimulator}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#12372a] px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#002116]"
              >
                <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                Explore Interactive Mobile Cockpit
              </button>
              <button
                type="button"
                onClick={scrollToBuilds}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-5 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] shadow-sm transition-all hover:bg-[var(--bg-tertiary)]"
              >
                <Download className="h-4 w-4" />
                Download iOS &amp; Android Enterprise Builds
              </button>
            </div>

            {/* Hero Telemetry Metrics Ribbon */}
            <div className="grid max-w-lg grid-cols-3 gap-4 pt-4">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="font-mono text-2xl font-bold text-[var(--text-main)]">0.08s</div>
                <div className="mt-0.5 font-sans text-xs text-[var(--text-muted)]">Scan-to-Ledger Commit</div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="font-mono text-2xl font-bold text-[var(--text-main)]">100%</div>
                <div className="mt-0.5 font-sans text-xs text-[var(--text-muted)]">Offline Zero Data Loss</div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="font-mono text-2xl font-bold text-[var(--text-main)]">-72%</div>
                <div className="mt-0.5 font-sans text-xs text-[var(--text-muted)]">Paperwork Overhead</div>
              </div>
            </div>
          </div>

          {/* Visual Column (Editorial Layered Collage) */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Background Accent Wash */}
              <div className="pointer-events-none absolute -right-10 -top-12 h-72 w-72 rounded-full bg-[#bef529]/40 blur-3xl" />
              {/* Main Hero Visual Card */}
              <div className="relative space-y-4 rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#12372a]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#bef529]" />
                    <span className="font-mono text-[10px] font-semibold uppercase text-[var(--text-main)]">
                      Zebra TC57 • Node #LDN-81
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">BATTERY 94% • 5G ULTRA</span>
                </div>
                {/* Live Photo Imagery Container */}
                <div className="relative h-60 overflow-hidden rounded-xl bg-[var(--bg-tertiary)] shadow-inner">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuABgLLL2UyHaBk6Fct5Li0UOsS433ZAhRPg-gps9FLlIJbNLuy4WcSr0IM3Ozp28YrDUzzIbrxpBP5cycJ-ra8iHykQo92klpZwiG_p_MB9eSU5QbURCGYEh2IIEXy3naOWpzFPPVyE995-LaJPFESPNoGbDIqamRPgb054VpLrRsnzfsVWLi71NXtnO_cBt3Fz_s5pbmZZ1Hmx8DNlIPlVhztsaVE2n3WhHc9gKA"
                    alt="Rugged industrial tablet handheld scanner deployed on an automated warehouse dock"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002116]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white">
                    <div>
                      <div className="font-sans text-xs font-semibold">Dock Receiving Bay 14B</div>
                      <div className="font-mono text-[10px] opacity-80">
                        Pallet #PL-09412 • Confirmed
                      </div>
                    </div>
                    <span className="rounded bg-[#bef529] px-2.5 py-1 font-mono text-[10px] font-bold text-[#151f00]">
                      MATCH 100%
                    </span>
                  </div>
                </div>
                {/* Micro Status Ledger Stream */}
                <div className="space-y-2 pt-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-2">
                    <span className="text-[var(--text-muted)]">ASN-8820: Medical Stent Pack</span>
                    <span className="font-bold text-[var(--text-main)]">480 / 480 verified</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-2">
                    <span className="text-[var(--text-muted)]">Biometric Shift: S. Lindqvist</span>
                    <span className="font-bold text-[var(--text-main)]">GPS Geofence + Fingerprint Verified</span>
                  </div>
                </div>
              </div>

              {/* Overlapping Float Pill */}
              <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-xl bg-[#002116] p-4 text-white shadow-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#bef529] font-sans text-base text-[#151f00]">
                  <Zap className="h-5 w-5 text-[var(--text-main)]" />
                </div>
                <div>
                  <div className="font-sans text-xs font-semibold text-white">Local SQLite CRDT Node</div>
                  <div className="font-mono text-[10px] text-[#7ba190]">
                    Auto-replicates upon 4G/WiFi reconnect
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Interactive Dual-Perspective Mobile Simulator Cockpit ---------- */

function SimulatorCockpit() {
  const [activeTab, setActiveTab] = useState<'dock' | 'crew' | 'sales'>('dock')
  const [logMessage, setLogMessage] = useState(
    '> READY FOR OPERATOR INTERACTION IN SIMULATOR...',
  )
  const [feedbackBadge, setFeedbackBadge] = useState('Manifest Mode Active')
  const [badgeClass, setBadgeClass] = useState(
    'rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] text-[var(--text-main)]',
  )

  const handleTabSwitch = (tab: 'dock' | 'crew' | 'sales') => {
    setActiveTab(tab)
    if (tab === 'dock') {
      setLogMessage(
        '> SWITCHED CONTEXT: [BAY_RECEIVING_MODE] - RFID/LASER LISTENER ATTACHED',
      )
      setFeedbackBadge('Manifest Mode Active')
      setBadgeClass('rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] text-[var(--text-main)]')
    } else if (tab === 'crew') {
      setLogMessage(
        '> SWITCHED CONTEXT: [GEOFENCE_LABOR_RULES] - GPS & BIOMETRIC SENSORS ACTIVE',
      )
      setFeedbackBadge('Jobsite Audit Mode')
      setBadgeClass('rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] text-[var(--text-main)]')
    } else {
      setLogMessage(
        '> SWITCHED CONTEXT: [FIELD_POS_ALLOCATION] - MULTI-NODE STOCK SYNC READY',
      )
      setFeedbackBadge('Sales Terminal Mode')
      setBadgeClass('rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] text-[var(--text-main)]')
    }
  }

  const triggerAction = (type: 'dock' | 'crew' | 'sales') => {
    const ts = new Date().toISOString().substring(11, 23)
    if (type === 'dock') {
      setFeedbackBadge('Committed to Ledger (ASN-8820)')
      setBadgeClass(
        'rounded-full bg-[#bef529] px-3 py-1 font-mono text-[10px] font-bold text-[#151f00]',
      )
      setLogMessage(
        `> [${ts}] CRDT_MERGE_SUCCESS: 1,540 SKUs posted to ERP Stock Parity Ledger. 12 Valves flagged for QA quarantine vault.`,
      )
    } else if (type === 'crew') {
      setFeedbackBadge('Milestone 4.2 Approved')
      setBadgeClass(
        'rounded-full bg-[#bef529] px-3 py-1 font-mono text-[10px] font-bold text-[#151f00]',
      )
      setLogMessage(
        `> [${ts}] MILESTONE_COMMITTED: WBS Task 4.2 validated with GPS hash. €140,000 sub-draw capitalized to project asset ledger.`,
      )
    } else {
      setFeedbackBadge('Order Confirmed & Stock Reserved')
      setBadgeClass(
        'rounded-full bg-[#bef529] px-3 py-1 font-mono text-[10px] font-bold text-[#151f00]',
      )
      setLogMessage(
        `> [${ts}] POS_ORDER_LOCKED: €71,400.00 contract committed. 4x Turbine Blades locked in London Gateway warehouse.`,
      )
    }
  }

  return (
    <section id="simulator" className="w-full bg-[var(--bg-secondary)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
              Simulated Tactical Operating Console
            </div>
            <h2 className="font-serif text-2xl font-medium text-[var(--text-main)] sm:text-3xl">
              Live State v3.4 Field Cockpit Simulator
            </h2>
            <p className="max-w-xl font-sans text-sm text-[var(--text-muted)]">
              Toggle between warehouse dock operators, construction field supervisors, and roving regional sales leads to experience deterministic mobile ledger execution.
            </p>
          </div>

          {/* Simulator Viewport Switcher Tabs */}
          <div className="inline-flex gap-1 rounded-xl bg-[#e3e2e0] p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabSwitch('dock')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all ${
                activeTab === 'dock'
                  ? 'bg-[#bef529] text-[#151f00] shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[#1a1c1a]'
              }`}
            >
              <Scan className="h-4 w-4" />
              Dockside Receiving
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('crew')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all ${
                activeTab === 'crew'
                  ? 'bg-[#bef529] text-[#151f00] shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[#1a1c1a]'
              }`}
            >
              <HardHat className="h-4 w-4" />
              Jobsite Milestones &amp; Shifts
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('sales')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all ${
                activeTab === 'sales'
                  ? 'bg-[#bef529] text-[#151f00] shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[#1a1c1a]'
              }`}
            >
              <Receipt className="h-4 w-4" />
              Field Sales &amp; Stock
            </button>
          </div>
        </div>

        {/* Cockpit Interactive Body */}
        <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-12">
          {/* Left: Realistic Mobile Handheld Viewport */}
          <div className="flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-[380px] rounded-[40px] bg-[#002116] p-3 text-[#1a1c1a] shadow-2xl">
              {/* Speaker & Camera Dynamic Notch */}
              <div className="absolute top-6 left-1/2 z-30 flex h-4 w-28 -translate-x-1/2 items-center justify-end rounded-full bg-[#12372a] px-3">
                <span className="h-2 w-2 animate-ping rounded-full bg-[#bef529]" />
              </div>
              {/* Screen Canvas */}
              <div className="relative flex min-h-[640px] w-full flex-col justify-between overflow-hidden rounded-[32px] bg-[var(--bg-main)] px-4 pt-8 pb-4 shadow-inner">
                {/* Screen Top Bar */}
                <div className="flex items-center justify-between pb-3 font-mono text-[10px] text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--text-main)]">09:41</span>
                  <div className="flex items-center gap-2">
                    <Signal className="h-3.5 w-3.5 text-[var(--text-main)]" />
                    <Wifi className="h-3.5 w-3.5 text-[var(--text-main)]" />
                    <Battery className="h-3.5 w-3.5 text-[var(--text-main)]" />
                  </div>
                </div>

                {/* PANE A: Dockside Receiving */}
                {activeTab === 'dock' && (
                  <div className="flex flex-1 flex-col justify-between space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                            Inbound Consignment
                          </div>
                          <div className="font-sans text-sm font-bold text-[var(--text-main)]">
                            ASN-8820 • Rotterdam Bulk
                          </div>
                        </div>
                        <span className="rounded bg-[#bef529] px-2 py-0.5 font-mono text-[10px] text-[#151f00]">
                          RECEIVING
                        </span>
                      </div>

                      {/* Viewfinder */}
                      <div className="relative flex h-44 flex-col justify-between overflow-hidden rounded-xl bg-[#e3e2e0] p-3 shadow-inner">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfzdrWM4VLQwVSVsOaHMHBbpfzzGRSJvHCGfh3Or9L3hE9Xc_2dAyO1Rx-TkRYk-KIY_uNWIp-iNc5ZURdDWs0nYTq9nlNimJUUrgSJSBEhXlbYK2jEFa3sDEA5NwfoIcs903LQuMQsppDHno-N-ltsVW4dIlTUhBNZFYX03gi3bQ8ed0ar9iCvYd_GYgetPCbV3qaQ5GOeFmBkmMFuNcppXe4v8SqGVFxExtqkw"
                          alt="Optical scanning targeting reticle on inventory pallets"
                          className="absolute inset-0 h-full w-full object-cover opacity-90"
                        />
                        <div className="relative z-10 flex items-center justify-between text-white">
                          <span className="rounded bg-[#002116]/80 px-2 py-0.5 font-mono text-[10px] backdrop-blur">
                            LiDAR ACTIVE • 60 FPS
                          </span>
                          <Zap className="h-4.5 w-4.5 text-[#bef529]" />
                        </div>
                        {/* Scan Reticle */}
                        <div className="relative z-10 mx-auto flex h-20 w-36 items-center justify-center rounded border-2 border-[#bef529]">
                          <div className="h-0.5 w-full animate-pulse bg-[#bef529] shadow-[0_0_8px_#bef529]" />
                        </div>
                        <div className="relative z-10 rounded bg-[#002116]/90 py-1 text-center font-mono text-[10px] text-white">
                          SKU #MD-48192-A [VERIFIED]
                        </div>
                      </div>

                      {/* Manifest Checklist */}
                      <div className="space-y-1.5 font-sans text-xs">
                        <div className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[var(--text-main)]" />
                            <span>Titanium Screws 24mm</span>
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-[var(--text-main)]">
                            1,200 / 1,200
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[var(--text-main)]" />
                            <span>Polymer Hydraulic Seal</span>
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-[var(--text-main)]">
                            340 / 340
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-[#ffdad6] p-2 text-[#93000a] shadow-sm">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Regulator Valves G2</span>
                          </div>
                          <span className="font-mono text-[10px] font-bold">12 MISSING</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => triggerAction('dock')}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#002116] py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#12372a]"
                      >
                        <Verified className="h-4.5 w-4.5 text-[#bef529]" />
                        Post Discrepancy &amp; Commit Ledger
                      </button>
                    </div>
                  </div>
                )}

                {/* PANE B: Jobsite Milestones */}
                {activeTab === 'crew' && (
                  <div className="flex flex-1 flex-col justify-between space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                            Active Jobsite Geofence
                          </div>
                          <div className="font-sans text-sm font-bold text-[var(--text-main)]">
                            Munich Substation • WO-4190
                          </div>
                        </div>
                        <span className="rounded bg-[#e3e2e0] px-2 py-0.5 font-mono text-[10px] text-[var(--text-main)]">
                          IN-BOUNDS
                        </span>
                      </div>

                      <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between font-sans text-xs">
                          <span className="text-[var(--text-muted)]">Lead Engineer</span>
                          <span className="font-semibold text-[var(--text-main)]">K. Hartmann (#ENG-09)</span>
                        </div>
                        <div className="flex items-center justify-between font-sans text-xs">
                          <span className="text-[var(--text-muted)]">Union Break Clock</span>
                          <span className="font-mono text-[10px] font-bold text-[var(--text-main)]">
                            3h 42m remaining
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e3e2e0]">
                          <div className="h-full w-2/3 bg-[#bef529]" />
                        </div>
                      </div>

                      {/* Task Milestone Card */}
                      <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
                        <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                          Milestone 4.2: Foundation Pour
                        </div>
                        <div className="space-y-1.5 font-sans text-xs">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded text-[var(--text-main)]"
                            />
                            <span>Lien waivers signed by subcontractor</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded text-[var(--text-main)]"
                            />
                            <span>Slump test slump certificate attached</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded text-[var(--text-main)]" />
                            <span>GPS hash photo validation (3 required)</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-2.5 font-mono text-[10px]">
                        <span className="text-[var(--text-muted)]">CRDT Cryptographic Hash</span>
                        <span className="font-semibold text-[var(--text-main)]">0x7F...E91A</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => triggerAction('crew')}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#bef529] py-2.5 font-sans text-xs font-bold text-[#151f00] shadow-md transition-colors hover:bg-[#a4d700]"
                      >
                        <Verified className="h-4.5 w-4.5" />
                        Sign Milestone &amp; Release Draw
                      </button>
                    </div>
                  </div>
                )}

                {/* PANE C: Field Sales */}
                {activeTab === 'sales' && (
                  <div className="flex flex-1 flex-col justify-between space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                            Account #AC-9902
                          </div>
                          <div className="font-sans text-sm font-bold text-[var(--text-main)]">
                            Atlas Heavy Industrials
                          </div>
                        </div>
                        <span className="rounded bg-[#e3e2e0] px-2 py-0.5 font-mono text-[10px] text-[var(--text-main)]">
                          TIER-A VIP
                        </span>
                      </div>

                      <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
                        <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                          Live Multi-Site Availability
                        </div>
                        <div className="space-y-1 font-sans text-xs">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">London Gateway Hub</span>
                            <span className="font-mono font-bold text-[var(--text-main)]">
                              420 units (Same-Day)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Rotterdam Depot</span>
                            <span className="font-mono font-bold text-[var(--text-main)]">
                              1,150 units (+24h)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cart Summary */}
                      <div className="space-y-2 rounded-xl bg-white p-3 font-sans text-xs shadow-sm">
                        <div className="flex justify-between">
                          <span>Turbine Rotor Blades (×4)</span>
                          <span className="font-mono font-semibold">€84,000.00</span>
                        </div>
                        <div className="flex justify-between text-[var(--text-muted)]">
                          <span>Contract Discount (-15%)</span>
                          <span className="font-mono text-[#4d6700] dark:text-[#d2ff3a]">-€12,600.00</span>
                        </div>
                        <div className="flex justify-between pt-1 font-sans text-xs font-semibold text-[var(--text-main)]">
                          <span>Total Committed</span>
                          <span className="font-mono font-bold">€71,400.00</span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[var(--bg-secondary)] p-2.5 text-center font-mono text-[10px] text-[var(--text-muted)]">
                        NFC Tap-to-Pay &amp; Corporate PO Token Ready
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => triggerAction('sales')}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#002116] py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#12372a]"
                      >
                        <UserCheck className="h-4.5 w-4.5 text-[#bef529]" />
                        Capture Digital Signature &amp; Reserve Stock
                      </button>
                    </div>
                  </div>
                )}

                {/* Simulator Bottom Home Indicator */}
                <div className="mx-auto mt-2 h-1 w-32 rounded-full bg-[#414844]/30" />
              </div>
            </div>
          </div>

          {/* Right: Real-time ERP Backplane Telemetry Mirror */}
          <div className="space-y-6 lg:col-span-7">
            <div className="space-y-4 rounded-2xl bg-white p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-[#12372a]/10 pb-3">
                <div>
                  <div className="font-mono text-[10px] font-semibold uppercase text-[#4d6700] dark:text-[#d2ff3a]">
                    Autonomous Central Ledger Monitor
                  </div>
                  <h3 className="font-serif text-xl font-medium text-[var(--text-main)]">
                    Live Backend Replicated State
                  </h3>
                </div>
                <span className={badgeClass}>{feedbackBadge}</span>
              </div>

              {/* Terminal Code Feed */}
              <div className="space-y-2 overflow-x-auto rounded-xl bg-[#002116] p-4 font-mono text-[10px] text-white">
                <div className="text-[#7ba190]">
                  // CRDT Synchronization Kernel v3.4.1 [EVENT STREAM]
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#a4d700]">09:41:02.104</span>
                  <span className="text-[#a8cfbd]">HANDHELD_AUTH_TOKEN:</span>
                  <span>DEVICE_UUID: zb-tc57-eu-8819 [GEOFENCE: PASS]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#a4d700]">09:41:02.392</span>
                  <span className="text-[#a8cfbd]">LOCAL_STATE:</span>
                  <span>SQLITE_TRANSACTION: READ_COMMITTED [TX_38102]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#a4d700]">09:41:02.810</span>
                  <span className="text-[#a8cfbd]">CRDT_CLOCK:</span>
                  <span>LAMPORT_TIMESTAMP: &#123; node_id: "ldn_dock_14b", seq: 94812 &#125;</span>
                </div>
                <div className="animate-pulse text-[#a4d700]">{logMessage}</div>
              </div>

              {/* Operational Feature Matrix Breakdown */}
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="space-y-1.5 rounded-xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-center gap-2 font-sans text-xs font-semibold text-[var(--text-main)]">
                    <Shield className="h-5 w-5 text-[#4d6700] dark:text-[#d2ff3a]" />
                    Hardware Enclave Keystore
                  </div>
                  <p className="font-sans text-xs text-[var(--text-muted)]">
                    Transactions signed via secure Android StrongBox or Apple Secure Enclave. Private keys never leave the silicon.
                  </p>
                </div>
                <div className="space-y-1.5 rounded-xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-center gap-2 font-sans text-xs font-semibold text-[var(--text-main)]">
                    <RefreshCw className="h-5 w-5 text-[#4d6700] dark:text-[#d2ff3a]" />
                    Sub-second Consensus
                  </div>
                  <p className="font-sans text-xs text-[var(--text-muted)]">
                    State merges without locks. If two fork-lifts scan the same bin simultaneously, CRDT delta reconciles in 8.2ms.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Device Telemetry Mini Board */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] font-bold text-[var(--text-main)]">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                    Mesh Synchronization Protocol
                  </div>
                  <div className="font-sans text-xs text-[var(--text-muted)]">
                    Bluetooth Low Energy (BLE) peer-to-peer sync in zero-cellular basements
                  </div>
                </div>
              </div>
              <span className="rounded bg-[#bef529] px-3 py-1 font-mono text-[10px] font-bold uppercase text-[#151f00]">
                ACTIVE FIELD RUNTIME
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Four Pillars of Mobile Enterprise Execution (Bento Grid) ---------- */

function BentoGridPillars() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="mx-auto max-w-3xl space-y-2 text-center">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
            Architectural Capabilities
          </div>
          <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
            Four Pillars of Mobile Enterprise Execution
          </h2>
          <p className="font-sans text-base text-[var(--text-muted)]">
            Engineered to eradicate desktop latency from physical operations across manufacturing plants, mega-logistics ports, and remote engineering footprints.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Pillar 01 (Span 7) */}
          <div className="flex flex-col justify-between space-y-6 rounded-2xl bg-white p-8 shadow-md lg:col-span-7">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] font-semibold text-[var(--text-main)]">
                  PILLAR 01
                </span>
                <Fingerprint className="h-7 w-7 text-[var(--text-main)]" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                Dynamic Shift Scheduling &amp; Biometric Labor Rules
              </h3>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Enforce geofenced perimeter clock-ins with optical facial recognition and hardware fingerprint matching. Automatic compliance checking continuously verifies European Working Time Directive rules, mandatory breaks, and overtime limits before feeding approved hours directly into ERP payroll journals.
              </p>
            </div>
            {/* Visual Inline Feature */}
            <div className="grid grid-cols-1 gap-3 pt-2 font-mono text-[10px] sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                <div className="text-[var(--text-muted)]">Geofence Drift</div>
                <div className="font-sans text-xs font-bold text-[var(--text-main)]">&lt; 1.2 Meters</div>
              </div>
              <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                <div className="text-[var(--text-muted)]">Union Break Audit</div>
                <div className="font-sans text-xs font-bold text-[#4d6700] dark:text-[#d2ff3a]">100% Guarded</div>
              </div>
              <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                <div className="text-[var(--text-muted)]">Payroll Post</div>
                <div className="font-sans text-xs font-bold text-[var(--text-main)]">Real-Time Ledger</div>
              </div>
            </div>
          </div>

          {/* Pillar 02 (Span 5) */}
          <div className="flex flex-col justify-between space-y-6 rounded-2xl bg-white p-8 shadow-md lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] font-semibold text-[var(--text-main)]">
                  PILLAR 02
                </span>
                <Verified className="h-7 w-7 text-[var(--text-main)]" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                Jobsite Project Milestones &amp; Progress Tracking
              </h3>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Execute Work Breakdown Structure (WBS) task completions directly on-site. Field superintendents capture high-resolution inspection photos cryptographically stamped with GPS coordinates, verify subcontractor conditional lien waivers, and trigger automatic milestone CapEx capitalization.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--bg-tertiary)] p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#4d6700] dark:text-[#d2ff3a]" />
                <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                  Zero Dispute Audit Trail
                </div>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">ISO 19650</span>
            </div>
          </div>

          {/* Pillar 03 (Span 5) */}
          <div className="flex flex-col justify-between space-y-6 rounded-2xl bg-white p-8 shadow-md lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] font-semibold text-[var(--text-main)]">
                  PILLAR 03
                </span>
                <Package className="h-7 w-7 text-[var(--text-main)]" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                High-Velocity Dockside Receiving &amp; Stock Transfers
              </h3>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Ingest inbound logistics manifests via camera OCR or rugged 2D imager lasers in milliseconds. Automatic cross-dock routing directs pallets straight to staging or designated warehouse racks, triggering instant quarantine vault isolation whenever batch temperature excursions are logged.
              </p>
            </div>
            <div className="space-y-2 rounded-xl bg-[var(--bg-secondary)] p-4">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-[var(--text-muted)]">Optical Ingest Rate</span>
                <span className="font-bold text-[var(--text-main)]">85 Pallets / min</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e3e2e0]">
                <div className="h-full w-4/5 bg-[#002116]" />
              </div>
            </div>
          </div>

          {/* Pillar 04 (Span 7) */}
          <div className="flex flex-col justify-between space-y-6 rounded-2xl bg-white p-8 shadow-md lg:col-span-7">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[10px] font-semibold text-[var(--text-main)]">
                  PILLAR 04
                </span>
                <Receipt className="h-7 w-7 text-[var(--text-main)]" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                Mobile Point of Sale &amp; Real-Time Stock Allocations
              </h3>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Arm field reps and showroom consultants with dynamic customer account tiers, instant global warehouse availability lookups, and on-the-spot mobile payment processing (EMV chip, Apple Pay, NFC). Instantly lock inventory stock across all regional depots the moment a digital signature is captured.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 font-sans text-xs sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-3.5">
                <Smartphone className="h-5 w-5 text-[#4d6700] dark:text-[#d2ff3a]" />
                <span>Tap-to-Pay on COTS Commercial iOS/Android</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-3.5">
                <Receipt className="h-5 w-5 text-[#4d6700] dark:text-[#d2ff3a]" />
                <span>Instant Bluetooth ESC/POS Thermal Printing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. Offline-First CRDT Sync Engine Architecture Section ---------- */

function ArchitectureSection() {
  return (
    <section data-scroll-reveal="fade-in" className="relative w-full overflow-hidden bg-[var(--bg-tertiary)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-12">
          {/* Architecture Narrative */}
          <div className="space-y-6 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#12372a] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white">
              <Zap className="h-3.5 w-3.5 text-[#bef529]" />
              Zero-Collision Deterministic Ledger
            </div>
            <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
              Conflict-Free Replicated Data Types (CRDT) Sync Kernel
            </h2>
            <p className="font-sans text-base text-[var(--text-muted)]">
              Workers operating deep inside subterranean rail tunnels, ocean freight cargo holds, or rural construction sites cannot rely on cellular coverage. Scryme embeds a complete, high-performance SQLite engine paired with state-based CRDT delta algorithms inside every mobile binary.
            </p>
            <div className="space-y-3 font-sans text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--text-main)]" />
                <span>
                  <strong>State Replication Without Locks:</strong> When 200 handhelds simultaneously scan goods in offline mode, reconnecting initiates automated multi-way merges with zero database locking or transaction aborts.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--text-main)]" />
                <span>
                  <strong>Lamport Vector Clocks:</strong> Deterministic ordering guarantees that stock deductions and inventory transfers maintain mathematically provable causality.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--text-main)]" />
                <span>
                  <strong>Differential Compression:</strong> Over-the-air sync batches are compressed via Zstandard, transmitting only raw field diffs to minimize edge bandwidth consumption.
                </span>
              </div>
            </div>
            <div className="pt-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-[var(--text-main)] transition-colors hover:text-[#4d6700] dark:text-[#d2ff3a]"
              >
                Read CRDT Enterprise Whitepaper
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Architecture Flow Visual Schematic */}
          <div className="lg:col-span-6">
            <div className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#12372a]/10 pb-2">
                <span className="font-mono text-[10px] font-bold uppercase text-[var(--text-main)]">
                  CRDT Replication Topology
                </span>
                <span className="rounded-full bg-[#bef529] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#151f00]">
                  DELTA STATE v3
                </span>
              </div>

              {/* Interactive Architecture Step Diagram */}
              <div className="space-y-3">
                {/* Node 1: Mobile Edge */}
                <div className="flex items-center justify-between rounded-xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#002116] font-bold text-white">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                        Mobile Local SQLite Instance
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        AES-256 Encrypted on Device Disk
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-[#e3e2e0] px-2 py-1 font-mono text-[10px] font-semibold text-[var(--text-main)]">
                    0.00ms RTT
                  </span>
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center text-[var(--text-main)]">
                  <div className="flex items-center gap-2 rounded-full bg-[#e3e2e0] px-3 py-1 font-mono text-[10px]">
                    <RefreshCw className="h-3.5 w-3.5 text-[#4d6700] dark:text-[#d2ff3a]" />
                    Bidir CRDT Delta Stream (WebSocket / HTTP3)
                  </div>
                </div>

                {/* Node 2: Edge Gateway */}
                <div className="flex items-center justify-between rounded-xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e3e2e0] font-bold text-[var(--text-main)]">
                      <Router className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                        Facility Edge Mesh Node
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        Local LAN Peer Hub (Zero WAN Dependency)
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-[#bef529] px-2 py-1 font-mono text-[10px] font-semibold text-[#151f00]">
                    LOCAL RESILIENT
                  </span>
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center text-[var(--text-main)]">
                  <div className="flex items-center gap-2 rounded-full bg-[#e3e2e0] px-3 py-1 font-mono text-[10px]">
                    <RefreshCw className="h-3.5 w-3.5 text-[#4d6700] dark:text-[#d2ff3a]" />
                    WAN Re-hydration &amp; Global Journal Ingest
                  </div>
                </div>

                {/* Node 3: Cloud ERP Kernel */}
                <div className="flex items-center justify-between rounded-xl bg-[#002116] p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#bef529] font-bold text-[#151f00]">
                      <Database className="h-5 w-5 text-[var(--text-main)]" />
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold text-white">
                        Global Autonomous ERP Kernel
                      </div>
                      <div className="font-mono text-[10px] text-[#7ba190]">
                        Triple-Replicated Financial Ledger
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-[#12372a] px-2 py-1 font-mono text-[10px] font-semibold text-[#bef529]">
                    FINAL COMMITTED
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

/* ---------- 6. Hardware & Scanner Ecosystem ---------- */

function HardwareEcosystem() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
              Hardware-Agnostic Ecosystem
            </div>
            <h2 className="font-serif text-2xl font-medium text-[var(--text-main)] sm:text-3xl">
              Certified Enterprise Peripheral Compatibility
            </h2>
            <p className="max-w-xl font-sans text-sm text-[var(--text-muted)]">
              Direct OEM SDK integration gives frontline workers native trigger response on ruggedized barcode terminals, wearable ring units, and commercial consumer tablets.
            </p>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-muted)]">
            SDK DRIVERS BUILT FOR ANDROID 11–15 &amp; iOS 16–18
          </div>
        </div>

        {/* Hardware Device Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Device 1 */}
          <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="space-y-3">
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1qgioNkJWmTJ1MEI2RPms7wuaXcxmeFOG2QvD28rI0qBtFRFfpRqqiGMJNOkn5Daqk1S5HS6aWUdM4_Z5_ZAnrNcK7LRtoNB_l3O0PtK41_cEUcNvZu3d4wYG7MqAi7tN2MB5S56SP1HRk4qXPgX2go1334YcDovgNwO0g7xNZw3u6zmyCgKnH2GFYZn0lKNVG4Bq_1S212OBAkPxfTMaLKD6-IJKzV4SlIz0og"
                  alt="Zebra TC52 TC57 TC77 Handheld"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[#4d6700] dark:text-[#d2ff3a]">
                  ZEBRA TECHNOLOGIES
                </span>
                <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-main)]">
                  NATIVE EMDK
                </span>
              </div>
              <h3 className="font-sans text-sm font-semibold text-[var(--text-main)]">
                TC52 / TC57 / TC77 Handhelds
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Hardware scan engine acceleration via Zebra DataWedge intents. Sub-50ms barcode deciphering through glass, shrink wrap, and degraded labels.
              </p>
            </div>
            <div className="pt-2 font-mono text-[10px] font-semibold text-[var(--text-main)]">
              Status: Certified Tier 1
            </div>
          </div>

          {/* Device 2 */}
          <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="space-y-3">
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDk0CwhEBy6lbzZJKHWhrcMBrcQBZ5A4yFsblEcz0-hvnnlBYw0pDQczjltgu8Vxn57Jss3GjmBFwrDtaWCwBC_NoIAGyUvFRQzZsSMctWezMdbrGz7pTNoRFGQPfKQ7z8WOeRb8354XMe-_fsq9nZKkxm4r4c-pg4Z1l3gm34GthfmtNe5GT_WvcMeKn_4BlZRPq-E1j-NMqVFW_Qjmt4iK7P_yPrJuzLCW3rohQ"
                  alt="Honeywell CT40 CT60 EDA52 Series"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[#4d6700] dark:text-[#d2ff3a]">
                  HONEYWELL SCANNING
                </span>
                <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-main)]">
                  MOBILITY EDGE
                </span>
              </div>
              <h3 className="font-sans text-sm font-semibold text-[var(--text-main)]">
                CT40 / CT60 / EDA52 Series
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Deep integration with Honeywell Mobility SDK for high-range forklift scanning, OCR packaging reading, and IP67 water/dust ingress resistance.
              </p>
            </div>
            <div className="pt-2 font-mono text-[10px] font-semibold text-[var(--text-main)]">
              Status: Certified Tier 1
            </div>
          </div>

          {/* Device 3 */}
          <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="space-y-3">
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXDm78eBtcSg9_xhJlBLw4SzzfpJqGzVsuZGX16SutmI_KLHXXjttmlueKv92BTsN6N0iOscoG0ajzdXPh5ead9ApWyMOiuKnvDdzVQ5dgudoj2GdLpt34d_-Ba_6RD7rLcvSuXjgH3KLWHr--KJc51y706KfSi22gkgPU_uEbB5JsqcJnpWzQoMGsjaHCfN2OjJcZVwKAUuvuWBlJL5aLJmdOU5TZcwRm2LoQGQ"
                  alt="ProGlove Wearables MARK Display"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[#4d6700] dark:text-[#d2ff3a]">
                  PROGLOVE WEARABLES
                </span>
                <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-main)]">
                  BLE GLOVE
                </span>
              </div>
              <h3 className="font-sans text-sm font-semibold text-[var(--text-main)]">
                MARK Display &amp; LEO Wearables
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Hands-free ring barcode scanners communicate with the operator's smartphone or smart watch, providing haptic buzz feedback on scan validity.
              </p>
            </div>
            <div className="pt-2 font-mono text-[10px] font-semibold text-[var(--text-main)]">
              Status: Hands-Free Validated
            </div>
          </div>

          {/* Device 4 */}
          <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="space-y-3">
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOaOOi0_4eEiDe6idwPhagk1ZGFiUDk_Qzxao2dqhJu93PNUF2fktHpzR1Wxr-FO_QuIdOmhuG4zNmLpJGY0ngLhlo7u3Mo-x7JsMj-XPq3EQf_eVOHCA8rpXr1rsZzUwPJ5mkMObwcuZyVnOGmd0MWMBRpG8FkQI0Y09-UcMK31bVeuNjFL4WYE4sokbmNj_XXOw4VL4MdL-kp6de76NavLCN6GuNrgVmT9D-CQ"
                  alt="Apple iPad Pro & iPhone 15/16 Pro"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[#4d6700] dark:text-[#d2ff3a]">
                  APPLE ENTERPRISE
                </span>
                <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-main)]">
                  LIDAR VISION
                </span>
              </div>
              <h3 className="font-sans text-sm font-semibold text-[var(--text-main)]">
                iPad Pro &amp; iPhone 15/16 Pro
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Turn commercial iOS hardware into precision volume-dimensioning scanners. Utilize LiDAR sensors to measure freight cargo pallet cubing in 2 seconds.
              </p>
            </div>
            <div className="pt-2 font-mono text-[10px] font-semibold text-[var(--text-main)]">
              Status: Certified iOS SDK
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. Enterprise Case Study Spotlight ---------- */

function CaseStudySpotlight() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-secondary)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 shadow-xl md:p-12">
        <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-12">
          {/* Story Column */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#bef529] px-3 py-1 font-mono text-[10px] font-semibold text-[#151f00]">
              CASE SPOTLIGHT • NORDIC LOGISTICS &amp; HEAVY CIVIL
            </div>
            <h2 className="font-serif text-3xl font-normal leading-tight text-[var(--text-main)] sm:text-4xl">
              How Nordic Construction deployed 3,400 Scryme terminals to eliminate 14,000 monthly jobsite delays.
            </h2>
            <blockquote className="font-serif text-lg italic text-[var(--text-muted)]">
              “Our heavy civil engineers work in Arctic fjords and deep excavation trenches with zero cellular connection. Scryme's offline CRDT engine gave our 3,400 field workers immediate ledger autonomy. When they step back into range, days of work merge seamlessly without losing a single subcontractor signature or inventory bolt.”
            </blockquote>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e3e2e0] font-bold text-[var(--text-main)]">
                ME
              </div>
              <div>
                <div className="font-sans text-sm font-bold text-[var(--text-main)]">Mårten Engström</div>
                <div className="font-sans text-xs text-[var(--text-muted)]">
                  Chief Information Officer, Nordic Infrastructure Group
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Column */}
          <div className="space-y-4 lg:col-span-5">
            <div className="space-y-1 rounded-2xl bg-[var(--bg-tertiary)] p-6">
              <div className="font-mono text-4xl font-bold tracking-tight text-[var(--text-main)]">-62%</div>
              <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                Dock Dwell Turnaround
              </div>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Inbound freight trucks cleared and reconciled in under 18 minutes vs. previous 48-minute manual paper manifest verification.
              </p>
            </div>
            <div className="space-y-1 rounded-2xl bg-[var(--bg-tertiary)] p-6">
              <div className="font-mono text-4xl font-bold tracking-tight text-[var(--text-main)]">100%</div>
              <div className="font-sans text-xs font-semibold text-[var(--text-main)]">
                Biometric Timesheet Accuracy
              </div>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Zero ghost shifts or manual timeclock dispute arbitrations across 12 simultaneous multi-year mega-project sites.
              </p>
            </div>
            <div className="space-y-1 rounded-2xl bg-[#002116] p-6 text-white">
              <div className="font-mono text-4xl font-bold tracking-tight text-[#bef529]">€4.2M</div>
              <div className="font-sans text-xs font-semibold text-white">
                Annual Direct Labor Savings
              </div>
              <p className="font-sans text-xs text-[#7ba190]">
                Derived from automated PO invoice matching, real-time inventory allocation, and administrative paper eradication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 8. Technical Specifications & Field Compliance FAQ ---------- */

const FAQS = [
  {
    q: 'How does Scryme protect offline enterprise financial data stored on lost or stolen handhelds?',
    a: 'All localized SQLite databases are protected via SQLCipher with FIPS 140-2 validated AES-256 encryption. Encryption keys are securely derived through the hardware\'s TPM / Apple Secure Enclave / Android StrongBox. Furthermore, administrators can trigger cryptographic zeroization over MDM channels the moment an asset is flagged missing.',
  },
  {
    q: 'Which Mobile Device Management (MDM) platforms are supported for silent fleet rollout?',
    a: 'Scryme publishes managed app configurations conforming to the AppConfig community standard. We support turnkey zero-touch provisioning and silent APK/IPA updates through Microsoft Intune, VMware Workspace ONE, Jamf Pro, SOTI MobiControl, and Ivanti Neurons.',
  },
  {
    q: 'How do battery optimization profiles support uninterrupted 12-to-16 hour double shifts?',
    a: 'Our background daemon throttles non-critical telemetry transmissions and utilizes hardware-accelerated batching. When scanning at maximum velocity, the UI maintains 60 FPS while consuming under 4.8% battery per operating hour on standard Zebra and Honeywell OEM battery packs.',
  },
  {
    q: 'What happens when two workers attempt to claim the exact same pallet or serial number while offline?',
    a: 'Scryme uses custom CRDT Last-Write-Wins (LWW) with Lamport vector timestamps combined with an immutable ERP reconciliation queue. If two operators claim the same physical serial unit, the earlier microsecond hash claims primary ownership while the second is instantly diverted to supervisory quarantine with an automated push-notification dispatch.',
  },
]

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
            Governance &amp; Deployment Standards
          </div>
          <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
            Technical Architecture &amp; Field Compliance FAQ
          </h2>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Strict security safeguards, MDM integration capabilities, and deterministic database guarantees.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.q} className="rounded-2xl bg-white p-6 shadow-sm">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between text-left"
                >
                  <h3 className="font-sans text-sm font-semibold text-[var(--text-main)]">
                    {faq.q}
                  </h3>
                  <ChevronDown
                    className={`h-5 w-5 text-[var(--text-main)] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                    {faq.a}
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

/* ---------- 9. Executive Conversion Banner ---------- */

function ExecutiveCtaBanner() {
  return (
    <section id="builds" className="w-full bg-[#002116] py-16 px-4 text-white md:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#12372a] p-8 shadow-2xl md:p-14">
        {/* Background Ambient Glow */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#bef529]/20 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 gap-8 items-center lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#002116] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#bef529]">
              Ready For Frontline Deployment
            </div>
            <h2 className="font-serif text-3xl font-normal leading-tight text-white sm:text-4xl">
              Equip your operational workforce with deterministic mobile intelligence.
            </h2>
            <p className="max-w-2xl font-sans text-base text-[#7ba190]">
              Book an on-site pilot trial at your primary distribution center or manufacturing hub. Our engineers configure staging profiles, MDM builds, and scanner SDKs in under 72 hours.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#bef529] px-6 py-3.5 font-sans text-xs font-bold text-[#151f00] shadow-md transition-colors hover:bg-[#a4d700]"
              >
                <Calendar className="h-4.5 w-4.5" />
                Schedule Facility Deployment Pilot
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-[#002116] px-6 py-3.5 font-sans text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#e3e2e0] hover:text-[var(--text-main)]"
              >
                <Terminal className="h-4.5 w-4.5" />
                Request MDM Package (APK / IPA)
              </Link>
            </div>
          </div>

          {/* Right Quick Badge Telemetry */}
          <div className="space-y-3 font-mono text-[10px] lg:col-span-4">
            <div className="space-y-1 rounded-xl bg-[#002116]/60 p-4 backdrop-blur">
              <div className="font-semibold uppercase text-[#bef529]">ENTERPRISE SLA</div>
              <div className="font-sans text-xs text-white">
                99.999% Field Sync Uptime Guarantee with Dedicated Edge Gateway Nodes.
              </div>
            </div>
            <div className="space-y-1 rounded-xl bg-[#002116]/60 p-4 backdrop-blur">
              <div className="font-semibold uppercase text-[#bef529]">MDM PROFILES</div>
              <div className="font-sans text-xs text-white">
                Ready-to-sign binaries for Intune, Jamf Pro, and SOTI MobiControl available today.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Component Page ---------- */

function MobileFieldOpsComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#bef529] selection:text-[#151f00] transition-colors">
      <Header />
      <main className="w-full pt-20">
        <LiveTelemetryTicker />
        <Hero />
        <SimulatorCockpit />
        <BentoGridPillars />
        <ArchitectureSection />
        <HardwareEcosystem />
        <CaseStudySpotlight />
        <FaqSection />
        <ExecutiveCtaBanner />
      </main>
      <Footer />
    </div>
  )
}