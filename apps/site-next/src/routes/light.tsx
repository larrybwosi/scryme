import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Sun, ArrowRight, CheckCircle2, Shield, Layers } from 'lucide-react'

export const Route = createFileRoute('/light')({
  component: LightModeComponent,
})

function LightModeComponent() {
  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#121417] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b]">
      {/* Custom Light Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#f5f3ed]/90 border-b border-black/10 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#121417] text-[#d2ff3a] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#121417] font-sans">
              SCRYME<span className="text-[#10b981]">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#30312d]">
            <Link to="/" className="hover:text-black transition-colors">Platform</Link>
            <Link to="/inventory" className="hover:text-black transition-colors">Inventory</Link>
            <Link to="/sales" className="hover:text-black transition-colors">RevOps</Link>
            <Link to="/pricing" className="hover:text-black transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#121417] rounded-full hover:bg-black transition"
            >
              <span>Back to Obsidian Dark</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 mb-6">
            <Sun className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#121417] font-mono">
              Executive Light Theme Mode
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif text-[#121417] mb-6">
            High-Contrast Clarity for Boardroom Reporting
          </h1>
          <p className="text-base text-[#474743] leading-relaxed">
            Switch effortlessly between dark and light operational workspaces designed for supreme typographic legibility and executive presentations.
          </p>
        </div>

        <div className="bg-white border border-black/10 p-8 md:p-12 rounded-3xl shadow-xl max-w-4xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-[#121417] mb-4">Executive Summary Dashboard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-black/10">
            <div>
              <span className="text-xs font-mono uppercase text-[#656560]">Global Valuation</span>
              <div className="text-3xl font-bold text-[#121417] mt-1">$48.2M</div>
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-[#656560]">Active Outlets</span>
              <div className="text-3xl font-bold text-[#121417] mt-1">128 Hubs</div>
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-[#656560]">Daily Throughput</span>
              <div className="text-3xl font-bold text-[#10b981] mt-1">+34.2%</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
