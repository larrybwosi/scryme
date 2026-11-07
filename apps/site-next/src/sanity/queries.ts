export interface SeoData {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  ogImage?: any
  ogType?: "website" | "article" | "product"
  twitterCard?: "summary_large_image" | "summary"
  canonicalUrl?: string
  noIndex?: boolean
}

import { sanityClient } from './client'

/* =========================================================================
   1. PRICING CONFIGURATION
   ========================================================================= */

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
        annual: {
          amount: 'Custom',
          period: '',
        },
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
    if (sanityClient) {
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

/* =========================================================================
   2. GLOBAL SITE SETTINGS & NAVIGATION
   ========================================================================= */

export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    _id,
    siteTitle,
    siteDescription,
    siteUrl,
    twitterHandle,
    defaultOgImage,
    defaultKeywords,
    announcementBanner,
    navItems,
    headerCtas,
    footerColumns,
    socialLinks,
    copyrightText
  }
`

export interface SubmenuItem {
  label: string
  description?: string
  href: string
  badge?: string
}

export interface NavItem {
  label: string
  href?: string
  isExternal?: boolean
  children?: SubmenuItem[]
}

export interface HeaderCtas {
  loginLabel?: string
  loginUrl?: string
  primaryCtaLabel?: string
  primaryCtaUrl?: string
}

export interface FooterLink {
  label: string
  href: string
  badge?: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface SocialLink {
  platform: string
  url: string
}

export interface SiteSettings {
  siteTitle?: string
  siteDescription?: string
  siteUrl?: string
  twitterHandle?: string
  defaultOgImage?: any
  defaultKeywords?: string[]
  announcementBanner?: {
    enabled?: boolean
    text?: string
    linkText?: string
    linkUrl?: string
  }
  navItems?: NavItem[]
  headerCtas?: HeaderCtas
  footerColumns?: FooterColumn[]
  socialLinks?: SocialLink[]
  copyrightText?: string
}

export const DEFAULT_SITE_SETTINGS_FALLBACK: SiteSettings = {
  siteTitle: 'Scryme - Next-Gen ERP Platform',
  siteDescription: 'Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship intelligence, and decoupled catalog engines.',
  siteUrl: 'https://scryme.tech',
  twitterHandle: '@ScrymeTech',
  defaultKeywords: [
    'ERP',
    'Scryme',
    'Autonomous ERP',
    'POS',
    'Point of Sale',
    'Real-time Inventory',
    'Multi-node Supply Chain',
    'CRM',
    'Headless CMS',
    'Open Source ERP',
  ],
  announcementBanner: {
    enabled: false,
    text: 'Scryme ERP v3.2 is now live with native M-Pesa STK push and distributed offline-first sync.',
    linkText: 'Learn more',
    linkUrl: '/payments',
  },
  navItems: [
    {
      label: 'Platform',
      children: [
        { label: 'Point of Sale', description: 'Offline-first POS with sub-second M-Pesa checkout', href: '/point-of-sale' },
        { label: 'Inventory & Warehousing', description: 'Multi-branch stock reconciliation & serial tracking', href: '/inventory' },
        { label: 'Stock Ops & Transfers', description: 'Internal transfers, approvals & batch reconciliation', href: '/stock-ops' },
        { label: 'Sales & Invoicing', description: 'Automated invoicing, tax compliance & B2B quotations', href: '/sales' },
        { label: '360° Relationship CRM', description: 'Unified customer graph & omnichannel pipeline', href: '/crm' },
        { label: 'Project & Shift Scheduling', description: 'Gantt milestones, staff shifts & time tracking', href: '/project-management-scheduling' },
        { label: 'Procurement & Suppliers', description: 'PO workflows, 3-way matching & vendor ledgers', href: '/procurement-supply-chain' },
        { label: 'Multi-Branch Locations', description: 'Geofenced attendance, branch permissions & zones', href: '/locations' },
        { label: 'Payments & Settlement', description: 'M-Pesa STK Push, card processing & automated recon', href: '/payments' },
        { label: 'Headless CMS & Catalog', description: 'Centralized product publishing & marketing pages', href: '/cms' },
        { label: 'MCP & Agent APIs', description: 'Autonomous agent integration via Model Context Protocol', href: '/mcp-agent-apis' },
        { label: 'Mobile Field Ops', description: 'Android handhelds, barcode scanning & mobile audit', href: '/mobile-field-ops' },
      ],
    },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Developers', href: '/developers/apps' },
  ],
  headerCtas: {
    loginLabel: 'Log In',
    loginUrl: 'https://app.scryme.tech/login',
    primaryCtaLabel: 'Start 14-Day Trial',
    primaryCtaUrl: 'https://app.scryme.tech/signup?plan=scale&trial=true',
  },
  footerColumns: [
    {
      title: 'Platform Modules',
      links: [
        { label: 'Point of Sale', href: '/point-of-sale' },
        { label: 'Multi-Node Inventory', href: '/inventory' },
        { label: 'Stock Operations', href: '/stock-ops' },
        { label: 'Sales Automation', href: '/sales' },
        { label: 'Relationship CRM', href: '/crm' },
        { label: 'Project Scheduling', href: '/project-management-scheduling' },
      ],
    },
    {
      title: 'Infrastructure',
      links: [
        { label: 'Payment Architecture', href: '/payments' },
        { label: 'MCP AI Endpoints', href: '/mcp-agent-apis' },
        { label: 'Mobile Field Operations', href: '/mobile-field-ops' },
        { label: 'Procurement Supply Chain', href: '/procurement-supply-chain' },
        { label: 'Branch Management', href: '/locations' },
        { label: 'Headless CMS & Catalog', href: '/cms' },
      ],
    },
    {
      title: 'Resources & Compare',
      links: [
        { label: 'Pricing & Plans', href: '/pricing' },
        { label: 'Developer Portal', href: '/developers/apps' },
        { label: 'Scryme vs Square', href: '/compare/scryme-vs-square' },
        { label: 'Scryme vs Lightspeed', href: '/compare/scryme-vs-lightspeed' },
        { label: 'Scryme vs Odoo', href: '/compare/scryme-vs-odoo' },
      ],
    },
  ],
  socialLinks: [
    { platform: 'GitHub', url: 'https://github.com/scryme' },
    { platform: 'Twitter', url: 'https://twitter.com/scrymetech' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/company/scryme' },
  ],
  copyrightText: '© 2026 Scryme Systems Inc. All rights reserved. Enterprise Operational Kernel.',
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    if (sanityClient) {
      const settings = await sanityClient.fetch(SITE_SETTINGS_QUERY)
      if (settings && (settings.navItems || settings.siteTitle)) {
        return {
          ...DEFAULT_SITE_SETTINGS_FALLBACK,
          ...settings,
        }
      }
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching site settings from API, falling back to default:', err)
  }

  return DEFAULT_SITE_SETTINGS_FALLBACK
}

/* =========================================================================
   3. HOME PAGE
   ========================================================================= */

export const HOME_PAGE_QUERY = `
  *[_type == "homePage"][0] {
    _id,
    title,
    seo {
      metaTitle,
      metaDescription,
      keywords,
      ogImage,
      ogType,
      twitterCard,
      canonicalUrl,
      noIndex
    },
    hero,
    pillarsSection,
    paradigmSection,
    metricsSection,
    faqsSection,
    bottomCta
  }
