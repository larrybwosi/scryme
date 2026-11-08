import { urlFor } from '../sanity/image'
import type { SeoData, SiteSettings } from '../sanity/queries'

export interface SeoOptions {
  title?: string
  description?: string
  keywords?: string[]
  pathname?: string
  ogType?: 'website' | 'article' | 'product'
  ogImage?: any
  twitterCard?: 'summary_large_image' | 'summary'
  canonicalUrl?: string
  noIndex?: boolean
  siteSettings?: SiteSettings
  seoData?: SeoData
  structuredData?: Record<string, any> | Array<Record<string, any>>
  faqs?: Array<{ q: string; a: string }>
}

export const DEFAULT_SITE_URL = 'https://scryme.tech'
export const DEFAULT_OG_IMAGE = 'https://scryme.tech/images/screen.png'
export const DEFAULT_TWITTER_HANDLE = '@ScrymeTech'

export function createSiteSeo({
  title,
  description,
  keywords,
  pathname = '',
  ogType,
  ogImage,
  twitterCard,
  canonicalUrl,
  noIndex,
  siteSettings,
  seoData,
  structuredData,
  faqs,
}: SeoOptions) {
  const baseUrl = siteSettings?.siteUrl?.replace(/\/$/, '') || DEFAULT_SITE_URL
  const cleanPath = pathname ? (pathname.startsWith('/') ? pathname : `/${pathname}`) : ''
  const fullCanonicalUrl =
    canonicalUrl ||
    seoData?.canonicalUrl ||
    `${baseUrl}${cleanPath}`

  // Title resolution: Page-specific -> SEO metaTitle -> fallback -> default
  const baseTitle = seoData?.metaTitle || title || siteSettings?.siteTitle || 'Scryme - Next-Gen ERP Platform'
  const fullTitle = baseTitle.includes('Scryme') ? baseTitle : `${baseTitle} | Scryme ERP`

  // Description resolution
  const resolvedDescription =
    seoData?.metaDescription ||
    description ||
    siteSettings?.siteDescription ||
    'Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship intelligence, and decoupled catalog engines.'

  // Keywords resolution
  const resolvedKeywords = Array.from(
    new Set([
      ...(siteSettings?.defaultKeywords || [
        'ERP',
        'Scryme',
        'Autonomous ERP',
        'POS',
        'Point of Sale',
        'Real-time Inventory',
        'Multi-node Supply Chain',
      ]),
      ...(keywords || []),
      ...(seoData?.keywords || []),
    ])
  )

  // Image resolution
  let resolvedImageUrl = DEFAULT_OG_IMAGE
  const rawImage = seoData?.ogImage || ogImage || siteSettings?.defaultOgImage

  if (rawImage) {
    if (typeof rawImage === 'string') {
      resolvedImageUrl = rawImage.startsWith('http') ? rawImage : `${baseUrl}${rawImage.startsWith('/') ? rawImage : `/${rawImage}`}`
    } else {
      try {
        const built = urlFor(rawImage)?.width(1200).height(630).fit('crop').auto('format').url()
        if (built) resolvedImageUrl = built
      } catch {
        resolvedImageUrl = DEFAULT_OG_IMAGE
      }
    }
  }

  const resolvedOgType = seoData?.ogType || ogType || 'website'
  const resolvedTwitterCard = seoData?.twitterCard || twitterCard || 'summary_large_image'
  const resolvedTwitterHandle = siteSettings?.twitterHandle || DEFAULT_TWITTER_HANDLE
  const shouldNoIndex = Boolean(noIndex || seoData?.noIndex)

  // Meta Tags
  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: 'description', content: resolvedDescription },
    { name: 'robots', content: shouldNoIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    { name: 'author', content: 'Scryme Systems Inc.' },
    { property: 'og:site_name', content: siteSettings?.siteTitle || 'Scryme ERP' },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: resolvedDescription },
    { property: 'og:url', content: fullCanonicalUrl },
    { property: 'og:type', content: resolvedOgType },
    { property: 'og:image', content: resolvedImageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: fullTitle },
    { name: 'twitter:card', content: resolvedTwitterCard },
    { name: 'twitter:site', content: resolvedTwitterHandle },
    { name: 'twitter:creator', content: resolvedTwitterHandle },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: resolvedDescription },
    { name: 'twitter:image', content: resolvedImageUrl },
  ]

  if (resolvedKeywords.length > 0) {
    meta.push({ name: 'keywords', content: resolvedKeywords.join(', ') })
  }

  // Canonical and Alternate Links
  const links: Array<Record<string, string>> = [
    { rel: 'canonical', href: fullCanonicalUrl },
  ]

  // JSON-LD Structured Data
  const jsonLdObjects: Array<Record<string, any>> = [
    // Organization
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Scryme Systems Inc.',
      url: baseUrl,
      logo: `${baseUrl}/images/screen.png`,
      sameAs: [
        'https://github.com/scryme',
        'https://twitter.com/scrymetech',
        'https://linkedin.com/company/scryme',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        url: `${baseUrl}/pricing`,
      },
    },
    // WebSite
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteSettings?.siteTitle || 'Scryme',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/pages/{search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]

  // SoftwareApplication / Product metadata for primary product/landing pages
  if (resolvedOgType === 'website' || resolvedOgType === 'product') {
    jsonLdObjects.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: fullTitle,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Cloud, Web, iOS, Android',
      description: resolvedDescription,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    })
  }

  // BreadcrumbList
  if (cleanPath && cleanPath !== '/') {
    const segments = cleanPath.split('/').filter(Boolean)
    const breadcrumbs = segments.map((segment, index) => {
      const url = `${baseUrl}/${segments.slice(0, index + 1).join('/')}`
      const name = segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      return {
        '@type': 'ListItem',
        position: index + 1,
        name,
        item: url,
      }
    })

    jsonLdObjects.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs,
    })
  }

  // FAQPage structured data if FAQs provided
  if (faqs && faqs.length > 0) {
    jsonLdObjects.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    })
  }

  // Custom user structured data if provided
  if (structuredData) {
    if (Array.isArray(structuredData)) {
      jsonLdObjects.push(...structuredData)
    } else {
      jsonLdObjects.push(structuredData)
    }
  }

  const scripts = jsonLdObjects.map((data) => ({
    type: 'application/ld+json',
    children: JSON.stringify(data),
  }))

  return {
    meta,
    links,
    scripts,
  }
}
