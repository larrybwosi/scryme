import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  Users,
  TrendingUp,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  LineChart,
  DollarSign,
  Activity,
  Layers,
  Search,
  Filter,
  UserPlus
} from 'lucide-react'

export const Route = createFileRoute('/crm')({
  component: CrmComponent,
})

function CrmComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* CRM Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-purple-500/30 glass-panel mb-6 font-mono text-xs text-purple-400">
            <Users className="w-3.5 h-3.5" />
            <span>Enterprise 360° Customer Topology Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-balance mb-6 dark:text-white light:text-[#090a0b]">
            Turn fragmented customer signals into unified account intelligence.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-3xl mx-auto mb-8 font-sans">
            Scryme 360° CRM connects live operational feeds, POS checkout streams, and automated pipeline workflows into a single high-consequence customer platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="https://app.scryme.tech/signup?plan=growth&billing=annual&trial=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-md hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.5)] transition-all"
            >
              <span>Start Free CRM Trial</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#capabilities"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/15 rounded-md hover:bg-white/5 transition"
            >
              <span>Explore Capabilities</span>
            </a>
          </div>

          {/* CRM Hero Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto font-mono text-left pt-4 border-t border-white/10">
            <div className="glass-panel p-4 rounded-md border border-white/10 text-center">
              <div className="text-3xl font-bold text-purple-400">89.4%</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Net Retention Rate</div>
            </div>
            <div className="glass-panel p-4 rounded-md border border-white/10 text-center">
              <div className="text-3xl font-bold text-[#10b981]">&lt;3 min</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">SLA Resolution Time</div>
            </div>
            <div className="glass-panel p-4 rounded-md border border-white/10 text-center">
              <div className="text-3xl font-bold text-[#d2ff3a]">42x</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Pipeline Velocity</div>
            </div>
          </div>
        </div>

        {/* Primary CRM Screenshot Showcase (screen.png) */}
        <div className="mt-8 relative z-10 max-w-6xl mx-auto glass-panel p-2 md:p-4 rounded-lg md:rounded-xl border border-white/15 shadow-2xl overflow-hidden group">
          <div className="relative rounded-md md:rounded-lg overflow-hidden border border-white/10 bg-[#0d0e0f]">
            <img
              src="/images/img1.png"
              alt="Scryme CRM Platform Overview"
              className="w-full h-auto object-cover rounded-md transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </div>
        </div>
      </section>

      {/* Embedded Screenshot Showcases Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Operational Visibility</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            End-to-End Customer Topology
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            Bridge customer touchpoints across contacts, deals, orders, and field operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-4 rounded-lg border border-white/10 space-y-4 hover:border-purple-500/40 transition">
            <div className="overflow-hidden rounded-md border border-white/10 bg-[#0d0e0f]">
              <img
                src="/images/screen8.png"
                alt="CRM Directory & Contact Insights"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-1">Contact & Account Directory</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Centralized customer profiles with purchase history, active tickets, and custom attributes.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-lg border border-white/10 space-y-4 hover:border-purple-500/40 transition">
            <div className="overflow-hidden rounded-md border border-white/10 bg-[#0d0e0f]">
              <img
                src="/images/screen1.png"
                alt="Pipeline & Revenue Analytics"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-1">Pipeline & Conversion Analytics</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Track conversion rates, velocity metrics, and pipeline stages in real time.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-lg border border-white/10 space-y-4 hover:border-purple-500/40 transition">
            <div className="overflow-hidden rounded-md border border-white/10 bg-[#0d0e0f]">
              <img
                src="/images/screen2.png"
                alt="Fulfillment & Order Linked Feeds"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-1">Fulfillment & Order Tracking</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Seamless link between deal won status, warehouse dispatch, and invoice generation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sync Drift Elimination Callout */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="glass-panel p-8 md:p-12 rounded-xl border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#d2ff3a] mb-3 block">Real-Time Data Architecture</span>
            <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              Eliminate the catastrophic 48-hour sync drift of legacy CRMs.
            </h2>
            <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
              When sales teams use standalone CRM software, payment delays, open support tickets, and inventory shortages remain invisible. Scryme 360° CRM connects live operational feeds directly to your customer pipeline.
            </p>
            <div className="space-y-3 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Instant payment status synced to customer profile</span>
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

          <div className="p-6 rounded-lg bg-[#0d0e0f] border border-white/10 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">// CRM_PIPELINE_SYNCHRONIZATION</span>
              <span className="text-[#d2ff3a] font-bold">12ms Telemetry</span>
            </div>
            <div className="p-3 rounded-md bg-white/5 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Deal #SC-88402 (Lumina Corp)</span>
                <span className="text-emerald-400">WON ($240k)</span>
              </div>
              <div className="text-slate-400 text-[11px]">Contract auto-generated & ERP invoice dispatched.</div>
            </div>
            <div className="p-3 rounded-md bg-white/5 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Account Support Health</span>
                <span className="text-purple-400">0 Open Tickets</span>
              </div>
              <div className="text-slate-400 text-[11px]">Last touchpoint: 45s ago via ScrymeChat.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Feature Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="glass-panel p-8 md:p-12 rounded-xl border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#d2ff3a] mb-3 block">Enterprise Proof</span>
            <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              How Lumina Global retained $24M in ARR using Scryme
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              By consolidating disconnected sales tools into Scryme's bi-directional ledger, Lumina reduced customer support resolution times from 4 hours to 12 minutes while eliminating $180k/yr in middleware costs.
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

          <div className="p-6 rounded-lg bg-[#0d0e0f] border border-white/10 font-mono text-xs text-slate-300 space-y-3">
            <div className="text-purple-400 font-bold">// CRM_TIMELINE_FEED</div>
            <div className="p-3 rounded-sm bg-white/5 border border-white/5">
              <div className="text-white font-bold">Contract Renewal Signed</div>
              <div className="text-slate-400 text-[11px]">$240,000 USD • 2 Year Commitment</div>
            </div>
            <div className="p-3 rounded-sm bg-white/5 border border-white/5">
              <div className="text-white font-bold">Support Ticket Closed</div>
              <div className="text-slate-400 text-[11px]">Resolved via ScrymeChat Agent in 45s</div>
            </div>
            <div className="p-3 rounded-sm bg-white/5 border border-white/5">
              <div className="text-white font-bold">Settlement Confirmed</div>
              <div className="text-slate-400 text-[11px]">Sub-second ledger sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section id="capabilities" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Operational Command</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            Engineered for High-Growth & Enterprise Teams
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            Bridge customer relationships directly with fulfillment, billing, and inventory telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-lg hover:border-purple-500/40 transition">
            <div className="w-10 h-10 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Predictive Account Health</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Detect sudden drops in order frequency or activity before accounts churn.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-md bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Quote-to-Contract Escalation</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Escalate sales quotes straight to contracts with automated credit checks.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg hover:border-[#10b981]/40 transition">
            <div className="w-10 h-10 rounded-md bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Multichannel Attribution</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Trace account touchpoints from initial click to physical POS store purchases.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-lg hover:border-blue-500/40 transition">
            <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Bi-directional Data Mesh</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Changes in CRM reflect immediately across inventory reservation and finance ledgers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="glass-panel-elevated p-10 md:p-16 rounded-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Ready to establish real-time customer topology across your enterprise?
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8 leading-relaxed">
            Deploy Scryme 360° CRM in less than 5 minutes with zero migration downtime.
          </p>
          <a
            href="https://app.scryme.tech/signup?plan=growth&billing=annual&trial=true"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-md hover:bg-[#c7f32c] transition hover:shadow-[0_0_30px_rgba(210,255,58,0.5)]"
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