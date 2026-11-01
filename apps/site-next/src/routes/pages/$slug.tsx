import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { PageBuilder } from '../../components/page-builder'
import { fetchLandingPageBySlug } from '../../sanity/queries'
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'

export const Route = createFileRoute('/pages/$slug')({
  loader: async ({ params }) => {
    const pageData = await fetchLandingPageBySlug(params.slug)
    return { pageData, slug: params.slug }
  },
  head: ({ loaderData }) => {
    const page = loaderData?.pageData
    const title = page?.seo?.metaTitle || page?.title || `${loaderData?.slug?.replace(/[-_]/g, ' ') || 'Solutions'} | Scryme Enterprise ERP`
    const description =
      page?.seo?.metaDescription ||
      `Explore ${page?.title || 'modern operational solutions'} powered by Scryme's single-kernel ERP architecture.`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        ...(page?.seo?.keywords && page.seo.keywords.length > 0
          ? [{ name: 'keywords', content: page.seo.keywords.join(', ') }]
          : []),
        ...(page?.seo?.noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      ],
      links: [
        ...(page?.seo?.canonicalUrl ? [{ rel: 'canonical', href: page.seo.canonicalUrl }] : []),
      ],
    }
  },
  component: GenericLandingPageComponent,
})

function GenericLandingPageComponent() {
  const { pageData, slug } = Route.useLoaderData()
  const displayTitle = pageData?.title || slug?.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Enterprise Solutions'

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors flex flex-col justify-between">
      <div>
        <Header />
        <main>
          {pageData?.modules && pageData.modules.length > 0 ? (
            <PageBuilder modules={pageData.modules} />
          ) : (
            <div className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d2ff3a]/10 border border-[#d2ff3a]/20 text-[#d2ff3a] text-xs font-mono">
                  <span>Scryme Enterprise Solutions</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-serif dark:text-white light:text-[#090a0b] tracking-tight">
                  {displayTitle}
                </h1>
                <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
                  Unified operational telemetry and automation engineered for modern high-growth and enterprise brands.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <a
                    href="https://app.scryme.tech/signup?plan=scale&trial=true"
                    className="inline-flex items-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] rounded-full hover:bg-[#c7f32c] transition shadow-md"
                  >
                    <span>Launch Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    to="/pricing"
                    className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border border-white/15 dark:border-white/15 light:border-black/15 rounded-full hover:bg-white/10 transition"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>

              {/* Three Value Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-panel p-8 rounded-3xl border-white/10 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#d2ff3a]/10 text-[#d2ff3a] flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b]">Sub-12ms Telemetry</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Zero data drift across multi-location inventories, POS checkout stations, and accounting ledgers.
                  </p>
                </div>

                <div className="glass-panel p-8 rounded-3xl border-white/10 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b]">Zero Seat Taxes</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Add your entire workforce across finance, warehouse logistics, and store staff without per-seat penalty fees.
                  </p>
                </div>

                <div className="glass-panel p-8 rounded-3xl border-white/10 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white light:text-[#090a0b]">Bank-Grade Security</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    SOC 2 Type II certified and field-level encrypted to safeguard enterprise transactional records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}
