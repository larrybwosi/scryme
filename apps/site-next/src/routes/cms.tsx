import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Database, ShieldCheck, ArrowRight, Zap, Globe, Layers, Cpu, Code2, Server } from 'lucide-react'

export const Route = createFileRoute('/cms')({
  component: CmsComponent,
})

function CmsComponent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6">
            <Database className="w-3.5 h-3.5" />
            <span>Headless Catalog Cloud • Edge-Cached Sub-50ms TTFB</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif dark:text-white light:text-[#090a0b] tracking-tight leading-[1.08] mb-6">
            Publish Localized Catalogs to Global Storefronts in Sub-50ms
          </h1>
          <p className="text-base md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
            Unify digital content management, product variant schemas, multi-currency pricing, and localized VAT compliance into one GraphQL & REST edge API.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
            >
              <span>Explore Catalog Cloud</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Global Edge Workers</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Edge-cached product metadata guarantees sub-50ms TTFB across 150+ regional POPs.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Generated Typings</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Auto-generate TypeScript SDKs and OpenAPI specs directly from your master schema.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Omnichannel Publishing</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Instantly sync catalog changes to web storefronts, mobile apps, and POS terminals.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold dark:text-white light:text-[#090a0b] mb-2">Dynamic Localized VAT</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Real-time foreign exchange conversion and regional tax calculation at checkout.
            </p>
          </div>
        </div>
      </section>

      {/* GraphQL Code Preview */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel-elevated p-8 md:p-12 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a] mb-2 block">Developer Standard</span>
            <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
              Engineered for Engineering Teams Who Refuse Tradeoffs
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              Query products, inventory reserves, price lists, and Sanity CMS media through a single unified GraphQL schema with hardware-isolated SLA guarantees.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0e0f] border border-white/10 font-mono text-xs text-slate-300 space-y-3">
            <div className="text-blue-400 font-bold">// GRAPHQL_CATALOG_QUERY</div>
            <pre className="text-slate-400 overflow-x-auto text-[11px] leading-relaxed p-3 bg-white/5 rounded">
{`query GetLocalizedProduct($sku: String!, $currency: CurrencyCode!) {
  product(sku: $sku) {
    id
    name
    variants {
      sku
      inventory {
        availableUnits
        warehouseNode
      }
      pricing(currency: $currency) {
        amount
        formatted
        taxCalculated
      }
    }
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="glass-panel p-10 md:p-14 rounded-3xl">
          <h2 className="text-3xl md:text-5xl font-serif dark:text-white light:text-[#090a0b] mb-4">
            Deploy Omnichannel Catalog Cloud Today
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
            Build storefronts with confidence using generated TypeScript SDKs.
          </p>
          <a
            href="https://app.scryme.tech/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition"
          >
            <span>Start Building Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
