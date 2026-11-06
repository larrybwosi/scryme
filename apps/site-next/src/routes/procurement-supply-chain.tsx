import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Database,
  FileText,
  Globe,
  Layers,
  Lock,
  Package,
  Receipt,
  RefreshCw,
  Send,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Sparkles,
  Terminal,
  TrendingDown,
  Truck,
  UserCheck,
  Verified,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/procurement-supply-chain')({
  component: ProcurementSupplyChainComponent,
})

/* ---------- 1. Live Telemetry Ribbon ---------- */

function LiveTelemetryTicker() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-tertiary)] py-2.5 px-4 font-mono text-[10px] text-[var(--text-muted)] shadow-sm md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 font-semibold text-[var(--text-main)] shadow-sm">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#bef529]" />
            LIVE SOURCING MESH: ACTIVE
          </span>
          <span className="hidden text-[#c1c8c3] md:inline-block">/</span>
          <span className="hidden items-center gap-1 text-[#1a1c1a] md:inline-flex">
            SOURCING PIPELINE:{' '}
            <strong className="font-semibold text-[var(--text-main)]">$148.4M UNDER MGMT</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">SUPPLIER OTIF:</span>
            <span className="font-semibold text-[var(--text-main)]">98.7% DETERMINISTIC</span>
          </div>
          <span className="text-[#c1c8c3]">/</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">3-WAY MATCH SPEED:</span>
            <span className="font-semibold text-[var(--text-main)]">0.18s P99</span>
          </div>
          <span className="hidden text-[#c1c8c3] lg:inline-block">/</span>
          <div className="hidden items-center gap-1.5 lg:flex">
            <span className="text-[var(--text-muted)]">PEPPOL &amp; EDI:</span>
            <span className="font-semibold text-[var(--text-main)]">1,840 BRIDGES</span>
          </div>
          <span className="rounded bg-[#bef529] px-2 py-0.5 font-bold uppercase tracking-wider text-[#151f00]">
            SUB-CENT LANDED PRECISION
          </span>
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

  return (
    <section data-scroll-reveal="fade-in" className="relative w-full overflow-hidden bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Text Column */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--bg-secondary)] px-3 py-1 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#bef529]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#12372a]">
                Core Pillar 07 • Autonomous Sourcing, Procurement &amp; Supply Chain
              </span>
            </div>

            <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-tight text-[var(--text-main)] sm:text-5xl lg:text-[52px]">
              Autonomous supplier sourcing, dynamic landed costs, and touchless procure-to-pay.
            </h1>

            <p className="max-w-2xl font-sans text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              Bridge the critical divide between procurement contracts, international freight routes, and your corporate balance sheet. Automate RFQ bidding, dynamic supplier scoring, multimodal container tracking, and zero-touch 3-way ledger settlements in one deterministic kernel.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={scrollToSimulator}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#12372a] px-5 py-3 font-sans text-xs font-semibold text-white shadow-md transition-all hover:bg-[#002116]"
              >
                <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                <span>Launch Sourcing &amp; RFQ Simulator</span>
                <Terminal className="h-4.5 w-4.5" />
              </button>

              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-5 py-3 font-sans text-xs font-semibold text-[var(--text-main)] shadow-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              >
                <span>Schedule Supply Chain Audit</span>
                <Calendar className="h-4.5 w-4.5" />
              </Link>

              <a
                href="#"
                className="inline-flex items-center gap-1.5 px-3 py-2 font-sans text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
              >
                <FileText className="h-4 w-4" />
                <span>Whitepaper (PDF)</span>
              </a>
            </div>

            {/* Telemetry Highlights Grid */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="flex flex-col justify-between rounded-xl bg-white p-3 shadow-sm">
                <div className="font-mono text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  0.18s
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Invoice-to-Ledger Commit
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white p-3 shadow-sm">
                <div className="font-mono text-xl font-semibold text-[#4d6700] dark:text-[#d2ff3a] sm:text-2xl">
                  -28.4%
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Lead Time Compression
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white p-3 shadow-sm">
                <div className="font-mono text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  99.8%
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Auto PO-ASN Match
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual: Sovereign Trade Node Topology */}
          <div className="relative lg:col-span-5">
            <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#bef529]" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-main)]">
                    GLOBAL TRADE TOPOLOGY // LIVE FEED
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">UTC 14:22:09</span>
              </div>

              {/* Background Radar Imagery Box */}
              <div
                className="relative flex h-64 w-full flex-col justify-between overflow-hidden rounded-xl bg-[#12372a] p-3 text-white bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA3MH8gML_U5uiulxA5K1w6hw6V2SCnA_EqFEpNuYyACDOf2R_7BL7nbM---oslsvAKyqVxO_dn9TSYJzuAo2hohr4Chi_6LcR3nCoRtwI7LQYSON3pZTg7soc1hvAKVzfZyCbj0sjv1MV1_y0XfgHf301QdhlVqjS_QaAqYn69gVQ260OOq7J_iVKwJP6wNV65OxuSCA5lhJ1ma0Rgyz3eNnu6g6WZLfgzl7wzUw')",
                }}
              >
                <div className="max-w-xs space-y-1 rounded-lg bg-[#002116]/80 p-3 backdrop-blur-md">
                  <div className="font-mono text-[10px] text-[#bef529]">
                    ACTIVE VESSEL TELEMETRY
                  </div>
                  <div className="font-sans text-xs font-semibold text-white">
                    MSC FEBE (Voyage 409X)
                  </div>
                  <div className="font-sans text-xs text-[#e9e8e5]">
                    Rotterdam Hub → Gothenburg Terminal
                  </div>
                  <div className="font-mono text-[10px] text-[#a4d700]">
                    ETA: +11h 22m • Clear Customs Pre-Pass
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#002116]/85 px-3 py-2 font-mono text-[10px] text-white backdrop-blur-md">
                  <span>AIS RADAR: 42 CONVOYS MONITORED</span>
                  <span className="text-[#bef529]">ZERO PARITY DRIFT</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between font-sans text-xs">
                  <span className="text-[var(--text-muted)]">Current Autonomous RFQs</span>
                  <span className="font-mono font-semibold text-[var(--text-main)]">14 ACTIVE</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div className="h-full w-[78%] rounded-full bg-[#12372a]" />
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
                  <span>Algorithmic Allocation: 84.2%</span>
                  <span>Manual Review: 15.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Interactive Sourcing & Procurement Simulator Cockpit ---------- */

