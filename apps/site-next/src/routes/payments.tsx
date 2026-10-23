import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Check, ArrowRight, ShieldCheck, CreditCard, Smartphone, Building2, Zap, Lock, RefreshCw, Layers } from 'lucide-react'

export const Route = createFileRoute('/payments')({
  component: PaymentsComponent,
})

export function PaymentsComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#d2ff3a] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d2ff3a] font-mono">
              Omnichannel Payment Infrastructure • Sub-2s Settlement
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-6">
            Unified Payment Processing & Automated Ledger Reconciliation
          </h1>
          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-8">
            Accept localized M-Pesa mobile payments, global credit cards, Apple Pay, and wire transfers directly inside your POS and checkout workflows with zero reconciliation friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup?plan=free"
              className="px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white border border-white/20 rounded-full hover:bg-white/10 transition"
            >
              Start Free Testing ($0/mo)
            </a>
            <a
              href="https://app.scryme.tech/signup?plan=scale&trial=true"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-[0_0_20px_rgba(210,255,58,0.3)]"
            >
              <span>Deploy Scale Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Supported Payment Channels Grid */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* M-Pesa Direct & STK Push */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">East Africa Mobile Money</span>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mt-1 mb-4">M-Pesa STK Push & Paybill Sync</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                Automate customer checkout prompts on Safaricom M-Pesa. When cashier initiates checkout on POS, an STK push is instantly delivered to the customer’s phone. Webhook handlers confirm transaction completion in under 2 seconds.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Real-time STK Push Prompt Triggering</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Till & Paybill Automated Reconciliation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Automated Ledger Posting & Receipt Generation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Active Safaricom Status Polling Fallback</li>
              </ul>
            </div>
            <a
              href="https://app.scryme.tech/signup?plan=free"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline"
            >
              <span>Test M-Pesa Flow on Free Tier</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Cards & Mobile Pay */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-blue-400">Global Card Networks</span>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mt-1 mb-4">Visa, Mastercard & Wallet Pay</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                Seamless credit/debit card processing with 3D Secure verification, recurring billing auto-debit, Apple Pay, and Google Pay support for online checkout and physical terminals.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Multi-currency Card Settlement (USD, EUR, KSH)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Apple Pay & Google Pay Express Checkout</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> PCI-DSS Compliant Encryption & Tokenization</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Automatic Failed Payment Retry Sequences</li>
              </ul>
            </div>
            <a
              href="https://app.scryme.tech/signup?plan=growth&trial=true"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline"
            >
              <span>Explore Card Checkout Workflows</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Bank Wires & SEPA */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-purple-400">Bank Transfers</span>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mt-1 mb-4">ACH, SEPA & SWIFT Wire Transfers</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                For high-volume wholesale and enterprise orders, Scryme provides virtual bank account matching with automated ACH, SEPA, and international SWIFT transfer clearing.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Dedicated Virtual Account Numbers (VANs)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Real-time Bank Reconciliation Webhooks</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Automated Deposit Matching against Proforma Invoices</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Multi-currency Settlement Direct to Treasury</li>
              </ul>
            </div>
            <a
              href="mailto:enterprise@scryme.tech"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 hover:underline"
            >
              <span>Contact Enterprise Treasury Team</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Corporate Invoicing & Credit Terms */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl border-white/10 flex flex-col justify-between hover:border-[#d2ff3a]/40 transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">B2B Credit Terms</span>
              <h3 className="text-2xl font-serif dark:text-white light:text-[#090a0b] mt-1 mb-4">NET-30 Corporate Invoicing</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                Manage B2B customer credit limits, issue formal PDF invoices with custom tax IDs, and collect payments via structured NET-15/30/60 purchase order terms.
              </p>
              <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Automated Purchase Order Matching</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Customer Credit Limit Enforcement</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Multi-Branch Tax Compliance & E-Invoicing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#d2ff3a]" /> Automated Past-Due Reminder Sequences</li>
              </ul>
            </div>
            <a
              href="https://app.scryme.tech/signup?plan=scale&trial=true"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d2ff3a] hover:underline"
            >
              <span>Enable Corporate Invoicing</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>

      {/* Security & Multi-Currency Architecture */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel p-10 md:p-14 rounded-3xl border-white/10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Enterprise Architecture</span>
            <h2 className="text-3xl md:text-4xl font-serif dark:text-white light:text-[#090a0b] mt-2 mb-3">
              Bank-Grade Security & Zero-Loss Isolation
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Every payment credential and transaction payload is hardened with AES-256-GCM encryption and tenant isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d2ff3a]">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold dark:text-white light:text-[#090a0b]">V3 Credentials Encryption</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                M-Pesa Consumer Keys, Passkeys, and payment credentials are encrypted using AES-256-GCM PBKDF2 before reaching database storage.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d2ff3a]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold dark:text-white light:text-[#090a0b]">Real-Time Webhook Engine</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                High-throughput Redis event queue guarantees zero dropped payment callbacks and instant status updates to physical POS devices.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d2ff3a]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold dark:text-white light:text-[#090a0b]">Tenant BOLA Protection</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Strict multi-tenant organization boundaries ensure transaction data and payment logs remain 100% isolated per organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="glass-panel-elevated p-10 md:p-14 rounded-3xl">
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Start Accepting Payments Across Your Stores Today
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
            Deploy your Scryme workspace with Free Tier testing or a 14-day Scale trial. Connect M-Pesa, card processing, and bank transfers in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup?plan=free"
              className="px-8 py-4 text-sm font-bold uppercase tracking-wider text-white border border-white/20 rounded-full hover:bg-white/10 transition"
            >
              Start Free Testing ($0/mo)
            </a>
            <a
              href="https://app.scryme.tech/signup?plan=scale&trial=true"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-[0_0_20px_rgba(210,255,58,0.3)]"
            >
              <span>Start 14-Day Free Scale Trial</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
