import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from './env'

// Hardcoded static data to seed if not already present
const DEFAULT_HOME_PAGE = {
  _id: 'homePage',
  _type: 'homePage',
  heroTitle: 'Every sale, deal, and shipment. One reconciled record.',
  heroSubtitle: 'Scryme merges CRM, Point of Sale, Inventory, and Finance into a single ledger — so nothing you run your business on ever needs reconciling by hand again.',
  reconciledToday: 284900,
  brands: [
    'Westfield Retail',
    'Meridian Corp',
    'Fontaine Group',
    'Harlen & Co.',
    'Argent Industries',
    'Solis Distributors',
    'Kestrel Holdings',
  ],
  modules: [
    {
      code: 'CRM',
      name: 'Customer Relationship Management',
      description: 'Track every interaction, run the pipeline, and automate follow-ups — each closed deal posts straight to Finance and unlocks fulfillment in Inventory.',
      connectsTo: ['FIN', 'INV'],
      href: '/products/crm',
      accent: '#C89A4B',
    },
    {
      code: 'POS',
      name: 'Point of Sale',
      description: 'Ring up retail and wholesale sales, offline-capable, with stock and revenue reconciled to the second the register closes.',
      connectsTo: ['INV', 'FIN'],
      href: '/products/pos',
      accent: '#4B9073',
    },
    {
      code: 'INV',
      name: 'Inventory Management',
      description: 'Monitor stock across warehouses and storefronts, with automatic reorders that draw straight from committed Finance budgets.',
      connectsTo: ['POS', 'FIN'],
      href: '/products/inventory',
      accent: '#7C93B0',
    },
    {
      code: 'FIN',
      name: 'Financial Management',
      description: 'Invoicing, expense tracking, and reconciliation — every entry from CRM, POS, and Inventory lands here as one ledger line.',
      connectsTo: ['CRM', 'POS', 'INV'],
      href: '/products/finance',
      accent: '#B4553A',
    },
    {
      code: 'HR',
      name: 'HR & Workforce',
      description: 'Manage people, attendance, and payroll, with labor cost flowing directly into the same Finance ledger as everything else.',
      connectsTo: ['FIN'],
      href: '/products/hr',
      accent: '#9A7FB0',
    },
    {
      code: 'BI',
      name: 'Business Analytics',
      description: "Every module writes to one record, so reporting is never a reconciliation project — it's a query against a single source of truth.",
      connectsTo: ['CRM', 'POS', 'INV', 'FIN', 'HR'],
      href: '/products/analytics',
      accent: '#4E7FB5',
    },
  ],
  stats: [
    {
      value: '500+',
      label: 'Enterprise businesses',
      sublabel: 'across 12 countries',
    },
    {
      value: '$2B+',
      label: 'Transactions processed',
      sublabel: 'annually on the platform',
    },
    {
      value: '99.9%',
      label: 'Platform uptime SLA',
      sublabel: 'guaranteed & monitored',
    },
    {
      value: '24/7',
      label: 'Expert support',
      sublabel: 'dedicated account teams',
    },
  ],
  testimonials: [
    {
      quote: 'Scryme replaced four separate systems we were running. Our operations team now has a single dashboard for everything — inventory, POS, CRM, and finance. The ROI in the first quarter alone paid for the full-year subscription.',
      name: 'Amara Diallo',
      title: 'Chief Operating Officer',
      company: 'Fontaine Group',
      ticker: 'FTN',
      initials: 'AD',
    },
    {
      quote: 'We run 23 retail branches across three regions. Before Scryme, reconciling end-of-day sales was a half-day job. Now it takes minutes. The multi-branch inventory visibility alone is a game changer.',
      name: 'Marcus Chen',
      title: 'Head of Retail Operations',
      company: 'Westfield Retail Holdings',
      ticker: 'WRH',
      initials: 'MC',
    },
    {
      quote: 'The CRM pipeline gave our sales team a new level of accountability. We went from guessing what was in the pipeline to having real-time data on every deal. Deal velocity improved 40% in our first six months.',
      name: 'Sophia Hargreaves',
      title: 'VP of Sales',
      company: 'Meridian Corp',
      ticker: 'MRD',
      initials: 'SH',
    },
  ],
}

