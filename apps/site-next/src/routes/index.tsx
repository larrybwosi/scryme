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
  Server
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
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-28 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#d2ff3a]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d2ff3a]/10 border border-[#d2ff3a]/20 text-[#d2ff3a] text-xs font-mono mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d2ff3a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d2ff3a]"></span>
            </span>
            <span>Sub-Second Operational Data Mesh Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-8">
            Can one smarter engine scale your entire enterprise?
          </h1>

          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            Four specialized engines. Zero operational friction. Eliminate the catastrophic sync drift of legacy software with sub-second bi-directional telemetry.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.4)] transition-all"
            >
              <span>Deploy Workspace Free</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#engines"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/15 rounded-full hover:bg-white/5 transition"
            >
              <span>Explore Architecture</span>
            </a>
          </div>
        </div>

        {/* Core Operational Telemetry Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto font-mono text-center">
          <div className="glass-panel p-5 rounded-2xl border-white/10">
            <div className="text-2xl md:text-3xl font-extrabold text-[#d2ff3a]">+42%</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Win-Rate Velocity</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-white/10">
            <div className="text-2xl md:text-3xl font-extrabold text-[#10b981]">0.02%</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Incident Rate</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-white/10">
            <div className="text-2xl md:text-3xl font-extrabold text-purple-400">89.4%</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Net Retention</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-white/10">
            <div className="text-2xl md:text-3xl font-extrabold text-blue-400">&lt;8ms</div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">POS Latency</div>
          </div>
        </div>
      </section>

      {/* Legacy vs Scryme Callout */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-b border-white/10">
        <div className="glass-panel-elevated p-8 md:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a] block mb-3">Operational Friction Solved</span>
            <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              Stop paying the middleware tax on broken operational data.
            </h2>
            <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
              Traditional enterprise software wasn't designed to communicate. It was designed to bill you for integration consultants. Scryme unifies your CRM, stock ledger, sales engine, and CMS into a single hardware-isolated mesh.
            </p>
            <div className="flex flex-wrap gap-4 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Zero Middleware Connectors Needed</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" />
                <span>Sub-Second Multi-Node Replication</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-[#0d0e0f] border-white/10 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-slate-400">// LEGACY_STACK_DRIFT</span>
              <span className="text-rose-400 font-bold">48-Hour Sync Lag</span>
            </div>
            <div className="space-y-2 text-slate-400">
              <p>Salesforce ➔ NetSuite Integration: <span className="text-rose-400">Failed (Timeout)</span></p>
              <p>Warehouse Stock Reconciliation: <span className="text-amber-400">Inconsistent Ledger</span></p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[#d2ff3a] font-bold">// SCRYME_MESH_STATE</span>
              <span className="text-emerald-400 font-bold">12ms Telemetry Sync</span>
            </div>
            <p className="text-slate-300">Unified Account Graph: <span className="text-emerald-400">Consistent Across 180 Nodes</span></p>
          </div>
        </div>
      </section>

      {/* Four Specialized Engines (Interactive Switcher) */}
      <section id="engines" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Unified Architecture</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            The Four Pillars of Operational Command
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            Every module operates natively on the same unified ledger, eliminating data translation layers.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-12">
          {[
            { id: 'crm', label: '360° Relationship CRM', icon: Users },
            { id: 'inventory', label: 'Multi-Node Inventory', icon: Boxes },
            { id: 'sales', label: 'Omnichannel Sales POS', icon: Store },
            { id: 'cms', label: 'Headless Catalog Cloud', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-[#d2ff3a] text-[#090a0b] shadow-[0_0_20px_rgba(210,255,58,0.3)]'
                    : 'glass-panel text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Active Tab Panel */}
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-white/10">
          {activeTab === 'crm' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-mono mb-4">
                  <Users className="w-3.5 h-3.5" />
                  <span>360° Account Intelligence</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
                  Unified Customer Health & Retention
                </h3>
                <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
                  Merge commercial communications, order history, support tickets, and contract renewals into one predictive timeline. Prevent churn before it happens with AI risk guards.
                </p>
                <Link to="/crm" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline">
                  <span>Explore CRM Module</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/10 font-mono text-xs text-slate-300 space-y-3 bg-[#0d0e0f]">
                <p className="text-purple-400 font-bold">// ACCOUNT_INTELLIGENCE: Lumina Corp</p>
                <p><span className="text-slate-400">ARR Value:</span> $240,000 / yr</p>
                <p><span className="text-slate-400">Health Score:</span> <span className="text-emerald-400">98/100 (Optimal)</span></p>
                <p><span className="text-slate-400">Next Action:</span> Q3 Enterprise Expansion Contract Renewal</p>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-4">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Sub-Second Telemetry</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
                  Real-Time Multi-Location Inventory
                </h3>
                <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
                  Sub-second RFID & 2D barcode mesh sync across global warehouses and store locations. Prevent stockouts autonomously with predictive reordering.
                </p>
                <Link to="/inventory" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline">
                  <span>Explore Inventory Module</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/10 font-mono text-xs text-slate-300 space-y-3 bg-[#0d0e0f]">
                <p className="text-emerald-400 font-bold">// STOCK_LEDGER_TELEMETRY</p>
                <p><span className="text-slate-400">Nodes Active:</span> 150 Tier-1 Warehouses</p>
                <p><span className="text-slate-400">Sync Latency:</span> 12ms (Global Mesh)</p>
                <p><span className="text-slate-400">Stockouts Prevented:</span> 99.98% Accuracy</p>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d2ff3a]/10 text-[#d2ff3a] text-xs font-mono mb-4">
                  <Store className="w-3.5 h-3.5" />
                  <span>Omnichannel Velocity</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
                  Automated Quote-to-Cash Ledger
                </h3>
                <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
                  Accelerate quote-to-cash velocity with automated ledger reconciliation, instant M-Pesa STK push, credit cards, and corporate wire invoicing.
                </p>
                <Link to="/sales" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline">
                  <span>Explore Sales POS</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/10 font-mono text-xs text-slate-300 space-y-3 bg-[#0d0e0f]">
                <p className="text-[#d2ff3a] font-bold">// QUOTE_TO_CASH_STATE</p>
                <p><span className="text-slate-400">Deal Reference:</span> #SC-88402</p>
                <p><span className="text-slate-400">STK Push Settlement:</span> <span className="text-emerald-400">Instant (Confirmed)</span></p>
                <p><span className="text-slate-400">Cycle Reduction:</span> 4.2x Faster Sales Cycle</p>
              </div>
            </div>
          )}

          {activeTab === 'cms' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono mb-4">
                  <Database className="w-3.5 h-3.5" />
                  <span>Sub-50ms Catalog Cloud</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
                  Omnichannel Headless Content Mesh
                </h3>
                <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
                  Publish localized product catalogs, pricing tiers, and marketing content instantly to mobile apps, web storefronts, and POS units.
                </p>
                <Link to="/cms" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline">
                  <span>Explore Catalog Cloud</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/10 font-mono text-xs text-slate-300 space-y-3 bg-[#0d0e0f]">
                <p className="text-blue-400 font-bold">// EDGE_CATALOG_WORKER_RESPONSE</p>
                <p><span className="text-slate-400">TTFB:</span> 18ms (Edge Cache Hit)</p>
                <p><span className="text-slate-400">Localized Currency:</span> JPY (¥)</p>
                <p><span className="text-slate-400">GraphQL Endpoint:</span> https://api.scryme.tech/graphql/catalog</p>
              </div>
            </div>
          )}
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
