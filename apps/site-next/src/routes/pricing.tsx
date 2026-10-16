import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Check, ArrowRight, ShieldCheck, Zap, DollarSign, Calculator, ChevronDown, Layers } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/pricing')({
  component: PricingComponent,
})

function PricingComponent() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [legacyCost, setLegacyCost] = useState<number>(180000)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a] block mb-4">
            Predictable Enterprise Scaling
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-6">
            Predictable Pricing Engineered for Limitless Enterprise Scale
          </h1>
          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            No per-user penalties or hidden seat taxes. Unify your operational software stack under one transparent, telemetry-based billing model.
          </p>

          {/* Billing Toggle Switch */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10 mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
                billingCycle === 'monthly'
                  ? 'bg-[#d2ff3a] text-[#090a0b]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-[#d2ff3a] text-[#090a0b]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>Annual Commitment</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981] text-white">SAVE 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Starter Plan */}
          <div className="glass-panel p-8 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Growth Tier</div>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mb-4">Core Operational Engine</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold font-mono dark:text-white light:text-[#090a0b]">
                  ${billingCycle === 'annual' ? '499' : '599'}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">/ month</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                Ideal for growing brands unifying inventory across up to 5 regional warehouse nodes.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Up to 5 Warehouse Locations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> 10,000 Orders / Month Included</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Real-time POS & RevOps Sync</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Standard ScrymeChat Bot Support</li>
              </ul>
            </div>
            <a
              href="https://app.scryme.tech/signup"
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/20 rounded-full hover:bg-white/10 transition"
            >
              Deploy Growth Tier
            </a>
          </div>

          {/* Scale Plan (Featured) */}
          <div className="glass-panel-elevated p-8 rounded-3xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#d2ff3a] text-[#090a0b] text-[10px] font-extrabold uppercase tracking-widest font-mono">
              Most Popular Enterprise Plan
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a] mb-2">Scale Mesh</div>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mb-4">Autonomous Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold font-mono text-[#d2ff3a]">
                  ${billingCycle === 'annual' ? '1,499' : '1,799'}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">/ month</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                Complete multi-location inventory, Hermes AI automation, and sub-50ms catalog cloud.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Unlimited Warehouse Nodes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> 100,000 Orders / Month Included</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Hermes AI HITL Approval Workflows</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Sub-50ms Catalog Cloud Edge Workers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Dedicated SLA & Priority Engineering</li>
              </ul>
            </div>
            <a
              href="https://app.scryme.tech/signup"
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-[0_0_20px_rgba(210,255,58,0.3)]"
            >
              Start 14-Day Free Scale Trial
            </a>
          </div>

          {/* Custom Enterprise Plan */}
          <div className="glass-panel p-8 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-2">Global Grid</div>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mb-4">Custom Architecture</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold font-mono dark:text-white light:text-[#090a0b]">Custom</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                For high-volume enterprise organizations requiring dedicated hardware isolation and bespoke SAP/NetSuite integrations.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Custom High-Volume Order Throughput</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Hardware-Isolated Database Instances</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> 99.999% Guaranteed SLA Uptime</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> 24/7 Dedicated Solutions Architect</li>
              </ul>
            </div>
            <a
              href="mailto:enterprise@scryme.tech"
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/20 rounded-full hover:bg-white/10 transition"
            >
              Contact Solutions Team
            </a>
          </div>

        </div>
      </section>

      {/* Consolidation Yield Calculator */}
      <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-white/10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">ROI Estimator</span>
            <h2 className="text-3xl font-serif dark:text-white light:text-[#090a0b] mt-2 mb-3">
              Quantify Your Consolidation Yield
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Calculate your annual savings by replacing fragmented SaaS tools with Scryme's single ledger engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-3">
                Current Annual Middleware & SaaS Spend ($)
              </label>
              <input
                type="range"
                min="30000"
                max="500000"
                step="10000"
                value={legacyCost}
                onChange={(e) => setLegacyCost(Number(e.target.value))}
                className="w-full accent-[#d2ff3a] cursor-pointer mb-4"
              />
              <div className="text-2xl font-bold font-mono text-white mb-2">
                ${legacyCost.toLocaleString()} / year
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Includes legacy ERP licenses, CRM add-ons, inventory sync middleware, and CMS hosting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d0e0f] border border-white/10 font-mono text-center">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Estimated Yearly Yield</div>
              <div className="text-4xl md:text-5xl font-extrabold text-[#d2ff3a] mb-2">
                ${Math.max(0, Math.round(legacyCost * 0.65)).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-400">~65% Average Cost Reduction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Procurement FAQ */}
      <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Procurement & Implementation</span>
          <h2 className="text-3xl font-serif dark:text-white light:text-[#090a0b] mt-2">
            Frequently Asked Procurement Inquiries
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Are there per-seat or per-user licensing fees?",
              a: "No. Scryme believes charging per-seat penalizes business growth and discourages cross-department collaboration. All plans include unlimited user seats."
            },
            {
              q: "What happens if our order volume exceeds the plan threshold?",
              a: "You are never cut off. Overages are billed transparently at fractional cents per transaction without service degradation."
            },
            {
              q: "How long does migration from NetSuite or SAP take?",
              a: "Our automated zero-loss ingestion connectors typically complete complete data migration and validation within 48 to 72 hours."
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

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="glass-panel-elevated p-10 md:p-14 rounded-3xl">
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Ready to Streamline Your Operational Core?
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
            Deploy your Scryme workspace in 5 minutes with zero long-term commitment.
          </p>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
          >
            <span>Deploy Workspace Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
