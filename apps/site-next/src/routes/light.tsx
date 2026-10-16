import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ArrowRight, Layers, Sun, Zap, ShieldCheck, Box, DollarSign, Users, Database, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/light')({
  component: LightComponent,
})

function LightComponent() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#121314] font-sans selection:bg-[#10b981] selection:text-white transition-colors">
      <Header />

      {/* Editorial Light Canvas Hero */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200 border border-slate-300 text-slate-800 text-xs font-mono mb-6">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>High-Contrast Editorial Light Mode • Obsidian Kinetic Standard</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-[#121314] tracking-tight leading-[1.05] mb-8">
            Can One Smarter Engine Scale Your Entire Enterprise?
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Experience Scryme's high-contrast chalk-cream editorial interface. Unifying telemetry across inventory, sales, CRM, and catalog cloud with sub-second execution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white bg-[#090a0b] rounded-full hover:bg-slate-800 transition"
            >
              <span>Deploy Light Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Four Pillars Grid */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">Core Capabilities</span>
          <h2 className="text-3xl md:text-5xl font-serif text-[#121314] mt-2">
            The Four Pillars of Operational Command
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#121314] mb-3">Sales Automation & RevOps</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automated quote-to-cash pipeline with 12ms ledger reconciliation.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-5">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#121314] mb-3">Multi-Location Inventory</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sub-second inventory telemetry across 150+ regional warehouse nodes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-5">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#121314] mb-3">360° Relationship CRM</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Predictive customer health scores and bi-directional ERP data mesh.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mb-5">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#121314] mb-3">Headless Catalog Cloud</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Edge-cached product catalog with sub-50ms TTFB worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="bg-white p-10 md:p-16 rounded-3xl border border-slate-200 shadow-lg">
          <h2 className="text-3xl md:text-5xl font-serif text-[#121314] mb-4">
            Ready to Operate with Absolute Operational Clarity?
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto mb-8">
            Deploy your workspace in less than 5 minutes on Scryme's light canvas.
          </p>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white bg-[#090a0b] rounded-full hover:bg-slate-800 transition"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