`

export interface HomeHero {
  badge?: string
  nodeCounterText?: string
  headline?: string
  subtitle?: string
  primaryCtaText?: string
  primaryCtaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  heroImage?: any
  heroImageUrlFallback?: string
  heroImageCaption?: string
  syncStateText?: string
}

export interface PillarItem {
  label?: string
  badge?: string
  stat?: string
  title?: string
  body?: string
  cta?: string
  href?: string
}

export interface HomePageData {
  _id?: string
  title?: string
  seo?: SeoData
  hero?: HomeHero
  pillarsSection?: {
    eyebrow?: string
    title?: string
    description?: string
    pillars?: PillarItem[]
  }
  paradigmSection?: {
    eyebrow?: string
    title?: string
    description?: string
    calloutTitle?: string
    calloutDescription?: string
    boardroomImageUrlFallback?: string
    legacyItems?: { title: string; description: string }[]
    kernelItems?: { title: string; description: string }[]
  }
  metricsSection?: {
    metrics?: { label: string; value: string; description: string }[]
    spotlight?: {
      badge?: string
      company?: string
      quote?: string
      authorName?: string
      authorRole?: string
      deploymentStats?: { label: string; value: string }[]
      caseStudyLink?: string
    }
  }
  faqsSection?: {
    eyebrow?: string
    title?: string
    faqs?: { q: string; a: string }[]
  }
  bottomCta?: {
    badge?: string
    title?: string
    subtitle?: string
    primaryCtaText?: string
    primaryCtaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
    guarantees?: string[]
  }
}

export const DEFAULT_HOME_PAGE_FALLBACK: HomePageData = {
  title: 'Home Page',
  hero: {
    badge: 'Scryme ERP OS v3.2 • Unified Operational Kernel',
    nodeCounterText: '180+ NODES SYNCHRONIZED',
    headline: 'Can one smarter engine scale your entire enterprise?',
    subtitle: 'Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship intelligence, and decoupled catalog engines across an immutable sub-millisecond mesh. Zero fragmented connectors.',
    primaryCtaText: 'Start 14-Day Enterprise Trial',
    primaryCtaLink: 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true',
    secondaryCtaText: 'Schedule Enterprise Demo',
    secondaryCtaLink: '/pricing',
    heroImageUrlFallback: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEcL6RQ6LruIwODktib1Z-LtAxbtJdLE_O7f1exFDsOc7JvSDz-k9MKgGrYPAdoe9EY_QgL8sN7K_t0jZNVXOUz4mAu0gbuNSyQ7SifZwM8g-jrhEVfJP3SymEuoxeNApEO1pZuMzI0agi683zEbZ6Ubvu-LFu8toq30QpFrZEovSpAYDvx-oj5W4auHNRvuYQidD6at9cfhTQ57t0E2OwlhyOFaXV7svyQ3c8M5FVSplYNGb1tg8',
    heroImageCaption: 'Autonomous Global Operations Command • Sub-12ms Telemetry Fabric across 180+ Enterprise Nodes',
    syncStateText: '0.008s Consensus',
  },
  pillarsSection: {
    eyebrow: '01 // Architectural Pillars',
    title: 'Four specialized engines. Zero operational friction.',
    description: 'Explore the modular, single-state systems powering multinational enterprises. Every action updates the kernel in sub-millisecond real time.',
    pillars: [
      {
        label: 'Pillar 01 / Commercial',
        badge: '12ms Ledger Settlement',
        stat: '+42% Win-Rate Velocity',
        title: 'Sales Automation & RevOps',
        body: 'Compress enterprise sales cycles from months to days. Automate multi-currency proposals, dynamic discount margin guardrails, and real-time inventory reservation right from the live sales pipeline.',
        cta: 'Explore Sales Automation & RevOps',
        href: '/sales',
      },
      {
        label: 'Pillar 02 / Logistics',
        badge: '184 Global Nodes Synced',
        stat: '0.02% Incident Rate',
        title: 'Smart Multi-Location Inventory',
        body: 'Track millions of physical units across distributed 3PL networks, regional fulfillment hubs, and retail stores with sub-second RFID and barcode ingestion. Never lose inventory to phantom stockouts.',
        cta: 'Explore Multi-Location Inventory Hub',
        href: '/inventory',
      },
      {
        label: 'Pillar 03 / Intelligence',
        badge: 'Unified Account Graph',
        stat: '89.4% Net Retention',
        title: '360° Relationship CRM',
        body: 'Turn fragmented customer conversations, contract proposals, support escalations, and fulfillment statuses into a unified real-time reactive customer graph with sub-minute churn prediction.',
        cta: 'Explore 360° Relationship CRM',
        href: '/crm',
      },
      {
        label: 'Pillar 04 / Omnichannel',
        badge: 'GraphQL v3.4 Ready',
        stat: '38ms P95 Latency',
        title: 'Headless CMS & Catalog Cloud',
        body: 'Synchronize multi-brand marketing pages, regional localized product catalogs, and custom customer portals directly from your ERP core without re-authoring content or managing brittle webhooks.',
        cta: 'Explore Headless CMS & Catalog Cloud',
        href: '/cms',
      },
    ],
  },
  paradigmSection: {
    eyebrow: '02 // Paradigm Shift',
    title: 'Stop paying the middleware tax on broken operational data.',
    description: 'Enterprise systems failed because they bolted isolated SaaS point solutions together with duct-tape webhooks. When data is replicated across 9 different vendors, truth becomes obsolete within 15 minutes.',
    calloutTitle: 'The True Cost of Legacy SaaS Sprawl',
    calloutDescription: 'The average $100M+ enterprise spends $184,000 annually maintaining API sync scripts, reconciling ledger mismatches, and investigating phantom inventory orders.',
    boardroomImageUrlFallback: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9ZM4bZ8DDOQzSju9oaCfN9nNGo89aQ11vBih0-9nmagA83FfZx-7i-OnYk6ctmvJc7p7o5sRLtJXLPKHNXVmlNdUnwd5S2s7W43zRJmTkkUCT4ZRM8V8J1pSA3Zj8h-4srMdJ50ilYbBV_aHnjFHudRudTggYduNejOFL6R3-BC7-N0T53Y9QSlIYbjeESVKH3_YkNeuLFpOKRamFYPJN4bH3fmpVqwjqBzQIS4ddURFD2FXULIE',
    legacyItems: [
      { title: '9 Disconnected Vendor Silos', description: 'Separate CRM, warehouse, ledger, eCommerce, and catalog databases constantly drifting apart.' },
      { title: '15+ Minute Cron Job Sync Delays', description: 'Orders accepted against already depleted inventories during flash spikes and seasonal promotions.' },
      { title: '$184k / Year In Brittle Middleware', description: 'Full-time engineers required solely to patch custom webhooks and debug failed Zapier-style flows.' },
    ],
    kernelItems: [
      { title: '1 Single Operational State Engine', description: 'Every department interacts with a unified ledger. When inventory sells, finance and sales instantly reflect it.' },
      { title: '<12ms Deterministic Telemetry', description: 'Sub-second atomic state consistency across global nodes with zero phantom stockouts.' },
      { title: 'Zero Middleware Tax', description: 'Native modules communicate through zero-overhead internal bus, eliminating middleware maintenance.' },
    ],
  },
  metricsSection: {
    metrics: [
      { label: 'Annual GMV Managed', value: '$1.2B+', description: 'Governed with zero reconciliation drift' },
      { label: 'Global Sync Latency', value: '12ms', description: 'Across multi-cloud regions' },
      { label: 'Guaranteed SLA', value: '99.999%', description: 'Mission-critical redundancy standard' },
      { label: 'Ledger Recon Reduction', value: '88%', description: 'Eliminating manual accounting friction' },
    ],
    spotlight: {
      badge: 'Customer Spotlight',
      company: 'Veloce Global Logistics AG',
      quote: 'Migrating to Scryme’s single-kernel architecture collapsed our reconciliation cycle from 3 days to literally 4 seconds. Our ops teams in Zurich and Singapore are finally looking at the exact same ledger numbers without questioning data freshness.',
      authorName: 'Elena Rostova',
      authorRole: 'Chief Operating Officer, Veloce Global Logistics',
      deploymentStats: [
        { label: 'Fulfillment Nodes:', value: '42 Facilities' },
        { label: 'SKU Catalog Scale:', value: '4.2M SKUs' },
        { label: 'Migration Timeframe:', value: '31 Business Days' },
      ],
      caseStudyLink: '/crm',
    },
  },
  faqsSection: {
    eyebrow: '03 // Architectural Inquiries',
    title: 'Frequently asked questions by enterprise engineering & leadership',
    faqs: [
      {
        q: 'How does Scryme guarantee sub-12ms sync across disparate regions without data conflicts?',
        a: 'Scryme uses an immutable state mesh powered by multi-raft consensus protocols. Rather than relying on traditional delayed database replications, ledger events are serialized into deterministic operational blocks with CRDT-backed delta resolution, preventing phantom inventory allocations and sales race conditions.',
      },
      {
        q: 'Can we gradually migrate existing data from SAP, NetSuite, or legacy custom ERPs?',
        a: 'Yes. Scryme features bidirectional Shadow Sync adapters. You can deploy our Sales Automation or Multi-Location Inventory module first, running in parallel with your legacy core while our zero-loss ETL pipelines mirror real-time records until full migration sign-off.',
      },
      {
        q: 'What are the Model Context Protocol (MCP) capabilities for our AI development teams?',
        a: 'Scryme exposes secure, enterprise-scoped MCP endpoints. Internal AI assistants and autonomous workflows can query customer credit risk, forecast warehouse restock thresholds, or generate draft contracts with full role-based access control and immutable audit trails.',
      },
      {
        q: 'What security certifications and data residency guarantees are provided?',
        a: 'Scryme is SOC 2 Type II and ISO/IEC 27001 certified. We support dedicated sovereign VPC instances across Frankfurt, Zurich, Northern Virginia, Singapore, and Tokyo with TLS 1.3 in-transit and AES-256 field-level encryption at rest.',
      },
    ],
  },
  bottomCta: {
    badge: 'Autonomous Enterprise Orchestration',
    title: 'Reclaim command of your global operations today.',
    subtitle: 'Speak directly with a Principal Enterprise Solutions Architect or spin up an isolated staging sandbox loaded with your sample catalog and node taxonomy.',
    primaryCtaText: 'Start 14-Day Enterprise Trial',
    primaryCtaLink: 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true',
    secondaryCtaText: 'Schedule Architecture Review',
    secondaryCtaLink: '/pricing',
    guarantees: ['NO LEGACY CONNECTORS NEEDED', 'DEDICATED SOVEREIGN HOSTING', '99.999% RUNTIME SLA'],
  },
}

export async function fetchHomePage(): Promise<HomePageData> {
  try {
    if (sanityClient) {
      const page = await sanityClient.fetch(HOME_PAGE_QUERY)
      if (page && (page.hero || page.pillarsSection)) {
        return {
          ...DEFAULT_HOME_PAGE_FALLBACK,
          ...page,
        }
      }
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching home page from API, falling back to default:', err)
  }

  return DEFAULT_HOME_PAGE_FALLBACK
}

/* =========================================================================
   4. CMS PAGE
   ========================================================================= */

export const CMS_PAGE_QUERY = `
  *[_type == "cmsPage"][0] {
    _id,
    title,
    seo {
      metaTitle,
      metaDescription,
      keywords,
      ogImage,
      ogType,
      twitterCard,
      canonicalUrl,
      noIndex
    },
    hero,
    features,
    architecturePoints,
    bottomCta
  }