function SimulatorCockpit() {
  const [activeTab, setActiveTab] = useState<'rfq' | 'match'>('rfq')
  const [awardedVendor, setAwardedVendor] = useState<string | null>(null)

  return (
    <section id="simulator" className="w-full bg-[var(--bg-secondary)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-2">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#4d6700] dark:text-[#d2ff3a]">
              SIMULATOR ENGINE // BUILD 3.4.1
            </div>
            <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
              Algorithmic Sourcing Cockpit
            </h2>
            <p className="font-sans text-sm text-[var(--text-muted)]">
              Test how Scryme evaluates raw vendor quotes against real-time HS customs tariffs, inland fuel surcharges, carbon taxes, and historical reliability to establish true landed costs.
            </p>
          </div>

          <div className="flex self-start rounded-xl bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('rfq')}
              className={`cursor-pointer rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all ${
                activeTab === 'rfq'
                  ? 'bg-[#12372a] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Live RFQ Matrix (RFQ-9402)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('match')}
              className={`cursor-pointer rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all ${
                activeTab === 'match'
                  ? 'bg-[#12372a] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Touchless 3-Way Match
            </button>
          </div>
        </div>

        {/* Live Simulator Panel */}
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-md">
          {/* RFQ Metadata Strip */}
          <div className="flex flex-col justify-between gap-4 rounded-xl bg-[var(--bg-secondary)] p-4 md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#002116] px-2 py-0.5 font-mono text-[10px] text-white">
                  RFQ-9402
                </span>
                <span className="font-sans text-base font-semibold text-[var(--text-main)]">
                  Global Titanium Grade 5 Rods &amp; Industrial Sensor Bus
                </span>
              </div>
              <div className="font-sans text-xs text-[var(--text-muted)]">
                Scope: 25,000 Precision Milled Units • Destination: Stuttgart Advanced Machining Center (DE-STU-01)
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">Procurement Cap</div>
                <div className="font-mono text-sm font-semibold text-[var(--text-main)]">
                  €4,450,000.00
                </div>
              </div>
              <span className="rounded-full bg-[#bef529] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase text-[#151f00]">
                DYNAMIC AUCTION ACTIVE
              </span>
            </div>
          </div>

          {activeTab === 'rfq' ? (
            /* RFQ View */
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Vendor 1: Nippon Precision */}
                <div className="relative flex flex-col justify-between space-y-4 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md border border-[#bef529]/60">
                  <div className="absolute -top-3 right-4 rounded-full bg-[#bef529] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#151f00] shadow-sm">
                    RECOMMENDED WINNER
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-[var(--text-main)]">
                          Nippon Precision Metals
                        </h3>
                        <div className="font-sans text-xs text-[var(--text-muted)]">
                          Tokyo • Verified Tier-1 Partner
                        </div>
                      </div>
                      <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 font-mono text-base font-bold text-[var(--text-main)]">
                        98.4
                      </div>
                    </div>

                    {/* Cost breakdown */}
                    <div className="space-y-1.5 py-2 font-sans text-xs">
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Base FOB Price:</span>
                        <span className="font-mono text-[#1a1c1a]">€168.00 / unit</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Maritime Tariff (HS 8108.90):</span>
                        <span className="font-mono text-[#1a1c1a]">+€4.20</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Inland Rail &amp; Carbon Offset:</span>
                        <span className="font-mono text-[#1a1c1a]">+€2.30</span>
                      </div>
                      <div className="flex justify-between pt-2 font-semibold text-[var(--text-main)]">
                        <span>Calculated Landed Cost:</span>
                        <span className="font-mono text-sm font-bold text-[var(--text-main)]">€174.50</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                      <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                        14-Day Lead
                      </span>
                      <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                        99.2% OTIF
                      </span>
                      <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                        ISO 9001:2015
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAwardedVendor('Nippon Precision Metals')}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#12372a] py-2.5 font-sans text-xs font-semibold text-white transition-colors hover:bg-[#002116]"
                  >
                    <Verified className="h-4 w-4" />
                    <span>
                      {awardedVendor === 'Nippon Precision Metals'
                        ? 'Contract Awarded & Locked'
                        : 'Award Algorithmic Contract'}
                    </span>
                  </button>
                </div>

                {/* Vendor 2: Rheinland Industrietechnik */}
                <div className="flex flex-col justify-between space-y-4 rounded-xl bg-white p-5 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-[var(--text-main)]">
                          Rheinland Industrietechnik
                        </h3>
                        <div className="font-sans text-xs text-[var(--text-muted)]">
                          Duisburg • Domestic Hub Rail
                        </div>
                      </div>
                      <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 font-mono text-base font-bold text-[var(--text-main)]">
                        94.1
                      </div>
                    </div>

                    <div className="space-y-1.5 py-2 font-sans text-xs">
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Base FOB Price:</span>
                        <span className="font-mono text-[#1a1c1a]">€172.50 / unit</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>EU Intra-Trade Tariff:</span>
                        <span className="font-mono text-[#1a1c1a]">€0.00</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Direct EV Freight Drayage:</span>
                        <span className="font-mono text-[#1a1c1a]">+€3.10</span>
                      </div>
                      <div className="flex justify-between pt-2 font-semibold text-[var(--text-main)]">
                        <span>Calculated Landed Cost:</span>
                        <span className="font-mono text-sm font-bold text-[var(--text-main)]">€175.60</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                      <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                        8-Day Ultra-Fast
                      </span>
                      <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                        97.8% OTIF
                      </span>
                      <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                        Zero Tariff Risk
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAwardedVendor('Rheinland Industrietechnik')}
                    className="w-full cursor-pointer rounded-lg bg-[var(--bg-tertiary)] py-2.5 font-sans text-xs font-semibold text-[var(--text-main)] transition-colors hover:bg-[#dbdad7]"
                  >
                    Request Expedited Lot
                  </button>
                </div>

                {/* Vendor 3: Scandia Advanced Alloys */}
                <div className="flex flex-col justify-between space-y-4 rounded-xl bg-white p-5 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-[var(--text-main)]">
                          Scandia Advanced Alloys
                        </h3>
                        <div className="font-sans text-xs text-[var(--text-muted)]">
                          Gothenburg • Maritime Smelter
                        </div>
                      </div>
                      <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 font-mono text-base font-bold text-[var(--text-main)]">
                        89.2
                      </div>
                    </div>

                    <div className="space-y-1.5 py-2 font-sans text-xs">
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Base FOB Price:</span>
                        <span className="font-mono text-[#1a1c1a]">€164.20 / unit</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Maritime Feeder + Port Fee:</span>
                        <span className="font-mono text-[#1a1c1a]">+€8.90</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>CBAM Carbon Intensity Tax:</span>
                        <span className="font-mono text-[#ba1a1a]">+€4.80</span>
                      </div>
                      <div className="flex justify-between pt-2 font-semibold text-[var(--text-main)]">
                        <span>Calculated Landed Cost:</span>
                        <span className="font-mono text-sm font-bold text-[var(--text-main)]">€177.90</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                      <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)]">
                        22-Day Lead
                      </span>
                      <span className="rounded bg-[#ffdad6] px-2 py-0.5 font-medium text-[#93000a]">
                        CBAM Penalty High
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-lg bg-[var(--bg-tertiary)] py-2.5 font-sans text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[#dbdad7]"
                  >
                    Review CBAM Details
                  </button>
                </div>
              </div>

              {/* Terminal Output Bar */}
              <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-[#002116] p-4 text-white md:flex-row">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#bef529]" />
                  <div>
                    <div className="font-mono text-[10px] font-semibold text-[#bef529]">
                      DETERMINISTIC RECOMMENDATION READY
                    </div>
                    <div className="font-sans text-xs font-semibold text-white">
                      {awardedVendor
                        ? `Contract awarded to ${awardedVendor}. Peppol 850 PO dispatched.`
                        : 'Allocate 80% to Nippon Precision • 20% Buffer to Rheinland Industrietechnik'}
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center gap-2 md:w-auto">
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg bg-white px-4 py-2 font-sans text-xs font-semibold text-[var(--text-main)] transition-colors hover:bg-[var(--bg-tertiary)]"
                  >
                    Download Full Cost Ledger
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwardedVendor('Nippon Precision Metals')}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#bef529] px-5 py-2 font-sans text-xs font-bold text-[#151f00] transition-colors hover:bg-[#a4d700]"
                  >
                    <span>Execute Peppol 850 PO</span>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 3-Way Match View */
            <div className="space-y-4 rounded-xl bg-[#002116] p-6 text-white font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#12372a] pb-3 text-[#bef529]">
                <span>AUTOMATED 3-WAY MATCH KERNEL (0.18s MATCH SPEED)</span>
                <span>STATUS: MATCH_PASSED_100%</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-[#12372a] p-4 space-y-2">
                  <div className="text-[#bef529] font-bold">1. PURCHASE ORDER (PO-88190)</div>
                  <div>SKU: FAST-TIT-GR5</div>
                  <div>QTY: 25,000 Rods</div>
                  <div>RATE: €168.00 / unit</div>
                  <div className="text-[#7ba190]">HASH: 0x889f...b21</div>
                </div>
                <div className="rounded-lg bg-[#12372a] p-4 space-y-2">
                  <div className="text-[#bef529] font-bold">2. ADVANCED SHIP NOTICE (ASN-99120)</div>
                  <div>DOCK: DE-STU-01 Bay 4</div>
                  <div>SCAN: RFID Container #PL-9021</div>
                  <div>COUNT: 25,000 Verified</div>
                  <div className="text-[#7ba190]">SCANNER: Zebra TC57 #881</div>
                </div>
                <div className="rounded-lg bg-[#12372a] p-4 space-y-2">
                  <div className="text-[#bef529] font-bold">3. PEPPOL E-INVOICE (INV-2025-091)</div>
                  <div>AMOUNT: €4,362,500.00</div>
                  <div>TAX: 19% EU VAT (€828,875)</div>
                  <div>PAYMENT: Net 30 Dynamic</div>
                  <div className="text-[#7ba190]">COMMITTED TO AP LEDGER</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Four Pillars of Deterministic Supply Chain Architecture ---------- */

function BentoGridPillars() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="mx-auto max-w-3xl space-y-2 text-center">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
            FOUR ARCHITECTURAL PILLARS
          </div>
          <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
            Engineered for absolute procurement integrity.
          </h2>
          <p className="font-sans text-base text-[var(--text-muted)]">
            Conventional ERP modules rely on batch cron-jobs and loose relational tables. Scryme uses an immutable state engine that pairs supply chain events with balance sheet adjustments instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pillar 01 */}
          <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl group">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-main)]">
                <Package className="h-7 w-7" />
              </div>
              <div className="font-mono text-[10px] font-semibold text-[#4d6700] dark:text-[#d2ff3a]">
                PILLAR 01 // AUTONOMOUS INVENTORY COUPLING
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                Dynamic Economic Order Quantity (EOQ) &amp; Predictive Re-ordering
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                Scryme fuses real-time multi-warehouse telemetry, bill-of-materials eBOM scrap variances, and global transit canal congestion to trigger purchase orders weeks prior to threshold breaches—mitigating stockouts without bloated holding costs.
              </p>
            </div>
            <div className="-mx-6 -mb-6 mt-6 rounded-b-2xl bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-main)]">
                <span>ALGORITHM: POISSON SAFETY BUFFER</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">ZERO OUT-OF-STOCK INCIDENTS</span>
              </div>
            </div>
          </div>

          {/* Pillar 02 */}
          <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl group">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-main)]">
                <CreditCard className="h-7 w-7" />
              </div>
              <div className="font-mono text-[10px] font-semibold text-[#4d6700] dark:text-[#d2ff3a]">
                PILLAR 02 // REAL-TIME BALANCE HARMONY
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                Total Landed Cost &amp; Sovereign Customs Harmonization
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                Eliminate surprise downstream freight reconciliations. Calculate real-time HS customs classifications, dynamic free trade agreement exemptions (USMCA, EU-Japan EPA), and live bunker fuel surcharges down to the individual serial lot.
              </p>
            </div>
            <div className="-mx-6 -mb-6 mt-6 rounded-b-2xl bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-main)]">
                <span>HS CODE ACCURACY: 99.94%</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">DUAL-CURRENCY AUDIT TRAIL</span>
              </div>
            </div>
          </div>

          {/* Pillar 03 */}
          <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl group">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-main)]">
                <Globe className="h-7 w-7" />
              </div>
              <div className="font-mono text-[10px] font-semibold text-[#4d6700] dark:text-[#d2ff3a]">
                PILLAR 03 // VENDOR TELEMETRY RADAR
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                Comprehensive SRM &amp; Multi-Tier Geopolitical Risk
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                Gain visibility into Tier-2 and Tier-3 sub-tier suppliers. Continually monitor credit ratings, ESG compliance flags, port labor disputes, and extreme weather corridors to automatically invoke pre-negotiated dual-source contingencies.
              </p>
            </div>
            <div className="-mx-6 -mb-6 mt-6 rounded-b-2xl bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-main)]">
                <span>EARLY WARNING HORIZON: 18 DAYS</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">AUTOMATED CONTINGENCY REROUTE</span>
              </div>
            </div>
          </div>

          {/* Pillar 04 */}
          <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl group">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-main)]">
                <Receipt className="h-7 w-7" />
              </div>
              <div className="font-mono text-[10px] font-semibold text-[#4d6700] dark:text-[#d2ff3a]">
                PILLAR 04 // ZERO-TOUCH SETTLEMENTS
              </div>
              <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                Touchless 3-Way Match &amp; AP Settlement Engine
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                Direct cryptographic verification matches line items from Purchase Orders, dockside RFID Advanced Shipping Notices (ASNs), and electronic vendor invoices with zero human intervention. Clean orders post directly to Accounts Payable in sub-second time.
              </p>
            </div>
            <div className="-mx-6 -mb-6 mt-6 rounded-b-2xl bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-main)]">
                <span>TOUCHLESS AP VOLUME: 92.4%</span>
                <span className="font-bold text-[#4d6700] dark:text-[#d2ff3a]">0.18s MATCH-TO-POST SPEED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. Data Interchange & Protocols ---------- */

function ProtocolGrid() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-secondary)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-2">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#4d6700] dark:text-[#d2ff3a]">
              DATA INTERCHANGE &amp; PROTOCOLS
            </div>
            <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
              Native B2B Ingestion: Zero Middleware Mandate
            </h2>
            <p className="font-sans text-sm text-[var(--text-muted)]">
              Connect directly with enterprise supply chains without costly third-party transformation hubs. Scryme processes raw ANSI X12, EDIFACT, Peppol, and satellite logistics telemetry natively.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold text-[var(--text-main)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#bef529]" />
            <span>100% NATIVE RFC COMPLIANT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <RefreshCw className="h-8 w-8 text-[var(--text-main)]" />
              <h3 className="font-sans text-xs font-semibold text-[var(--text-main)]">
                EDI X12 &amp; EDIFACT
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Full lifecycle transactional support for 850 (PO), 855 (Ack), 856 (Ship Notice), and 810 (Invoice) with deterministic validation.
              </p>
            </div>
            <div className="-mx-5 -mb-5 flex justify-between rounded-b-xl bg-[var(--bg-secondary)] p-2.5 font-mono text-[10px] text-[var(--text-main)]">
              <span>Latency</span>
              <span className="font-bold">4.2ms Parse</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <ShieldCheck className="h-8 w-8 text-[var(--text-main)]" />
              <h3 className="font-sans text-xs font-semibold text-[var(--text-main)]">
                Peppol BIS Billing 3.0
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Accredited European and Asia-Pacific e-invoicing access point for sovereign tax mandate compliance across 34 countries.
              </p>
            </div>
            <div className="-mx-5 -mb-5 flex justify-between rounded-b-xl bg-[var(--bg-secondary)] p-2.5 font-mono text-[10px] text-[var(--text-main)]">
              <span>Network</span>
              <span className="font-bold">Direct Node Link</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <ShoppingBag className="h-8 w-8 text-[var(--text-main)]" />
              <h3 className="font-sans text-xs font-semibold text-[var(--text-main)]">
                cXML &amp; OCI PunchOut
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Seamlessly link external vendor catalogs into Scryme's internal requisitions engine, enforcing contractual negotiated discounts.
              </p>
            </div>
            <div className="-mx-5 -mb-5 flex justify-between rounded-b-xl bg-[var(--bg-secondary)] p-2.5 font-mono text-[10px] text-[var(--text-main)]">
              <span>Catalog Sync</span>
              <span className="font-bold">Instant Real-Time</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <Ship className="h-8 w-8 text-[var(--text-main)]" />
              <h3 className="font-sans text-xs font-semibold text-[var(--text-main)]">
                AIS Maritime Tracking
              </h3>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Direct telemetry feeds tracking Maersk, MSC, and Hapag-Lloyd container shipments via satellite AIS geofencing to anticipate delay penalties.
              </p>
            </div>
            <div className="-mx-5 -mb-5 flex justify-between rounded-b-xl bg-[var(--bg-secondary)] p-2.5 font-mono text-[10px] text-[var(--text-main)]">
              <span>Telemetry</span>
              <span className="font-bold">Live GPS Updates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Enterprise Case Study Spotlight ---------- */

function CaseStudySpotlight() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#12372a] p-8 text-white shadow-xl md:p-12">
        <div className="relative z-10 grid grid-cols-1 gap-8 items-center lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 text-[#bef529]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
                CUSTOMER VERIFICATION CASE // INDUSTRIAL MANUFACTURING
              </span>
            </div>
            <h2 className="font-serif text-3xl font-normal leading-tight text-white sm:text-4xl">
              How Värmland Industrial Consortium consolidated 420 suppliers and cut €18.6M in supply chain leakage.
            </h2>
            <blockquote className="font-serif text-lg font-normal italic leading-relaxed text-[#e9e8e5]">
              “Scryme turned our procurement division into a deterministic profit driver. We replaced six disparate middleware orchestrators with one single kernel. Our AP team now reviews exceptions, while 92% of orders flow autonomously from PO to balance sheet.”
            </blockquote>
            <div className="flex items-center gap-3 pt-2">
              <div
                className="h-12 w-12 rounded-full bg-[var(--bg-tertiary)] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC8KgZa3C_SeXzWv16P5iDLINYhfsD0a3m7azXzYHwKquaRomUJeAL7FmlDFhhrzNDMeJm3AOEcCbEWucu-_MNtkZbrMgI1NvFUnhzSX2Z7MuN_161NmbEg4vvQwVPK2nHuW3uUkqZ1e0RAtjjA3ie9swfVRYD6WlqcUHpwOxzmLEJ3wOpKvY3WWSAa2g5y8RZ_K6FdEpnyJIXt3hGbhnIb_hxG0ne_KTADSQ0drg')",
                }}
              />
              <div>
                <div className="font-sans text-sm font-bold text-white">Henrik Lindholm</div>
                <div className="font-sans text-xs text-[#e9e8e5]">
                  Chief Procurement Officer, Värmland Heavy Industries
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="space-y-1 rounded-2xl bg-white/10 p-5 backdrop-blur-md">
              <div className="font-mono text-3xl font-semibold text-[#bef529] sm:text-4xl">
                -82%
              </div>
              <div className="font-sans text-xs font-semibold text-white">
                Touchless PO Processing Time
              </div>
              <div className="font-sans text-xs text-[#e9e8e5]">
                From an average of 4.2 days down to sub-10 minutes approval loops.
              </div>
            </div>

            <div className="space-y-1 rounded-2xl bg-white/10 p-5 backdrop-blur-md">
              <div className="font-mono text-3xl font-semibold text-[#bef529] sm:text-4xl">
                €18.6M
              </div>
              <div className="font-sans text-xs font-semibold text-white">
                Recovered Contract Leakage
              </div>
              <div className="font-sans text-xs text-[#e9e8e5]">
                Captured via automatic clawbacks on vendor unfulfilled SLAs and rogue off-contract spend.
              </div>
            </div>

            <div className="space-y-1 rounded-2xl bg-white/10 p-5 backdrop-blur-md">
              <div className="font-mono text-3xl font-semibold text-[#bef529] sm:text-4xl">
                100%
              </div>
              <div className="font-sans text-xs font-semibold text-white">
                Cross-Border Customs Tax Compliance
              </div>
              <div className="font-sans text-xs text-[#e9e8e5]">
                Zero border impound delays across 34 active trade corridors.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. Technical Architecture FAQ ---------- */

