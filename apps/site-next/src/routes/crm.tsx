import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Users, ShieldCheck, ArrowRight, TrendingUp, Activity, CheckCircle2, DollarSign, MessageSquare, LineChart, Cpu } from 'lucide-react'

export const Route = createFileRoute('/crm')({
  component: CrmComponent,
})

function CrmComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-6">
            <Users className="w-3.5 h-3.5" />
            <span>360° Relationship CRM • Sub-Second Operational Data Mesh</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-6">
            Turn Fragmented Customer Signals Into Unified Account Intelligence
          </h1>
          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Eliminate silos between CRM and ERP. Streamline lead attribution, contract renewals, payment history, and support tickets into one autonomous timeline.
          </p>
        </div>

        {/* Live Deal Preview Card */}
        <div className="glass-panel-elevated p-6 md:p-10 rounded-3xl max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-[var(--text-muted)] font-mono mb-1">ACCOUNT_NAME</div>
            <div className="text-lg font-bold dark:text-white light:text-[#090a0b]">Lumina Global Corp</div>
            <div className="text-xs text-emerald-400 mt-2 font-mono flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Health Score: 98/100
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-[var(--text-muted)] font-mono mb-1">LIFETIME_VALUE</div>
            <div className="text-2xl font-extrabold text-[#d2ff3a] font-mono">$1,480,000</div>
            <div className="text-xs text-[var(--text-muted)] mt-2 font-mono">14 Connected Contracts</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-[var(--text-muted)] font-mono mb-1">PREDICTIVE_CHURN_RISK</div>
            <div className="text-2xl font-extrabold text-[#10b981] font-mono">0.02%</div>
            <div className="text-xs text-[var(--text-muted)] mt-2 font-mono">Hermes AI Risk Guard: Clear</div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Operational Command</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3">
            Engineered to Dissolve Boundaries Between CRM & ERP
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Predictive Churn Alerts</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Detect sudden drops in order frequency or API usage before customers request cancellation.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Quote-to-Contract</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Escalate sales quotes straight to legally binding contracts with automated credit threshold checks.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Multichannel Attribution</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Trace account touchpoints from initial ad click to physical POS store purchases.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Bi-Directional Mesh</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Changes in Scryme CRM reflect immediately across inventory reservation and finance ledgers.
            </p>
          </div>
        </div>
      </section>

      {/* Case Study Feature */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#d2ff3a] mb-3 block">Enterprise Proof</span>
            <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              How Lumina Global retained $24M in ARR using Scryme 360° CRM
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              By consolidating 6 disconnected sales tools into Scryme's bi-directional ledger, Lumina reduced customer support resolution times from 4 hours to 12 minutes while eliminating $180k/yr in middleware costs.
            </p>
            <div className="flex items-center gap-6 border-t border-white/10 pt-6 font-mono text-xs">
              <div>
                <div className="text-xl font-bold text-[#d2ff3a]">+41%</div>
                <div className="text-[var(--text-muted)]">Upsell Conversion</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#10b981]">12min</div>
                <div className="text-[var(--text-muted)]">Avg SLA Time</div>
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
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="glass-panel-elevated p-10 md:p-14 rounded-3xl">
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Unify Your Customer Ledger Today
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
            Deploy Scryme 360° CRM in minutes with zero migration downtime.
          </p>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
          >
            <span>Start CRM Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