`

export interface CmsPageData {
  _id?: string
  title?: string
  seo?: SeoData
  hero?: {
    badge?: string
    headline?: string
    subtitle?: string
    primaryCtaText?: string
    primaryCtaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
  }
  features?: {
    icon?: string
    title: string
    description?: string
    badge?: string
  }[]
  architecturePoints?: {
    title: string
    description?: string
    codeSnippet?: string
  }[]
  bottomCta?: {
    badge?: string
    title?: string
    subtitle?: string
    primaryCtaText?: string
    primaryCtaLink?: string
  }
}

export const DEFAULT_CMS_PAGE_FALLBACK: CmsPageData = {
  title: 'Headless CMS & Catalog Cloud',
  hero: {
    badge: 'Headless CMS & Catalog Cloud • v3.4',
    headline: 'Single-Source Content & Dynamic Catalog Mesh',
    subtitle: 'Synchronize localized merchandising, multi-brand marketing copy, and real-time inventory pricing directly from your ERP core to any frontend framework.',
    primaryCtaText: 'Deploy Free Workspace',
    primaryCtaLink: 'https://app.scryme.tech/signup?plan=free',
    secondaryCtaText: 'Explore Catalog APIs',
    secondaryCtaLink: '/developers/apps',
  },
  features: [
    {
      title: 'Decoupled Multi-Channel Publishing',
      description: 'Author pages, banners, announcements, and localized promotions once and broadcast instantly via edge GraphQL and REST APIs.',
      badge: 'Edge-First',
    },
    {
      title: 'Real-Time Inventory Synchronization',
      description: 'Product availability, stock levels, and multi-currency pricing stay synchronised with your physical warehouses with sub-millisecond precision.',
      badge: 'Zero Drift',
    },
    {
      title: 'Sanity Studio CMS Embedded',
      description: 'Empower marketing and copywriters with visual editing, localized preview modes, and schema-driven page builders.',
      badge: 'Structured Content',
    },
  ],
  bottomCta: {
    badge: 'Omnichannel Publishing',
    title: 'Power your storefronts with live ERP content',
    subtitle: 'Zero headless disconnects. Build fast, scalable commerce experiences with Scryme.',
    primaryCtaText: 'Get Started with Free Tier',
    primaryCtaLink: 'https://app.scryme.tech/signup?plan=free',
  },
}

export async function fetchCmsPage(): Promise<CmsPageData> {
  try {
    if (sanityClient) {
      const page = await sanityClient.fetch(CMS_PAGE_QUERY)
      if (page && (page.hero || page.features)) {
        return {
          ...DEFAULT_CMS_PAGE_FALLBACK,
          ...page,
        }
      }
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching CMS page from API, falling back to default:', err)
  }

  return DEFAULT_CMS_PAGE_FALLBACK
}

/* =========================================================================
   5. CRM PAGE
   ========================================================================= */

export const CRM_PAGE_QUERY = `
  *[_type == "crmPage"][0] {
    _id,
    title,
    seo {
      metaTitle,
      metaDescription,
      keywords,
      ogImage,
      ogType,
      twitterCard,
      canonicalUrl,
      noIndex
    },
    hero,
    features,
    testimonials,
    bottomCta
  }