const FAQS = [
  {
    q: 'How does Scryme prevent ghost purchase orders and rogue employee spend?',
    a: 'Scryme enforces cryptographically signed purchase requisitions. Every line item is validated in real-time against pre-approved master supplier contracts, budget allocation envelopes in the general ledger, and department-level spend allowances before a legally binding PO can be committed to the network.',
  },
  {
    q: 'Can Scryme ingest legacy EDI formats without expensive middleware like Boomi or MuleSoft?',
    a: 'Yes. Scryme includes built-in EDI X12, EDIFACT, and Peppol AS2/AS4 protocol handlers. It parses raw interchange envelopes directly in memory, maps schema variations dynamically, and normalizes them into structured JSON-LD events without requiring intermediate ETL pipelines.',
  },
  {
    q: 'How is true landed cost computed when ocean freight demurrage and fuel surcharges arrive weeks late?',
    a: 'Scryme utilizes an algorithmic Landed Cost Accrual Ledger. When inventory arrives at your dock, it is received with a provisional valuation calculated using live container carrier rate cards. When late demurrage or ancillary carrier bills arrive, Scryme automatically adjusts the COGS balance retrospectively without breaking ledger invariants.',
  },
  {
    q: 'Does Scryme synchronize with external general ledgers like SAP S/4HANA or Oracle ERP Cloud?',
    a: 'Scryme functions either as your comprehensive standalone ERP OS or as an autonomous execution engine paired with SAP or Oracle. The platform emits bidirectional event streams via Apache Kafka and webhooks, replicating purchase commitments, 3-way matches, and vendor vouchers seamlessly.',
  },
]

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-secondary)] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
            ENGINEERING SPECIFICATIONS
          </div>
          <h2 className="font-serif text-3xl font-normal text-[var(--text-main)] sm:text-4xl">
            Technical Architecture FAQ
          </h2>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Engineered for Chief Procurement Officers and Enterprise Architecture teams requiring sub-second determinism.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.q} className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between text-left font-sans text-sm font-semibold text-[var(--text-main)]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-[var(--text-main)] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="pt-2 font-sans text-sm leading-relaxed text-[var(--text-muted)]">
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

