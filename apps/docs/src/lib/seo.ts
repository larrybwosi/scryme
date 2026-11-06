export interface SeoProps {
  title: string
  description: string
  keywords?: string[]
  pathname?: string
  ogType?: 'website' | 'article'
  image?: string
}

const SITE_URL = 'https://docs.scryme.tech'
const DEFAULT_IMAGE = 'https://docs.scryme.tech/og-image.png'

export function createDocSeo({
  title,
  description,
  keywords = [],
  pathname = '',
  ogType = 'website',
  image = DEFAULT_IMAGE
}: SeoProps) {
  const fullTitle = `${title} | Scryme Developer Docs`
  const canonicalUrl = `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
  const defaultKeywords = [
    'Scryme',
    'ERP',
    'POS',
    'Inventory Management',
    'Stocking',
    'Retail API',
    'Multi-tenant Architecture',
    ...keywords
  ]

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      { name: 'keywords', content: defaultKeywords.join(', ') },
      { name: 'robots', content: 'index, follow' },
      // Open Graph
      { property: 'og:site_name', content: 'Scryme Developer Docs' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: image },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl }
    ]
  }
}
