import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Check, Shield, Zap, Sparkles, Building2, HelpCircle } from 'lucide-react'

export const Route = createFileRoute('/pricing')({
  component: PricingComponent,
})

function PricingComponent() {
  return (
    <div className="min-h-screen bg-[#121314] text-[#e3e2e3] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b]">
      <Header />

      <main className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Transparent Predictable Pricing</span>
          <h1 className="text-4xl sm:text-6xl font-serif text-white mt-3 mb-6">
            Enterprise Power, Frictionless Scalability
          </h1>
          <p className="text-base text-[#c5c9ae] leading-relaxed">
            Select the tier that aligns with your operational throughput. Every plan includes full access to Scryme V3 API and Hermes Automation Agent.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Starter Plan */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between border-white/10 hover:border-white/20 transition-all">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#8e937a]">Growth Stage</span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-2">Growth</h3>
              <p className="text-xs text-[#c5c9ae] mb-6">Ideal for single-location ops and emerging brands scale-up.</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold text-white font-sans">$299</span>
                <span className="text-xs font-mono text-[#8e937a]">/ location / month</span>
              </div>

              <ul className="space-y-3.5 text-sm text-[#e3e2e3] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Up to 5 User Seats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Multi-Location Stock Sync</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Integrated POS & Online Sales</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Standard 360° CRM Records</span>
                </li>
              </ul>
            </div>

            <a
              href="https://app.scryme.tech/signup"
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider text-white border border-white/20 rounded-full hover:bg-white/10 transition"
            >
              Start 14-Day Free Trial
            </a>
          </div>

          {/* Pro / Enterprise Core Plan (Featured) */}
          <div className="glass-panel-elevated p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden transform md:-translate-y-2">
            <div className="absolute top-0 right-0 bg-[#d2ff3a] text-[#090a0b] text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg font-mono">
              Most Popular
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">High Performance</span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-2">Scale Enterprise</h3>
              <p className="text-xs text-[#c5c9ae] mb-6">Built for multi-regional operations & high-volume retail chains.</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold text-[#d2ff3a] font-sans">$799</span>
                <span className="text-xs font-mono text-[#8e937a]">/ location / month</span>
              </div>

              <ul className="space-y-3.5 text-sm text-[#e3e2e3] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Unlimited User Seats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Hermes AI Automation Workflows</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Advanced Recipe & Batch Production</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Sub-second Real-time Webhooks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Dedicated Account Manager</span>
                </li>
              </ul>
            </div>

            <a
              href="https://app.scryme.tech/signup"
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] hover:shadow-[0_0_20px_rgba(210,255,58,0.4)] transition"
            >
              Get Started Instantly
            </a>
          </div>

          {/* Custom Dedicated Plan */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between border-white/10 hover:border-white/20 transition-all">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#8e937a]">Global Infrastructure</span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-2">Global Custom</h3>
              <p className="text-xs text-[#c5c9ae] mb-6">Tailored single-tenant clouds, custom integrations, and strict SLA requirements.</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-3xl font-bold text-white font-sans">Custom</span>
              </div>

              <ul className="space-y-3.5 text-sm text-[#e3e2e3] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Dedicated VPC / On-Premise Deployments</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Custom ERP Schema & DB Sharding</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>24/7 Priority Ops Support & SLA</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#d2ff3a]" />
                  <span>Custom Hardware & Reader Pairing</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:enterprise@scryme.tech"
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider text-white border border-white/20 rounded-full hover:bg-white/10 transition"
            >
              Contact Enterprise Engineering
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