`

export interface CrmPageData {
  _id?: string
  title?: string
  seo?: SeoData
  hero?: {
    badge?: string
    headline?: string
    subtitle?: string
    primaryCtaText?: string
    primaryCtaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
  }
  features?: {
    icon?: string
    title: string
    description?: string
    metricBadge?: string
  }[]
  testimonials?: {
    quote?: string
    authorName?: string
    authorRole?: string
    company?: string
  }[]
  bottomCta?: {
    badge?: string
    title?: string
    subtitle?: string
    primaryCtaText?: string
    primaryCtaLink?: string
  }
}

export const DEFAULT_CRM_PAGE_FALLBACK: CrmPageData = {
  title: '360° Relationship CRM',
  hero: {
    badge: '360° Relationship CRM • Enterprise Graph',
    headline: 'Real-Time Customer Graph Driven by Operational Truth',
    subtitle: 'Bridge commercial pipelines, account health metrics, billing status, and warehouse fulfillments into one unified customer graph. Prevent churn before it happens.',
    primaryCtaText: 'Start 14-Day Free Trial',
    primaryCtaLink: 'https://app.scryme.tech/signup?plan=growth&trial=true',
    secondaryCtaText: 'Book Enterprise Demo',
    secondaryCtaLink: '/pricing',
  },
  features: [
    {
      title: 'Automated Account Graph & Signals',
      description: 'Aggregate historical checkout frequency, outstanding receivables, open support tickets, and sales velocity.',
      metricBadge: '+42% Win Velocity',
    },
    {
      title: 'Omnichannel Conversation Timeline',
      description: 'Unify WhatsApp, email, and live retail order notes into one chronological customer activity feed.',
      metricBadge: 'Zero Silos',
    },
    {
      title: 'Predictive Margin & Churn Intelligence',
      description: 'Telemetry models alert sales directors when re-order intervals decay or margin thresholds are compromised.',
      metricBadge: '89.4% Net Retention',
    },
  ],
  bottomCta: {
    badge: 'Accelerate Growth',
    title: 'Turn customer interactions into lasting enterprise relationships',
    subtitle: 'Experience CRM seamlessly interwoven with inventory, finance, and POS.',
    primaryCtaText: 'Deploy Growth Workspace',
    primaryCtaLink: 'https://app.scryme.tech/signup?plan=growth',
  },
}

export async function fetchCrmPage(): Promise<CrmPageData> {
  try {
    if (sanityClient) {
      const page = await sanityClient.fetch(CRM_PAGE_QUERY)
      if (page && (page.hero || page.features)) {
        return {
          ...DEFAULT_CRM_PAGE_FALLBACK,
          ...page,
        }
      }
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching CRM page from API, falling back to default:', err)
  }

  return DEFAULT_CRM_PAGE_FALLBACK
}

/* =========================================================================
   6. PAYMENTS PAGE
   ========================================================================= */

export const PAYMENTS_PAGE_QUERY = `
  *[_type == "paymentsPage"][0] {
    _id,
    title,
    seo {
      metaTitle,
      metaDescription,
      keywords,
      ogImage,
      ogType,
      twitterCard,
      canonicalUrl,
      noIndex
    },
    hero,
    channels,
    settlementPoints
  }
