import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from './env'

// Hardcoded static data to seed if not already present
const DEFAULT_HOME_PAGE = {
  _id: 'homePage',
  _type: 'homePage',
  heroTitle: 'The commerce engine built for scaling and performance',
  heroSubtitle: 'Scryme integrates retail POS, multi-branch syncing, advanced stock control, and centralized management with automated customer-facing storefront websites. Built for high-performance operations.',
  reconciledToday: 341850,
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
      name: 'Storefronts & CRM',
      description: 'Create and manage customer-facing storefront websites for your clients, beautifully synced with inventory and central operations.',
      connectsTo: ['FIN', 'INV'],
      href: '/products/crm',
      accent: '#C89A4B',
    },
    {
      code: 'POS',
      name: 'Integrated Point of Sale',
      description: 'Ring up transactions offline-first, with stock and revenue reconciled across multiple branches the split second a shift closes.',
      connectsTo: ['INV', 'FIN'],
      href: '/products/pos',
      accent: '#4B9073',
    },
    {
      code: 'INV',
      name: 'Stock & Inventory Management',
      description: 'Advanced stock management across warehouses and branches, with automated reorders and instant digital storefront stock syncing.',
      connectsTo: ['POS', 'FIN'],
      href: '/products/inventory',
      accent: '#7C93B0',
    },
    {
      code: 'FIN',
      name: 'Central Management & ERP',
      description: 'Manage several branches, global accounting, consolidated reporting, and multi-store configurations from one master dashboard.',
      connectsTo: ['CRM', 'POS', 'INV'],
      href: '/products/finance',
      accent: '#B4553A',
    },
    {
      code: 'HR',
      name: 'Multi-Branch Workforce',
      description: 'Orchestrate staffing, shifts, and registers across several branches with centralized corporate policy and permission controls.',
      connectsTo: ['FIN'],
      href: '/products/hr',
      accent: '#9A7FB0',
    },
    {
      code: 'BI',
      name: 'Performance Analytics',
      description: "Analyze branch growth, inventory turnover, and conversion metrics in real-time to scale business performance with precision.",
      connectsTo: ['CRM', 'POS', 'INV', 'FIN', 'HR'],
      href: '/products/analytics',
      accent: '#4E7FB5',
    },
  ],
  stats: [
    {
      value: '2,500+',
      label: 'Active storefronts',
      sublabel: 'generated and fully managed',
    },
    {
      value: '45ms',
      label: 'Barcode scan sync',
      sublabel: 'under extreme load',
    },
    {
      value: '100%',
      label: 'Offline POS uptime',
      sublabel: 'local SQLite sync technology',
    },
    {
      value: '24/7',
      label: 'Performance monitoring',
      sublabel: 'built to scale business ops',
    },
  ],
  testimonials: [
    {
      quote: 'Scryme allowed us to scale from 2 to 14 branches in under a year. We manage central pricing, stock replenishments, and 14 local POS terminals from one dashboard. Plus, the automated storefront websites generated for our clients have increased our wholesale demand by 60%.',
      name: 'Amara Diallo',
      title: 'Chief Operating Officer',
      company: 'Fontaine Group',
      ticker: 'FTN',
      initials: 'AD',
    },
    {
      quote: 'We run 23 retail branches. Before Scryme, managing physical stock transfers and syncing them with our digital customer storefront was a nightmare. Now it takes seconds. Performance and accuracy have skyrocketed.',
      name: 'Marcus Chen',
      title: 'Head of Retail Operations',
      company: 'Westfield Retail Holdings',
      ticker: 'WRH',
      initials: 'MC',
    },
    {
      quote: 'The managed storefront websites are a game changer. We generated branded stores for our main buyers, syncing our central stock levels directly to their shopping carts. Wholesale orders are fully automated now.',
      name: 'Sophia Hargreaves',
      title: 'VP of Sales',
      company: 'Meridian Corp',
      ticker: 'MRD',
      initials: 'SH',
    },
  ],
  storefrontTitle: 'Customer-Facing Storefront Websites',
  storefrontSubtitle: 'Instantly build, customize, and manage customer-facing storefront websites for your brand. Beautiful e-commerce templates synchronized natively with your central stock database and retail POS registers.',
  multiBranchTitle: 'Unified Multi-Branch Orchestration',
  multiBranchSubtitle: 'Scale across several branches with ease. Oversee location-specific pricing, staff shift rosters, live drawer reconciliations, and inter-branch inventory transfers from a unified cloud console.',
  stockManagementTitle: 'Advanced Stock & Inventory Control',
  stockManagementSubtitle: 'Optimize cash flow with intelligent stock level monitoring. Prevent stockouts using multi-warehouse replenishment workflows and automated trigger thresholds synchronized with online and offline channels.',
}

