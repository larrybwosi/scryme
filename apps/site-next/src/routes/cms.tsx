import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronDown,
  Activity,
  Hash,
  MessageSquare,
  Database,
  LifeBuoy,
  FileCheck2,
  Network,
  Check,
  ShieldCheck,
  Cpu,
} from 'lucide-react'

export const Route = createFileRoute('/cms')({
  component: CrmComponent,
})

// Swap for the real photo asset in /public/images
const ACCOUNT_PHOTO = '/images/account-visibility.jpg'

const LIME = '#c8f31d'
const INK = '#0c1108'
const DEEP = '#0d2a1a'

/* ---------- small shared pieces ---------- */

const Mono = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono text-[10px] uppercase tracking-wide ${className}`}>{children}</span>
)

const Pill = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-[#d9e6a8] bg-[#eef7c9] px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-[#2c3a10] ${className}`}
  >
    {children}
  </span>
)

const Dot = ({ color = '#7ac70c' }: { color?: string }) => (
  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
)


/* ---------- hero ---------- */

function Hero() {
  return (
    <section
      className="relative"
      style={{ background: 'linear-gradient(180deg, #eaf8b4 0%, #f3f8dc 35%, #f7f8f3 100%)' }}
    >
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-8">
        <Mono className="text-[#59614d]">KERNEL_CORE / ORCHESTRATION / PILLAR_03_CRM_GRAPH</Mono>

        <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <Pill>
              <Dot /> CORE PILLAR 03 • 360° RELATIONSHIP CRM &amp; CUSTOMER GRAPH
            </Pill>
            <h1
              className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl md:text-[56px]"
              style={{ color: INK }}
            >
              Turn fragmented customer signals into <em className="italic">unified account intelligence.</em>
            </h1>
            <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-[#4a5140]">
              Every client communication, multi-warehouse fulfillment state, purchase order, invoice ledger, and
              support ticket unified into a real-time reactive customer graph with sub-minute churn prediction.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-black/10 bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <Mono className="text-[#59614d]">GRAPH STATE</Mono>
                <span className="rounded bg-[#eef7c9] px-1.5 py-0.5 font-mono text-[9px] text-[#2c3a10]">
                  SYNCHRONIZED
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl" style={{ color: INK }}>
                  1.4ms
                </span>
                <span className="text-[11px] text-[#59614d]">cross-node signal propagation</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://app.scryme.tech/signup"
                className="flex h-16 items-end rounded-md p-3 text-xs font-semibold"
                style={{ background: LIME, color: INK, border: `1px solid ${INK}` }}
              >
                Explore Live Sandbox
              </a>
              <a
                id="demo"
                href="#"
                className="flex h-16 items-end gap-2 rounded-md p-3 text-xs font-semibold text-white"
                style={{ background: INK }}
              >
                <Dot color={LIME} /> Book Demo
              </a>
            </div>
          </div>
        </div>

        <Telemetry />
      </div>
    </section>
  )
}

/* ---------- telemetry panel ---------- */

function Telemetry() {
  const events = [
    { icon: MessageSquare, t: 'Slack Connect Sync', d: 'VP Procurement requested +2,400 reserve unit...', ago: '14s ago' },
    { icon: Database, t: 'ERP Ledger Settled', d: 'NetSuite auto-reconciliation complete: $340,20...', ago: '2s ago' },
    { icon: LifeBuoy, t: 'Zendesk Ticket Resolved', d: 'Auto-mitigated routing variance: Frankfurt logis...', ago: '3m ago' },
    { icon: FileCheck2, t: 'Contract Margin Verified', d: 'Margin guard approved 28.4% gross margin thr...', ago: '3m ago' },
  ]
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-black/10 py-3">
        <div className="flex items-center gap-3">
          <Dot color="#7ac70c" />
          <span className="text-[13px] font-medium" style={{ color: INK }}>
            Reactive Account Graph Telemetry
          </span>
          <span className="rounded border border-black/10 bg-white/70 px-1.5 py-0.5 font-mono text-[9px] text-[#59614d]">
            LUMINA_TENANT_ID: 84092-A
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Mono className="text-[#59614d]">STREAMING LIVE (12.4K EPS)</Mono>
          <span className="rounded border border-black/10 bg-white px-2 py-1 text-[10px] text-[#2a2f24]">
            Export Topology
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Entity identity */}
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <Mono className="text-[#59614d]">ENTITY IDENTITY</Mono>
              <h3 className="mt-1 font-serif text-xl" style={{ color: INK }}>
                Lumina Global Corp
              </h3>
              <p className="text-[10px] text-[#59614d]">Global Enterprise • Tier-1 High Velocity</p>
            </div>
            <span className="rounded-full px-2.5 py-1 text-center font-mono text-[9px] leading-tight" style={{ background: LIME, color: INK }}>
              HEALTH
              <br />
              96/100
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ['Annual Recurring', '$1,428,000', ''],
              ['Churn Probability', '1.2%', ' (-0.8%)'],
              ['Open Ledgers', '4 Invoices', ''],
              ['SLA Commitment', '99.995%', ''],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded border border-black/10 p-2">
                <div className="text-[9px] text-[#59614d]">{k}</div>
                <div className="mt-0.5 text-sm font-semibold" style={{ color: INK }}>
                  {v}
                  <span className="text-[9px] font-normal text-[#4a8a10]">{s}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[10px] text-[#59614d]">
            <span>Algorithmic Stakeholder Sentiment</span>
            <span className="font-medium text-[#2c3a10]">94% Positive</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/10">
            <div className="h-full w-[94%]" style={{ background: INK }} />
          </div>
          <div className="mt-3 flex justify-between border-t border-black/10 pt-2 text-[9px] text-[#59614d]">
            <span>Warehouse Inventory Allocation Health</span>
            <span className="text-[#4a8a10]">Nominal (Optimal)</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-black/10 pt-2">
            <Mono className="text-[#59614d]">PRIMARY CS LEAD: ELEANOR V.</Mono>
            <span className="rounded bg-[#eef7c9] px-1.5 py-0.5 font-mono text-[9px] text-[#2c3a10]">QBR SCHEDULED</span>
          </div>
        </div>

        {/* Event feed */}
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <Mono className="text-[#59614d]">OMNICHANNEL EVENT FEED</Mono>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-[#2c3a10]">
              <Dot /> LIVE INGEST
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {events.map(({ icon: Icon, t, d, ago }) => (
              <li key={t} className="flex gap-3 rounded border border-black/10 p-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black/10 bg-[#f3f6e8]">
                  <Icon className="h-3.5 w-3.5 text-[#2c3a10]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-[11px] font-semibold" style={{ color: INK }}>
                      {t}
                    </span>
                    <span className="shrink-0 text-[9px] text-[#59614d]">{ago}</span>
                  </div>
                  <p className="truncate text-[10px] text-[#59614d]">{d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-black/10 pt-2 text-[9px] text-[#59614d]">
            <span>DISPATCH RECORD COUNT: 1,482</span>
            <a href="#" className="font-medium text-[#2a2f24]">
              View full audit trail →
            </a>
          </div>
        </div>

        {/* Topology */}
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <Mono className="text-[#59614d]">STAKEHOLDER TOPOLOGY</Mono>
            <Mono className="text-[#59614d]">DIRECTED GRAPH</Mono>
          </div>
          <svg viewBox="0 0 300 220" className="mt-2 w-full">
            <g stroke="#bfc7ad" strokeWidth="1" strokeDasharray="3 3" fill="none">
              <path d="M150 112 L70 40" />
              <path d="M150 112 L230 40" />
              <path d="M150 112 L70 185" />
              <path d="M150 112 L230 185" />
            </g>
            {[
              [70, 40, 'CFO Office', 'Budget Signer'],
              [230, 40, 'WH-1 Node', 'Fulfillment'],
              [70, 185, 'VP Procurement', 'Commercial Intent'],
              [230, 185, 'SAP/NetSuite', 'Ledger Origin'],
            ].map(([x, y, a, b]) => (
              <g key={a as string}>
                <circle cx={x as number} cy={y as number} r="13" fill="#fff" stroke="#bfc7ad" />
                <circle cx={x as number} cy={y as number} r="3.5" fill="#59614d" />
                <text x={x as number} y={(y as number) + 28} textAnchor="middle" fontSize="8" fontWeight="600" fill={INK}>
                  {a}
                </text>
                <text x={x as number} y={(y as number) + 38} textAnchor="middle" fontSize="7" fill="#59614d">
                  {b}
                </text>
              </g>
            ))}
            <rect x="110" y="100" width="80" height="24" rx="12" fill={INK} />
            <circle cx="124" cy="112" r="3" fill={LIME} />
            <text x="134" y="115" fontSize="8" fontWeight="600" fill="#fff">
              SCRYME KERNEL
            </text>
          </svg>
          <div className="mt-1 flex justify-between border-t border-black/10 pt-2 font-mono text-[9px] text-[#59614d]">
            <span>NODES DETECTED: 8 ACTIVE</span>
            <span>EDGE LATENCY: 8ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- architectural promise ---------- */

function Promise() {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 md:px-8 lg:grid-cols-2 lg:items-center">
      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-[#dfe6d0]">
        <span className="absolute left-3 top-3 z-10 rounded bg-white/90 px-2 py-1 font-mono text-[9px] text-[#2a2f24]">
          GRAPH_INSPECTOR // V3.2
        </span>
        <img src={ACCOUNT_PHOTO} alt="Account executive reviewing the unified account graph" className="h-[420px] w-full object-cover" />
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded border border-black/10">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[12px] font-semibold" style={{ color: INK }}>
                Deterministic Account Visibility
              </div>
              <div className="text-[10px] text-[#59614d]">Zero-drift synchronization active across 14 ERP nodes</div>
            </div>
          </div>
          <span className="shrink-0 rounded px-2 py-1 font-mono text-[9px]" style={{ background: LIME, color: INK }}>
            0-LAG COHERENCY
          </span>
        </div>
      </div>

      <div>
        <Pill>
          <Dot color="#59614d" /> ARCHITECTURAL PROMISE
        </Pill>
        <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl" style={{ color: INK }}>
          Eliminate the catastrophic 48-hour sync drift of legacy CRMs.
        </h2>
        <p className="mt-4 text-[13px] leading-relaxed text-[#4a5140]">
          Conventional cloud CRMs operate in isolation, treating customer interactions as disjointed text notes and
          guessed renewal percentages. They lag days behind actual warehouse stock allocations, unresolved ERP billing
          claims, and real supply-chain friction.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[#4a5140]">
          Scryme roots the 360° CRM directly into the operational ERP kernel. When an account executive opens a Lumina
          record, they observe authoritative ground-truth: inventory reservation quotas in Rotterdam, instantaneous
          credit rating adjustments, and active logistics lead times.
        </p>
        <ul className="mt-5 space-y-4">
          {[
            ['Direct-to-Ledger Binding', 'Every contractual clause connects directly to automated billing schedulers and inventory manifests.'],
            ['Algorithmic Predictive Retention', 'Sub-minute graph signals trigger playbooks based on actual product consumption velocity, not subjective rep feedback.'],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#7ac70c]">
                <Check className="h-2.5 w-2.5 text-[#4a8a10]" />
              </span>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: INK }}>
                  {t}
                </div>
                <p className="text-[11px] text-[#59614d]">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------- capabilities ---------- */

function Capabilities() {
  const stat = (k: string, v: string) => (
    <div className="flex-1 rounded border border-black/10 bg-white p-2">
      <div className="font-mono text-[8px] uppercase text-[#59614d]">{k}</div>
      <div className="mt-0.5 text-[11px] font-semibold" style={{ color: INK }}>
        {v}
      </div>
    </div>
  )
  const Card = ({
    cap,
    tag,
    title,
    body,
    children,
  }: {
    cap: string
    tag: string
    title: string
    body: string
    children: React.ReactNode
  }) => (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="flex justify-between">
        <Mono className="text-[#59614d]">{cap}</Mono>
        <Mono className="text-[#59614d]">{tag}</Mono>
      </div>
      <h3 className="mt-2 font-serif text-xl" style={{ color: INK }}>
        {title}
      </h3>
      <p className="mt-2 text-[11px] leading-relaxed text-[#59614d]">{body}</p>
      <div className="mt-4">{children}</div>
    </div>
  )

  return (
    <section className="border-t border-black/10 bg-[#f7f8f3] py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <Mono className="text-[#59614d]">OPERATIONAL CAPABILITIES</Mono>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl" style={{ color: INK }}>
              Engineered for high-consequence enterprise ecosystems.
            </h2>
          </div>
          <Mono className="hidden text-[#59614d] sm:block">SPECIFICATION // SPEC-CRM-409</Mono>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            cap="CAPABILITY 01"
            tag="ALGORITHMIC MONITORED"
            title="Predictive Account Health & Churn Early-Alerts"
            body="Continuous sentiment analysis processes communication streams, dispatch cadence deviations, and order frequency drops. Autonomous playbooks deploy proactive mitigation sequences prior to contract renewal."
          >
            <div className="rounded border border-black/10 bg-[#f7f8f3] p-2">
              <div className="flex justify-between font-mono text-[9px] text-[#59614d]">
                <span>DETECTION MODEL</span>
                <span>TENSOR-HEALTH-V6</span>
              </div>
              <div className="mt-2 flex gap-2">
                {stat('LEAD TIME', '42 Days')}
                {stat('PRECISION', '98.4%')}
                {stat('AUTONOMOUS', 'Active')}
              </div>
            </div>
          </Card>

          <Card
            cap="CAPABILITY 02"
            tag="MARGIN GUARD"
            title="Unified Quote-to-Contract Escalation"
            body="Commercial representatives negotiate with full visibility into real-time global warehouse allocations, shipping lane volatility, and minimum approved margin constraints."
          >
            <div className="flex items-center justify-between rounded border border-black/10 bg-[#f7f8f3] px-3 py-3">
              <span className="inline-flex items-center gap-2 text-[10px] text-[#2a2f24]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#4a8a10]" /> Margin Guardrails Enforced
              </span>
              <Mono className="text-[#59614d]">ZERO DRIFT</Mono>
            </div>
          </Card>

          <Card
            cap="CAPABILITY 03"
            tag="ATTRIBUTION"
            title="Autonomous Multichannel Attribution"
            body="Unify revenues stemming from self-serve storefronts, EDI enterprise pipelines, and direct field representative deals into a singular unified account graph ledger."
          >
            <div className="flex gap-2 rounded border border-black/10 bg-[#f7f8f3] p-2">
              {stat('EDI STREAMS', 'X12 & EDIFACT')}
              {stat('PORTAL ORDERS', 'B2B Headless')}
            </div>
          </Card>

          <Card
            cap="CAPABILITY 04"
            tag="DATA MESH"
            title="Bi-directional ERP Data Mesh"
            body="A high-frequency event bus updates billing thresholds, dynamic credit balances, logistics held tickets, and warehouse dispatch confirmations instantaneously between customer-facing staff and back-office controllers."
          >
            <div className="flex items-center justify-between rounded border border-black/10 bg-[#f7f8f3] px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[10px] text-[#2a2f24]">
                <Dot /> Apache Kafka / Event Mesh Bus
              </span>
              <Mono className="text-[#59614d]">PERSISTENCE: ACID LEDGER</Mono>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

/* ---------- metrics ---------- */

function Metrics() {
  const items = [
    ['Retention Efficacy', '89.4%', 'Net enterprise annual retention across high-velocity accounts with automated retention hooks.'],
    ['Resolution Velocity', '< 3 min', 'Mean time to resolve Tier-1 supply-chain and fulfillment escalations without manual hand-offs.'],
    ['Expansion Discovery', '4.2×', 'Faster identification of whitespace upsell opportunities derived from multi-node inventory flow.'],
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map(([k, v, d]) => (
          <div key={k} className="rounded-lg border border-black/10 bg-white p-5">
            <Mono className="text-[#59614d]">{k}</Mono>
            <div className="mt-2 font-serif text-4xl md:text-5xl" style={{ color: INK }}>
              {v}
            </div>
            <p className="mt-2 text-[11px] text-[#59614d]">{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- case study ---------- */

function CaseStudy() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
      <div className="grid grid-cols-1 gap-8 rounded-xl border border-black/10 bg-white p-6 md:p-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Pill>ENTERPRISE CASE STUDY • MANUFACTURING &amp; LOGISTICS</Pill>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl" style={{ color: INK }}>
            How Lumina Global retained $24M in ARR using Scryme 360° CRM.
          </h2>
          <p className="mt-4 text-[12px] leading-relaxed text-[#4a5140]">
            By connecting customer service reps directly to factory line schedules and multi-region inventories,
            Lumina resolved supplier shortages before customers were impacted, converting potential cancelations into
            multi-year commitments.
          </p>
          <blockquote className="mt-5 border-l-2 pl-4" style={{ borderColor: LIME }}>
            <p className="font-serif text-[15px] italic leading-relaxed" style={{ color: INK }}>
              “Scryme turned our commercial account managers into operational generals. We no longer ask clients for
              time to check with warehouse supervisors; the graph answers before the client completes the sentence.”
            </p>
            <footer className="mt-3 text-[11px]">
              <div className="font-semibold" style={{ color: INK }}>
                Evelyn Kovač
              </div>
              <div className="text-[#59614d]">Chief Commercial Officer, Lumina Global</div>
            </footer>
          </blockquote>
        </div>

        <div className="self-center rounded-lg border border-black/10 bg-[#f7f8f3] p-4">
          <Mono className="text-[#59614d]">DEPLOYMENT RETROSPECTIVE</Mono>
          <dl className="mt-3 divide-y divide-black/10 text-[12px]">
            {[
              ['Pre-Scryme Baseline Churn', '14.8% ARR Loss', '#c0392b'],
              ['Post-Scryme Implementation', '1.2% Risk Level', '#4a8a10'],
              ['Net Preserved Revenue', '$24,100,000', INK],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between py-2.5">
                <dt className="text-[#2a2f24]">{k}</dt>
                <dd className="font-mono font-semibold" style={{ color: c }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href="#"
            className="mt-3 flex items-center justify-between rounded px-3 py-2.5 font-mono text-[10px] font-semibold uppercase text-white"
            style={{ background: DEEP }}
          >
            <span>Full verified audit report</span>
            <span style={{ color: LIME }}>Download PDF ↓</span>
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------- explore links ---------- */

function Explore() {
  const items = [
    ['PILLAR 01', 'Sales Automation'],
    ['PILLAR 02', 'Multi-Location Inventory'],
    ['PILLAR 04', 'Headless CMS'],
    ['API LAYER', 'MCP & Event APIs'],
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
      <Mono className="text-[#59614d]">EXPLORE COMPLEMENTARY SYSTEM ARCHITECTURE</Mono>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([k, v]) => (
          <a key={v} href="#" className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-3 hover:border-black/30">
            <div>
              <div className="font-mono text-[8px] uppercase text-[#59614d]">{k}</div>
              <div className="text-[12px] font-semibold" style={{ color: INK }}>
                {v}
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#59614d]" />
          </a>
        ))}
      </div>
    </section>
  )
}

/* ---------- final CTA ---------- */

function FinalCta() {
  return (
    <section
      className="px-4 py-14 md:px-8"
      style={{ background: `linear-gradient(110deg, #08150d 0%, ${DEEP} 55%, #1c4a22 100%)` }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase" style={{ color: LIME }}>
            <Dot color={LIME} /> ENTERPRISE KERNEL ONBOARDING
          </span>
          <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
            Ready to establish real-time customer topology across your enterprise?
          </h2>
          <p className="mt-3 text-[12px] text-white/60">
            Deploy the Scryme CRM Graph alongside your existing data infrastructure with zero production downtime and
            guaranteed sub-second event ingestion.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="rounded-md px-5 py-3 text-xs font-semibold"
            style={{ background: LIME, color: INK }}
          >
            Launch Interactive Sandbox
          </a>
          <Link
            to="/pricing"
            className="rounded-md border border-white/30 px-5 py-3 text-xs font-semibold text-white hover:bg-white/10"
          >
            Schedule Architecture Briefing
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- footer ---------- */

function SiteFooter() {
  const cols: [string, string[]][] = [
    ['SOLUTIONS', ['Sales Automation', 'Multi-Location Inventory', '360° CRM Intelligence', 'Headless CMS Gateway', 'Automated Procurement']],
    ['PLATFORM', ['Core Kernel', 'Global Architecture', 'Audit Telemetry', 'Ecosystem Hub']],
    ['GOVERNANCE', ['Privacy Architecture', 'Terms of Provisioning', 'SOC2 & Sovereignty', 'Enterprise SLA (99.99%)', 'ISO/IEC 27001 Standard', 'Data Residency Matrix']],
  ]
  return (
    <footer className="bg-[#f7f8f3] px-4 pt-12 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 border-b border-black/10 pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold" style={{ color: INK }}>
              Scryme
            </span>
            <Mono className="text-[#59614d]">CORE SUITE</Mono>
          </div>
          <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-[#59614d]">
            High-fidelity enterprise operating kernel coordinating sales velocity, multi-node inventory, and
            multi-tenant telemetry with sub-millisecond precision.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded border border-black/10 bg-white px-2 py-1 font-mono text-[9px] text-[#2a2f24]">
            <Dot /> 99.99% Operational • All global regions live
          </span>
        </div>

        {cols.map(([h, links]) => (
          <div key={h}>
            <Mono className="font-semibold text-[#2a2f24]">{h}</Mono>
            <ul className="mt-3 space-y-2">
              {links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-[11px] text-[#59614d] hover:text-black">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="col-span-2 lg:col-span-1">
          <Mono className="font-semibold text-[#2a2f24]">DISPATCH</Mono>
          <p className="mt-3 text-[11px] leading-relaxed text-[#59614d]">
            Executive analysis, kernel release logs, and architectural briefs delivered weekly.
          </p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="executive@enterprise.com"
              className="min-w-0 flex-1 rounded border border-black/15 bg-white px-3 py-2 text-[11px] outline-none focus:border-black/40"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="flex h-8 w-8 items-center justify-center rounded text-white"
              style={{ background: INK }}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 py-4 font-mono text-[9px] text-[#59614d]">
        <span>© 2026 Scryme ERP AG. All rights reserved. Registered Enterprise OS.</span>
        <span>NODE_LATENCY: 12ms | TLS 1.3 / ENCRYPTED</span>
      </div>
    </footer>
  )
}

/* ---------- page ---------- */

function CrmComponent() {
  return (
    <div className="min-h-screen bg-[#f7f8f3] font-sans text-[#0c1108] selection:bg-[#c8f31d] selection:text-[#0c1108]">
      <Hero />
      <Promise />
      <Capabilities />
      <Metrics />
      <CaseStudy />
      <Explore />
      <FinalCta />
      <SiteFooter />
    </div>
  )
}