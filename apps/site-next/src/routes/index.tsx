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
  Layers
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return (
    <div className="min-h-screen bg-[#121314] text-[#e3e2e3] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#d2ff3a]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1f2021] border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#d2ff3a] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d2ff3a] font-mono">
              Obsidian Kinetic Architecture • V3 Engine Released
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal font-serif text-white tracking-tight leading-[1.05] max-w-5xl mx-auto mb-8">
            The Autonomous ERP for High-Growth Enterprises
          </h1>

          <p className="text-lg md:text-xl text-[#c5c9ae] max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Bridge institutional rigor with real-time operational telemetry. Unify inventory, RevOps, POS, and CRM into one high-contrast, kinetic intelligence engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_30px_rgba(210,255,58,0.5)] transition-all transform active:scale-95"
            >
              <span>Deploy Instant Instance</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white border border-white/20 rounded-full hover:bg-white/5 transition"
            >
              <span>Explore Enterprise Plans</span>
            </Link>
          </div>

          {/* Interactive Metric Showcase Card */}
          <div className="glass-panel-elevated p-6 md:p-8 rounded-2xl max-w-5xl mx-auto text-left relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 mb-6 gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Live Telemetry Console</span>
                <h3 className="text-xl font-bold text-white font-sans">Global Operational Health Index</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#10b981]/20 text-[#10b981] text-xs font-mono uppercase font-semibold">
                  ● 99.998% Sync Velocity
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono">
                  Org: Enterprise Multi-Region
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl bg-[#121314]/80 border border-white/5">
                <span className="text-xs font-mono text-[#8e937a]">Active Orders</span>
                <div className="text-3xl font-bold font-sans text-white mt-1">14,290</div>
                <div className="text-xs text-[#10b981] font-mono mt-2">↑ 24.8% vs last hour</div>
              </div>
              <div className="p-4 rounded-xl bg-[#121314]/80 border border-white/5">
                <span className="text-xs font-mono text-[#8e937a]">Inventory Fulfillment</span>
                <div className="text-3xl font-bold font-sans text-white mt-1">99.8%</div>
                <div className="text-xs text-[#10b981] font-mono mt-2">Optimal Stock Ratio</div>
              </div>
              <div className="p-4 rounded-xl bg-[#121314]/80 border border-white/5">
                <span className="text-xs font-mono text-[#8e937a]">MRR Revenue Pipeline</span>
                <div className="text-3xl font-bold font-sans text-[#d2ff3a] mt-1">$1.42M</div>
                <div className="text-xs text-[#10b981] font-mono mt-2">↑ 18.2% ARR QoQ</div>
              </div>
              <div className="p-4 rounded-xl bg-[#121314]/80 border border-white/5">
                <span className="text-xs font-mono text-[#8e937a]">Automated Actions</span>
                <div className="text-3xl font-bold font-sans text-white mt-1">84,102/day</div>
                <div className="text-xs text-[#d2ff3a] font-mono mt-2">Hermes Agent Active</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 border-t border-white/10 bg-[#0d0e0f]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Architectural Modules</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-white mt-2 mb-4">
              Engineered for Speed, Precision, and Uncompromising Scale
            </h2>
            <p className="text-sm md:text-base text-[#c5c9ae]">
              Replace fragmented legacy software with a single unified data plane designed for real-time operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-6 group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-sans">Multi-Location Inventory</h3>
              <p className="text-sm text-[#c5c9ae] leading-relaxed mb-6">
                Real-time stock balance, automated replenishment thresholds, lot/batch tracking, and cross-warehouse transfer orchestration.
              </p>
              <Link to="/inventory" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase font-mono text-[#d2ff3a] hover:underline">
                <span>Explore Inventory</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-sans">Sales & RevOps Engine</h3>
              <p className="text-sm text-[#c5c9ae] leading-relaxed mb-6">
                Automated quote-to-cash pipelines, POS terminal syncing, dynamic pricing tiers, and real-time sales reporting.
              </p>
              <Link to="/sales" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase font-mono text-[#10b981] hover:underline">
                <span>Explore RevOps</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-sans">360° Customer CRM</h3>
              <p className="text-sm text-[#c5c9ae] leading-relaxed mb-6">
                Unified account histories, automated customer synchronization between POS & web, credit limit controls, and interaction timelines.
              </p>
              <Link to="/crm" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase font-mono text-[#d2ff3a] hover:underline">
                <span>Explore CRM</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Light & Dark Dual Theme Teaser */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="glass-panel p-8 md:p-12 rounded-3xl bg-gradient-to-r from-[#191c20] to-[#121314] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Flexible Theme Modes</span>
              <h3 className="text-3xl md:text-4xl font-serif text-white">
                Obsidian Kinetic Dark & Crisp Executive Light Mode
              </h3>
              <p className="text-sm text-[#c5c9ae] leading-relaxed">
                Whether operating in high-density night command centers or sunlit executive boardrooms, Scryme provides tailored visual ergonomics with zero compromise on data contrast.
              </p>
            </div>
            <div>
              <Link
                to="/light"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#f5f3ed] rounded-full hover:bg-white transition shadow-lg"
              >
                <span>View Light Mode Experience</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
