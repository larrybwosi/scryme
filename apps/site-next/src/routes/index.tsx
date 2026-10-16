import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingUp,
  Cpu,
  BarChart3,
  Box,
  Users,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronDown,
  Activity,
  Globe,
  Database,
  Terminal,
  Lock,
  RefreshCw,
  Server,
  ShoppingCart,
  DollarSign
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'crm' | 'cms'>('sales')

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#d2ff3a]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#d2ff3a] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d2ff3a] font-mono">
              Obsidian Kinetic Architecture • V3 Engine Released
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.05] max-w-5xl mx-auto mb-8">
            The Autonomous ERP for High-Growth Enterprises
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Bridge institutional rigor with real-time operational telemetry. Unify inventory, RevOps, POS, and CRM into one high-contrast, kinetic intelligence engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.5)] transition-all transform active:scale-95"
            >
              <span>Deploy Workspace Free</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/15 dark:border-white/15 light:border-black/15 rounded-full hover:bg-white/5 transition"
            >
              <span>Explore Live Telemetry</span>
            </a>
          </div>

          {/* Stat Ticker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 glass-panel rounded-2xl max-w-4xl mx-auto text-left">
            <div>
              <div className="text-3xl font-extrabold dark:text-white light:text-[#090a0b] font-mono">12ms</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">Global Sync Latency</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#d2ff3a] font-mono">99.999%</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#10b981] font-mono">$4.2B+</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">Ledger Processed</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold dark:text-white light:text-[#090a0b] font-mono">150+</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">Global Edge Nodes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Platform Overview */}
      <section id="demo" className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Architectural Mesh</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            Four Core Pillars. One Unified Ledger.
          </h2>
          <p className="text-base text-[var(--text-muted)]">
            Select a module below to inspect real-time ERP operational capabilities.
          </p>
        </div>

        {/* Module Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
              activeTab === 'sales'
                ? 'bg-[#d2ff3a] text-[#090a0b]'
                : 'bg-white/5 border border-white/10 dark:text-white light:text-[#090a0b] hover:bg-white/10'
            }`}
          >
            Sales & RevOps
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
              activeTab === 'inventory'
                ? 'bg-[#d2ff3a] text-[#090a0b]'
                : 'bg-white/5 border border-white/10 dark:text-white light:text-[#090a0b] hover:bg-white/10'
            }`}
          >
            Multi-Location Inventory
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
              activeTab === 'crm'
                ? 'bg-[#d2ff3a] text-[#090a0b]'
                : 'bg-white/5 border border-white/10 dark:text-white light:text-[#090a0b] hover:bg-white/10'
            }`}
          >
            360° Relationship CRM
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
              activeTab === 'cms'
                ? 'bg-[#d2ff3a] text-[#090a0b]'
                : 'bg-white/5 border border-white/10 dark:text-white light:text-[#090a0b] hover:bg-white/10'
            }`}
          >
            Catalog Cloud & Headless CMS
          </button>
        </div>

        {/* Tab Display Panel */}
        <div className="glass-panel-elevated rounded-3xl p-6 md:p-10 transition-all">
          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-mono mb-4">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Real-Time Quote-to-Cash Engine</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
                  Deterministic Financial Velocity
                </h3>
                <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
                  Automate contract approvals, multi-currency invoicing, VAT calculations, and instant banking reconciliation. Eliminate revenue leakage across all digital and POS touchpoints.
                </p>
                <ul className="space-y-2.5 text-sm text-[var(--text-muted)] mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" /> Sub-second invoice generation with localized Tax ID routing.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" /> Automated payment gateway webhook processing & ledger sync.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" /> Hermes AI guardrails for automated deal margin protection.
                  </li>
                </ul>
                <Link to="/sales" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline">
                  <span>Explore Sales & RevOps Module</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mock Terminal Card */}
              <div className="glass-panel p-6 rounded-2xl border-white/10 font-mono text-xs text-slate-300 space-y-3 bg-[#0d0e0f]">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] text-slate-500">deal-SC-88402.json</span>
                </div>
                <p className="text-emerald-400">// Deal Approval Executed in 12ms</p>
                <p><span className="text-slate-500">account:</span> "Aetheria Dynamics Corp"</p>
                <p><span className="text-slate-500">value:</span> "$142,500.00 USD" (EUR conversion: €131,210.00)</p>
                <p><span className="text-slate-500">status:</span> <span className="text-[#d2ff3a]">RECONCILED_LEDGER_SYNC</span></p>
                <p><span className="text-slate-500">inventory_reserved:</span> true (SKU-9021, SKU-9022)</p>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">VAT ID: EU372019482</span>
                  <span className="text-[#10b981]">Margin: 48.2% (Approved)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d2ff3a]/10 text-[#d2ff3a] text-xs font-mono mb-4">
                  <Box className="w-3.5 h-3.5" />
                  <span>Sub-Second Logistics Mesh</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
                  Zero-Ghost Physical Stock Routing
                </h3>
                <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-6">
                  Track lot numbers, expiry dates, and bin locations across 150+ regional hubs in real time. Automatic reorder triggers ensure zero stockouts under peak traffic.
                </p>
                <ul className="space-y-2.5 text-sm text-[var(--text-muted)] mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" /> Dynamic multi-branch order allocation by shipping proximity.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d2ff3a]" /> Full barcode and scanner fleet interoperability.
                  </li>
                </ul>
                <Link to="/inventory" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline">
                  <span>Explore Inventory Module</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/10 font-mono text-xs text-slate-300 space-y-3 bg-[#0d0e0f]">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-[#d2ff3a] font-bold">WAREHOUSE_TELEMETRY_LIVE</span>
                  <span className="text-[10px] text-emerald-400">SYNC: 100%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-slate-400">HUB-NYC-01</p>
                    <p className="text-white font-bold">4,120 Units</p>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-slate-400">HUB-LON-04</p>
                    <p className="text-white font-bold">8,950 Units</p>
                  </div>
                </div>
                <p className="text-slate-400">// Reorder triggered for SKU-PREM-88</p>
                <p className="text-[#d2ff3a]">Supplier Auto-PO dispatched via Hermes Agent</p>
              </div>
            </div>
          )}

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
                  Merge commercial communications, order history, support tickets, and contract renewals into one predictive timeline.
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

      {/* Feature Highlights Grid */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
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
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Frequently Analyzed Inquiries</span>
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mt-3 mb-4">
            Everything You Need to Know
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
              a: "Hermes Agent evaluates business rules continuously. When an action exceeds set thresholds (such as discount caps or stock reorders), it dispatches a approval request to ScrymeChat for human sign-off."
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
            Ready to Operate with Absolute Clarity?
          </h2>
          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy your workspace in less than 5 minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.5)] transition-all"
            >
              <span>Get Started Now</span>
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