const DEFAULT_ABOUT_PAGE = {
  _id: 'aboutPage',
  _type: 'aboutPage',
  heroTitle: 'The ERP built for businesses that can\'t afford to stop',
  heroSubtitle: 'We built Scryme after watching too many retailers lose hours every week reconciling spreadsheets, battling unreliable POS systems, and missing growth because their tools were designed for someone else. Scryme is different — purpose-built for the businesses that keep the economy moving.',
  stats: [
    { value: '4,200+', label: 'Businesses on Scryme' },
    { value: '18', label: 'Countries' },
    { value: '$3.8M+', label: 'Transactions daily' },
    { value: '4.9 / 5', label: 'Customer satisfaction' },
  ],
  missionTitle: 'Give every business the tools that used to require a Fortune 500 budget',
  missionText: [
    'Enterprise ERP platforms have long been out of reach for independent retailers and mid-market wholesalers — priced in six-figure implementation fees and requiring dedicated IT departments to maintain.',
    'Scryme changes that. We ship a unified platform — CRM, POS, Inventory, and Finance — that a 10-person team can run as confidently as a 10,000-person organisation. Our pricing is transparent, our onboarding is measured in days not months, and our support is staffed by people who understand retail and wholesale.',
  ],
  timeline: [
    {
      year: '2019',
      milestone: 'Founded in Accra, Ghana. First POS beta shipped to 12 local retailers.',
    },
    {
      year: '2021',
      milestone: 'Launched CRM and Inventory modules. Reached 500 businesses across West Africa.',
    },
    {
      year: '2022',
      milestone: 'Series A funding. Expanded to UK and Southeast Asia markets.',
    },
    {
      year: '2023',
      milestone: 'Launched Finance module and Tauri desktop POS. Crossed 2,000 customers.',
    },
    {
      year: '2025',
      milestone: '4,200+ businesses in 18 countries. $3.8M+ daily transactions processed.',
    },
  ],
  values: [
    {
      tag: 'RF',
      title: 'Reliability first',
      desc: 'Our offline-first POS and 99.9% uptime commitment mean your business keeps running — no matter what the network does.',
    },
    {
      tag: 'RO',
      title: 'Built for real operations',
      desc: 'Every feature in Scryme was informed by actual conversations with retailers and wholesalers, not theoretical user stories.',
    },
    {
      tag: 'TP',
      title: 'Transparent pricing',
      desc: 'No hidden modules, no per-feature add-ons. The price you see is what you pay — features included as your business scales.',
    },
    {
      tag: 'LP',
      title: 'Long-term partnership',
      desc: "We measure success by our customers' revenue growth, not activation rates. Our team is reachable, accountable, and invested.",
    },
  ],
  team: [
    { name: 'Adeola Mensah', role: 'Chief Executive Officer', initials: 'AM' },
    { name: 'Yuki Tanaka', role: 'Chief Product Officer', initials: 'YT' },
    { name: 'Samuel Osei', role: 'Chief Technology Officer', initials: 'SO' },
    { name: 'Lena Hoffmann', role: 'VP of Customer Success', initials: 'LH' },
    { name: 'Priya Rajan', role: 'Head of Engineering', initials: 'PR' },
    { name: 'Marcus Webb', role: 'Head of Sales', initials: 'MW' },
  ],
}