`

export interface PaymentsPageData {
  _id?: string
  title?: string
  seo?: SeoData
  hero?: {
    badge?: string
    headline?: string
    subtitle?: string
    primaryCtaText?: string
    primaryCtaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
  }
  channels?: {
    title: string
    badge?: string
    description?: string
    icon?: string
    highlights?: string[]
  }[]
  settlementPoints?: {
    title: string
    description?: string
    stat?: string
  }[]
}

export const DEFAULT_PAYMENTS_PAGE_FALLBACK: PaymentsPageData = {
  title: 'Payments Infrastructure',
  hero: {
    badge: 'Omnichannel Payment Infrastructure • Sub-2s Settlement',
    headline: 'Unified Payment Processing & Automated Ledger Reconciliation',
    subtitle: 'Accept localized M-Pesa mobile payments, global credit cards, Apple Pay, and wire transfers directly inside your POS and checkout workflows with zero reconciliation friction.',
    primaryCtaText: 'Deploy Scale Workspace',
    primaryCtaLink: 'https://app.scryme.tech/signup?plan=scale&trial=true',
    secondaryCtaText: 'Start Free Testing ($0/mo)',
    secondaryCtaLink: 'https://app.scryme.tech/signup?plan=free',
  },
  channels: [
    {
      title: 'Safaricom M-Pesa STK Push & Paybill',
      badge: 'Sub-2s Direct Prompt',
      description: 'Trigger instant M-Pesa PIN prompts directly on customer smartphones with zero manual reference entry.',
      highlights: ['Direct Safaricom Daraja API integration', 'Automated reconciliation with sales orders', 'Zero chargeback risk'],
    },
    {
      title: 'Credit & Debit Cards (Global & Regional)',
      badge: 'Visa • Mastercard • Amex',
      description: 'PCI-DSS Level 1 compliant card processing with localized routing for lower interchange fees.',
      highlights: ['Apple Pay & Google Pay ready', 'Multi-currency settlement (USD, KSH, EUR)', '3D Secure fraud prevention'],
    },
    {
      title: 'Corporate Invoicing & Wire Transfers',
      badge: 'ACH • SEPA • RTGS',
      description: 'Automated invoice settlement tracking with real-time bank ledger reconciliation.',
      highlights: ['Custom credit terms (Net 30, Net 60)', 'Automated reminder emails and statements', 'Dual-control payment approvals'],
    },
  ],
}

export async function fetchPaymentsPage(): Promise<PaymentsPageData> {
  try {
    if (sanityClient) {
      const page = await sanityClient.fetch(PAYMENTS_PAGE_QUERY)
      if (page && (page.hero || page.channels)) {
        return {
          ...DEFAULT_PAYMENTS_PAGE_FALLBACK,
          ...page,
        }
      }
    }
  } catch (err) {
    console.warn('[Sanity] Error fetching payments page from API, falling back to default:', err)
  }

  return DEFAULT_PAYMENTS_PAGE_FALLBACK
}

/* =========================================================================
   7. DYNAMIC PAGES & COMPARISONS
   ========================================================================= */

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
      ogType,
      twitterCard,
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
    if (sanityClient) {
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
    if (sanityClient) {
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
