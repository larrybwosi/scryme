import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  DollarSign,
  LineChart,
  Cpu,
  RefreshCw,
  Clock,
  Zap,
  Layers,
  FileText,
  AlertTriangle
} from 'lucide-react'

export const Route = createFileRoute('/crm')({
  component: CrmComponent,
})

function CrmComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-28 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-8 backdrop-blur-md">
            <Users className="w-3.5 h-3.5" />
            <span>360° Relationship CRM • Sub-Second Operational Data Mesh</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-8">
            Turn fragmented customer signals into unified account intelligence.
          </h1>

          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            Eliminate the catastrophic 48-hour sync drift of legacy CRMs. Streamline lead attribution, contract renewals, payment history, and support tickets into one autonomous timeline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup?plan=growth&billing=annual&trial=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.4)] transition-all"
            >
              <span>Start 14-Day CRM Trial</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#capabilities"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/15 rounded-full hover:bg-white/5 transition"
            >
              <span>View Capabilities</span>
            </a>
          </div>
        </div>

        {/* Live Account Preview & Health Metrics */}
        <div className="glass-panel-elevated p-6 md:p-10 rounded-3xl max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 font-mono">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">ACCOUNT_NAME</div>
            <div className="text-xl font-bold dark:text-white light:text-[#090a0b]">Lumina Global Corp</div>
            <div className="text-xs text-emerald-400 mt-3 font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Health Score: 98/100 (Optimal)
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 font-mono">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">CONTRACTED_ARR</div>
            <div className="text-2xl font-extrabold text-[#d2ff3a]">$1,480,000</div>
            <div className="text-xs text-[var(--text-muted)] mt-3">14 Connected Active Contracts</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 font-mono">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">HERMES_RISK_GUARD</div>
            <div className="text-2xl font-extrabold text-[#10b981]">0.02%</div>
            <div className="text-xs text-[var(--text-muted)] mt-3 flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Churn Alert: Minimal Risk
            </div>
          </div>
        </div>

        {/* Metric Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8 font-mono text-center">
          <div className="glass-panel p-5 rounded-2xl border-white/10">
            <div className="text-3xl font-extrabold text-purple-400 mb-1">89.4%</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Net Account Retention</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-white/10">
            <div className="text-3xl font-extrabold text-[#10b981] mb-1">&lt;3 min</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Avg Support Resolution</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-white/10">
            <div className="text-3xl font-extrabold text-[#d2ff3a] mb-1">4.2x</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Upsell Conversion Speed</div>
          </div>
        </div>
      </section>

      {/* Sync Drift Comparison */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-b border-white/10">
        <div className="glass-panel-elevated p-8 md:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a] block mb-3">Sync Drift Solved</span>
            <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              Eliminate the catastrophic 48-hour sync drift of legacy CRMs.
            </h2>
            <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
              When sales teams use standalone CRM software, payment delays, open support tickets, and inventory shortages remain invisible. Scryme 360° CRM connects live operational feeds directly to your customer pipeline.
            </p>
            <div className="space-y-3 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Instant STK Push payment status synced to customer profile</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Live warehouse stock availability visible during contract quoting</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Hermes AI churn warning triggered on reduced order frequency</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-[#0d0e0f] border-white/10 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">// CRM_PIPELINE_SYNCHRONIZATION</span>
              <span className="text-[#d2ff3a] font-bold">12ms Telemetry</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Deal #SC-88402 (Lumina Corp)</span>
                <span className="text-emerald-400">WON ($240k)</span>
              </div>
              <div className="text-slate-400 text-[11px]">Contract auto-generated & ERP invoice dispatched.</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Account Support Health</span>
                <span className="text-purple-400">0 Open Tickets</span>
              </div>
              <div className="text-slate-400 text-[11px]">Last touchpoint: 45s ago via ScrymeChat.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="capabilities" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Operational Command</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            Engineered for high-consequence enterprise ecosystems.
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            Bridge customer relationships directly with fulfillment, billing, and inventory telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl hover:border-purple-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Predictive Account Health & Churn Early-Alerts</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Detect sudden drops in order frequency or API usage before customers request cancellation.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Unified Quote-to-Contract Escalation</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Escalate sales quotes straight to legally binding contracts with automated credit threshold checks.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-[#10b981]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Autonomous Multichannel Attribution</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Trace account touchpoints from initial ad click to physical POS store purchases.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-blue-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Bi-directional ERP Data Mesh</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Changes in Scryme CRM reflect immediately across inventory reservation and finance ledgers.
            </p>
          </div>
        </div>
      </section>

      {/* Case Study Feature */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#d2ff3a] mb-3 block">Enterprise Proof</span>
            <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              How Lumina Global retained $24M in ARR using Scryme 360° CRM
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              By consolidating 6 disconnected sales tools into Scryme's bi-directional ledger, Lumina reduced customer support resolution times from 4 hours to 12 minutes while eliminating $180k/yr in middleware costs.
            </p>
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 font-mono text-xs">
              <div>
                <div className="text-xl font-bold text-[#d2ff3a]">+41%</div>
                <div className="text-[var(--text-muted)] mt-1">Upsell Conversion</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#10b981]">12min</div>
                <div className="text-[var(--text-muted)] mt-1">Avg SLA Time</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-400">$180k</div>
                <div className="text-[var(--text-muted)] mt-1">Middleware Saved</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0e0f] border border-white/10 font-mono text-xs text-slate-300 space-y-3">
            <div className="text-purple-400 font-bold">// CRM_TIMELINE_FEED</div>
            <div className="p-3 rounded bg-white/5 border border-white/5">
              <div className="text-white font-bold">Contract Renewal Signed</div>
              <div className="text-slate-400 text-[11px]">$240,000 USD • 2 Year Commitment</div>
            </div>
            <div className="p-3 rounded bg-white/5 border border-white/5">
              <div className="text-white font-bold">Support Ticket Closed</div>
              <div className="text-slate-400 text-[11px]">Resolved via ScrymeChat Agent in 45s</div>
            </div>
            <div className="p-3 rounded bg-white/5 border border-white/5">
              <div className="text-white font-bold">M-Pesa STK Settlement Confirmed</div>
              <div className="text-slate-400 text-[11px]">Receipt #MP-9941 • Sub-second ledger sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="glass-panel-elevated p-10 md:p-16 rounded-3xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Ready to establish real-time customer topology across your enterprise?
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8 leading-relaxed">
            Deploy Scryme 360° CRM in less than 5 minutes with zero migration downtime.
          </p>
          <a
            href="https://app.scryme.tech/signup?plan=growth&billing=annual&trial=true"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition hover:shadow-[0_0_30px_rgba(210,255,58,0.5)]"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
