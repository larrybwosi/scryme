import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Users, UserCheck, Shield, HeartHandshake, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/crm')({
  component: CrmComponent,
})

function CrmComponent() {
  return (
    <div className="min-h-screen bg-[#121314] text-[#e3e2e3] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b]">
      <Header />

      <main className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">360° Relationship CRM</span>
          <h1 className="text-4xl sm:text-6xl font-serif text-white mt-3 mb-6">
            Complete Visibility into Every Customer Touchpoint
          </h1>
          <p className="text-base text-[#c5c9ae] leading-relaxed">
            Consolidate B2B wholesale buyers, retail POS customers, and web subscribers into a single actionable record.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-5">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Automated Identity Reconciliation</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Match customer profiles by phone, email, or tax ID across in-person POS sales and digital storefront orders automatically.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-5">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Credit Limits & Invoicing Rules</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Define credit limits, custom payment terms (Net 30/60), and tiered volume discounts for top-tier accounts.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