const DEFAULT_ABOUT_PAGE = {
  _id: 'aboutPage',
  _type: 'aboutPage',
  heroTitle: 'The high-performance platform built to scale operations',
  heroSubtitle: 'We built Scryme to empower businesses to scale securely and enhance their performance. By unifying offline-first POS registers, multi-branch syncing, advanced stock tracking, and automated customer storefronts into a single system, we eliminate friction and drive growth.',
  stats: [
    { value: '4,200+', label: 'Stores scaled on Scryme' },
    { value: '18', label: 'Countries active' },
    { value: '$12M+', label: 'Daily volume' },
    { value: '4.9 / 5', label: 'Performance rating' },
  ],
  missionTitle: 'Equip every growing merchant with absolute control and scale',
  missionText: [
    'Managing several branches, tracking massive stock, and maintaining an online storefront has historically required a patchwork of bloated systems and an expensive IT staff to reconcile data.',
    'Scryme changes that. We provide an integrated, enterprise-ready engine. Beautiful, high-converting customer-facing storefronts, lightning-fast POS terminals, robust multi-branch inventory transfers, and complete central management — all engineered to run at maximum performance.',
  ],
  timeline: [
    {
      year: '2019',
      milestone: 'Founded in Accra, Ghana. First integrated POS and multi-branch engine shipped to 12 retail teams.',
    },
    {
      year: '2021',
      milestone: 'Launched automated Customer Storefront builders. Reached 500 businesses syncing stock in real-time.',
    },
    {
      year: '2022',
      milestone: 'Series A funding. Expanded central management ERP to UK and European wholesale markets.',
    },
    {
      year: '2023',
      milestone: 'Released advanced offline-first POS engine and SQLite sync plugins. Crossed 2,000 customers.',
    },
    {
      year: '2025',
      milestone: '4,200+ brands scaling across several branches. Real-time operations running at peak performance.',
    },
  ],
  values: [
    {
      tag: 'PS',
      title: 'Performance & Scale',
      desc: 'Our engine is designed to handle rapid barcode scanning, complex stock allocations, and sudden storefront traffic spikes without slowing down.',
    },
    {
      tag: 'MB',
      title: 'Multi-Branch Integrity',
      desc: 'Never worry about inventory drifting. Transfers, branch sales, and online orders sync with transaction-level precision.',
    },
    {
      tag: 'SE',
      title: 'Storefront Excellence',
      desc: 'We enable you to offer your clients stunning, fast, SEO-optimized shopping storefronts that run perfectly across all devices.',
    },
    {
      tag: 'CM',
      title: 'Centralized Control',
      desc: "One central platform to rule them all. Manage catalogs, pricing, users, and performance analytics across all physical and online stores.",
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
  heroTitle: 'Simple, transparent pricing to scale your brand',
  heroSubtitle: 'Choose the right plan to expand across branches, manage stock, and launch stunning storefront websites.',
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
        '1 Integrated POS terminal',
        '1 store location / branch',
        'Up to 1,000 SKUs & stock tracking',
        '1 Customer storefront website',
        'Real-time central management',
        'Email support',
      ],
    },
    {
      name: 'Growth',
      price: '$149',
      period: '/mo',
      tagline: 'For growing brands scaling several branches',
      cta: 'Start free trial',
      href: 'https://app.scryme.tech/sign-up',
      highlight: true,
      badge: 'Most popular',
      features: [
        'Up to 5 POS terminals',
        'Up to 3 branches',
        'Unlimited SKUs & advanced stock control',
        'Up to 5 Customer storefront websites',
        'Central management ERP & CRM tools',
        'Inter-branch inventory transfers',
        'Performance forecasting',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tagline: 'For large retailers, franchises, and wholesale setups',
      cta: 'Talk to sales',
      href: 'https://app.scryme.tech/sign-up',
      highlight: false,
      badge: '',
      features: [
        'Unlimited POS terminals',
        'Unlimited branches & warehouses',
        'Unlimited SKUs & stock configurations',
        'Unlimited Customer storefront websites',
        'Consolidated corporate central management',
        'High-performance analytics BI suite',
        'Dedicated success manager',
        'Custom SLA & guided branch onboarding',
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
      feature: 'Store locations & branches',
      starter: '1',
      growth: 'Up to 3',
      enterprise: 'Unlimited',
    },
    {
      feature: 'Customer storefront websites',
      starter: '1',
      growth: 'Up to 5',
      enterprise: 'Unlimited',
    },
    {
      feature: 'Stock limits (SKUs)',
      starter: '1,000',
      growth: 'Unlimited',
      enterprise: 'Unlimited',
    },
    { feature: 'Central Management ERP', starter: 'Included', growth: 'Included', enterprise: 'Included' },
    {
      feature: 'Inter-branch transfers',
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
      a: 'Yes. The POS desktop app stores a full local copy of your data and syncs automatically with central management when connectivity returns.',
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
    const seededHome = await writeClient.createOrReplace(DEFAULT_HOME_PAGE)
    console.log('[Sanity Seed] Home page seed status:', seededHome ? 'success/exists' : 'failed')

    // Seed About Page
    const seededAbout = await writeClient.createOrReplace(DEFAULT_ABOUT_PAGE)
    console.log('[Sanity Seed] About page seed status:', seededAbout ? 'success/exists' : 'failed')

    // Seed Pricing Page
    const seededPricing = await writeClient.createOrReplace(DEFAULT_PRICING_PAGE)
    console.log('[Sanity Seed] Pricing page seed status:', seededPricing ? 'success/exists' : 'failed')

    console.log('[Sanity Seed] Seeding completed.')
  } catch (error) {
    console.error('[Sanity Seed] Seeding failed with error:', error)
  }
}
