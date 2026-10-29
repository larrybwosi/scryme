import { sanityClient } from './client'

export const PRICING_CONFIG_QUERY = `
  *[_type == "pricingConfig"][0] {
    _id,
    _type,
    title,
    heroBadge,
    heroTitle,
    heroSubtitle,
    currencies,
    faqs
  }
`

export interface PlanPricing {
  amount: string
  period: string
  billedNote?: string
}

export interface CurrencyData {
  code: string
  symbol: string
  name: string
  badge: string
  free?: { monthly?: PlanPricing; annual?: PlanPricing }
  growth?: { monthly?: PlanPricing; annual?: PlanPricing }
  scale?: { monthly?: PlanPricing; annual?: PlanPricing }
  enterprise?: { monthly?: PlanPricing; annual?: PlanPricing }
}

export interface PricingFaq {
  q: string
  a: string
}

export interface PricingConfig {
  _id?: string
  _type?: string
  title?: string
  heroBadge?: string
  heroTitle?: string
  heroSubtitle?: string
  currencies?: CurrencyData[]
  faqs?: PricingFaq[]
}

export const DEFAULT_PRICING_FALLBACK: PricingConfig = {
  title: 'Global Site Pricing Configuration',
  heroBadge: '14-Day Free Trial • Instant Deployment • Zero Risk',
  heroTitle: 'Predictable Pricing Engineered for Limitless Enterprise Scale',
  heroSubtitle: 'No per-user penalties or hidden seat taxes. Unify your operational software stack under one transparent, telemetry-based billing model.',
  currencies: [
    {
      code: 'USD',
      symbol: '$',
      name: 'USD ($)',
      badge: 'Global USD',
      free: {
        monthly: { amount: '$0', period: '/ month' },
        annual: { amount: '$0', period: '/ month' },
      },
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
    {
      code: 'KSH',
      symbol: 'KSh ',
      name: 'KSh (M-Pesa)',
      badge: 'M-Pesa Direct',
      free: {
        monthly: { amount: 'KSh 0', period: '/ month' },
        annual: { amount: 'KSh 0', period: '/ month' },
      },
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
    {
      code: 'EUR',
      symbol: '€',
      name: 'EUR (€)',
      badge: 'Eurozone SEPA',
      free: {
        monthly: { amount: '€0', period: '/ month' },
        annual: { amount: '€0', period: '/ month' },
      },
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
  ],
  faqs: [
    {
      q: 'How does the 14-day free trial work?',
      a: 'When you sign up for Growth or Scale tiers, you receive full platform access for 14 days without charge. You can upgrade, switch billing cycles, or cancel anytime before the trial period ends.',
    },
    {
      q: 'What payment options do you support?',
      a: 'We support M-Pesa (STK push & direct paybill), all major credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and bank wire transfers (ACH/SEPA/SWIFT) for annual commitments.',
    },
    {
      q: 'Are there per-seat or per-user licensing fees?',
      a: 'No. Scryme believes charging per-seat penalizes business growth and discourages cross-department collaboration. All plans include unlimited user seats.',
    },
    {
      q: 'Can I change my billing cycle or currency later?',
      a: 'Yes. You can switch between Monthly and Annual billing or adjust your default workspace currency at any time directly in Organization Settings.',
    },
    {
      q: 'What happens if our order volume exceeds the plan threshold?',
      a: 'You are never cut off. Overages are billed transparently at fractional cents per transaction without service degradation.',
    },
    {
      q: 'How long does migration from NetSuite or SAP take?',
      a: 'Our automated zero-loss ingestion connectors typically complete data migration and validation within 48 to 72 hours.',
    },
  ],
}

export async function fetchPricingConfig(): Promise<PricingConfig> {
  try {
    if (sanityClient && process.env.VITE_SANITY_PROJECT_ID !== 'placeholder_project_id') {
      const config = await sanityClient.fetch(PRICING_CONFIG_QUERY)
      if (config && config.currencies && config.currencies.length > 0) {
        return config
      }
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching pricing config from API, falling back to default:', err)
  }

  return DEFAULT_PRICING_FALLBACK
}

export const COMPARISON_PAGE_QUERY = `
  *[_type == "comparisonPage" && slug.current == $slug][0] {
    _id,
    _type,
    title,
    "slug": slug.current,
    competitorName,
    competitorLogo,
    seo {
      metaTitle,
      metaDescription,
      keywords,
      ogImage,
      canonicalUrl,
      noIndex
    },
    modules
  }
`

export const LANDING_PAGE_QUERY = `
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    _type,
    title,
    "slug": slug.current,
    seo {
      metaTitle,
      metaDescription,
      keywords,
      ogImage,
      canonicalUrl,
      noIndex
    },
    modules
  }
`

const DEFAULT_COMPARISON_FALLBACKS: Record<string, any> = {
  'scryme-vs-square': {
    title: 'Scryme vs Square — Next-Gen Enterprise ERP vs Legacy POS',
    slug: 'scryme-vs-square',
    competitorName: 'Square',
    seo: {
      metaTitle: 'Scryme vs Square: Comparison for Enterprise Merchants (2025)',
      metaDescription: 'Discover why African & global enterprises choose Scryme over Square for native M-Pesa STK Push, multi-currency accounting, and zero monthly lock-in fees.',
      keywords: ['Scryme vs Square', 'Square POS alternative', 'M-Pesa POS Kenya', 'Enterprise ERP Africa'],
    },
    modules: [
      {
        _type: 'heroBlock',
        badge: 'Scryme vs Square',
        headline: 'The Next-Gen Enterprise ERP Built for African Commerce',
        subtitle: 'Looking for a Square alternative with native M-Pesa STK push, real-time multi-branch stocking, and multi-currency accounting? See why top brands are making the switch.',
        primaryCtaText: 'Start 14-Day Free Trial',
        primaryCtaLink: 'https://app.scryme.tech/signup',
        secondaryCtaText: 'Book a Live Demo',
        secondaryCtaLink: 'https://app.scryme.tech/signup?plan=enterprise',
        ratingText: 'Rated 4.9/5 by over 500+ multi-branch enterprises across East Africa',
      },
      {
        _type: 'statsBarBlock',
        title: 'Built for Scale, Speed, and Zero Secret Fees',
        stats: [
          { value: '0s', label: 'M-Pesa Delay', subtext: 'Direct STK Push integrated' },
          { value: '10x', label: 'Faster Sync', subtext: 'Offline-first POS architecture' },
          { value: '100%', label: 'Tax Compliant', subtext: 'Automated KRA eTIMS & VAT' },
          { value: '$0', label: 'Plugin Lock-in', subtext: 'All features built into standard plans' },
        ],
      },
      {
        _type: 'comparisonMatrixBlock',
        title: 'Direct Head-to-Head Feature Comparison',
        description: 'See how Scryme outperforms Square across core POS, payments, inventory, and multi-branch enterprise features.',
        competitorName: 'Square',
        scrymeBadge: 'Winner • Next-Gen ERP',
        categories: [
          {
            categoryName: 'Payment Options & Local Currency',
            features: [
              {
                featureName: 'Native M-Pesa STK Push',
                featureDescription: 'Direct Safaricom Daraja API STK push prompt directly to customer phone.',
                scrymeSupport: 'full',
                scrymeValueText: 'Native direct integration',
                competitorSupport: 'none',
                competitorValueText: 'Not supported in Africa',
              },
              {
                featureName: 'Multi-Currency & FX Accounting',
                featureDescription: 'Simultaneous support for KSH, USD, EUR, UGX, TZS with live FX conversion.',
                scrymeSupport: 'full',
                scrymeValueText: 'Built-in real-time rates',
                competitorSupport: 'partial',
                competitorValueText: 'Requires custom workaround',
              },
            ],
          },
          {
            categoryName: 'Inventory & Operations',
            features: [
              {
                featureName: 'Multi-Branch Stock Reconciliation',
                featureDescription: 'Inter-branch stock transfers, approvals, batch tracking, and variance reconciliation.',
                scrymeSupport: 'full',
                scrymeValueText: 'Multi-tenant isolation & security',
                competitorSupport: 'partial',
                competitorValueText: 'Requires Square for Retail plan ($89/mo)',
              },
              {
                featureName: 'Bakery & Recipe Manufacturing',
                featureDescription: "Sub-recipes, baker's percentages, flour basis hydration metrics, and raw stock deduction.",
                scrymeSupport: 'full',
                scrymeValueText: 'Native bakery & kitchen ERP',
                competitorSupport: 'none',
                competitorValueText: 'Requires 3rd party plugin',
              },
            ],
          },
        ],
        verdictTitle: 'Ready to upgrade to Scryme?',
        verdictText: 'Migrate your existing catalog and sales data in less than 15 minutes with our automated importer.',
      },
      {
        _type: 'featureGridBlock',
        badge: 'Why Switch?',
        title: 'Everything You Need in One Unified Workspace',
        subtitle: 'Stop stitching together 5 different apps. Scryme gives you POS, Inventory, CRM, Shift Scheduling, and Accounting out of the box.',
        columns: '3',
        features: [
          {
            icon: 'Smartphone',
            title: 'Native Android & POS App',
            description: 'Run your register on dedicated Tauri desktop POS, Android handhelds, or web browsers.',
            tag: 'Cross-Platform',
          },
          {
            icon: 'Zap',
            title: 'Instant M-Pesa Callbacks',
            description: 'Automatic payment confirmation in under 2 seconds without manually typing transaction codes.',
            tag: 'Automated',
          },
          {
            icon: 'ShieldCheck',
            title: 'Enterprise Multi-Tenant Security',
            description: 'Strict BOLA tenant isolation and role-based access control for cashiers, managers, and owners.',
            tag: 'Bank-Grade',
          },
        ],
      },
      {
        _type: 'testimonialsBlock',
        badge: 'Merchant Stories',
        title: 'Hear From Merchants Who Switched',
        items: [
          {
            quote: 'Switching from Square to Scryme reduced our checkout time by 60% because M-Pesa payments prompt automatically on the customer phone.',
            authorName: 'Maina Kamau',
            authorRole: 'Operations Director',
            companyName: 'Java Point Outlets',
            rating: 5,
            switchedFrom: 'Switched from Square',
          },
        ],
      },
      {
        _type: 'faqAccordionBlock',
        badge: 'FAQ',
        title: 'Frequently Asked Questions',
        faqs: [
          {
            question: 'Can I import my catalog from Square into Scryme?',
            answer: 'Yes! Scryme provides a 1-click CSV importer for products, variants, pricing, and customer records directly from Square.',
          },
          {
            question: 'How does M-Pesa integration work on Scryme?',
            answer: 'Scryme connects directly to Safaricom Daraja STK push API. When a sale is initiated, the customer receives an instant M-Pesa PIN prompt on their phone.',
          },
        ],
      },
      {
        _type: 'ctaBannerBlock',
        badge: 'Get Started Today',
        title: 'Upgrade your store operations with Scryme',
        subtitle: 'Start your free 14-day trial now. No credit card required.',
        primaryCtaText: 'Start Free Trial',
        primaryCtaLink: 'https://app.scryme.tech/signup',
      },
    ],
  },
}

export async function fetchComparisonPageBySlug(slug: string) {
  try {
    if (sanityClient && process.env.VITE_SANITY_PROJECT_ID !== 'placeholder_project_id') {
      const page = await sanityClient.fetch(COMPARISON_PAGE_QUERY, { slug })
      if (page) return page
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching comparison page from API, falling back to default:', err)
  }

  if (DEFAULT_COMPARISON_FALLBACKS[slug]) {
    return DEFAULT_COMPARISON_FALLBACKS[slug]
  }

  const normalizedCompetitor = slug.replace(/^scryme-vs-/, '').replace(/-/g, ' ')
  const formattedCompetitor = normalizedCompetitor.charAt(0).toUpperCase() + normalizedCompetitor.slice(1)

  return {
    title: `Scryme vs ${formattedCompetitor} — Enterprise Comparison`,
    slug,
    competitorName: formattedCompetitor,
    seo: {
      metaTitle: `Scryme vs ${formattedCompetitor}: Enterprise Comparison`,
      metaDescription: `Compare Scryme against ${formattedCompetitor}. Native M-Pesa, real-time inventory, and zero lock-in fees.`,
    },
    modules: [
      {
        _type: 'heroBlock',
        badge: `Scryme vs ${formattedCompetitor}`,
        headline: `Why Businesses Choose Scryme Over ${formattedCompetitor}`,
        subtitle: `Discover how Scryme provides a faster, more reliable ERP experience tailored for modern enterprises.`,
        primaryCtaText: 'Start Free Trial',
        primaryCtaLink: 'https://app.scryme.tech/signup',
      },
      {
        _type: 'comparisonMatrixBlock',
        title: 'Feature-by-Feature Comparison',
        competitorName: formattedCompetitor,
        categories: [
          {
            categoryName: 'Core Features',
            features: [
              {
                featureName: 'Native Payment & M-Pesa STK Push',
                scrymeSupport: 'full',
                scrymeValueText: 'Integrated STK Push',
                competitorSupport: 'none',
                competitorValueText: 'Not supported',
              },
            ],
          },
        ],
      },
      {
        _type: 'ctaBannerBlock',
        title: `Switch from ${formattedCompetitor} to Scryme`,
        primaryCtaText: 'Start Free Trial',
      },
    ],
  }
}

export async function fetchLandingPageBySlug(slug: string) {
  try {
    if (sanityClient && process.env.VITE_SANITY_PROJECT_ID !== 'placeholder_project_id') {
      const page = await sanityClient.fetch(LANDING_PAGE_QUERY, { slug })
      if (page) return page
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching landing page from API, falling back to default:', err)
  }

  return {
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    slug,
    seo: {
      metaTitle: `${slug.replace(/-/g, ' ')} | Scryme ERP`,
      metaDescription: `Explore ${slug.replace(/-/g, ' ')} solutions built on Scryme's next-gen ERP platform.`,
    },
    modules: [
      {
        _type: 'heroBlock',
        badge: 'Scryme Platform',
        headline: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        subtitle: 'Supercharge your store operations, stocking, and sales with Scryme.',
        primaryCtaText: 'Start 14-Day Free Trial',
        primaryCtaLink: 'https://app.scryme.tech/signup',
      },
      {
        _type: 'ctaBannerBlock',
        title: 'Ready to transform your business?',
        primaryCtaText: 'Start Free Trial',
      },
    ],
  }
}
