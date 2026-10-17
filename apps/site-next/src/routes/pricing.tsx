import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Check, ArrowRight, ShieldCheck, Zap, DollarSign, Calculator, ChevronDown, Layers, CreditCard, Smartphone, Building2, HelpCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/pricing')({
  component: PricingComponent,
})

type Currency = 'USD' | 'KSH' | 'EUR'

interface PlanPricing {
  amount: string
  period: string
  billedNote?: string
}

const PRICING_DATA: Record<Currency, {
  symbol: string
  name: string
  badge: string
  growth: { monthly: PlanPricing; annual: PlanPricing }
  scale: { monthly: PlanPricing; annual: PlanPricing }
  enterprise: { monthly: PlanPricing; annual: PlanPricing }
}> = {
  USD: {
    symbol: '$',
    name: 'USD ($)',
    badge: 'Global USD',
    growth: {
      monthly: { amount: '$599', period: '/ month' },
      annual: { amount: '$499', period: '/ month', billedNote: 'Billed annually ($5,988/yr)' },
    },
    scale: {
      monthly: { amount: '$1,799', period: '/ month' },
      annual: { amount: '$1,499', period: '/ month', billedNote: 'Billed annually ($17,988/yr)' },
    },
    enterprise: {
      monthly: { amount: 'Custom', period: '' },
      annual: { amount: 'Custom', period: '' },
    },
  },
  KSH: {
    symbol: 'KSh ',
    name: 'KSh (M-Pesa)',
    badge: 'M-Pesa Direct',
    growth: {
      monthly: { amount: 'KSh 78,000', period: '/ month' },
      annual: { amount: 'KSh 65,000', period: '/ month', billedNote: 'Billed annually (KSh 780,000/yr)' },
    },
    scale: {
      monthly: { amount: 'KSh 234,000', period: '/ month' },
      annual: { amount: 'KSh 195,000', period: '/ month', billedNote: 'Billed annually (KSh 2,340,000/yr)' },
    },
    enterprise: {
      monthly: { amount: 'Custom', period: '' },
      annual: { amount: 'Custom', period: '' },
    },
  },
  EUR: {
    symbol: '€',
    name: 'EUR (€)',
    badge: 'Eurozone SEPA',
    growth: {
      monthly: { amount: '€550', period: '/ month' },
      annual: { amount: '€460', period: '/ month', billedNote: 'Billed annually (€5,520/yr)' },
    },
    scale: {
      monthly: { amount: '€1,650', period: '/ month' },
      annual: { amount: '€1,380', period: '/ month', billedNote: 'Billed annually (€16,560/yr)' },
    },
    enterprise: {
      monthly: { amount: 'Custom', period: '' },
      annual: { amount: 'Custom', period: '' },
    },
  },
}

