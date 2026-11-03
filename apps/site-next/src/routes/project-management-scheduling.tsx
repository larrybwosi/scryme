import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  GitFork,
  ArrowDown,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Construction,
  Cpu,
  Download,
  GanttChart,
  HardHat,
  ShieldCheck,
  Terminal,
  Users,
  Verified,
  Wallet,
} from 'lucide-react'

export const Route = createFileRoute('/project-management-scheduling')({
  component: ProjectManagementComponent,
})

/* ---------- 1. Top Live Telemetry Ticker Ribbon ---------- */

function LiveTelemetryTicker() {
  return (
    <section className="w-full border-b border-[#12372a]/10 bg-[#f4f3f0]/80 px-4 py-3 backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-[#414844]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" />
            <span className="font-semibold text-[#1a1c1a]">ACTIVE PROJECTS:</span>
            <span className="font-medium text-[#002116]">412 GLOBALLY</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-[#414844]/40">/</span>
            <span className="font-semibold text-[#1a1c1a]">RESOURCE UTILIZATION:</span>
            <span className="font-medium text-[#4d6700]">91.4% OPTIMAL</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-[#414844]/40">/</span>
            <span className="font-semibold text-[#1a1c1a]">SCHEDULE DRIFT:</span>
            <span className="font-medium text-[#002116]">±0.0% DETERMINISTIC</span>
          </div>
          <div className="hidden items-center gap-2 xl:flex">
            <span className="text-[#414844]/40">/</span>
            <span className="font-semibold text-[#1a1c1a]">LEDGER-TIED BUDGETS:</span>
            <span className="font-medium text-[#002116]">$84.2M ACTIVE COMMITTED</span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-[#414844]">
          <span className="flex items-center gap-1.5 rounded bg-[#efeeeb] px-2 py-0.5 font-medium text-[#1a1c1a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d6700]" />
            LON_NODE [0.4ms]
          </span>
          <span className="flex items-center gap-1.5 rounded bg-[#efeeeb] px-2 py-0.5 font-medium text-[#1a1c1a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d6700]" />
            ZRH_CORE [0.6ms]
          </span>
          <span className="hidden items-center gap-1.5 rounded bg-[#efeeeb] px-2 py-0.5 font-medium text-[#1a1c1a] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d6700]" />
            TYO_EDGE [1.1ms]
          </span>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Editorial Hero Section ---------- */

function Hero() {
  const scrollToCockpit = () => {
    document.getElementById('project-cockpit')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToPillars = () => {
    document.getElementById('architectural-pillars')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="mx-auto max-w-[1600px] w-full px-4 pt-14 pb-20 md:px-8">
      <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#12372a]/10 bg-[#efeeeb] px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-[#bef529]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#414844]">
              CORE PILLAR 06 • PROJECT MANAGEMENT, SCHEDULING &amp; RESOURCE ORCHESTRATION
            </span>
          </div>

          <h1 className="max-w-4xl font-serif text-4xl font-normal leading-tight tracking-tight text-[#002116] sm:text-5xl lg:text-[64px] lg:leading-[70px]">
            Synchronize capital, crews, and critical paths directly to the enterprise ledger.
          </h1>

          <p className="max-w-2xl font-sans text-base leading-relaxed text-[#414844] sm:text-lg font-normal">
            Eliminate disconnected project trackers and manual timesheet reconciliation. Scryme fuses critical-path Gantt timelines, autonomous shift scheduling, contractor milestones, and real-time ERP inventory allocations into one deterministic operating kernel.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              type="button"
              onClick={scrollToCockpit}
              className="group flex cursor-pointer items-center gap-2 rounded-lg bg-[#002116] px-6 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#12372a]"
            >
              <Terminal className="h-4.5 w-4.5 text-[#bef529] transition-transform group-hover:rotate-45" />
              <span>Launch Interactive Project Cockpit</span>
            </button>
            <button
              type="button"
              onClick={scrollToPillars}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#12372a]/10 bg-[#efeeeb] px-5 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#1a1c1a] transition-colors hover:bg-[#e9e8e5]"
            >
              <span>Explore Resource Scheduler</span>
              <ArrowDown className="h-4 w-4" />
            </button>
            <a
              href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
              className="flex items-center gap-1.5 px-4 py-3.5 font-sans text-xs font-semibold text-[#414844] transition-colors hover:text-[#002116]"
            >
              <Download className="h-4 w-4" />
              <span>Download Planning SDK v3.2</span>
            </a>
          </div>
        </div>

        {/* Key Benchmark Metrics Card */}
        <div className="mt-4 flex flex-col gap-4 lg:col-span-4 lg:mt-0">
          <div className="relative overflow-hidden rounded-xl border border-[#12372a]/10 bg-white p-6 shadow-[0_4px_24px_rgba(18,55,42,0.06)]">
            <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-[#bef529]/15 blur-2xl" />
            <div className="flex items-center justify-between border-b border-[#12372a]/10 pb-4">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#414844]">
                KERNEL PERFORMANCE INDEX
              </span>
              <span className="rounded-full bg-[#bef529] px-2 py-0.5 font-mono text-[10px] font-bold text-[#526d00]">
                VERIFIED
              </span>
            </div>
            <div className="divide-y divide-[#12372a]/10">
              <div className="flex flex-col py-4">
                <span className="font-serif text-[44px] font-normal leading-tight text-[#002116]">
                  0.00s
                </span>
                <span className="font-sans text-xs font-semibold text-[#1a1c1a]">
                  Budget Sync Latency
                </span>
                <span className="mt-0.5 font-sans text-xs text-[#414844]">
                  Sub-millisecond ledger commit per task status alteration
                </span>
              </div>
              <div className="flex flex-col py-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-[44px] font-normal leading-tight text-[#002116]">
                    99.8%
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#4d6700]">
                    ↑ +14.2% YoY
                  </span>
                </div>
                <span className="font-sans text-xs font-semibold text-[#1a1c1a]">
                  Critical Path On-Time Rate
                </span>
                <span className="mt-0.5 font-sans text-xs text-[#414844]">
                  Automated material leveling eliminates stage gating bottlenecks
                </span>
              </div>
              <div className="flex flex-col pt-4">
                <span className="font-serif text-[44px] font-normal leading-tight text-[#002116]">
                  -42%
                </span>
                <span className="font-sans text-xs font-semibold text-[#1a1c1a]">
                  Project Overhead
                </span>
                <span className="mt-0.5 font-sans text-xs text-[#414844]">
                  Reduces administrative billing overhead &amp; discrepancy reviews
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#12372a]/5 bg-[#efeeeb] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002116] text-white">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-sans text-xs font-semibold text-[#1a1c1a]">EVM Engine Linked</div>
                <div className="font-mono text-[11px] text-[#414844]">
                  ANSI/EIA-748-C Standard Certified
                </div>
              </div>
            </div>
            <Verified className="h-5 w-5 text-[#4d6700]" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Interactive Project Simulator Cockpit ---------- */

function ProjectSimulatorCockpit() {
  const [mode, setMode] = useState<'gantt' | 'shifts'>('gantt')

  return (
    <section id="project-cockpit" className="mx-auto max-w-[1600px] w-full px-4 pb-24 md:px-8">
      <div className="rounded-2xl border border-[#12372a]/10 bg-white p-6 shadow-[0_20px_48px_rgba(18,55,42,0.08),0_4px_16px_rgba(18,55,42,0.04)] lg:p-8">
        {/* Cockpit Header & Mode Switcher */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[#12372a]/10 pb-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-medium text-[#002116] sm:text-3xl">
                Interactive Project Simulator Cockpit
              </h2>
              <span className="rounded-full bg-[#bef529] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#526d00]">
                LIVE STATE v3.2
              </span>
            </div>
            <p className="mt-1 font-sans text-sm text-[#414844]">
              Multi-entity Work Breakdown Structure fused with deterministic supply chain allocation and labor ledger telemetry.
            </p>
          </div>

          <div className="flex w-full items-center rounded-xl border border-[#12372a]/10 bg-[#efeeeb] p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setMode('gantt')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all sm:flex-none ${
                mode === 'gantt'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              <GanttChart className="h-4 w-4" />
              <span>Enterprise Gantt &amp; Critical Path</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('shifts')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all sm:flex-none ${
                mode === 'shifts'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Multi-Crew Shift Allocator</span>
            </button>
          </div>
        </div>

        {/* Active Project Metadata Bar */}
        <div className="-mx-6 grid grid-cols-1 gap-4 border-b border-[#12372a]/10 bg-[#f4f3f0]/40 px-6 py-5 md:grid-cols-4 lg:-mx-8 lg:px-8">
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#414844]">
              PROJECT DESIGNATION
            </span>
            <div className="mt-0.5 truncate font-sans text-sm font-semibold text-[#002116]">
              Project Chimera // Robotics DC
            </div>
            <span className="font-mono text-xs text-[#414844]">$14.8M Capex Greenfield Build</span>
          </div>
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#414844]">
              EXECUTION INTEGRITY
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#bef529]" />
              <span className="font-sans text-xs font-semibold text-[#1a1c1a]">ON SCHEDULE</span>
            </div>
            <span className="font-mono text-xs font-medium text-[#4d6700]">P95 LATENCY: 0.4ms</span>
          </div>
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#414844]">
              BUDGET BURN &amp; EARNED VALUE
            </span>
            <div className="mt-0.5 font-sans text-xs font-semibold text-[#002116]">
              $6.2M Spent / 42.0% Committed
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#efeeeb]">
              <div className="h-full rounded-full bg-[#002116]" style={{ width: '42%' }} />
            </div>
          </div>
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#414844]">
              RESOURCE ORCHESTRATION
            </span>
            <div className="mt-0.5 font-sans text-xs font-semibold text-[#1a1c1a]">
              68 FTEs + 24 Specialized Contractors
            </div>
            <span className="font-mono text-xs text-[#414844]">Rotterdam Node Logistics Sync</span>
          </div>
        </div>

        {/* Mode 1: GANTT & CRITICAL PATH */}
        {mode === 'gantt' && (
          <div className="pt-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* Left WBS Table (5 cols) */}
              <div className="flex flex-col gap-2 xl:col-span-5">
                <div className="flex items-center justify-between rounded-lg bg-[#efeeeb] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#414844]">
                  <span>WBS Phase &amp; Task Hierarchy</span>
                  <span>ERP Material Bind</span>
                </div>

                {/* Task Row 1 */}
                <div className="flex flex-col gap-2 rounded-lg bg-[#f4f3f0] p-3 transition-colors hover:bg-[#efeeeb]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#efeeeb] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#414844]">
                        1.0
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#002116]">
                        Civil &amp; Foundation Ingest
                      </span>
                    </div>
                    <span className="rounded-full bg-[#efeeeb] px-2 py-0.5 font-mono text-[10px] font-bold text-[#414844]">
                      100% DONE
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-sans text-xs text-[#414844]">
                    <span>Crew A • J. Vogel (Lead)</span>
                    <span className="font-mono text-[11px] font-medium text-[#4d6700]">
                      PO-9102 Material Cleared
                    </span>
                  </div>
                </div>

                {/* Task Row 2 (Critical Path Active) */}
                <div className="flex flex-col gap-2 rounded-lg border-l-4 border-l-[#ba1a1a] bg-[#f4f3f0] p-3 shadow-sm transition-colors hover:bg-[#efeeeb]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#ffdad6] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#93000a]">
                        2.1
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#002116]">
                        Automated AGV Track Deployment
                      </span>
                    </div>
                    <span className="animate-pulse rounded-full bg-[#bef529] px-2 py-0.5 font-mono text-[10px] font-bold text-[#526d00]">
                      CRITICAL PATH
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-sans text-xs text-[#414844]">
                    <span>Robotics Fleet Eng • 14 Specialists</span>
                    <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-[#002116]">
                      PO-9912 Material Locked
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#efeeeb]">
                    <div className="h-full rounded-full bg-[#4d6700]" style={{ width: '68%' }} />
                  </div>
                </div>

                {/* Task Row 3 */}
                <div className="flex flex-col gap-2 rounded-lg border-l-4 border-l-[#ba1a1a] bg-[#f4f3f0] p-3 transition-colors hover:bg-[#efeeeb]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#ffdad6] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#93000a]">
                        2.2
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#002116]">
                        High-Bay Racking Sensor Bus
                      </span>
                    </div>
                    <span className="rounded-full bg-[#efeeeb] px-2 py-0.5 font-mono text-[10px] text-[#414844]">
                      PENDING DEP
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-sans text-xs text-[#414844]">
                    <span>Subcontractor: Kuka Field Integration</span>
                    <span className="font-mono text-[11px] text-[#414844]">In-Stock Rotterdam WH</span>
                  </div>
                </div>

                {/* Task Row 4 */}
                <div className="flex flex-col gap-2 rounded-lg bg-[#f4f3f0] p-3 transition-colors hover:bg-[#efeeeb]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#efeeeb] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#414844]">
                        3.0
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#002116]">
                        Firmware Mesh &amp; Sensor Calibration
                      </span>
                    </div>
                    <span className="rounded-full bg-[#efeeeb] px-2 py-0.5 font-mono text-[10px] text-[#414844]">
                      QUEUED
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-sans text-xs text-[#414844]">
                    <span>Firmware Squad Alpha • Zurich Remote</span>
                    <span className="font-mono text-[11px] text-[#414844]">Cloud Node Staged</span>
                  </div>
                </div>

                {/* Task Row 5 */}
                <div className="flex flex-col gap-2 rounded-lg bg-[#f4f3f0] p-3 transition-colors hover:bg-[#efeeeb]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#efeeeb] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#414844]">
                        4.0
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#002116]">
                        General Ledger Capitalization &amp; Handover
                      </span>
                    </div>
                    <span className="rounded-full bg-[#efeeeb] px-2 py-0.5 font-mono text-[10px] text-[#414844]">
                      FINAL GATE
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-sans text-xs text-[#414844]">
                    <span>CFO Desk • Auto Depreciation Schedule</span>
                    <span className="font-mono text-[11px] font-medium text-[#4d6700]">
                      SAP/IFRS 16 Sync
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Interactive Gantt Chart (7 cols) */}
              <div className="flex flex-col overflow-x-auto rounded-xl bg-[#f4f3f0]/50 p-4 xl:col-span-7">
                <div className="flex min-w-[540px] items-center justify-between border-b border-[#12372a]/10 pb-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#414844]">
                    CRITICAL PATH GANTT TIMELINE // SPRINT WEEKS
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-[#414844]">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-3 rounded-sm bg-[#ba1a1a]" /> Critical Path
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-3 rounded-sm bg-[#002116]" /> Baseline
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rotate-45 bg-[#bef529]" /> Milestone Gate
                    </span>
                  </div>
                </div>

                {/* Timeline Header Weeks */}
                <div className="grid min-w-[540px] grid-cols-6 border-b border-[#12372a]/10 py-2 text-center font-mono text-[11px] text-[#414844]">
                  <div>W18 (May)</div>
                  <div>W20</div>
                  <div>W22 (Jun)</div>
                  <div>W24</div>
                  <div>W26 (Jul)</div>
                  <div>W28</div>
                </div>

                {/* Timeline Bars Canvas */}
                <div className="relative flex min-w-[540px] flex-col gap-6 py-4">
                  {/* Vertical grid guide lines */}
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-6 opacity-20">
                    <div className="border-r border-dashed border-[#002116]" />
                    <div className="border-r border-dashed border-[#002116]" />
                    <div className="border-r border-dashed border-[#002116]" />
                    <div className="border-r border-dashed border-[#002116]" />
                    <div className="border-r border-dashed border-[#002116]" />
                    <div />
                  </div>

                  {/* Bar 1 */}
                  <div className="relative flex h-8 items-center">
                    <div className="flex h-6 w-1/3 items-center justify-between rounded-md bg-[#002116]/20 px-3 text-[#1a1c1a]">
                      <span className="font-mono text-[10px] font-bold">1.0 FOUNDATION</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#4d6700]" />
                    </div>
                  </div>

                  {/* Bar 2 (Critical Path - Red) */}
                  <div className="relative flex h-8 items-center">
                    <div className="relative ml-[30%] flex h-7 w-[45%] cursor-pointer items-center justify-between rounded-md bg-[#ba1a1a]/90 px-3 text-white shadow-md transition-all hover:bg-[#ba1a1a]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold">
                          2.1 AGV TRACKS (CRITICAL)
                        </span>
                        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#a4d700]" />
                      </div>
                      <span className="font-mono text-[10px]">68%</span>
                    </div>
                  </div>

                  {/* Bar 3 */}
                  <div className="relative flex h-8 items-center">
                    <div className="ml-[55%] flex h-6 w-[30%] cursor-pointer items-center justify-between rounded-md bg-[#12372a] px-3 text-white">
                      <span className="font-mono text-[10px]">2.2 SENSOR BUS</span>
                      <span className="font-mono text-[9px] text-[#bef529]">PO-LOCK</span>
                    </div>
                  </div>

                  {/* Bar 4 */}
                  <div className="relative flex h-8 items-center">
                    <div className="ml-[70%] flex h-6 w-[25%] items-center justify-between rounded-md bg-[#e3e2e0] px-3 text-[#1a1c1a]">
                      <span className="font-mono text-[10px]">3.0 FIRMWARE MESH</span>
                      <span className="font-mono text-[9px]">W25</span>
                    </div>
                  </div>

                  {/* Milestone Diamond */}
                  <div className="relative flex h-8 items-center">
                    <div className="ml-[92%] flex items-center gap-2">
                      <div className="h-4 w-4 rotate-45 bg-[#bef529] shadow-sm" />
                      <span className="font-mono text-[10px] font-bold text-[#002116]">
                        CAPITALIZE
                      </span>
                    </div>
                  </div>
                </div>

                {/* EVM Stream Sub-Panel */}
                <div className="mt-4 flex min-w-[540px] flex-col gap-2 border-t border-[#12372a]/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#414844]">
                      LEDGER EARNED VALUE MANAGEMENT (EVM) STREAM
                    </span>
                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span className="text-[#1a1c1a]">
                        <span className="font-bold text-[#002116]">CPI: 1.04</span> (Cost Efficient)
                      </span>
                      <span className="text-[#1a1c1a]">
                        <span className="font-bold text-[#4d6700]">SPI: 1.02</span> (Ahead of Schedule)
                      </span>
                    </div>
                  </div>

                  {/* SVG Inline Sparkline / S-Curve */}
                  <div className="flex h-16 w-full items-center rounded-lg bg-[#efeeeb] p-2">
                    <svg
                      className="h-full w-full text-[#002116]"
                      fill="none"
                      viewBox="0 0 500 50"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M 0 45 Q 150 40, 250 25 T 500 5"
                        opacity="0.3"
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      <path d="M 0 45 Q 140 42, 250 22" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="250" cy="22" fill="#bef529" r="4" stroke="#12372a" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-[#414844]">
                    <span>COMMITTED PO: $6.2M</span>
                    <span>EARNED VALUE: $6.45M</span>
                    <span>VARIANCE: +$250K FAVORABLE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: MULTI-CREW SHIFTS */}
        {mode === 'shifts' && (
          <div className="pt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-3 rounded-xl bg-[#f4f3f0] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-semibold text-[#002116]">
                    Crew Alpha • Robotics Engineers
                  </span>
                  <span className="rounded bg-[#bef529] px-2 py-0.5 font-mono text-[10px] font-bold text-[#526d00]">
                    100% ROSTERED
                  </span>
                </div>
                <div className="font-sans text-xs text-[#414844]">
                  14 FTEs • Certified Level 4 Autonomous Rail Foremen
                </div>
                <div className="divide-y divide-[#12372a]/10">
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Day Shift (06:00 - 14:30)</span>
                    <span className="font-mono text-[11px] font-medium text-[#002116]">
                      8 Engineers / Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Swing Shift (14:30 - 23:00)</span>
                    <span className="font-mono text-[11px] font-medium text-[#002116]">
                      6 Engineers / Staged
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Overtime Cap Guardrail</span>
                    <span className="font-mono text-[11px] font-medium text-[#4d6700]">
                      0.0h (Within CEA Rules)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl bg-[#f4f3f0] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-semibold text-[#002116]">
                    Crew Beta • High-Voltage Electricians
                  </span>
                  <span className="rounded bg-[#efeeeb] px-2 py-0.5 font-mono text-[10px] font-bold text-[#414844]">
                    92% ROSTERED
                  </span>
                </div>
                <div className="font-sans text-xs text-[#414844]">
                  18 Subcontractors (Siemens Field Guild)
                </div>
                <div className="divide-y divide-[#12372a]/10">
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Busbar Termination Sprint</span>
                    <span className="font-mono text-[11px] font-medium text-[#002116]">
                      10 Techs Assigned
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Safety Compliance Lock</span>
                    <span className="font-mono text-[11px] font-medium text-[#4d6700]">
                      OSHA 1910 Cleared
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Blended Billing Rate</span>
                    <span className="font-mono text-[11px] font-medium text-[#1a1c1a]">
                      €118.50 / hr (Locked)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl bg-[#f4f3f0] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-semibold text-[#002116]">
                    Heavy Machinery Allocation
                  </span>
                  <span className="rounded bg-[#bef529] px-2 py-0.5 font-mono text-[10px] font-bold text-[#526d00]">
                    NATIVE RESERVED
                  </span>
                </div>
                <div className="font-sans text-xs text-[#414844]">
                  Direct ERP Equipment Ledger Binding
                </div>
                <div className="divide-y divide-[#12372a]/10">
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Liebherr MK-88 Mobile Crane</span>
                    <span className="font-mono text-[11px] font-medium text-[#002116]">
                      Reserved Gate 2.1
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Scissor Lift Battery Fleet (x8)</span>
                    <span className="font-mono text-[11px] font-medium text-[#002116]">
                      Rotterdam Depot Pool
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-sans text-xs">
                    <span>Telematics Sync</span>
                    <span className="font-mono text-[11px] font-medium text-[#4d6700]">
                      CAN-Bus Live (428 hrs)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- 4. Architectural Pillars Bento Grid ---------- */

function ArchitecturalPillars() {
  return (
    <section
      id="architectural-pillars"
      className="w-full border-y border-[#12372a]/5 bg-[#f4f3f0]/60 px-4 py-20 md:px-8"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-12">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
            ARCHITECTURAL TAXONOMY
          </span>
          <h2 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
            Four Pillars of Deterministic Project Orchestration
          </h2>
          <p className="font-sans text-base text-[#414844]">
            Conventional project trackers operate as isolated silos. Scryme embeds task logic directly into the enterprise ERP ledger, accounting rules, and global supply networks.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Pillar 01 (7 Cols) */}
          <div className="group flex flex-col justify-between rounded-2xl border border-[#12372a]/10 bg-white p-8 shadow-[0_4px_24px_rgba(18,55,42,0.04)] transition-all hover:shadow-lg lg:col-span-7">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002116] font-mono text-xs font-bold text-white">
                  01
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4d6700]">
                  ANSI/EIA-748-C COMPLIANT
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#002116]">
                Direct-to-Ledger Cost &amp; EVM Engine
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[#414844]">
                Eliminate month-end reconciliation drift between project controllers and the finance desk. Every timesheet sign-off, purchase order receipt, or subcontractor progress billing writes directly to the general ledger, updating Earned Value Management (EVM) metrics in real time.
              </p>

              <div className="mt-2 grid grid-cols-3 gap-3 rounded-xl bg-[#f4f3f0] p-4">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-semibold text-[#414844]">
                    CPI PRECISION
                  </span>
                  <span className="mt-1 font-serif text-[22px] font-medium text-[#002116]">
                    1.04
                  </span>
                  <span className="font-mono text-[11px] text-[#4d6700]">Real-Time Earned</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-semibold text-[#414844]">
                    PO CAPITALIZATION
                  </span>
                  <span className="mt-1 font-serif text-[22px] font-medium text-[#002116]">
                    Automatic
                  </span>
                  <span className="font-mono text-[11px] text-[#414844]">Gate-driven split</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-semibold text-[#414844]">
                    DRIFT TOLERANCE
                  </span>
                  <span className="mt-1 font-serif text-[22px] font-medium text-[#002116]">
                    ±0.00%
                  </span>
                  <span className="font-mono text-[11px] text-[#4d6700]">Zero Month-End Lag</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6 font-sans text-xs font-semibold text-[#002116] transition-colors group-hover:text-[#4d6700]">
              <span>Explore Ledger Depreciation Integration</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Pillar 02 (5 Cols) */}
          <div className="group flex flex-col justify-between rounded-2xl border border-[#12372a]/10 bg-white p-8 shadow-[0_4px_24px_rgba(18,55,42,0.04)] transition-all hover:shadow-lg lg:col-span-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002116] font-mono text-xs font-bold text-white">
                  02
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4d6700]">
                  MONTE CARLO READY
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#002116]">
                Algorithmic Critical Path &amp; Risk Auto-Leveling
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[#414844]">
                When supplier shipments slip or port customs delay freight, Scryme autonomously re-evaluates dependency graph topology. Buffer allocation preserves contracted completion gates without manual scheduler intervention.
              </p>

              <div className="mt-2 flex items-center justify-between rounded-lg bg-[#f4f3f0] p-3 font-sans text-xs">
                <span className="flex items-center gap-2 font-medium text-[#1a1c1a]">
                  <GitFork className="h-4.5 w-4.5 text-[#4d6700]" />
                  Dynamic Buffer Preservation
                </span>
                <span className="font-mono text-[10px] font-bold text-[#002116]">
                  14.2 DAYS PRESERVED
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6 font-sans text-xs font-semibold text-[#002116] transition-colors group-hover:text-[#4d6700]">
              <span>Review Topology Solver Docs</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Pillar 03 (5 Cols) */}
          <div className="group flex flex-col justify-between rounded-2xl border border-[#12372a]/10 bg-white p-8 shadow-[0_4px_24px_rgba(18,55,42,0.04)] transition-all hover:shadow-lg lg:col-span-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002116] font-mono text-xs font-bold text-white">
                  03
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4d6700]">
                  LABOR COMPLIANCE
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#002116]">
                Multi-Crew Shift &amp; Labor Optimization
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[#414844]">
                Match specialized certifications and security clearances against project requirements. Built-in guardrails prevent union mandate violations, excessive overtime premiums, and cross-project double-booking.
              </p>

              <div className="mt-2 flex items-center justify-between rounded-lg bg-[#f4f3f0] p-3 font-sans text-xs">
                <span className="flex items-center gap-2 font-medium text-[#1a1c1a]">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#4d6700]" />
                  Biometric &amp; Geofenced Clock-In
                </span>
                <span className="font-mono text-[10px] font-bold text-[#002116]">100% AUDITABLE</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6 font-sans text-xs font-semibold text-[#002116] transition-colors group-hover:text-[#4d6700]">
              <span>Explore Workforce Rules Engine</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Pillar 04 (7 Cols) */}
          <div className="group flex flex-col justify-between rounded-2xl border border-[#12372a]/10 bg-white p-8 shadow-[0_4px_24px_rgba(18,55,42,0.04)] transition-all hover:shadow-lg lg:col-span-7">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002116] font-mono text-xs font-bold text-white">
                  04
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4d6700]">
                  ERP WAREHOUSE INTEGRATED
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#002116]">
                Native Inventory &amp; Heavy Asset Reservation
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[#414844]">
                Eliminate task stalls caused by missing components. As Gantt phases are scheduled, specialized parts, test fixtures, and high-tonnage machinery are locked down in regional warehouse inventory rings, issuing automated replenishment purchase orders before staging dates arrive.
              </p>

              <div className="mt-2 grid grid-cols-2 gap-4 rounded-xl bg-[#f4f3f0] p-4">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-semibold text-[#414844]">
                    ASSET ALLOCATION
                  </span>
                  <span className="mt-1 font-sans text-xs font-semibold text-[#002116]">
                    Multi-Warehouse Hard Lock
                  </span>
                  <span className="font-sans text-xs text-[#414844]">
                    Rotterdam • Singapore • Houston
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-semibold text-[#414844]">
                    TELEMATICS &amp; IOT
                  </span>
                  <span className="mt-1 font-sans text-xs font-semibold text-[#002116]">
                    Real-Time Utilization Feed
                  </span>
                  <span className="font-sans text-xs text-[#414844]">
                    Fuel, hours &amp; scheduled maintenance
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6 font-sans text-xs font-semibold text-[#002116] transition-colors group-hover:text-[#4d6700]">
              <span>View Multi-Node Inventory Topology</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. Tailored Sector Adaptations ---------- */

function SectorAdaptations() {
  return (
    <section className="mx-auto max-w-[1600px] w-full px-4 py-20 md:px-8">
      <div className="flex flex-col gap-12">
        <div className="flex max-w-2xl flex-col gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
            SECTOR ADAPTATION
          </span>
          <h2 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
            Precision execution tailored to operational topology
          </h2>
          <p className="font-sans text-base text-[#414844]">
            Whether capital-intensive industrial builds or fast-moving software sprints, Scryme adapts its scheduling kernel to meet regulatory and procedural mandates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Vertical 1 */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#12372a]/10 bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#efeeeb] text-[#002116]">
                <Construction className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-sm font-semibold text-[#002116]">
                Industrial Engineering &amp; Infrastructure
              </h3>
              <p className="font-sans text-xs leading-relaxed text-[#414844]">
                Designed for megaprojects, multi-stage infrastructure, and civil EPC contractors requiring rigorous compliance.
              </p>
              <ul className="flex flex-col gap-2 pt-2 font-sans text-xs text-[#1a1c1a]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Capex tracking &amp; subcontractor lien waivers
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Multi-tier procurement milestone gates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Heavy equipment CAN-bus telemetry
                </li>
              </ul>
            </div>
            <div className="mt-6 border-t border-[#12372a]/10 pt-6">
              <span className="font-mono text-[10px] uppercase text-[#414844]">
                TEMPLATE SPEC:
              </span>
              <div className="font-sans text-xs font-semibold text-[#002116]">
                EPC Megaproject Standard // Level 4
              </div>
            </div>
          </div>

          {/* Vertical 2 */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#12372a]/10 bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#efeeeb] text-[#002116]">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-sm font-semibold text-[#002116]">
                High-Tech R&amp;D &amp; Product Engineering
              </h3>
              <p className="font-sans text-xs leading-relaxed text-[#414844]">
                Integrate hardware revisions, bill-of-materials changes, and embedded firmware roadmaps into unified delivery schedules.
              </p>
              <ul className="flex flex-col gap-2 pt-2 font-sans text-xs text-[#1a1c1a]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Sprint cycles linked to engineering BOMs (eBOM)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Prototype fabrication lot batch tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Patent filing &amp; ISO 9001 audit gates
                </li>
              </ul>
            </div>
            <div className="mt-6 border-t border-[#12372a]/10 pt-6">
              <span className="font-mono text-[10px] uppercase text-[#414844]">
                TEMPLATE SPEC:
              </span>
              <div className="font-sans text-xs font-semibold text-[#002116]">
                Agile Hardware Stage-Gate v2.4
              </div>
            </div>
          </div>

          {/* Vertical 3 */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#12372a]/10 bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#efeeeb] text-[#002116]">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-sm font-semibold text-[#002116]">
                Professional Services &amp; Consultancies
              </h3>
              <p className="font-sans text-xs leading-relaxed text-[#414844]">
                Maximize margin preservation across distributed advisory practices, accounting firms, and legal counsels.
              </p>
              <ul className="flex flex-col gap-2 pt-2 font-sans text-xs text-[#1a1c1a]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Multi-currency real-time billable utilization
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Blended rate card governance &amp; margin locks
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#4d6700]" />
                  Milestone-triggered automated client invoicing
                </li>
              </ul>
            </div>
            <div className="mt-6 border-t border-[#12372a]/10 pt-6">
              <span className="font-mono text-[10px] uppercase text-[#414844]">
                TEMPLATE SPEC:
              </span>
              <div className="font-sans text-xs font-semibold text-[#002116]">
                Global PSA Architecture // Multi-Tenant
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Quantitative Proof & Case Study ---------- */

function CaseStudySection() {
  return (
    <section className="w-full border-t border-[#12372a]/5 bg-[#f4f3f0]/70 px-4 py-20 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="relative overflow-hidden rounded-3xl bg-[#002116] p-8 text-white shadow-xl lg:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#12372a]/60 blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 gap-10 items-center lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="flex items-center gap-3">
                <span className="rounded bg-[#bef529] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#151f00]">
                  CASE STUDY DISPATCH
                </span>
                <span className="font-mono text-xs text-[#7ba190]">
                  STRATA INFRASTRUCTURE GROUP
                </span>
              </div>
              <h3 className="font-serif text-3xl font-normal leading-tight text-white sm:text-4xl">
                How Strata delivered a €62M greenfield facility 6 weeks ahead of schedule.
              </h3>
              <blockquote className="border-l-2 border-[#bef529] pl-4 font-serif text-lg italic text-[#7ba190]">
                “Before Scryme, our project managers operated on weekly spreadsheets while ERP finance operated on monthly reconciliation cycles. The friction caused millions in idle equipment waiting on approvals. Scryme eliminated that divide entirely.”
              </blockquote>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efeeeb] font-mono text-base font-bold text-[#002116]">
                  HL
                </div>
                <div>
                  <div className="font-sans text-xs font-semibold text-white">Henrik Lindholm</div>
                  <div className="font-sans text-xs text-[#7ba190]">
                    VP Global Capital Projects • Strata Infrastructure
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              <div className="flex flex-col rounded-xl border border-[#a8cfbd]/20 bg-[#12372a]/80 p-5 backdrop-blur-md">
                <span className="font-serif text-[44px] font-normal leading-tight text-[#bef529]">
                  -64%
                </span>
                <span className="mt-1 font-sans text-xs font-semibold text-white">
                  Milestone Approval Lag
                </span>
                <span className="mt-0.5 font-sans text-xs text-[#7ba190]">
                  Automated ERP lien waiver verification accelerated contractor turnarounds.
                </span>
              </div>
              <div className="flex flex-col rounded-xl border border-[#a8cfbd]/20 bg-[#12372a]/80 p-5 backdrop-blur-md">
                <span className="font-serif text-[44px] font-normal leading-tight text-[#bef529]">
                  €1.8M
                </span>
                <span className="mt-1 font-sans text-xs font-semibold text-white">
                  Retained Margin
                </span>
                <span className="mt-0.5 font-sans text-xs text-[#7ba190]">
                  Preserved via deterministic labor scheduling and reduced equipment idle time.
                </span>
              </div>
              <div className="flex flex-col rounded-xl border border-[#a8cfbd]/20 bg-[#12372a]/80 p-5 backdrop-blur-md sm:col-span-2 lg:col-span-1">
                <span className="font-serif text-[44px] font-normal leading-tight text-[#bef529]">
                  100%
                </span>
                <span className="mt-1 font-sans text-xs font-semibold text-white">
                  Timesheet-to-Payroll Parity
                </span>
                <span className="mt-0.5 font-sans text-xs text-[#7ba190]">
                  Zero payroll adjustments needed across 640 site contractors.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. Technical FAQ Accordion ---------- */

const FAQS = [
  {
    q: 'How does Scryme connect project milestones directly to accounts payable and accounts receivable?',
    a: 'When a project milestone is marked complete and passes QA gates, Scryme issues cryptographically signed state updates to the AP/AR ledger engines. Contractor invoices matched against purchase orders are automatically cleared for payment, and customer milestone billing schedules generate invoice documents without manual intervention.',
  },
  {
    q: 'Can we ingest existing Primavera P6, Microsoft Project, or Jira XML/CSV files?',
    a: 'Yes. Scryme includes high-performance bidirectional connectors for Primavera P6 (XER/XML), Microsoft Project (MPP/XML), and Jira Software (JQL REST API). When imported, tasks are instantly hydrated with enterprise ERP metadata, WBS accounting codes, and resource ledger bindings.',
  },
  {
    q: 'How does the autonomous resource leveling engine resolve crew allocation conflicts across concurrent projects?',
    a: 'Scryme uses a constraint satisfaction solver that weighs project financial criticality, liquidated damage penalties, and Earned Value SPI. When key personnel or machinery are double-booked, the kernel suggests optimal shift rescheduling or cross-team transfers while guaranteeing compliance with local union mandates.',
  },
  {
    q: 'What offline capabilities exist for remote field engineers and jobsite foremen?',
    a: 'Scryme Mobile utilizes Conflict-Free Replicated Data Types (CRDTs) to allow jobsite supervisors to sign off punch lists, record equipment hours, and clock crew shifts in remote, network-denied locations. Once connectivity is restored, operations synchronize deterministically with zero conflict overrides.',
  },
]

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="mx-auto max-w-[1200px] w-full px-4 py-20 md:px-8">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
            TECHNICAL SPECIFICATIONS &amp; GOVERNANCE
          </span>
          <h2 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
            Frequently Answered Architectural Questions
          </h2>
          <p className="font-sans text-base text-[#414844]">
            In-depth technical clarifications for enterprise architects, program management offices (PMOs), and financial controllers.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-[#12372a]/10">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div key={faq.q} className="group flex flex-col gap-3 py-6">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between text-left"
                >
                  <span className="font-sans text-sm font-semibold text-[#002116] transition-colors group-hover:text-[#4d6700]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#002116] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="font-sans text-sm leading-relaxed text-[#414844]">
                    {faq.a}
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

/* ---------- 8. Executive Call to Action Banner ---------- */

function ExecutiveCtaBanner() {
  return (
    <section className="mx-auto max-w-[1600px] w-full px-4 pb-20 md:px-8">
      <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-[#12372a]/10 bg-white p-8 shadow-[0_20px_48px_rgba(18,55,42,0.06)] lg:flex-row lg:items-center lg:p-14">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700]">
            ORCHESTRATION ARCHITECTURE DISPATCH
          </span>
          <h3 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
            Deploy Scryme Unified Project Management across your enterprise.
          </h3>
          <p className="font-sans text-base text-[#414844]">
            Connect your critical path to your general ledger in under 14 days. Book an architectural deep dive with a Scryme Principal Systems Engineer.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center lg:w-auto">
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#002116] px-6 py-4 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#12372a]"
          >
            <span className="h-2 w-2 rounded-full bg-[#bef529]" />
            <span>Schedule Architecture Review</span>
          </a>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#12372a]/10 bg-[#efeeeb] px-6 py-4 font-sans text-xs font-semibold uppercase tracking-wider text-[#1a1c1a] transition-colors hover:bg-[#e9e8e5]"
          >
            <Terminal className="h-4.5 w-4.5" />
            <span>Access Staging Sandbox</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Component Page ---------- */

function ProjectManagementComponent() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#bef529] selection:text-[#151f00]">
      <Header />
      <main className="w-full pt-20">
        <LiveTelemetryTicker />
        <Hero />
        <ProjectSimulatorCockpit />
        <ArchitecturalPillars />
        <SectorAdaptations />
        <CaseStudySection />
        <FaqSection />
        <ExecutiveCtaBanner />
      </main>
      <Footer />
    </div>
  )
}