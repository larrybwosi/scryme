import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle2,
  DollarSign,
  Users,
  Building2,
  Store,
  Boxes,
  Lock,
  RefreshCw,
  Server,
  Sparkles
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const [activeTab, setActiveTab] = useState<'crm' | 'inventory' | 'sales' | 'cms'>('crm')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#d2ff3a]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#d2ff3a]/30 glass-panel mb-6 font-mono text-xs text-[#d2ff3a]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Four specialized engines, Zero operational friction</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-balance mb-6 dark:text-white light:text-[#090a0b]">
            Can one smarter engine scale your entire enterprise?
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-3xl mx-auto mb-8 font-sans">
            Scryme unifies real-time CRM, multi-location inventory, high-throughput POS, sales analytics, and catalog management into one seamless platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.5)] transition-all"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/crm"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/15 rounded-full hover:bg-white/5 transition"
            >
              <span>Explore Platform</span>
            </Link>
          </div>

          {/* Hero Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto font-mono text-left pt-4 border-t border-white/10">
            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-[#d2ff3a]">+42%</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Win-Rate Velocity</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-[#10b981]">0.02%</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Incident Rate</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-purple-400">89.4%</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">Net Retention</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-blue-400">&lt;12ms</div>
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mt-1">POS Latency</div>
            </div>
          </div>
        </div>

        {/* Primary Screen Showcase (screen23.png) */}
        <div className="mt-8 relative z-10 max-w-6xl mx-auto glass-panel p-2 md:p-4 rounded-2xl md:rounded-3xl border border-white/15 shadow-2xl overflow-hidden group">
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/10 bg-[#0d0e0f]">
            <img
              src="/images/screen23.png"
              alt="Scryme Enterprise Platform Architecture"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </div>
        </div>
      </section>

      {/* Embedded Feature Screenshots Showcase */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Interface Suite</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            Designed for Speed, Accuracy & Scale
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            Explore dedicated views built for sales teams, inventory managers, and operational leads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4 hover:border-[#d2ff3a]/40 transition">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0e0f]">
              <img
                src="/images/screen1.png"
                alt="Operational Dashboard & Analytics"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-1">Operational Analytics</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Real-time tracking of sales trends, active inventory, and cash movements.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4 hover:border-[#d2ff3a]/40 transition">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0e0f]">
              <img
                src="/images/screen2.png"
                alt="Multi-Location & Stock Control"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-1">Stock & Logistics Control</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Multi-branch transfer automation and low-stock alert triggers across warehouses.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4 hover:border-[#d2ff3a]/40 transition">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0e0f]">
              <img
                src="/images/screen8.png"
                alt="Customer Directory & CRM Intelligence"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-1">CRM & Lead Intelligence</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Centralized account histories, deal pipeline stages, and contact timelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stop Paying Middleware Tax Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#d2ff3a] mb-3 block">Cost & System Consolidation</span>
            <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              Stop paying the middleware tax on broken operational data.
            </h2>
            <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
              Legacy enterprise stacks rely on fragile ETL pipelines and third-party middleware connectors. Scryme provides a single unified ledger where POS sales, warehouse deducts, and CRM deals update synchronously.
            </p>
            <div className="space-y-3 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Sub-12ms sync latency across distributed branch nodes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Zero third-party connector subscriptions or ETL maintenance fees</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Automated HITL approval workflows for low stock and custom pricing</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0e0f] border border-white/10 font-mono text-xs text-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">// UNIFIED_OPERATIONAL_STREAM</span>
              <span className="text-[#d2ff3a] font-bold">Live Stream</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>POS Sale Completed</span>
                <span className="text-[#d2ff3a]">$1,480.00</span>
              </div>
              <div className="text-slate-400 text-[11px]">Branch: Central Depot • Stock updated across 4 nodes</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Hermes Churn Warning</span>
                <span className="text-amber-400">Action Required</span>
              </div>
              <div className="text-slate-400 text-[11px]">Account: Apex Ltd • 30-day order frequency drop detected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Measurable Yield Callout */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto font-mono">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-2xl border-white/10">
            <div className="text-3xl md:text-4xl font-extrabold text-[#d2ff3a] mb-2">$180,000</div>
            <div className="text-sm font-bold dark:text-white light:text-[#090a0b] mb-2">Yearly Middleware Saved</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Eliminated expensive custom API integration software and external ETL maintenance contracts.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-white/10">
            <div className="text-3xl md:text-4xl font-extrabold text-[#10b981] mb-2">99.999%</div>
            <div className="text-sm font-bold dark:text-white light:text-[#090a0b] mb-2">Hardware-Isolated Uptime</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              High-availability SLA backed by edge-replicated NestJS V3 micro-runtimes and local offline SQLite fallbacks.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-white/10">
            <div className="text-3xl md:text-4xl font-extrabold text-purple-400 mb-2">88%</div>
            <div className="text-sm font-bold dark:text-white light:text-[#090a0b] mb-2">TCO Cost Reduction</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Consolidated 5 disparate SaaS products into one cohesive subscription model with multi-tenant isolation.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-6">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b] mb-3">Sub-Second Sync Engine</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Every sales order, inventory deduct, and invoice updates all downstream ledgers in 12 milliseconds across globally distributed nodes.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-6">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b] mb-3">Hermes Agent AI Automation</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Autonomous workflows evaluate low stock levels, generate purchase orders, dispatch ScrymeChat alerts, and handle HITL deal approvals.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b] mb-3">Hardware-Isolated Security</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              SOC2 Type II compliance with multi-tenant database isolation, encrypted JWT sessions, and granular permission guards.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Frequently Asked Questions</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            Frequently asked questions by enterprise engineering & leadership
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does Scryme unify fragmented legacy ERP software?",
              a: "Scryme provides zero-loss ingestion connectors for NetSuite, SAP, Salesforce, and legacy SQL databases. Our sub-second sync pipeline mirrors data in real-time into a high-performance unified schema."
            },
            {
              q: "Can Scryme operate offline on mobile and POS hardware?",
              a: "Yes. The Tauri POS desktop app and Android app use local SQLite engines to queue transactions offline, syncing seamlessly with the V3 NestJS API upon re-connection."
            },
            {
              q: "What is Hermes Agent and how does HITL approval work?",
              a: "Hermes Agent evaluates business rules continuously. When an action exceeds set thresholds (such as discount caps or stock reorders), it dispatches an approval request to ScrymeChat for human sign-off."
            },
            {
              q: "Is there support for multi-currency and multi-tax jurisdictions?",
              a: "Scryme includes a built-in sub-50ms Currency & VAT Engine that calculates real-time exchange rates, localized Tax IDs, and compliance rules across 180+ countries."
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel rounded-2xl border-white/10 overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold dark:text-white light:text-[#090a0b]"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === idx ? 'rotate-180 text-[#d2ff3a]' : 'text-slate-400'}`} />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 text-sm text-[var(--text-muted)] leading-relaxed border-t border-white/5 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel-elevated p-10 md:p-16 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#d2ff3a]/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl md:text-6xl font-serif dark:text-white light:text-[#090a0b] mb-6">
            Reclaim command of your global operations today.
          </h2>
          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Start your 14-day free trial today. Deploy your workspace in less than 5 minutes with zero commitment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.5)] transition-all"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/15 rounded-full hover:bg-white/5 transition"
            >
              <span>View Pricing Plans</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
