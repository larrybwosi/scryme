import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { TrendingUp, Zap, CreditCard, ShoppingBag, BarChart3, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/sales')({
  component: SalesComponent,
})

function SalesComponent() {
  return (
    <div className="min-h-screen bg-[#121314] text-[#e3e2e3] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b]">
      <Header />

      <main className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">Sales Automation & RevOps</span>
          <h1 className="text-4xl sm:text-6xl font-serif text-white mt-3 mb-6">
            Quote-to-Cash Automation at Scale
          </h1>
          <p className="text-base text-[#c5c9ae] leading-relaxed">
            Unify point-of-sale terminals, web store transactions, and B2B wholesale invoicing into a unified RevOps pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#10b981]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-5">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">POS & Desktop Checkout Integration</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Native Tauri POS integration supporting offline sale caching, barcode scanners, receipt printing, and instant ledger sync.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#10b981]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-time RevOps Intelligence</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Live executive dashboards displaying gross margin analysis, location revenue leaderboards, and automated commission calculations.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
