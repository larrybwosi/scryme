import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowRight,
  Activity,
  MessageSquare,
  Database,
  LifeBuoy,
  FileCheck2,
  Check,
  ShieldCheck,
  Users,
  LineChart,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react'

export const Route = createFileRoute('/crm')({
  component: CrmPageComponent,
})

/* ---------- small shared pieces ---------- */

const Mono = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono text-[10px] uppercase tracking-wide ${className}`}>{children}</span>
)

const Pill = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-[#d2ff3a]/30 bg-[#d2ff3a]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-[#4d6700] dark:text-[#d2ff3a] ${className}`}
  >
    {children}
  </span>
)

const Dot = ({ color = '#d2ff3a' }: { color?: string }) => (
  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
)

/* ---------- hero ---------- */

function Hero() {
  return (
    <section className="relative px-4 pb-12 pt-8 md:px-8 border-b border-[var(--border-subtle)]">
      <div className="mx-auto max-w-7xl">
        <Mono className="text-[var(--text-muted)]">KERNEL_CORE / ORCHESTRATION / PILLAR_03_CRM_GRAPH</Mono>

        <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <Pill>
              <Dot /> CORE PILLAR 03 • 360° RELATIONSHIP CRM &amp; CUSTOMER GRAPH
            </Pill>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-normal leading-[1.08] tracking-tight sm:text-5xl md:text-6xl text-[var(--text-main)]">
              Turn fragmented customer signals into <em className="italic text-[#4d6700] dark:text-[#d2ff3a]">unified account intelligence.</em>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              Every client communication, multi-warehouse fulfillment state, purchase order, invoice ledger, and
              support ticket unified into a real-time reactive customer graph with sub-minute churn prediction.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl glass-panel p-5">
              <div className="flex items-center justify-between">
                <Mono className="text-[var(--text-muted)]">GRAPH STATE</Mono>
                <span className="rounded bg-[#d2ff3a]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-[#4d6700] dark:text-[#d2ff3a]">
                  SYNCHRONIZED
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-[var(--text-main)]">
                  1.4ms
                </span>
                <span className="text-xs text-[var(--text-muted)]">cross-node signal propagation</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://app.scryme.tech/signup?plan=growth&billing=annual&trial=true"
                className="flex h-14 items-center justify-center rounded-xl text-center text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition shadow-sm"
              >
                Start Free Trial
              </a>
              <Link
                to="/pricing"
                className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[var(--border-prominent)] text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <Dot color="#10b981" /> View Plans
              </Link>
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
    { icon: MessageSquare, t: 'Slack Connect Sync', d: 'VP Procurement requested +2,400 reserve units...', ago: '14s ago' },
    { icon: Database, t: 'ERP Ledger Settled', d: 'Direct ledger auto-reconciliation: $340,200 cleared', ago: '2s ago' },
    { icon: LifeBuoy, t: 'Support Escalation Mitigated', d: 'Auto-mitigated routing variance: Frankfurt logistics', ago: '3m ago' },
    { icon: FileCheck2, t: 'Contract Margin Verified', d: 'Margin guard approved 28.4% gross margin threshold', ago: '3m ago' },
  ]
  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--border-subtle)] py-3">
        <div className="flex items-center gap-3">
          <Dot color="#10b981" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-main)]">
            Reactive Account Graph Telemetry
          </span>
          <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[9px] text-[var(--text-muted)]">
            LUMINA_TENANT_ID: 84092-A
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Mono className="text-[var(--text-muted)]">STREAMING LIVE (12.4K EPS)</Mono>
          <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 py-1 text-[10px] text-[#4d6700] dark:text-[#d2ff3a] font-mono">
            Topology Active
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Entity identity */}
        <div className="rounded-3xl glass-panel p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Mono className="text-[var(--text-muted)]">ENTITY IDENTITY</Mono>
              <h3 className="mt-1 font-serif text-2xl font-bold text-[var(--text-main)]">
                Lumina Global Corp
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Global Enterprise • Tier-1 High Velocity</p>
            </div>
            <span className="rounded-2xl px-3 py-1.5 text-center font-mono text-[10px] font-bold leading-tight bg-[#d2ff3a] text-[#090a0b]">
              HEALTH
              <br />
              96/100
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              ['Annual Recurring', '$1,428,000', ''],
              ['Churn Probability', '1.2%', ' (-0.8%)'],
              ['Open Ledgers', '4 Invoices', ''],
              ['SLA Commitment', '99.995%', ''],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                <div className="text-[10px] text-[var(--text-muted)] font-mono">{k}</div>
                <div className="mt-1 text-sm font-bold text-[var(--text-main)]">
                  {v}
                  <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">{s}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
              <span>Algorithmic Stakeholder Sentiment</span>
              <span className="font-mono font-bold text-[#4d6700] dark:text-[#d2ff3a]">94% Positive</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <div className="h-full w-[94%] bg-[#d2ff3a]" />
            </div>
          </div>
          <div className="flex justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
            <span>Warehouse Inventory Allocation Health</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Nominal (Optimal)</span>
          </div>
          <div className="flex justify-between border-t border-[var(--border-subtle)] pt-3">
            <Mono className="text-[var(--text-muted)]">PRIMARY LEAD: ELEANOR V.</Mono>
            <span className="rounded bg-[#d2ff3a]/10 px-2 py-0.5 font-mono text-[9px] font-bold text-[#4d6700] dark:text-[#d2ff3a]">QBR SCHEDULED</span>
          </div>
        </div>

        {/* Event feed */}
        <div className="rounded-3xl glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Mono className="text-[var(--text-muted)]">OMNICHANNEL EVENT FEED</Mono>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-[#10b981]">
              <Dot color="#10b981" /> LIVE INGEST
            </span>
          </div>
          <ul className="space-y-2.5">
            {events.map(({ icon: Icon, t, d, ago }) => (
              <li key={t} className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d2ff3a]/10 text-[#4d6700] dark:text-[#d2ff3a]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-xs font-bold text-[var(--text-main)]">
                      {t}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-[var(--text-muted)]">{ago}</span>
                  </div>
                  <p className="truncate text-[11px] text-[var(--text-muted)] mt-0.5">{d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
            <span>DISPATCH COUNT: 1,482</span>
            <span className="font-mono text-[#4d6700] dark:text-[#d2ff3a]">Full Audit Live</span>
          </div>
        </div>

        {/* Topology */}
        <div className="rounded-3xl glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Mono className="text-[var(--text-muted)]">STAKEHOLDER TOPOLOGY</Mono>
            <Mono className="text-[#4d6700] dark:text-[#d2ff3a]">DIRECTED GRAPH</Mono>
          </div>
          <svg viewBox="0 0 300 220" className="w-full my-auto text-[var(--text-main)]">
            <g stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" fill="none">
              <path d="M150 112 L70 40" />
              <path d="M150 112 L230 40" />
              <path d="M150 112 L70 185" />
              <path d="M150 112 L230 185" />
            </g>
            {[
              [70, 40, 'CFO Office', 'Budget Signer'],
              [230, 40, 'WH-1 Node', 'Fulfillment'],
              [70, 185, 'VP Procurement', 'Commercial Intent'],
              [230, 185, 'ERP Core Bus', 'Ledger Origin'],
            ].map(([x, y, a, b]) => (
              <g key={a as string}>
                <circle cx={x as number} cy={y as number} r="14" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.25" />
                <circle cx={x as number} cy={y as number} r="4" fill="#d2ff3a" />
                <text x={x as number} y={(y as number) + 26} textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor">
                  {a}
                </text>
                <text x={x as number} y={(y as number) + 36} textAnchor="middle" fontSize="7" fill="gray">
                  {b}
                </text>
              </g>
            ))}
            <rect x="90" y="98" width="120" height="28" rx="14" fill="var(--bg-main)" stroke="#d2ff3a" strokeWidth="1.5" />
            <circle cx="106" cy="112" r="3" fill="#d2ff3a" />
            <text x="114" y="116" fontSize="9" fontWeight="700" fill="currentColor" letterSpacing="0.05em">
              SCRYME KERNEL
            </text>
          </svg>
          <div className="flex justify-between border-t border-[var(--border-subtle)] pt-3 font-mono text-[9px] text-[var(--text-muted)]">
            <span>NODES DETECTED: 8 ACTIVE</span>
            <span className="text-emerald-600 dark:text-emerald-400">EDGE LATENCY: 8ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- architectural promise ---------- */

function PromiseSection() {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 md:px-8 lg:grid-cols-2 lg:items-center">
      <div className="relative overflow-hidden rounded-3xl glass-panel shadow-2xl">
        <span className="absolute left-4 top-4 z-10 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 font-mono text-[10px] text-[#d2ff3a] border border-[#d2ff3a]/30">
          GRAPH_INSPECTOR // V3.2
        </span>
        <img
          src="/images/img1.png"
          alt="Account executive reviewing the unified account graph"
          className="h-[420px] w-full object-cover opacity-90"
        />
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl glass-panel p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d2ff3a]/10 text-[#4d6700] dark:text-[#d2ff3a]">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-[var(--text-main)]">
                Deterministic Account Visibility
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Zero-drift synchronization active across 14 ERP nodes</div>
            </div>
          </div>
          <span className="shrink-0 rounded-full px-3 py-1 font-mono text-[9px] font-bold bg-[#d2ff3a] text-[#090a0b]">
            0-LAG COHERENCY
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <Pill>
          <Dot color="#d2ff3a" /> ARCHITECTURAL PROMISE
        </Pill>
        <h2 className="font-serif text-3xl font-normal leading-tight sm:text-4xl md:text-5xl text-[var(--text-main)]">
          Eliminate the catastrophic 48-hour sync drift of legacy CRMs.
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Conventional cloud CRMs operate in isolation, treating customer interactions as disjointed text notes and
          guessed renewal percentages. They lag days behind actual warehouse stock allocations, unresolved ERP billing
          claims, and real supply-chain friction.
        </p>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Scryme roots the 360° CRM directly into the operational ERP kernel. When an account executive opens a client
          record, they observe authoritative ground-truth: inventory reservation quotas across branches, instantaneous
          credit rating adjustments, and active logistics lead times.
        </p>
        <ul className="space-y-4 pt-2">
          {[
            ['Direct-to-Ledger Binding', 'Every contractual clause connects directly to automated billing schedulers and inventory manifests.'],
            ['Algorithmic Predictive Retention', 'Sub-minute graph signals trigger playbooks based on actual product consumption velocity, not subjective rep feedback.'],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
                <Check className="h-3 w-3" />
              </span>
              <div>
                <div className="text-sm font-bold text-[var(--text-main)]">
                  {t}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{d}</p>
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
    <div className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
      <div className="font-mono text-[9px] uppercase text-[var(--text-muted)]">{k}</div>
      <div className="mt-1 text-xs font-bold text-[var(--text-main)]">
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
    <div className="rounded-3xl glass-panel p-6 md:p-8 space-y-4">
      <div className="flex justify-between items-center">
        <Mono className="text-[var(--text-muted)]">{cap}</Mono>
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#4d6700] dark:text-[#d2ff3a] px-2 py-0.5 rounded bg-[#d2ff3a]/10 border border-[#d2ff3a]/20">
          {tag}
        </span>
      </div>
      <h3 className="font-serif text-2xl font-bold text-[var(--text-main)]">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{body}</p>
      <div className="pt-2">{children}</div>
    </div>
  )

  return (
    <section className="border-t border-[var(--border-subtle)] py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <Mono className="text-[var(--text-muted)]">OPERATIONAL CAPABILITIES</Mono>
          <h2 className="mt-2 font-serif text-3xl md:text-5xl text-[var(--text-main)]">
            Engineered for high-consequence enterprise ecosystems.
          </h2>
        </div>
        <Mono className="text-[#4d6700] dark:text-[#d2ff3a]">SPECIFICATION // SPEC-CRM-409</Mono>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card
          cap="CAPABILITY 01"
          tag="ALGORITHMIC MONITORED"
          title="Predictive Account Health & Churn Early-Alerts"
          body="Continuous sentiment analysis processes communication streams, dispatch cadence deviations, and order frequency drops. Autonomous playbooks deploy proactive mitigation sequences prior to contract renewal."
        >
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 space-y-3">
            <div className="flex justify-between font-mono text-[9px] text-[var(--text-muted)]">
              <span>DETECTION MODEL</span>
              <span className="text-[#4d6700] dark:text-[#d2ff3a]">TENSOR-HEALTH-V6</span>
            </div>
            <div className="flex gap-2">
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
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-[#10b981]">
              <ShieldCheck className="h-4 w-4" /> Margin Guardrails Enforced
            </span>
            <Mono className="text-[var(--text-muted)]">ZERO DRIFT</Mono>
          </div>
        </Card>

        <Card
          cap="CAPABILITY 03"
          tag="ATTRIBUTION"
          title="Autonomous Multichannel Attribution"
          body="Unify revenues stemming from self-serve storefronts, POS counters, and direct field sales into a singular unified account graph ledger."
        >
          <div className="flex gap-3">
            {stat('STOREFRONT ORDERS', 'Headless B2B')}
            {stat('POS TERMINALS', 'Sub-second Sync')}
          </div>
        </Card>

        <Card
          cap="CAPABILITY 04"
          tag="DATA MESH"
          title="Bi-directional ERP Data Mesh"
          body="A high-frequency event bus updates billing thresholds, dynamic credit balances, held logistics tickets, and warehouse dispatch confirmations instantaneously."
        >
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
            <span className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-main)]">
              <Dot color="#10b981" /> Event Mesh Telemetry Bus
            </span>
            <Mono className="text-emerald-600 dark:text-emerald-400">PERSISTENCE: ACID LEDGER</Mono>
          </div>
        </Card>
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
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 border-t border-[var(--border-subtle)]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map(([k, v, d]) => (
          <div key={k} className="rounded-3xl glass-panel p-6 space-y-2">
            <Mono className="text-[var(--text-muted)]">{k}</Mono>
            <div className="font-serif text-4xl md:text-5xl font-bold text-[#4d6700] dark:text-[#d2ff3a]">
              {v}
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- case study ---------- */

function CaseStudy() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
      <div className="grid grid-cols-1 gap-8 rounded-3xl glass-panel p-8 md:p-12 lg:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <Pill>ENTERPRISE CASE STUDY • LOGISTICS &amp; COMMERCE</Pill>
          <h2 className="mt-4 font-serif text-3xl md:text-5xl text-[var(--text-main)]">
            How Lumina Global retained $24M in ARR using Scryme 360° CRM.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
            By connecting customer service reps directly to factory line schedules and multi-region inventories,
            Lumina resolved supplier shortages before customers were impacted, converting potential cancellations into
            multi-year commitments.
          </p>
          <blockquote className="mt-6 border-l-2 border-[#d2ff3a] pl-4 space-y-3">
            <p className="font-serif text-lg italic leading-relaxed text-[var(--text-main)]">
              “Scryme turned our commercial account managers into operational generals. We no longer ask clients for
              time to check with warehouse supervisors; the graph answers before the client completes the sentence.”
            </p>
            <footer className="text-xs text-[var(--text-muted)]">
              <span className="font-bold text-[var(--text-main)]">Evelyn Kovač</span> — Chief Commercial Officer, Lumina Global
            </footer>
          </blockquote>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 space-y-4">
          <Mono className="text-[#4d6700] dark:text-[#d2ff3a]">DEPLOYMENT RETROSPECTIVE</Mono>
          <dl className="divide-y divide-[var(--border-subtle)] text-xs">
            {[
              ['Pre-Scryme Baseline Churn', '14.8% ARR Loss', 'text-red-500 dark:text-red-400'],
              ['Post-Scryme Implementation', '1.2% Risk Level', 'text-emerald-600 dark:text-emerald-400'],
              ['Net Preserved Revenue', '$24,100,000', 'text-[#4d6700] dark:text-[#d2ff3a]'],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between py-3">
                <dt className="text-[var(--text-muted)]">{k}</dt>
                <dd className={`font-mono font-bold ${c}`}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href="https://app.scryme.tech/signup?plan=growth&billing=annual&trial=true"
            className="flex items-center justify-between rounded-xl p-3 font-mono text-xs font-bold uppercase text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition"
          >
            <span>Start 14-Day Free CRM Trial</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------- final CTA ---------- */

function FinalCta() {
  return (
    <section className="px-4 py-20 md:px-8 max-w-7xl mx-auto text-center">
      <div className="glass-panel-elevated p-10 md:p-16 rounded-3xl relative overflow-hidden">
        <Pill className="mb-6">
          <Dot color="#d2ff3a" /> ENTERPRISE KERNEL ONBOARDING
        </Pill>
        <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl max-w-3xl mx-auto text-[var(--text-main)] mb-6">
          Ready to establish real-time customer topology across your enterprise?
        </h2>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-8">
          Deploy the Scryme CRM Graph alongside your existing data infrastructure with zero production downtime and
          guaranteed sub-second event ingestion.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://app.scryme.tech/signup?plan=growth&billing=annual&trial=true"
            className="rounded-full px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition shadow-lg"
          >
            Start 14-Day Free Trial
          </a>
          <Link
            to="/pricing"
            className="rounded-full border border-[var(--border-prominent)] px-8 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Schedule Architecture Briefing
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- page ---------- */

function CrmPageComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />
      <main className="w-full">
        <Hero />
        <PromiseSection />
        <Capabilities />
        <Metrics />
        <CaseStudy />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
