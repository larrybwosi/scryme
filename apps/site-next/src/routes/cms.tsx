import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowRight,
  Database,
  Layers,
  Zap,
  Globe,
  Code2,
  RefreshCw,
  Cpu,
  Check,
  ShieldCheck,
  Share2,
  Boxes,
  FileCode,
} from 'lucide-react'
import { fetchCmsPage, fetchSiteSettings, DEFAULT_CMS_PAGE_FALLBACK, DEFAULT_SITE_SETTINGS_FALLBACK, CmsPageData, SiteSettings } from '../sanity/queries'

export const Route = createFileRoute('/cms')({
  loader: async () => {
    const [cmsData, siteSettings] = await Promise.all([
      fetchCmsPage(),
      fetchSiteSettings(),
    ])
    return {
      cmsData: cmsData || DEFAULT_CMS_PAGE_FALLBACK,
      siteSettings: siteSettings || DEFAULT_SITE_SETTINGS_FALLBACK,
    }
  },
  component: CmsPageComponent,
})

/* ---------- small shared pieces ---------- */

const Mono = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono text-[10px] uppercase tracking-wide ${className}`}>{children}</span>
)

const Pill = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-[#d2ff3a]/30 bg-[#d2ff3a]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-[#d2ff3a] ${className}`}
  >
    {children}
  </span>
)

const Dot = ({ color = '#d2ff3a' }: { color?: string }) => (
  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
)

/* ---------- hero ---------- */

