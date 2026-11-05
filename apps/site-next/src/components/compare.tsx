import { useState } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  MinusCircle,
  ShieldCheck,
  Sparkles,
  Swords,
  User,
  XCircle,
} from 'lucide-react'

/*
 * Reusable "Scryme vs X" comparison page.
 *
 * File location: src/routes/compare.$slug.tsx  ->  /compare/netsuite, /compare/odoo, ...
 * To add a competitor: add an entry to COMPETITORS and a value for it in every ROWS entry.
 *
 * IMPORTANT: competitor claims below are written conservatively but MUST be verified against
 * each vendor's current public documentation before publishing. Update LAST_REVIEWED when you do.
 *
 * Fonts (add once in your root): Inter, Newsreader, JetBrains Mono from Google Fonts.
 */

const SITE_URL = 'https://scryme.tech'
const LAST_REVIEWED = 'November 2026'

/* ---------- tokens (same as home page) ---------- */

const C = {
  surface: '#faf9f6',
  low: '#f4f3f0',
  mid: '#efeeeb',
  high: '#e9e8e5',
  primary: '#002116',
  primaryContainer: '#12372a',
  onSurface: '#1a1c1a',
  muted: '#414844',
  secondary: '#4d6700',
  lime: '#bef529',
  limeDim: '#a4d700',
  onLime: '#151f00',
  onPrimaryContainer: '#7ba190',
  error: '#ba1a1a',
  amber: '#9a6700',
  outline: '#c1c8c3',
}
const SERIF = "font-['Newsreader',serif]"
const MONO = "font-['JetBrains_Mono',monospace]"
const SANS = "font-['Inter',sans-serif]"

/* ---------- content ---------- */

type Level = 'yes' | 'partial' | 'no'
type Cell = [Level, string]

type Competitor = {
  slug: string
  name: string
  category: string
  tagline: string
  summary: string
  scrymeBestIf: string[]
  theyBestIf: string[]
  pricing: { scryme: string; them: string }
  timeline: { scryme: string; them: string }
  faq: [string, string][]
}

