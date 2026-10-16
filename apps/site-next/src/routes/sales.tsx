import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { DollarSign, ShieldCheck, ArrowRight, Zap, CheckCircle2, TrendingUp, RefreshCw, BarChart2, Layers } from 'lucide-react'

export const Route = createFileRoute('/sales')({
  component: SalesComponent,
})

function SalesComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-mono mb-6">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Sales Automation & RevOps Engine • Sub-12ms Reconciled Pipeline</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-6">
            Accelerate Quote-to-Cash Velocity With Automated Ledger Reconciliation
          </h1>
          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            Automate multi-currency proposals, strict discount margin guardrails, tax compliance, and instant bank settlement without human manual entry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
            >
              <span>Automate Deal Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Instant Invoicing</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Transform accepted quotes into compliant tax invoices in under 12 milliseconds.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Predictive Margin Guardrails</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Hermes AI prevents sales reps from discounting below required corporate gross margins.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Stock Reservation</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Automatically hold physical inventory across regional hubs the instant a quote is signed.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Bank Ingestion</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Reconcile wire transfers and card payments directly against account invoices.
            </p>
          </div>
        </div>
      </section>

      {/* Pipeline Walkthrough */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel-elevated p-8 md:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a] mb-2 block">12ms Velocity</span>
            <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              How Quotes Translate to Reconciled Balance Sheets
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              When a deal closes, Scryme automatically dispatches the tax invoice, reserves physical stock at the nearest fulfillment node, updates revenue projections, and records the journal entry in General Ledger.
            </p>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Zero manual revenue reconciliation required.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Automated tax reporting across 180+ jurisdictions.
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0e0f] border border-white/10 font-mono text-xs text-slate-300 space-y-3">
            <div className="text-[#10b981] font-bold">// DEAL_PIPELINE_EXECUTION</div>
            <div className="p-3 rounded bg-white/5 flex justify-between">
              <span>Proposal Issued</span>
              <span className="text-[#d2ff3a]">100% Validated</span>
            </div>
            <div className="p-3 rounded bg-white/5 flex justify-between">
              <span>VAT / Tax ID Checked</span>
              <span className="text-[#10b981]">EU-VAT PASS</span>
            </div>
            <div className="p-3 rounded bg-white/5 flex justify-between">
              <span>Stock Allocated</span>
              <span className="text-blue-400">Hub-LON-04</span>
            </div>
            <div className="p-3 rounded bg-white/5 flex justify-between">
              <span>Ledger Status</span>
              <span className="text-emerald-400 font-bold">RECONCILED</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="glass-panel p-10 md:p-14 rounded-3xl">
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Eliminate Quote-to-Cash Bottlenecks Permanently
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
            Deploy RevOps automation in minutes with zero setup friction.
          </p>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
          >
            <span>Start RevOps Automation</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
