import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MapPin, Box, Layers, RefreshCw, BarChart2, ShieldCheck, ArrowRight, Cpu, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/inventory')({
  component: InventoryComponent,
})

function InventoryComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d2ff3a]/10 border border-[#d2ff3a]/20 text-[#d2ff3a] text-xs font-mono mb-6">
            <Box className="w-3.5 h-3.5" />
            <span>Smart Multi-Location Inventory • Sub-Second Telemetry</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-6">
            Sub-Second Inventory Telemetry Across Every Global Node
          </h1>
          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            Eliminate stockouts, phantom inventory, and overstocking with dynamic multi-warehouse order allocation, RFID barcode mesh sync, and automated Hermes AI supplier reordering.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
            >
              <span>Deploy Inventory Mesh</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Warehouse Telemetry Feed */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel p-6 md:p-8 rounded-3xl border-white/10 grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-[var(--text-muted)] mb-1">TOTAL_SKUS_TRACKED</div>
            <div className="text-2xl font-extrabold text-white">1,420,890</div>
            <div className="text-[11px] text-emerald-400 mt-2">150+ Warehouses Connected</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-[var(--text-muted)] mb-1">SYNC_LATENCY</div>
            <div className="text-2xl font-extrabold text-[#d2ff3a]">12ms</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-2">Sub-Second Broadcaster</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-[var(--text-muted)] mb-1">STOCKOUT_PREVENTION</div>
            <div className="text-2xl font-extrabold text-[#10b981]">99.98%</div>
            <div className="text-[11px] text-emerald-400 mt-2">Autonomous PO Trigger Active</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-[var(--text-muted)] mb-1">HARDWARE_FLEET</div>
            <div className="text-2xl font-extrabold text-white">4,820 Units</div>
            <div className="text-[11px] text-blue-400 mt-2">Zebra & Android Scanners</div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-5">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b] mb-3">Multi-Branch Stock Routing</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Dynamically route orders to the nearest warehouse or fulfillment center with automatic batch assignment and GPS geo-fencing.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-5">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b] mb-3">Automated Stock Reordering</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Set min/max safety threshold rules. Hermes AI Agent generates Purchase Orders and dispatches them to suppliers instantly.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b] mb-3">Zero-Ghost Reconciliation</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Continuous stock verification matches physical scanner audits against General Ledger inventory valuation.
            </p>
          </div>
        </div>
      </section>

      {/* Simulation Banner */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel-elevated p-8 md:p-12 rounded-3xl text-center">
          <h2 className="text-2xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Test Your Supply Network Against Demand Surges
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
            Simulate 100,000 simultaneous order fulfillments to verify system stability and warehouse routing logic.
          </p>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
          >
            <span>Run Network Simulation</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
