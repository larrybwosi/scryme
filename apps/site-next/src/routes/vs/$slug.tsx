import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { PageBuilder } from '../../components/page-builder'
import { fetchComparisonPageBySlug } from '../../sanity/queries'
import { Check, X, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/vs/$slug')({
  loader: async ({ params }) => {
    const pageData = await fetchComparisonPageBySlug(params.slug)
    return { pageData, slug: params.slug }
  },
  head: ({ loaderData }) => {
    const page = loaderData?.pageData
    const competitor = page?.competitorName || loaderData?.slug?.replace(/[-_]/g, ' ') || 'Legacy ERP'
    const seo = page?.seo
    const title = seo?.metaTitle || page?.title || `Scryme vs ${competitor} | Next-Gen ERP Comparison`
    const description =
      seo?.metaDescription ||
      `Compare Scryme with ${competitor}. Sub-second telemetry, native M-Pesa & card settlement, and zero middleware tax.`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        ...(seo?.keywords && seo.keywords.length > 0
          ? [{ name: 'keywords', content: seo.keywords.join(', ') }]
          : []),
        ...(seo?.noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      ],
      links: [
        ...(seo?.canonicalUrl ? [{ rel: 'canonical', href: seo.canonicalUrl }] : []),
      ],
    }
  },
  component: VsPageComponent,
})

function VsPageComponent() {
  const { pageData, slug } = Route.useLoaderData()
  const competitorName = pageData?.competitorName || slug?.replace(/^scryme-vs-/, '').replace(/[-_]/g, ' ').toUpperCase() || 'LEGACY SYSTEMS'

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors flex flex-col justify-between">
      <div>
        <Header />
        <main>
          {pageData?.modules && pageData.modules.length > 0 ? (
            <PageBuilder modules={pageData.modules} />
          ) : (
            <div className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
              {/* Fallback Hero */}
              <div className="text-center max-w-3xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d2ff3a]/10 border border-[#d2ff3a]/20 text-[#4d6700] dark:text-[#d2ff3a] text-xs font-mono">
                  <span>Architectural Head-to-Head Comparison</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-serif text-[var(--text-main)] tracking-tight">
                  Scryme vs. {competitorName}
                </h1>
                <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
                  Discover how Scryme's single-kernel operational engine eliminates the sync delays, seat taxes, and brittle middleware common with {competitorName}.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                  <a
                    href="https://app.scryme.tech/signup?plan=scale&trial=true"
                    className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-md"
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    to="/pricing"
                    className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border border-[var(--border-prominent)] text-[var(--text-main)] rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
                  >
                    Compare Pricing
                  </Link>
                </div>
              </div>

              {/* Head-to-head Comparison Table */}
              <div className="glass-panel rounded-3xl overflow-x-auto shadow-2xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="p-5 font-bold">Architectural Vector</th>
                      <th className="p-5 font-bold text-center text-[#4d6700] dark:text-[#d2ff3a] bg-[#d2ff3a]/10">Scryme Autonomous ERP</th>
                      <th className="p-5 font-bold text-center">{competitorName}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                    <tr>
                      <td className="p-5 font-semibold text-[var(--text-main)]">Database Architecture</td>
                      <td className="p-5 text-center bg-[#d2ff3a]/5 font-bold text-[#4d6700] dark:text-[#d2ff3a]">Unified ACID Ledger Kernel</td>
                      <td className="p-5 text-center">Fragmented Relational Tables</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-semibold text-[var(--text-main)]">Cross-Node Telemetry Latency</td>
                      <td className="p-5 text-center bg-[#d2ff3a]/5 font-mono font-bold text-[#4d6700] dark:text-[#d2ff3a]">Sub-12ms Consensus</td>
                      <td className="p-5 text-center font-mono">15+ Minute Cron Delays</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-semibold text-[var(--text-main)]">East Africa M-Pesa Native Sync</td>
                      <td className="p-5 text-center bg-[#d2ff3a]/5"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                      <td className="p-5 text-center"><X className="w-4 h-4 text-red-500 dark:text-red-400 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-5 font-semibold text-[var(--text-main)]">User Seat Taxes</td>
                      <td className="p-5 text-center bg-[#d2ff3a]/5 font-bold text-emerald-600 dark:text-emerald-400">Zero ($0 Per Seat)</td>
                      <td className="p-5 text-center text-red-500 dark:text-red-400 font-bold">$40 - $120 / user / mo</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-semibold text-[var(--text-main)]">Model Context Protocol (MCP) AI</td>
                      <td className="p-5 text-center bg-[#d2ff3a]/5"><Check className="w-4 h-4 text-[#d2ff3a] mx-auto" /></td>
                      <td className="p-5 text-center"><X className="w-4 h-4 text-red-500 dark:text-red-400 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-5 font-semibold text-[var(--text-main)]">Catalog Cloud Headless Edge</td>
                      <td className="p-5 text-center bg-[#d2ff3a]/5 font-mono font-bold text-[#4d6700] dark:text-[#d2ff3a]">Sub-50ms TTFB</td>
                      <td className="p-5 text-center font-mono">Uncached SSR (300-800ms)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Callout */}
              <div className="glass-panel-elevated p-8 md:p-12 rounded-3xl text-center">
                <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-main)] mb-4">
                  Ready to Migrate Away from {competitorName}?
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
                  Deploy Scryme with bidirectional shadow ETL pipelines. Run in parallel with your legacy core with zero migration downtime.
                </p>
                <a
                  href="https://app.scryme.tech/signup?plan=scale&trial=true"
                  className="inline-flex items-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-lg"
                >
                  <span>Start Zero-Risk Migration</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}