const DEFAULT_PRICING_PAGE = {
  _id: 'pricingPage',
  _type: 'pricingPage',
  heroTitle: 'Simple pricing. No surprises.',
  heroSubtitle: 'Every plan includes a 30-day free trial with full feature access. No credit card required.',
  plans: [
    {
      name: 'Starter',
      price: '$49',
      period: '/mo',
      tagline: 'For independent retailers getting started',
      cta: 'Start free trial',
      href: 'https://app.scryme.tech/sign-up',
      highlight: false,
      features: [
        '1 POS terminal',
        '1 store location',
        'Up to 500 SKUs',
        'Basic inventory tracking',
        'Daily sales reports',
        'Email support',
      ],
    },
    {
      name: 'Growth',
      price: '$149',
      period: '/mo',
      tagline: 'For growing businesses with multiple staff',
      cta: 'Start free trial',
      href: 'https://app.scryme.tech/sign-up',
      highlight: true,
      badge: 'Most popular',
      features: [
        'Up to 5 POS terminals',
        'Up to 3 locations',
        'Unlimited SKUs',
        'Full inventory + transfers',
        'CRM — up to 2,500 contacts',
        'Finance module',
        'Demand forecasting',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tagline: 'For large retailers and wholesale operations',
      cta: 'Talk to sales',
      href: 'https://app.scryme.tech/sign-up',
      highlight: false,
      badge: '',
      features: [
        'Unlimited POS terminals',
        'Unlimited locations',
        'Unlimited SKUs',
        'Full inventory + transfers',
        'CRM — unlimited contacts',
        'Finance module',
        'Demand forecasting',
        'Dedicated success manager',
        'Custom SLA & onboarding',
      ],
    },
  ],
  comparisonRows: [
    {
      feature: 'POS terminals',
      starter: '1',
      growth: 'Up to 5',
      enterprise: 'Unlimited',
    },
    {
      feature: 'Store locations',
      starter: '1',
      growth: 'Up to 3',
      enterprise: 'Unlimited',
    },
    {
      feature: 'SKU limit',
      starter: '500',
      growth: 'Unlimited',
      enterprise: 'Unlimited',
    },
    {
      feature: 'CRM contacts',
      starter: '—',
      growth: '2,500',
      enterprise: 'Unlimited',
    },
    { feature: 'Finance module', starter: '—', growth: 'Included', enterprise: 'Included' },
    {
      feature: 'Demand forecasting',
      starter: '—',
      growth: 'Included',
      enterprise: 'Included',
    },
    { feature: 'API access', starter: '—', growth: 'Included', enterprise: 'Included' },
    {
      feature: 'Custom integrations',
      starter: '—',
      growth: '—',
      enterprise: 'Included',
    },
    { feature: 'Dedicated CSM', starter: '—', growth: '—', enterprise: 'Included' },
    { feature: 'Custom SLA', starter: '—', growth: '—', enterprise: 'Included' },
    {
      feature: 'On-premise deployment',
      starter: '—',
      growth: '—',
      enterprise: 'Included',
    },
  ],
  faqItems: [
    {
      q: 'Can I change plans at any time?',
      a: 'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing cycle.',
    },
    {
      q: 'What happens after the 30-day trial?',
      a: 'At the end of your trial, you choose a plan and enter payment details. If you decide not to continue, your data is retained for 60 days before deletion.',
    },
    {
      q: 'Is there a setup or onboarding fee?',
      a: 'No setup fees on Starter or Growth. Enterprise customers receive guided onboarding as part of their package at no extra cost.',
    },
    {
      q: 'Can I run Scryme POS without an internet connection?',
      a: 'Yes. The POS desktop app stores a full local copy of your data and syncs automatically when connectivity returns. There is no minimum uptime requirement.',
    },
    {
      q: 'Do you offer discounts for annual billing?',
      a: 'Yes — annual billing saves 20% compared to monthly. Contact sales or switch from your account settings after sign-up.',
    },
  ],
}

export async function seedSanity() {
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    console.log('[Sanity Seed] SANITY_API_TOKEN not found. Skipping auto-seed.')
    return
  }

  const isStubConfigured =
    projectId &&
    dataset &&
    projectId !== 'your-project-id' &&
    dataset !== 'production-mock-stub' &&
    projectId !== 'your-sanity-project-id'

  if (!isStubConfigured) {
    console.log('[Sanity Seed] Sanity project ID or dataset is mock/stub. Skipping auto-seed.')
    return
  }

  try {
    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      token,
      useCdn: false,
    })

    console.log('[Sanity Seed] Initiating seeding of singleton pages...')

    // Seed Home Page
    const seededHome = await writeClient.createIfNotExists(DEFAULT_HOME_PAGE)
    console.log('[Sanity Seed] Home page seed status:', seededHome ? 'success/exists' : 'failed')

    // Seed About Page
    const seededAbout = await writeClient.createIfNotExists(DEFAULT_ABOUT_PAGE)
    console.log('[Sanity Seed] About page seed status:', seededAbout ? 'success/exists' : 'failed')

    // Seed Pricing Page
    const seededPricing = await writeClient.createIfNotExists(DEFAULT_PRICING_PAGE)
    console.log('[Sanity Seed] Pricing page seed status:', seededPricing ? 'success/exists' : 'failed')

    console.log('[Sanity Seed] Seeding completed.')
  } catch (error) {
    console.error('[Sanity Seed] Seeding failed with error:', error)
  }
}
