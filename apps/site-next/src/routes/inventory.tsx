import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MapPin, Box, Layers, RefreshCw, BarChart2, ShieldCheck, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/inventory')({
  component: InventoryComponent,
})

function InventoryComponent() {
  return (
    <div className="min-h-screen bg-[#121314] text-[#e3e2e3] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b]">
      <Header />

      <main className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Smart Multi-Location Inventory</span>
          <h1 className="text-4xl sm:text-6xl font-serif text-white mt-3 mb-6">
            Autonomous Stock Synchronization Across Global Hubs
          </h1>
          <p className="text-base text-[#c5c9ae] leading-relaxed">
            Eliminate stockouts, overstocking, and phantom inventory with sub-second SKU updates, automated reorder thresholds, and lot tracking.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-5">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multi-Branch Stock Routing</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Dynamically route orders to the nearest warehouse or fulfillment center with automatic batch assignment and GPS geo-fencing.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-5">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Automated Stock Reordering</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Set min/max threshold rules. Hermes Agent automatically creates Purchase Orders and notifies suppliers when stock drops below safety margins.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="glass-panel-elevated p-8 md:p-12 rounded-3xl text-center max-w-3xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-serif text-white mb-4">Ready to Automate Your Supply Chain?</h3>
          <p className="text-sm text-[#c5c9ae] mb-6">Experience sub-millisecond stock reconciliation with Scryme V3.</p>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-lg"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
