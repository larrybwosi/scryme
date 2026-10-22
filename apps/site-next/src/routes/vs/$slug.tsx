import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { PageBuilder } from '../../components/page-builder'
import { fetchComparisonPageBySlug } from '../../sanity/queries'

export const Route = createFileRoute('/vs/$slug')({
  loader: async ({ params }) => {
    let targetSlug = params.slug
    if (!targetSlug.startsWith('scryme-vs-')) {
      targetSlug = `scryme-vs-${targetSlug}`
    }
    const pageData = await fetchComparisonPageBySlug(targetSlug)
    return { pageData }
  },
  head: ({ loaderData }) => {
    const page = loaderData?.pageData
    const seo = page?.seo
    const title = seo?.metaTitle || page?.title || 'Scryme Comparison'
    const description =
      seo?.metaDescription ||
      `Compare Scryme with ${page?.competitorName || 'competitors'}. Modern enterprise POS & ERP.`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
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
  const { pageData } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors flex flex-col justify-between">
      <div>
        <Header />
        <main>
          {pageData?.modules && pageData.modules.length > 0 ? (
            <PageBuilder modules={pageData.modules} />
          ) : (
            <div className="py-20 text-center max-w-xl mx-auto px-4">
              <h1 className="font-serif-headline text-3xl text-[var(--text-main)] mb-4">
                {pageData?.title || 'Comparison Page'}
              </h1>
              <p className="text-[var(--text-muted)]">
                No page builder modules configured yet for this comparison page.
              </p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}