function Hero({ data }: { data?: CmsPageData['hero'] }) {
  const hero = data || DEFAULT_CMS_PAGE_FALLBACK.hero!

  return (
    <section className="relative px-4 pb-12 pt-8 md:px-8 border-b border-white/10 dark:border-white/10 light:border-black/10">
      <div className="mx-auto max-w-7xl">
        <Mono className="text-[var(--text-muted)]">KERNEL_CORE / CATALOG_ORCHESTRATION / PILLAR_04_CATALOG_CLOUD</Mono>

        <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <Pill>
              <Dot /> {hero.badge || 'CORE PILLAR 04 • HEADLESS CMS & CATALOG CLOUD'}
            </Pill>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-normal leading-[1.08] tracking-tight sm:text-5xl md:text-6xl dark:text-white light:text-[#090a0b]">
              {hero.headline || 'Decouple your storefronts with a sub-50ms catalog edge.'}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              {hero.subtitle || 'Synchronize multi-channel eCommerce storefronts, regional wholesale price books, and localized digital catalogs directly from your ERP inventory core with zero manual ETL drift.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl glass-panel p-5 border-white/10">
              <div className="flex items-center justify-between">
                <Mono className="text-[var(--text-muted)]">EDGE TTFB LATENCY</Mono>
                <span className="rounded bg-[#10b981]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                  GLOBAL CACHE
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold dark:text-white light:text-[#090a0b]">
                  38ms
                </span>
                <span className="text-xs text-[var(--text-muted)]">P95 globally distributed</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={hero.primaryCtaLink || 'https://app.scryme.tech/signup?plan=growth&trial=true'}
                className="flex h-14 items-center justify-center rounded-xl text-center text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition shadow-sm"
              >
                {hero.primaryCtaText || 'Deploy Catalog'}
              </a>
              <Link
                to={hero.secondaryCtaLink || '/pricing'}
                className="flex h-14 items-center justify-center gap-2 rounded-xl border border-white/15 dark:border-white/15 light:border-black/15 text-center text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition"
              >
                <Dot color="#10b981" /> View Plans
              </Link>
            </div>
          </div>
        </div>

        <Telemetry />
      </div>
    </section>
  )
}

/* ---------- telemetry panel ---------- */

function Telemetry() {
  const edgeNodes = [
    { region: 'us-east (Virginia)', status: 'ACTIVE', ttfb: '18ms', reqs: '4.8M / hr' },
    { region: 'eu-central (Frankfurt)', status: 'ACTIVE', ttfb: '22ms', reqs: '3.2M / hr' },
    { region: 'af-south (Nairobi)', status: 'ACTIVE', ttfb: '26ms', reqs: '6.1M / hr' },
    { region: 'ap-southeast (Singapore)', status: 'ACTIVE', ttfb: '31ms', reqs: '2.9M / hr' },
  ]
  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/10 dark:border-white/10 light:border-black/10 py-3">
        <div className="flex items-center gap-3">
          <Dot color="#10b981" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono dark:text-white light:text-[#090a0b]">
            Catalog Cloud Edge Telemetry &amp; Sync Bus
          </span>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-[var(--text-muted)]">
            PROTOCOL: GRAPHQL v3.4 + REST
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Mono className="text-[var(--text-muted)]">SUB-SECOND CACHE PURGE</Mono>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[#d2ff3a] font-mono">
            Zero Phantom Stock
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Catalog Snapshot */}
        <div className="rounded-3xl glass-panel p-6 border-white/10 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Mono className="text-[var(--text-muted)]">HEADLESS REPOSITORY</Mono>
              <h3 className="mt-1 font-serif text-2xl font-bold dark:text-white light:text-[#090a0b]">
                Omnichannel Master Catalog
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Multi-Storefront • Localized Currency • Real-Time Stock</p>
            </div>
            <span className="rounded-2xl px-3 py-1.5 text-center font-mono text-[10px] font-bold leading-tight bg-[#d2ff3a] text-[#090a0b]">
              HEALTH
              <br />
              99.99%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              ['Master SKUs', '1,420,890', ''],
              ['Sync Latency', '< 12ms', ' (-4ms)'],
              ['Channels Connected', '12 Storefronts', ''],
              ['Cache Hit Ratio', '99.4%', ''],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="text-[10px] text-[var(--text-muted)] font-mono">{k}</div>
                <div className="mt-1 text-sm font-bold dark:text-white light:text-[#090a0b]">
                  {v}
                  <span className="text-[10px] font-normal text-emerald-400">{s}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
              <span>Catalog Invalidation Frequency</span>
              <span className="font-mono font-bold text-[#d2ff3a]">Real-Time Event Driven</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[98%] bg-[#d2ff3a]" />
            </div>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 text-xs text-[var(--text-muted)]">
            <span>Inventory Reservation Guard</span>
            <span className="text-emerald-400 font-mono font-bold">Active &amp; Enforced</span>
          </div>
        </div>

        {/* Global Edge Node Latencies */}
        <div className="rounded-3xl glass-panel p-6 border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <Mono className="text-[var(--text-muted)]">DISTRIBUTED EDGE NODES</Mono>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-[#10b981]">
              <Dot color="#10b981" /> 24 GLOBAL EDGES
            </span>
          </div>
          <ul className="space-y-2.5">
            {edgeNodes.map((n) => (
              <li key={n.region} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#d2ff3a]" />
                  <div>
                    <div className="text-xs font-bold dark:text-white light:text-[#090a0b]">{n.region}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{n.reqs}</div>
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-[#d2ff3a]">{n.ttfb}</div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-white/10 pt-3 text-xs text-[var(--text-muted)]">
            <span>GLOBAL PEAK LOAD</span>
            <span className="font-mono text-emerald-400">Zero Throttling</span>
          </div>
        </div>

        {/* Live GraphQL Query Preview */}
        <div className="rounded-3xl glass-panel p-6 border-white/10 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Mono className="text-[var(--text-muted)]">GRAPHQL QUERY EXAMPLE</Mono>
            <Mono className="text-[#d2ff3a]">INSTANT PAYLOAD</Mono>
          </div>
          <div className="p-4 rounded-2xl bg-[#090a0b] border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed my-auto">
            <span className="text-blue-400">query</span> <span className="text-emerald-400">GetProductWithLiveStock</span> &#123;<br />
            &nbsp;&nbsp;product(sku: <span className="text-[#d2ff3a]">"SKU-99201"</span>) &#123;<br />
            &nbsp;&nbsp;&nbsp;&nbsp;title<br />
            &nbsp;&nbsp;&nbsp;&nbsp;price(currency: <span className="text-[#d2ff3a]">"KES"</span>)<br />
            &nbsp;&nbsp;&nbsp;&nbsp;stockByLocation(node: <span className="text-[#d2ff3a]">"Hub-NBO-01"</span>) &#123;<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;availableQuantity<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;isReserved<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br />
            &nbsp;&nbsp;&#125;<br />
            &#125;
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 font-mono text-[9px] text-[var(--text-muted)]">
            <span>RESPONSE: 200 OK</span>
            <span className="text-[#d2ff3a]">EXECUTION: 4ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- architectural promise ---------- */

function PromiseSection() {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 md:px-8 lg:grid-cols-2 lg:items-center">
      <div className="relative overflow-hidden rounded-3xl glass-panel border-white/10 shadow-2xl">
        <span className="absolute left-4 top-4 z-10 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 font-mono text-[10px] text-[#d2ff3a] border border-[#d2ff3a]/30">
          CATALOG_ENGINE // V3.4
        </span>
        <img
          src="/images/screen2.png"
          alt="Omnichannel Catalog Management Interface"
          className="h-[420px] w-full object-cover opacity-90"
        />
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl glass-panel border-white/15 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d2ff3a]/10 text-[#d2ff3a]">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-bold dark:text-white light:text-[#090a0b]">
                Zero Phantom Inventory Overselling
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Instant edge inventory sync prevents cart allocation race conditions</div>
            </div>
          </div>
          <span className="shrink-0 rounded-full px-3 py-1 font-mono text-[9px] font-bold bg-[#d2ff3a] text-[#090a0b]">
            ATOMIC CACHE
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <Pill>
          <Dot color="#d2ff3a" /> ARCHITECTURAL ADVANTAGE
        </Pill>
        <h2 className="font-serif text-3xl font-normal leading-tight sm:text-4xl md:text-5xl dark:text-white light:text-[#090a0b]">
          Never re-author products across fragmented eCommerce portals.
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Most modern enterprises struggle with product catalogs split across Shopify, WooCommerce, physical retail POS, and custom mobile apps. Price changes take hours to propagate, and flash sales result in disastrous phantom orders.
        </p>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Scryme Catalog Cloud serves as the single immutable repository for your brand's digital catalog. Line-item prices, currency conversions, multi-tier wholesale discounts, and live branch inventory are exposed through lightning-fast edge APIs.
        </p>
        <ul className="space-y-4 pt-2">
          {[
            ['Atomic Multi-Storefront Invalidation', 'Update product descriptions, high-res assets, or tax codes once. Changes propagate to all consumer apps in sub-seconds.'],
            ['Edge-Computed Wholesale Pricing', 'Dynamically calculate customer-specific price tiers and currency conversions at edge nodes closest to the user.'],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
                <Check className="h-3 w-3" />
              </span>
              <div>
                <div className="text-sm font-bold dark:text-white light:text-[#090a0b]">
                  {t}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------- capabilities ---------- */

function Capabilities({ data }: { data?: CmsPageData['features'] }) {
  const features = data && data.length > 0 ? data : DEFAULT_CMS_PAGE_FALLBACK.features!

  const stat = (k: string, v: string) => (
    <div className="flex-1 rounded-xl border border-white/5 bg-white/5 p-3">
      <div className="font-mono text-[9px] uppercase text-[var(--text-muted)]">{k}</div>
      <div className="mt-1 text-xs font-bold dark:text-white light:text-[#090a0b]">
        {v}
      </div>
    </div>
  )
  const Card = ({
    cap,
    tag,
    title,
    body,
    children,
  }: {
    cap: string
    tag: string
    title: string
    body: string
    children: React.ReactNode
  }) => (
    <div className="rounded-3xl glass-panel p-6 md:p-8 border-white/10 space-y-4">
      <div className="flex justify-between items-center">
        <Mono className="text-[var(--text-muted)]">{cap}</Mono>
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#d2ff3a] px-2 py-0.5 rounded bg-[#d2ff3a]/10 border border-[#d2ff3a]/20">
          {tag}
        </span>
      </div>
      <h3 className="font-serif text-2xl font-bold dark:text-white light:text-[#090a0b]">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{body}</p>
      <div className="pt-2">{children}</div>
    </div>
  )

  return (
    <section className="border-t border-white/10 dark:border-white/10 light:border-black/10 py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <Mono className="text-[var(--text-muted)]">OMNICHANNEL CATALOG CAPABILITIES</Mono>
          <h2 className="mt-2 font-serif text-3xl md:text-5xl dark:text-white light:text-[#090a0b]">
            Architected for limitless storefront scale.
          </h2>
        </div>
        <Mono className="text-[#d2ff3a]">SPECIFICATION // SPEC-CMS-812</Mono>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {features.map((f, idx) => (
          <Card
            key={idx}
            cap={`CAPABILITY 0${idx + 1}`}
            tag={f.badge || 'CORE CAPABILITY'}
            title={f.title}
            body={f.description || ''}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-3">
              <div className="flex justify-between font-mono text-[9px] text-[var(--text-muted)]">
                <span>CDN INFRASTRUCTURE</span>
                <span className="text-[#d2ff3a]">ANYCAST WORKERS</span>
              </div>
              <div className="flex gap-2">
                {stat('AVG TTFB', '24ms')}
                {stat('GLOBAL UPTIME', '99.999%')}
                {stat('AUTO COMPRESSION', 'AVIF / WebP')}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ---------- metrics ---------- */

function Metrics() {
  const items = [
    ['Edge Response Time', '38ms', 'P95 global content latency across all mobile and web storefront clients.'],
    ['SKU Scalability', '10M+', 'Catalog complexity supported with multi-variant hierarchical attributes.'],
    ['Overselling Incidents', '0.00%', 'Atomic inventory reservation eliminates phantom stockouts completely.'],
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 border-t border-white/10 dark:border-white/10 light:border-black/10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map(([k, v, d]) => (
          <div key={k} className="rounded-3xl glass-panel p-6 border-white/10 space-y-2">
            <Mono className="text-[var(--text-muted)]">{k}</Mono>
            <div className="font-serif text-4xl md:text-5xl font-bold text-[#d2ff3a]">
              {v}
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- case study ---------- */

function CaseStudy() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
      <div className="grid grid-cols-1 gap-8 rounded-3xl glass-panel p-8 md:p-12 border-white/10 lg:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <Pill>ENTERPRISE SPOTLIGHT • OMNICHANNEL RETAIL</Pill>
          <h2 className="mt-4 font-serif text-3xl md:text-5xl dark:text-white light:text-[#090a0b]">
            How Aetheria Retail unified 42 stores and 3 online storefronts.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
            By shifting from a legacy CMS and fragmented inventory connectors to Scryme Catalog Cloud, Aetheria achieved sub-second product updates across both physical retail counters and headless Next.js digital stores.
          </p>
          <blockquote className="mt-6 border-l-2 border-[#d2ff3a] pl-4 space-y-3">
            <p className="font-serif text-lg italic leading-relaxed dark:text-white light:text-[#090a0b]">
              “We previously spent hours explaining to frustrated customers why an item showing in stock online had actually been sold an hour ago in our store. Scryme solved that fundamentally on day one.”
            </p>
            <footer className="text-xs text-[var(--text-muted)]">
              <span className="font-bold text-white">Marc Dubois</span> — VP eCommerce &amp; Digital, Aetheria Brands
            </footer>
          </blockquote>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <Mono className="text-[#d2ff3a]">IMPACT ANALYSIS</Mono>
          <dl className="divide-y divide-white/10 text-xs">
            {[
              ['Catalog Update Latency', '45 min → 800ms', 'text-emerald-400'],
              ['Overselling Order Cancellations', '-99.2%', 'text-emerald-400'],
              ['Monthly API Ingestion Volume', '240M Queries', 'text-[#d2ff3a]'],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between py-3">
                <dt className="text-[var(--text-muted)]">{k}</dt>
                <dd className={`font-mono font-bold ${c}`}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href="https://app.scryme.tech/signup?plan=scale&trial=true"
            className="flex items-center justify-between rounded-xl p-3 font-mono text-xs font-bold uppercase text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition"
          >
            <span>Deploy Headless Storefront</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------- final CTA ---------- */

function FinalCta({ data }: { data?: CmsPageData['bottomCta'] }) {
  const cta = data || DEFAULT_CMS_PAGE_FALLBACK.bottomCta!

  return (
    <section className="px-4 py-20 md:px-8 max-w-7xl mx-auto text-center">
      <div className="glass-panel-elevated p-10 md:p-16 rounded-3xl relative overflow-hidden">
        <Pill className="mb-6">
          <Dot color="#d2ff3a" /> {cta.badge || 'FAST-START DEVELOPER PORTAL'}
        </Pill>
        <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl max-w-3xl mx-auto dark:text-white light:text-[#090a0b] mb-6">
          {cta.title || 'Power your storefronts with the fastest catalog API in commerce.'}
        </h2>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-8">
          {cta.subtitle || 'Integrate the Scryme SDK or query GraphQL endpoints directly from your frontend application in minutes.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={cta.primaryCtaLink || 'https://app.scryme.tech/signup?plan=free'}
            className="rounded-full px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#090a0b] bg-[#d2ff3a] hover:bg-[#c7f32c] transition shadow-lg"
          >
            {cta.primaryCtaText || 'Start Free Testing ($0/mo)'}
          </a>
          <Link
            to="/developers/apps"
            className="rounded-full border border-white/20 px-8 py-4 text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition"
          >
            Configure Developer Auth Client
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- page ---------- */

function CmsPageComponent() {
  const { cmsData, siteSettings } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#d2ff3a] selection:text-[#090a0b] transition-colors">
      <Header settings={siteSettings} />
      <main className="w-full">
        <Hero data={cmsData.hero} />
        <PromiseSection />
        <Capabilities data={cmsData.features} />
        <Metrics />
        <CaseStudy />
        <FinalCta data={cmsData.bottomCta} />
      </main>
      <Footer settings={siteSettings} />
    </div>
  )
}