const COMPETITORS: Record<string, Competitor> = {
  netsuite: {
    slug: 'netsuite',
    name: 'Oracle NetSuite',
    category: 'Cloud ERP suite',
    tagline: 'A mature cloud ERP versus a single-kernel operating system.',
    summary:
      'NetSuite is a long-established cloud ERP with deep financials. Scryme is built around one operational kernel that keeps sales, inventory, CRM and catalog in a single live state, with fewer add-ons to stitch together.',
    scrymeBestIf: [
      'You run many fulfillment nodes and need inventory and sales to agree in real time',
      'You want CRM, inventory and catalog in one system without separate licences',
      'You want AI agents to query live ERP state through MCP endpoints',
    ],
    theyBestIf: [
      'Multi-subsidiary financial consolidation and statutory reporting are your top priority',
      'You already have an Oracle relationship and in-house NetSuite expertise',
      'You rely on a large third-party partner and SuiteApp ecosystem',
    ],
    pricing: { scryme: 'Published plans with a 14-day trial', them: 'Quote-based, modules licensed separately' },
    timeline: { scryme: 'Weeks (31 business days in our reference migration)', them: 'Commonly several months with a partner' },
    faq: [
      ['Is Scryme a replacement for NetSuite?', 'For many operations-heavy businesses, yes. Scryme can run in parallel with NetSuite through Shadow Sync adapters while records are mirrored, and you cut over module by module after sign-off.'],
      ['Which is better for multi-warehouse inventory?', 'Both support multi-location inventory. Scryme focuses on real-time consistency across nodes and native barcode/RFID ingestion; NetSuite often relies on its WMS or partner add-ons for the same depth.'],
      ['Can I migrate my NetSuite data to Scryme?', 'Yes. Bidirectional Shadow Sync adapters and zero-loss ETL pipelines mirror records until you sign off on full migration.'],
    ],
  },
  'sap-business-one': {
    slug: 'sap-business-one',
    name: 'SAP Business One',
    category: 'SMB / mid-market ERP',
    tagline: 'Established SMB ERP versus a unified, real-time operating kernel.',
    summary:
      'SAP Business One is a widely deployed ERP for small and mid-sized businesses, usually delivered through partners. Scryme offers a faster path to a single live operational state with CRM and catalog included.',
    scrymeBestIf: [
      'You want a shorter implementation without a long partner-led project',
      'You need native CRM and headless catalog rather than separate products',
      'You want public pricing and a self-serve trial',
    ],
    theyBestIf: [
      'You operate in the SAP ecosystem and want a path to larger SAP products',
      'You need a local partner with industry-specific add-ons in your region',
      'Your finance team already standardises on SAP processes',
    ],
    pricing: { scryme: 'Published plans with a 14-day trial', them: 'Partner-quoted licences and services' },
    timeline: { scryme: 'Weeks', them: 'Typically months, partner-dependent' },
    faq: [
      ['How does Scryme compare with SAP Business One on cost?', 'SAP Business One is typically quoted through partners with licence and services components. Scryme publishes plan pricing, so you can estimate total cost before talking to sales.'],
      ['Can Scryme run alongside SAP during migration?', 'Yes. Shadow Sync adapters let you deploy one module first and mirror records until you are ready to switch fully.'],
      ['Does Scryme include CRM?', 'Yes. The 360° Relationship CRM is part of the platform and connected natively to inventory, quotes and billing.'],
    ],
  },
  odoo: {
    slug: 'odoo',
    name: 'Odoo',
    category: 'Modular open-core ERP',
    tagline: 'Flexible modular apps versus an enterprise-grade unified kernel.',
    summary:
      'Odoo is a popular modular ERP with a large app catalogue and an open-source community edition. Scryme is aimed at enterprises that need high-consequence, multi-node consistency and enterprise security out of the box.',
    scrymeBestIf: [
      'You operate at multi-region scale and need consistent real-time state',
      'You need enterprise compliance and data-residency options by default',
      'You want predictive churn and margin guardrails built in, not assembled',
    ],
    theyBestIf: [
      'You want a low-cost start and are comfortable customising modules',
      'You value an open-source option and a large community',
      'Your needs are modest and a single-company deployment is enough',
    ],
    pricing: { scryme: 'Published plans with a 14-day trial', them: 'Published per-user pricing; hosting options vary' },
    timeline: { scryme: 'Weeks', them: 'Weeks to months, depends on customisation' },
    faq: [
      ['Is Odoo cheaper than Scryme?', 'Odoo can be less expensive to start, especially the community edition. The right comparison is total cost, including hosting, customisation, integrations and the engineering time to keep modules in sync.'],
      ['When should I choose Scryme over Odoo?', 'Choose Scryme when you run many nodes or regions, need enterprise security and residency guarantees, and want CRM, inventory and catalog to share one ledger without custom glue code.'],
      ['Can I move from Odoo to Scryme?', 'Yes. Start with one module in parallel, mirror records with the ETL pipelines, then move the rest after sign-off.'],
    ],
  },
  'dynamics-365': {
    slug: 'dynamics-365',
    name: 'Microsoft Dynamics 365',
    category: 'Suite of ERP & CRM apps',
    tagline: 'A broad Microsoft app family versus one operational kernel.',
    summary:
      'Dynamics 365 is a family of business applications that integrate closely with the Microsoft stack. Scryme delivers sales, inventory, CRM and catalog on a single state engine rather than as separate apps joined together.',
    scrymeBestIf: [
      'You want one data model instead of coordinating several apps',
      'You need real-time inventory and sales agreement across many nodes',
      'You want a simpler licence structure for CRM plus operations',
    ],
    theyBestIf: [
      'Your organisation is standardised on Microsoft 365, Azure and Power Platform',
      'You need Power BI and Power Apps deeply embedded in daily workflows',
      'You have in-house Microsoft skills and want to build custom apps',
    ],
    pricing: { scryme: 'Published plans with a 14-day trial', them: 'Per-app, per-user licensing; trials available' },
    timeline: { scryme: 'Weeks', them: 'Commonly months with a partner' },
    faq: [
      ['Does Scryme replace Dynamics 365 Sales and Finance together?', 'Scryme covers sales automation, CRM, inventory and catalog in one platform. If you depend heavily on Microsoft-specific finance features, run Scryme in parallel first and evaluate fit.'],
      ['Can Scryme work with Microsoft tools?', 'Yes. Scryme exposes GraphQL and MCP endpoints, so it can feed Power BI, Teams workflows and AI agents.'],
      ['Which is faster to implement?', 'Scryme is designed for weeks-long migrations with parallel running. Dynamics projects are commonly scoped over months, depending on apps and customisation.'],
    ],
  },
}