export function PricingComponent() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [legacyCost, setLegacyCost] = useState<number>(180000)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const currData = PRICING_DATA[currency]

  const getSignupUrl = (plan: string) => {
    return `https://app.scryme.tech/signup?plan=${plan}&billing=${billingCycle}&currency=${currency.toLowerCase()}&trial=true`
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#d2ff3a] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d2ff3a] font-mono">
              14-Day Free Trial • Instant Deployment • Zero Risk
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-6">
            Predictable Pricing Engineered for Limitless Enterprise Scale
          </h1>
          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-8">
            No per-user penalties or hidden seat taxes. Unify your operational software stack under one transparent, telemetry-based billing model.
          </p>

          {/* Controls: Billing Cycle + Currency Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            {/* Billing Toggle Switch */}
            <div className="inline-flex items-center p-1.5 rounded-full bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition ${
                  billingCycle === 'monthly'
                    ? 'bg-[#d2ff3a] text-[#090a0b]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-[#d2ff3a] text-[#090a0b]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>Annual Commitment</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981] text-white">SAVE 20%</span>
              </button>
            </div>

            {/* Currency Selector */}
            <div className="inline-flex items-center p-1.5 rounded-full bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10 gap-1">
              {(['USD', 'KSH', 'EUR'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3.5 py-2 rounded-full text-xs font-mono font-bold uppercase transition ${
                    currency === c
                      ? 'bg-white/20 text-white border border-white/20'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {PRICING_DATA[c].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-4 px-4 md:px-8 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Starter Plan (Growth) */}
          <div className="glass-panel p-8 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Growth Tier</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  14-Day Free Trial
                </span>
              </div>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mb-4">Core Operational Engine</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono dark:text-white light:text-[#090a0b]">
                    {currData.growth[billingCycle].amount}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{currData.growth[billingCycle].period}</span>
                </div>
                {currData.growth[billingCycle].billedNote && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-1">{currData.growth[billingCycle].billedNote}</p>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                Ideal for growing brands unifying inventory across up to 5 regional warehouse nodes.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Up to 5 Warehouse Locations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> 10,000 Orders / Month Included</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Real-time POS & RevOps Sync</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Standard ScrymeChat Bot Support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> M-Pesa, Card & Wire Payments</li>
              </ul>
            </div>
            <a
              href={getSignupUrl('growth')}
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider dark:text-white light:text-[#090a0b] border border-white/20 rounded-full hover:bg-white/10 transition"
            >
              Start 14-Day Growth Trial
            </a>
          </div>

          {/* Scale Plan (Featured) */}
          <div className="glass-panel-elevated p-8 rounded-3xl relative flex flex-col justify-between border-2 border-[#d2ff3a]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#d2ff3a] text-[#090a0b] text-[10px] font-extrabold uppercase tracking-widest font-mono shadow-md">
              Most Popular Enterprise Plan
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Scale Mesh</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d2ff3a]/20 text-[#d2ff3a] border border-[#d2ff3a]/30">
                  14-Day Free Trial
                </span>
              </div>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mb-4">Autonomous Enterprise</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono text-[#d2ff3a]">
                    {currData.scale[billingCycle].amount}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{currData.scale[billingCycle].period}</span>
                </div>
                {currData.scale[billingCycle].billedNote && (
                  <p className="text-[11px] font-mono text-[#d2ff3a] mt-1">{currData.scale[billingCycle].billedNote}</p>
                )}
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
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Multi-Currency & Automated M-Pesa Recon</li>
              </ul>
            </div>
            <a
              href={getSignupUrl('scale')}
              className="w-full text-center py-3.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-[0_0_20px_rgba(210,255,58,0.3)]"
            >
              Start 14-Day Free Scale Trial
            </a>
          </div>

          {/* Custom Enterprise Plan */}
          <div className="glass-panel p-8 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-purple-400">Global Grid</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Custom Onboarding
                </span>
              </div>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mb-4">Custom Architecture</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono dark:text-white light:text-[#090a0b]">Custom</span>
                </div>
                <p className="text-[11px] font-mono text-purple-400 mt-1">Tailored Billing & SLA Contracts</p>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                For high-volume enterprise organizations requiring dedicated hardware isolation and bespoke SAP/NetSuite integrations.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Custom High-Volume Order Throughput</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Hardware-Isolated Database Instances</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> 99.999% Guaranteed SLA Uptime</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> 24/7 Dedicated Solutions Architect</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Custom Invoicing & Corporate Purchase Orders</li>
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

      {/* Payment Options Section */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-white/10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Supported Payment Methods</span>
            <h2 className="text-3xl font-serif dark:text-white light:text-[#090a0b] mt-2 mb-3">
              Flexible Enterprise Payment Channels
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Scryme supports seamless localized and international settlement methods across all billing tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold dark:text-white light:text-[#090a0b]">M-Pesa Direct</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Automated STK Push, Till, and Paybill reconciliation for East African operational branches with instant ledger posting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold dark:text-white light:text-[#090a0b]">Cards & Mobile Pay</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Accept Visa, Mastercard, American Express, Apple Pay, and Google Pay with recurring subscription auto-debit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold dark:text-white light:text-[#090a0b]">SEPA & Wire Transfers</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Direct ACH, SWIFT, and SEPA electronic bank transfers for annual enterprise commitments and corporate invoicing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold dark:text-white light:text-[#090a0b]">Corporate Invoicing</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                NET-30 purchase order terms and multi-currency invoicing with custom tax ID matching for finance departments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Architectural Comparison</span>
          <h2 className="text-3xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mt-2 mb-3">
            Detailed Plan Feature Breakdown
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Compare capabilities across Growth, Scale, and Custom Enterprise tiers.
          </p>
        </div>

        <div className="glass-panel rounded-3xl border-white/10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <th className="p-5 font-bold">Capabilities</th>
                <th className="p-5 font-bold text-center">Growth</th>
                <th className="p-5 font-bold text-center text-[#d2ff3a]">Scale</th>
                <th className="p-5 font-bold text-center text-purple-400">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-[var(--text-muted)]">
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">Free Trial Period</td>
                <td className="p-5 text-center text-emerald-400 font-mono font-bold">14 Days</td>
                <td className="p-5 text-center text-emerald-400 font-mono font-bold">14 Days</td>
                <td className="p-5 text-center text-purple-400 font-mono font-bold">Custom PoC</td>
              </tr>
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">Unlimited User Seats</td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">Warehouse & Node Count</td>
                <td className="p-5 text-center font-mono">Up to 5</td>
                <td className="p-5 text-center font-mono text-[#d2ff3a]">Unlimited</td>
                <td className="p-5 text-center font-mono text-purple-400">Unlimited Isolated</td>
              </tr>
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">Monthly Transaction Allowance</td>
                <td className="p-5 text-center font-mono">10,000 / mo</td>
                <td className="p-5 text-center font-mono text-[#d2ff3a]">100,000 / mo</td>
                <td className="p-5 text-center font-mono text-purple-400">Custom Throughput</td>
              </tr>
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">M-Pesa STK Push & Webhook Sync</td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">Hermes AI Autonomous Agents</td>
                <td className="p-5 text-center font-mono text-slate-500">—</td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">Catalog Edge Workers (Sub-50ms)</td>
                <td className="p-5 text-center font-mono text-slate-500">—</td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                <td className="p-5 text-center"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-5 font-semibold dark:text-white light:text-[#090a0b]">Guaranteed Uptime SLA</td>
                <td className="p-5 text-center font-mono">99.9%</td>
                <td className="p-5 text-center font-mono text-[#d2ff3a]">99.95%</td>
                <td className="p-5 text-center font-mono text-purple-400">99.999% Dedicated</td>
              </tr>
            </tbody>
          </table>
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
                Current Annual Middleware & SaaS Spend ({currData.symbol.trim()})
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
                {currData.symbol}{legacyCost.toLocaleString()} / year
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Includes legacy ERP licenses, CRM add-ons, inventory sync middleware, and CMS hosting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d0e0f] border border-white/10 font-mono text-center">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Estimated Yearly Yield</div>
              <div className="text-4xl md:text-5xl font-extrabold text-[#d2ff3a] mb-2">
                {currData.symbol}{Math.max(0, Math.round(legacyCost * 0.65)).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-400">~65% Average Cost Reduction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Procurement & Trial FAQ */}
      <section className="py-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Procurement & Trials</span>
          <h2 className="text-3xl font-serif dark:text-white light:text-[#090a0b] mt-2">
            Frequently Asked Billing & Trial Inquiries
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the 14-day free trial work?",
              a: "When you sign up for Growth or Scale tiers, you receive full platform access for 14 days without charge. You can upgrade, switch billing cycles, or cancel anytime before the trial period ends."
            },
            {
              q: "What payment options do you support?",
              a: "We support M-Pesa (STK push & direct paybill), all major credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and bank wire transfers (ACH/SEPA/SWIFT) for annual commitments."
            },
            {
              q: "Are there per-seat or per-user licensing fees?",
              a: "No. Scryme believes charging per-seat penalizes business growth and discourages cross-department collaboration. All plans include unlimited user seats."
            },
            {
              q: "Can I change my billing cycle or currency later?",
              a: "Yes. You can switch between Monthly and Annual billing or adjust your default workspace currency at any time directly in Organization Settings."
            },
            {
              q: "What happens if our order volume exceeds the plan threshold?",
              a: "You are never cut off. Overages are billed transparently at fractional cents per transaction without service degradation."
            },
            {
              q: "How long does migration from NetSuite or SAP take?",
              a: "Our automated zero-loss ingestion connectors typically complete data migration and validation within 48 to 72 hours."
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
            Start your 14-day free trial today. Deploy your Scryme workspace in 5 minutes with zero commitment.
          </p>
          <a
            href={getSignupUrl('scale')}
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-[0_0_20px_rgba(210,255,58,0.3)]"
          >
            <span>Start 14-Day Free Scale Trial</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