/* ---------- 8. Executive Call to Action Banner ---------- */

function ExecutiveCtaBanner() {
  return (
    <section data-scroll-reveal="fade-in" className="w-full bg-[var(--bg-main)] py-16 px-4 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 rounded-3xl bg-[#002116] p-8 text-white shadow-2xl md:flex-row md:p-12">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[#bef529]">
            <span className="h-2 w-2 rounded-full bg-[#bef529]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
              14-DAY PRODUCTION PROVING PERIOD
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal leading-tight text-white sm:text-4xl">
            Deploy Scryme Autonomous Procurement across your global network.
          </h2>
          <p className="font-sans text-base leading-relaxed text-[#e9e8e5]">
            Plug your active EDI feeds into our isolated staging sandbox and witness zero-touch 3-way matching and landed cost reconciliation on your actual purchase records.
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row md:w-auto">
          <Link
            to="/pricing"
            className="rounded-xl bg-[#bef529] px-6 py-3.5 text-center font-sans text-xs font-semibold text-[#151f00] shadow-lg transition-all hover:bg-[#a4d700]"
          >
            Book Architecture Session
          </Link>
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="rounded-xl bg-white/10 px-6 py-3.5 text-center font-sans text-xs font-semibold text-white transition-all hover:bg-white/20"
          >
            Explore Staging Sandbox
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Component Page ---------- */

function ProcurementSupplyChainComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#bef529] selection:text-[#151f00] transition-colors">
      <Header />
      <main className="w-full pt-20">
        <LiveTelemetryTicker />
        <Hero />
        <SimulatorCockpit />
        <BentoGridPillars />
        <ProtocolGrid />
        <CaseStudySpotlight />
        <FaqSection />
        <ExecutiveCtaBanner />
      </main>
      <Footer />
    </div>
  )
}