type Row = { group: string; feature: string; scryme: Cell; vs: Record<string, Cell> }

const ROWS: Row[] = [
  {
    group: 'Core platform',
    feature: 'Single unified data model',
    scryme: ['yes', 'One operational ledger across all modules'],
    vs: {
      netsuite: ['yes', 'Unified suite on one platform'],
      'sap-business-one': ['yes', 'Single database for core modules'],
      odoo: ['yes', 'Integrated apps on one database'],
      'dynamics-365': ['partial', 'Several apps, some joined via Dataverse'],
    },
  },
  {
    group: 'Core platform',
    feature: 'Real-time sync across nodes',
    scryme: ['yes', 'Sub-12ms consensus mesh (vendor-stated)'],
    vs: {
      netsuite: ['partial', 'Near real time; multi-entity needs setup'],
      'sap-business-one': ['partial', 'Depends on deployment and add-ons'],
      odoo: ['partial', 'Multi-warehouse supported; scale varies'],
      'dynamics-365': ['partial', 'Depends on apps and integration'],
    },
  },
  {
    group: 'Core platform',
    feature: 'Typical implementation time',
    scryme: ['yes', 'Weeks, with parallel running'],
    vs: {
      netsuite: ['partial', 'Commonly months'],
      'sap-business-one': ['partial', 'Commonly months'],
      odoo: ['yes', 'Weeks to months'],
      'dynamics-365': ['partial', 'Commonly months'],
    },
  },
  {
    group: 'Sales & CRM',
    feature: 'Native CRM included',
    scryme: ['yes', '360° Relationship CRM built in'],
    vs: {
      netsuite: ['yes', 'CRM module available'],
      'sap-business-one': ['partial', 'Lighter CRM; often paired with another tool'],
      odoo: ['yes', 'CRM app available'],
      'dynamics-365': ['yes', 'Dynamics 365 Sales (separate app)'],
    },
  },
  {
    group: 'Sales & CRM',
    feature: 'Margin guardrails in quoting',
    scryme: ['yes', 'Enforced at quote and contract stage'],
    vs: {
      netsuite: ['partial', 'Via configuration or customisation'],
      'sap-business-one': ['partial', 'Via configuration or add-ons'],
      odoo: ['partial', 'Via pricing rules and customisation'],
      'dynamics-365': ['partial', 'Via configuration or Power Platform'],
    },
  },
  {
    group: 'Sales & CRM',
    feature: 'Built-in churn prediction',
    scryme: ['yes', 'Sub-minute graph signals and playbooks'],
    vs: {
      netsuite: ['partial', 'Via analytics or add-ons'],
      'sap-business-one': ['partial', 'Via add-ons'],
      odoo: ['no', 'Not a native feature'],
      'dynamics-365': ['partial', 'Via AI add-ons'],
    },
  },
  {
    group: 'Inventory & logistics',
    feature: 'Multi-location inventory',
    scryme: ['yes', 'Distributed 3PL, hubs and retail nodes'],
    vs: {
      netsuite: ['yes', 'Multi-location supported'],
      'sap-business-one': ['yes', 'Multi-warehouse supported'],
      odoo: ['yes', 'Multi-warehouse supported'],
      'dynamics-365': ['yes', 'Supported in supply chain apps'],
    },
  },
  {
    group: 'Inventory & logistics',
    feature: 'Native RFID & barcode ingestion',
    scryme: ['yes', 'Sub-second scan ingestion'],
    vs: {
      netsuite: ['partial', 'Via mobile or WMS add-on'],
      'sap-business-one': ['partial', 'Via add-ons'],
      odoo: ['yes', 'Barcode app available'],
      'dynamics-365': ['partial', 'Via warehouse app or add-ons'],
    },
  },
  {
    group: 'Inventory & logistics',
    feature: 'EDI streams (X12 & EDIFACT)',
    scryme: ['yes', 'Native enterprise EDI pipelines'],
    vs: {
      netsuite: ['partial', 'Via partner EDI solutions'],
      'sap-business-one': ['partial', 'Via partner solutions'],
      odoo: ['partial', 'Via community or paid modules'],
      'dynamics-365': ['partial', 'Via partner solutions'],
    },
  },
  {
    group: 'Integrations & AI',
    feature: 'Headless CMS & catalog API',
    scryme: ['yes', 'Decoupled catalog with GraphQL'],
    vs: {
      netsuite: ['partial', 'Commerce tooling; not headless-first'],
      'sap-business-one': ['no', 'Not a core capability'],
      odoo: ['partial', 'Website builder; not headless-first'],
      'dynamics-365': ['partial', 'Separate commerce products'],
    },
  },
  {
    group: 'Integrations & AI',
    feature: 'MCP endpoints for AI agents',
    scryme: ['yes', 'Enterprise-scoped MCP with audit trail'],
    vs: {
      netsuite: ['partial', 'Via APIs and custom connectors'],
      'sap-business-one': ['partial', 'Via APIs and custom connectors'],
      odoo: ['partial', 'Via APIs and custom connectors'],
      'dynamics-365': ['partial', 'Via APIs and Copilot tooling'],
    },
  },
  {
    group: 'Security & compliance',
    feature: 'SOC 2 Type II & ISO 27001',
    scryme: ['yes', 'Both certified'],
    vs: {
      netsuite: ['yes', 'Certifications published'],
      'sap-business-one': ['yes', 'Certifications published'],
      odoo: ['partial', 'Depends on hosting choice'],
      'dynamics-365': ['yes', 'Certifications published'],
    },
  },
  {
    group: 'Security & compliance',
    feature: 'Sovereign data residency options',
    scryme: ['yes', 'Frankfurt, Zurich, Virginia, Singapore, Tokyo'],
    vs: {
      netsuite: ['partial', 'Region options vary'],
      'sap-business-one': ['yes', 'Regional hosting options'],
      odoo: ['partial', 'Depends on hosting choice'],
      'dynamics-365': ['yes', 'Regional datacentres'],
    },
  },
  {
    group: 'Commercials',
    feature: 'Self-serve free trial',
    scryme: ['yes', '14-day enterprise trial'],
    vs: {
      netsuite: ['partial', 'Typically demo-led'],
      'sap-business-one': ['partial', 'Typically partner demo'],
      odoo: ['yes', 'Free trial available'],
      'dynamics-365': ['yes', 'Trials available'],
    },
  },
  {
    group: 'Commercials',
    feature: 'Transparent public pricing',
    scryme: ['yes', 'Published plans'],
    vs: {
      netsuite: ['no', 'Quote-based'],
      'sap-business-one': ['no', 'Partner-quoted'],
      odoo: ['yes', 'Published per-user pricing'],
      'dynamics-365': ['partial', 'Published list prices; complex bundles'],
    },
  },
]

