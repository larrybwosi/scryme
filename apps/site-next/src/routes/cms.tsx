import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Cloud, Code, Database, Sparkles, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/cms')({
  component: CmsComponent,
})

function CmsComponent() {
  return (
    <div className="min-h-screen bg-[#121314] text-[#e3e2e3] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b]">
      <Header />

      <main className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d2ff3a]">Headless CMS & Catalog Cloud</span>
          <h1 className="text-4xl sm:text-6xl font-serif text-white mt-3 mb-6">
            Headless Content & Product Catalog Engine
          </h1>
          <p className="text-base text-[#c5c9ae] leading-relaxed">
            Manage digital products, rich rich-text media specs, custom pricing tiers, and global taxonomy from one central hub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#d2ff3a]/10 flex items-center justify-center text-[#d2ff3a] mb-5">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">GraphQL & REST API Delivery</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Serve ultra-fast localized product catalogs directly to web storefronts, mobile apps, or digital menu boards with global CDN caching.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-white/10 hover:border-[#d2ff3a]/40 transition">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-5">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Sanity CMS Schema Integration</h3>
            <p className="text-sm text-[#c5c9ae] leading-relaxed">
              Seamless sync with Sanity Studio, allowing content creators to edit brand marketing assets without touching core ERP code.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