/* ---------- route ---------- */

export const Route = createFileRoute('/compare/$slug')({
  loader: ({ params }) => {
    if (!COMPETITORS[params.slug]) throw notFound()
    return null
  },
  head: ({ params }) => {
    const c = COMPETITORS[params.slug]
    if (!c) return {}
    const url = `${SITE_URL}/compare/${c.slug}`
    const title = `Scryme vs ${c.name}: Features, Pricing & Migration (${LAST_REVIEWED})`
    const description = `Compare Scryme and ${c.name} side by side: ${ROWS.length} criteria across CRM, inventory, AI, security and pricing, plus who should choose which and how to migrate.`
    const faqLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    }
    const crumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare` },
        { '@type': 'ListItem', position: 3, name: `Scryme vs ${c.name}`, item: url },
      ],
    }
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(faqLd) },
        { type: 'application/ld+json', children: JSON.stringify(crumbLd) },
      ],
    }
  },
  component: ComparePage,
  notFoundComponent: CompareNotFound,
})

/* ---------- shared bits ---------- */

function Dot({ color, size = 'h-1.5 w-1.5' }: { color: string; size?: string }) {
  return <span className={`inline-block shrink-0 rounded-full ${size}`} style={{ background: color }} />
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.secondary }}>
      {children}
    </span>
  )
}

function LevelIcon({ level, className = 'h-[18px] w-[18px]' }: { level: Level; className?: string }) {
  if (level === 'yes')
    return <CheckCircle2 aria-label="Supported" className={`${className} shrink-0`} style={{ color: C.secondary }} />
  if (level === 'partial')
    return <MinusCircle aria-label="Partial or via add-ons" className={`${className} shrink-0`} style={{ color: C.amber }} />
  return <XCircle aria-label="Not available" className={`${className} shrink-0`} style={{ color: C.error }} />
}

const scoreOf = (cells: Cell[]) => cells.filter(([l]) => l === 'yes').length

/* ---------- header / footer (compact; swap for your shared components) ---------- */

function SiteHeader() {
  return (
    <header
      className="fixed top-0 z-50 w-full backdrop-blur-xl"
      style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 8px rgba(18,55,42,0.04)' }}
    >
      <div className="flex h-20 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className={`${SERIF} text-[28px] font-medium tracking-tight`} style={{ color: C.primary }}>
            Scryme
          </Link>
          <nav className={`${SANS} hidden items-center gap-6 text-sm lg:flex`} style={{ color: C.muted }}>
            <a href="#" className="hover:text-[#1a1c1a]">Solutions</a>
            <a href="#" className="hover:text-[#1a1c1a]">Platform</a>
            <Link to="/pricing" className="hover:text-[#1a1c1a]">Pricing</Link>
            <span className="font-semibold" style={{ color: C.primary }}>Compare</span>
          </nav>
        </div>
        <div className={`${SANS} flex items-center gap-3`}>
          <a
            href="https://app.scryme.tech/signup"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#a4d700] sm:inline-flex"
            style={{ background: C.lime, color: C.onLime }}
          >
            Start Free Trial
          </a>
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: C.primary }}>
            <User className="h-[18px] w-[18px] text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t px-4 py-8 md:px-8" style={{ background: C.low, borderColor: 'rgba(18,55,42,0.08)' }}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
        <span className={`${SANS} text-xs`} style={{ color: C.muted }}>
          © 2026 Scryme ERP AG. All rights reserved. Product names are trademarks of their respective owners.
        </span>
        <span className={`${MONO} text-[11px]`} style={{ color: C.muted }}>
          NODE_LATENCY: 12ms · TLS 1.3 / ENCRYPTED
        </span>
      </div>
    </footer>
  )
}

/* ---------- page ---------- */

function ComparePage() {
  const { slug } = Route.useParams()
  const c = COMPETITORS[slug]
  if (!c) return <CompareNotFound />

  const scrymeScore = scoreOf(ROWS.map((r) => r.scryme))
  const theirScore = scoreOf(ROWS.map((r) => r.vs[c.slug]))
  const others = Object.values(COMPETITORS).filter((x) => x.slug !== c.slug)

  return (
    <div
      className={`${SANS} min-h-screen antialiased selection:bg-[#bef529] selection:text-[#526d00]`}
      style={{ background: C.surface, color: C.onSurface }}
    >
      <SiteHeader />
      <main className="pt-20">
        <Hero c={c} scrymeScore={scrymeScore} theirScore={theirScore} />
        <Switcher current={c.slug} />
        <Verdict c={c} />
        <Matrix c={c} scrymeScore={scrymeScore} theirScore={theirScore} />
        <WhoShouldChoose c={c} />
        <CostAndTime c={c} />
        <Migration c={c} />
        <Faq c={c} />
        <Related items={others} />
        <FinalCta c={c} />
      </main>
      <SiteFooter />
    </div>
  )
}

/* ---------- hero ---------- */

function Hero({ c, scrymeScore, theirScore }: { c: Competitor; scrymeScore: number; theirScore: number }) {
  return (
    <section className="px-4 pb-12 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className={`${MONO} flex items-center gap-1.5 text-[11px]`} style={{ color: C.muted }}>
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Compare</span>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: C.primary }}>Scryme vs {c.name}</span>
        </nav>

        <div className="mt-8 grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`${MONO} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider`}
                style={{ background: C.high, color: C.primary }}
              >
                <Swords className="h-3.5 w-3.5" /> Platform comparison
              </span>
              <span
                className={`${MONO} inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px]`}
                style={{ background: C.low, color: C.muted }}
              >
                <Clock className="h-3 w-3" /> Reviewed {LAST_REVIEWED}
              </span>
            </div>
            <h1
              className={`${SERIF} text-[38px] font-normal leading-[44px] tracking-tight md:text-[56px] md:leading-[64px]`}
              style={{ color: C.primary }}
            >
              Scryme vs {c.name}: <em className="italic">which platform fits your operations?</em>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed" style={{ color: C.muted }}>
              {c.summary}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://app.scryme.tech/signup"
                className="group inline-flex items-center rounded-lg px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#12372a] hover:shadow-lg"
                style={{ background: C.primary }}
              >
                <span className="mr-2.5 h-2 w-2 rounded-full transition-transform group-hover:scale-125" style={{ background: C.lime }} />
                Start 14-Day Enterprise Trial
              </a>
              <a
                href="#matrix"
                className="inline-flex items-center rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-[#e3e2e0]"
                style={{ background: C.high, color: C.primary }}
              >
                Jump to feature matrix
              </a>
            </div>
          </div>

          {/* VS scoreboard */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
                  Criteria fully supported
                </span>
                <span className={`${MONO} text-[10px]`} style={{ color: C.muted }}>
                  of {ROWS.length}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-xl p-4 text-center" style={{ background: C.primary }}>
                  <div className={`${SERIF} text-[44px] leading-none`} style={{ color: C.lime }}>
                    {scrymeScore}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-white">Scryme</div>
                </div>
                <span className={`${MONO} text-xs font-bold`} style={{ color: C.muted }}>
                  VS
                </span>
                <div className="rounded-xl p-4 text-center" style={{ background: C.mid }}>
                  <div className={`${SERIF} text-[44px] leading-none`} style={{ color: C.primary }}>
                    {theirScore}
                  </div>
                  <div className="mt-2 text-xs font-semibold" style={{ color: C.primary }}>
                    {c.name}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-[11px]" style={{ borderColor: C.high, color: C.muted }}>
                <span className="inline-flex items-center gap-1.5"><LevelIcon level="yes" className="h-3.5 w-3.5" /> Supported</span>
                <span className="inline-flex items-center gap-1.5"><LevelIcon level="partial" className="h-3.5 w-3.5" /> Partial / via add-ons</span>
                <span className="inline-flex items-center gap-1.5"><LevelIcon level="no" className="h-3.5 w-3.5" /> Not available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- competitor switcher ---------- */

function Switcher({ current }: { current: string }) {
  return (
    <div className="border-y px-4 py-4 md:px-8" style={{ background: C.low, borderColor: 'rgba(18,55,42,0.06)' }}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        <span className={`${MONO} mr-2 text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
          Compare Scryme with
        </span>
        {Object.values(COMPETITORS).map((x) => {
          const active = x.slug === current
          return (
            <Link
              key={x.slug}
              to="/compare/$slug"
              params={{ slug: x.slug }}
              aria-current={active ? 'page' : undefined}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={
                active
                  ? { background: C.primary, color: '#fff' }
                  : { background: '#fff', color: C.primary, border: `1px solid ${C.outline}` }
              }
            >
              {x.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- verdict summary ---------- */

function Verdict({ c }: { c: Competitor }) {
  const cards = [
    { icon: Sparkles, t: 'Unified by design', d: 'Sales, inventory, CRM and catalog share one live ledger, with no middleware to maintain.' },
    { icon: Clock, t: 'Faster to go live', d: 'Run in parallel with your current system and cut over module by module.' },
    { icon: ShieldCheck, t: 'Enterprise-ready', d: 'SOC 2 Type II, ISO 27001 and five sovereign hosting regions.' },
  ]
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2">
          <Eyebrow>01 // The short version</Eyebrow>
          <h2 className={`${SERIF} max-w-3xl text-[30px] leading-9 tracking-tight md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
            Why teams evaluating {c.name} also shortlist Scryme.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl bg-white p-7 shadow-sm transition-shadow hover:shadow-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: C.lime, color: C.onLime }}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className={`${SERIF} mt-5 text-[22px] font-medium leading-7`} style={{ color: C.primary }}>
                {t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
                {d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- feature matrix ---------- */

function Matrix({ c, scrymeScore, theirScore }: { c: Competitor; scrymeScore: number; theirScore: number }) {
  const groups = Array.from(new Set(ROWS.map((r) => r.group)))
  return (
    <section id="matrix" className="scroll-mt-24 px-4 py-20 md:px-8" style={{ background: C.low }}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <Eyebrow>02 // Feature matrix</Eyebrow>
            <h2 className={`${SERIF} text-[30px] leading-9 tracking-tight md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
              Scryme vs {c.name}, feature by feature.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-5" style={{ color: C.muted }}>
            Based on public information as of {LAST_REVIEWED}. “Partial” means available through configuration,
            add-ons, or partner products.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl bg-white shadow-md">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">Feature comparison between Scryme and {c.name}</caption>
            <thead>
              <tr>
                <th scope="col" className={`${MONO} w-[34%] px-5 py-4 text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
                  Capability
                </th>
                <th scope="col" className="w-[33%] px-5 py-4" style={{ background: C.primary }}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Dot color={C.lime} size="h-2 w-2" /> Scryme
                  </span>
                </th>
                <th scope="col" className="w-[33%] px-5 py-4" style={{ background: C.mid }}>
                  <span className="text-sm font-semibold" style={{ color: C.primary }}>
                    {c.name}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <GroupRows key={g} group={g} slug={c.slug} />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className={`${MONO} px-5 py-4 text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
                  Fully supported
                </th>
                <td className={`${SERIF} px-5 py-4 text-2xl`} style={{ background: 'rgba(190,245,41,0.18)', color: C.primary }}>
                  {scrymeScore} / {ROWS.length}
                </td>
                <td className={`${SERIF} px-5 py-4 text-2xl`} style={{ background: C.mid, color: C.primary }}>
                  {theirScore} / {ROWS.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  )
}

function GroupRows({ group, slug }: { group: string; slug: string }) {
  const rows = ROWS.filter((r) => r.group === group)
  return (
    <>
      <tr>
        <th
          colSpan={3}
          scope="colgroup"
          className={`${MONO} border-y px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest`}
          style={{ background: C.low, borderColor: C.high, color: C.secondary }}
        >
          {group}
        </th>
      </tr>
      {rows.map((r) => {
        const them = r.vs[slug]
        return (
          <tr key={r.feature} className="border-b" style={{ borderColor: C.high }}>
            <th scope="row" className="px-5 py-4 align-top text-sm font-semibold" style={{ color: C.primary }}>
              {r.feature}
            </th>
            <td className="px-5 py-4 align-top" style={{ background: 'rgba(190,245,41,0.10)' }}>
              <div className="flex items-start gap-2.5">
                <LevelIcon level={r.scryme[0]} />
                <span className="text-xs leading-5" style={{ color: C.onSurface }}>{r.scryme[1]}</span>
              </div>
            </td>
            <td className="px-5 py-4 align-top">
              <div className="flex items-start gap-2.5">
                <LevelIcon level={them[0]} />
                <span className="text-xs leading-5" style={{ color: C.muted }}>{them[1]}</span>
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}

/* ---------- who should choose which ---------- */

function WhoShouldChoose({ c }: { c: Competitor }) {
  return (
    <section className="px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2">
          <Eyebrow>03 // Honest guidance</Eyebrow>
          <h2 className={`${SERIF} max-w-3xl text-[30px] leading-9 tracking-tight md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
            Who should choose which platform?
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-2xl p-8 text-white shadow-xl" style={{ background: C.primary }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.lime }}>
                Choose Scryme if…
              </span>
              <span className={`${MONO} rounded-full px-2.5 py-1 text-xs font-bold`} style={{ background: C.secondary }}>
                Unified kernel
              </span>
            </div>
            <ul className="flex flex-col gap-4">
              {c.scrymeBestIf.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: C.lime }} />
                  <span style={{ color: '#e5efe9' }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5 rounded-2xl p-8" style={{ background: C.high }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>
                Choose {c.name} if…
              </span>
              <span className={`${MONO} rounded px-2.5 py-1 text-xs font-semibold`} style={{ background: '#fff', color: C.primary }}>
                {c.category}
              </span>
            </div>
            <ul className="flex flex-col gap-4">
              {c.theyBestIf.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: C.primaryContainer }} />
                  <span style={{ color: C.muted }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- cost and time ---------- */

function CostAndTime({ c }: { c: Competitor }) {
  const items = [
    { k: 'Pricing model', a: c.pricing.scryme, b: c.pricing.them },
    { k: 'Time to go live', a: c.timeline.scryme, b: c.timeline.them },
  ]
  return (
    <section className="px-4 py-20 md:px-8" style={{ background: C.low }}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2">
          <Eyebrow>04 // Cost &amp; time</Eyebrow>
          <h2 className={`${SERIF} text-[30px] leading-9 tracking-tight md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
            What it takes to get started.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((i) => (
            <div key={i.k} className="rounded-2xl bg-white p-7 shadow-sm">
              <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
                {i.k}
              </span>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl p-4" style={{ background: 'rgba(190,245,41,0.2)' }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.secondary }}>Scryme</div>
                  <p className={`${SERIF} mt-1 text-lg leading-snug`} style={{ color: C.primary }}>{i.a}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: C.mid }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{c.name}</div>
                  <p className={`${SERIF} mt-1 text-lg leading-snug`} style={{ color: C.primary }}>{i.b}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- migration steps ---------- */

function Migration({ c }: { c: Competitor }) {
  const steps = [
    ['Mirror', `Connect Shadow Sync adapters so ${c.name} records are mirrored into Scryme in real time.`],
    ['Run in parallel', 'Deploy Sales Automation or Multi-Location Inventory first while your current core keeps running.'],
    ['Validate', 'Reconcile ledgers and inventory counts between systems until the numbers agree.'],
    ['Cut over', 'Switch modules one by one after sign-off, with an audit trail for every change.'],
  ]
  return (
    <section className="px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2">
          <Eyebrow>05 // Migration path</Eyebrow>
          <h2 className={`${SERIF} max-w-3xl text-[30px] leading-9 tracking-tight md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
            Switching from {c.name} without downtime.
          </h2>
        </div>
        <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="relative rounded-2xl bg-white p-6 shadow-sm">
              <span className={`${MONO} text-xs font-bold`} style={{ color: C.secondary }}>
                STEP 0{i + 1}
              </span>
              <h3 className={`${SERIF} mt-3 text-[22px] font-medium leading-7`} style={{ color: C.primary }}>
                {t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
                {d}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */

function Faq({ c }: { c: Competitor }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="px-4 py-20 md:px-8" style={{ background: C.low }}>
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>06 // Questions</Eyebrow>
          <h2 className={`${SERIF} text-[30px] leading-9 tracking-tight md:text-[40px] md:leading-[48px]`} style={{ color: C.primary }}>
            Scryme vs {c.name}: frequently asked questions
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {c.faq.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold"
                  style={{ color: C.primary }}
                >
                  <span>{q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {isOpen && (
                  <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: C.muted }}>
                    {a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- related comparisons (internal linking for SEO) ---------- */

function Related({ items }: { items: Competitor[] }) {
  return (
    <section className="px-4 py-20 md:px-8">
      <div className="mx-auto max-w-7xl">
        <span className={`${MONO} text-[10px] font-bold uppercase tracking-widest`} style={{ color: C.muted }}>
          More comparisons
        </span>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((x) => (
            <Link
              key={x.slug}
              to="/compare/$slug"
              params={{ slug: x.slug }}
              className="group flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div>
                <div className={`${MONO} text-[9px] uppercase tracking-widest`} style={{ color: C.muted }}>
                  {x.category}
                </div>
                <div className={`${SERIF} text-xl`} style={{ color: C.primary }}>
                  Scryme vs {x.name}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: C.primary }} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- final CTA ---------- */

function FinalCta({ c }: { c: Competitor }) {
  return (
    <section className="px-4 py-20 text-white md:px-8" style={{ background: C.primary }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 py-8 text-center">
        <span
          className={`${MONO} rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest`}
          style={{ background: C.primaryContainer, color: C.lime }}
        >
          Ready to evaluate?
        </span>
        <h2 className={`${SERIF} max-w-3xl text-[30px] leading-[1.1] tracking-tight md:text-[52px]`}>
          See Scryme next to {c.name} with your own data.
        </h2>
        <p className="max-w-2xl text-base leading-relaxed" style={{ color: C.onPrimaryContainer }}>
          Spin up an isolated sandbox loaded with your sample catalog and node taxonomy, or talk to a solutions
          architect about a parallel-run migration plan.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
            className="rounded-xl px-8 py-4 text-sm font-bold shadow-lg transition-all hover:bg-[#a4d700] hover:shadow-xl"
            style={{ background: C.lime, color: C.onLime }}
          >
            Start 14-Day Enterprise Trial
          </a>
          <Link
            to="/pricing"
            className="rounded-xl px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#003923]"
            style={{ background: C.primaryContainer }}
          >
            Schedule Architecture Review
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- 404 for unknown slugs ---------- */

function CompareNotFound() {
  return (
    <div className={`${SANS} flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center`} style={{ background: C.surface }}>
      <h1 className={`${SERIF} text-[40px]`} style={{ color: C.primary }}>
        We don’t have that comparison yet.
      </h1>
      <div className="flex flex-wrap justify-center gap-2">
        {Object.values(COMPETITORS).map((x) => (
          <Link
            key={x.slug}
            to="/compare/$slug"
            params={{ slug: x.slug }}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm"
            style={{ color: C.primary }}
          >
            Scryme vs {x.name}
          </Link>
        ))}
      </div>
    </div>
  )
}