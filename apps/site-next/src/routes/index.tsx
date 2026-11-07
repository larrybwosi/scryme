import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Gauge,
  MonitorSmartphone,
  RefreshCw,
  Terminal,
  X,
} from 'lucide-react'
import { fetchHomePage, fetchSiteSettings, DEFAULT_HOME_PAGE_FALLBACK, DEFAULT_SITE_SETTINGS_FALLBACK, HomePageData, SiteSettings } from '../sanity/queries'
import { createSiteSeo } from '../lib/seo'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [homeData, siteSettings] = await Promise.all([
      fetchHomePage(),
      fetchSiteSettings(),
    ])
    return {
      homeData: homeData || DEFAULT_HOME_PAGE_FALLBACK,
      siteSettings: siteSettings || DEFAULT_SITE_SETTINGS_FALLBACK,
    }
  },
  head: ({ loaderData }) => {
    const home = loaderData?.homeData
    const settings = loaderData?.siteSettings
    const faqs = home?.faqsSection?.faqs

    return createSiteSeo({
      pathname: '/',
      siteSettings: settings,
      seoData: home?.seo,
      title: home?.seo?.metaTitle || 'Scryme | Autonomous Next-Gen ERP Operating Kernel',
      description: home?.seo?.metaDescription || home?.hero?.subtitle,
      faqs,
    })
  },
  component: HomeComponent,
})

/* ---------- Small Shared Components ---------- */

function PingDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#bef529] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#bef529]" />
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4d6700] dark:text-[#d2ff3a]">
      {children}
    </span>
  )
}

/* ---------- 1. Hero Section ---------- */

function Hero({ data }: { data?: HomePageData['hero'] }) {
  const heroData = data || DEFAULT_HOME_PAGE_FALLBACK.hero!
  const heroImageSrc = heroData.heroImageUrlFallback || DEFAULT_HOME_PAGE_FALLBACK.hero!.heroImageUrlFallback

  return (
    <section className="relative w-full overflow-hidden px-4 pb-20 pt-12 md:px-8 md:pt-16" data-scroll-reveal="fade-in">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] px-3 py-1.5 shadow-sm">
            <PingDot />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-main)]">
              {heroData.badge || 'Scryme ERP OS v3.2 • Unified Operational Kernel'}
            </span>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-muted)] sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d6700]" />
            <span>{heroData.nodeCounterText || '180+ NODES SYNCHRONIZED'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <h1 className="font-serif max-w-4xl text-4xl font-normal leading-[1.08] tracking-tight text-[var(--text-main)] sm:text-6xl md:text-7xl">
              {heroData.headline || 'Can one smarter engine scale your entire enterprise?'}
            </h1>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <p className="font-sans text-base leading-relaxed text-[var(--text-muted)]">
              {heroData.subtitle || 'Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship intelligence, and decoupled catalog engines across an immutable sub-millisecond mesh. Zero fragmented connectors.'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={heroData.primaryCtaLink || 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true'}
                className="group inline-flex items-center justify-center rounded-lg bg-[#002116] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#12372a] hover:shadow-lg"
              >
                <span className="mr-2.5 h-2 w-2 rounded-full bg-[#bef529] transition-transform group-hover:scale-125" />
                <span>{heroData.primaryCtaText || 'Start 14-Day Enterprise Trial'}</span>
              </a>
              <Link
                to={heroData.secondaryCtaLink || '/pricing'}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--bg-tertiary)] px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] transition-colors hover:bg-[#e3e2e0]"
              >
                {heroData.secondaryCtaText || 'Schedule Enterprise Demo'}
              </Link>
            </div>
          </div>
        </div>

        <div className="group relative mt-4 w-full overflow-hidden rounded-2xl bg-[#e3e2e0] shadow-xl">
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
            <img
              alt="Autonomous Global Operations Command Headquarters"
              src={heroImageSrc}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002116]/90 via-[#002116]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-end md:p-8">
              <div className="flex max-w-xl flex-col gap-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
                  Global Control Substrate
                </span>
                <p className="font-sans text-sm font-semibold text-white sm:text-base">
                  {heroData.heroImageCaption || 'Autonomous Global Operations Command • Sub-12ms Telemetry Fabric across 180+ Enterprise Nodes'}
                </p>
              </div>
              <div className="flex items-center gap-3 self-start rounded-xl bg-white/90 dark:bg-[#1f2021]/90 border border-white/20 dark:border-white/10 px-4 py-2 text-[var(--text-main)] backdrop-blur-md shadow-sm backdrop-blur-md sm:self-auto">
                <Gauge className="h-4 w-4 text-[#4d6700] dark:text-[#d2ff3a]" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Sync State
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-main)]">
                    {heroData.syncStateText || '0.008s Consensus'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Core Pillars ---------- */

function Pillars({ data }: { data?: HomePageData['pillarsSection'] }) {
  const pillarsSection = data || DEFAULT_HOME_PAGE_FALLBACK.pillarsSection!
  const pillars = pillarsSection.pillars && pillarsSection.pillars.length > 0
    ? pillarsSection.pillars
    : DEFAULT_HOME_PAGE_FALLBACK.pillarsSection!.pillars!

  return (
    <section className="w-full bg-[var(--bg-secondary)] px-4 py-20 md:px-8" data-scroll-reveal="fade-in">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Eyebrow>{pillarsSection.eyebrow || '01 // Architectural Pillars'}</Eyebrow>
              <span className="h-px w-8 bg-[#c1c8c3]" />
            </div>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-[var(--text-main)] sm:text-4xl md:text-5xl">
              {pillarsSection.title || 'Four specialized engines. Zero operational friction.'}
            </h2>
          </div>
          <p className="font-sans max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
            {pillarsSection.description || 'Explore the modular, single-state systems powering multinational enterprises. Every action updates the kernel in sub-millisecond real time.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-2xl glass-panel hover-lift p-8 shadow-sm"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {p.label}
                  </span>
                  <span className="font-mono inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--text-main)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4d6700]" />
                    {p.badge}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-serif text-3xl text-[var(--text-main)] md:text-4xl font-normal">
                    {p.stat}
                  </span>
                  <h3 className="font-serif text-2xl font-medium text-[var(--text-main)]">
                    {p.title}
                  </h3>
                </div>
                <p className="font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                  {p.body}
                </p>
              </div>
              <div className="mt-6 pt-8">
                <Link
                  to={p.href || '/'}
                  className="font-sans inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-main)] transition-colors group-hover:text-[#4d6700] dark:text-[#d2ff3a]"
                >
                  <span>{p.cta || 'Learn More'}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-6 hover-lift">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#002116] text-white">
                <Terminal className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text-main)]">
                  Model Context Protocol (MCP) &amp; APIs
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Stream programmatic ERP state to Claude, GPT-4, and custom AI agents.
                </span>
              </div>
            </div>
            <Link
              to="/developers/apps"
              aria-label="Developer Console"
              className="shrink-0 rounded-lg bg-white p-2.5 text-[var(--text-main)] transition-colors hover:bg-[#002116] hover:text-white"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-6 hover-lift">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#bef529] text-[#151f00]">
                <MonitorSmartphone className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text-main)]">
                  Native Mobile Operations Hub
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Real-time floor scans, inventory audit adjustments, and pipeline approvals on iOS &amp; Android.
                </span>
              </div>
            </div>
            <Link
              to="/payments"
              aria-label="Payments Architecture"
              className="shrink-0 rounded-lg bg-white p-2.5 text-[var(--text-main)] transition-colors hover:bg-[#002116] hover:text-white"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Paradigm Shift ---------- */

function Paradigm({ data }: { data?: HomePageData['paradigmSection'] }) {
  const paradigm = data || DEFAULT_HOME_PAGE_FALLBACK.paradigmSection!
  const legacy = paradigm.legacyItems || DEFAULT_HOME_PAGE_FALLBACK.paradigmSection!.legacyItems!
  const kernel = paradigm.kernelItems || DEFAULT_HOME_PAGE_FALLBACK.paradigmSection!.kernelItems!
  const boardroomImg = paradigm.boardroomImageUrlFallback || DEFAULT_HOME_PAGE_FALLBACK.paradigmSection!.boardroomImageUrlFallback!

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8" data-scroll-reveal="fade-in">
      <div className="flex flex-col gap-16">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Eyebrow>{paradigm.eyebrow || '02 // Paradigm Shift'}</Eyebrow>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-[var(--text-main)] sm:text-4xl md:text-5xl">
              {paradigm.title || 'Stop paying the middleware tax on broken operational data.'}
            </h2>
            <p className="font-sans text-base leading-relaxed text-[var(--text-muted)]">
              {paradigm.description || 'Enterprise systems failed because they bolted isolated SaaS point solutions together with duct-tape webhooks. When data is replicated across 9 different vendors, truth becomes obsolete within 15 minutes.'}
            </p>
            <div className="flex flex-col gap-3 rounded-xl bg-[var(--bg-secondary)] p-5">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-[18px] w-[18px] text-[#ba1a1a]" />
                <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                  {paradigm.calloutTitle || 'The True Cost of Legacy SaaS Sprawl'}
                </span>
              </div>
              <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
                {paradigm.calloutDescription || 'The average $100M+ enterprise spends $184,000 annually maintaining API sync scripts, reconciling ledger mismatches, and investigating phantom inventory orders.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-tertiary)] shadow-xl">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  alt="Senior enterprise leadership reviewing real-time global supply chain telemetry"
                  src={boardroomImg}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="flex flex-col items-start justify-between gap-4 bg-[var(--card-bg)] border-t border-[var(--border-subtle)] p-6 sm:flex-row sm:items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--text-main)]">
                    Executive Visibility Room
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Cross-node revenue &amp; logistics consensus active
                  </span>
                </div>
                <div className="font-mono flex items-center gap-2 text-xs font-semibold text-[#4d6700] dark:text-[#d2ff3a]">
                  <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                  ZERO SYNCHRONIZATION DELAY
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-8">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                The Conventional Pattern
              </span>
              <span className="font-mono rounded bg-[#ffdad6] px-2.5 py-1 text-xs font-semibold text-[#93000a]">
                Legacy Sprawl
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {legacy.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#ba1a1a]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--text-main)]">{item.title}</span>
                    <span className="text-xs text-[var(--text-muted)] leading-relaxed">{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-[#002116] p-8 text-white shadow-xl">
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
                Scryme Unified Kernel
              </span>
              <span className="font-mono rounded-full bg-[#bef529] px-2.5 py-1 text-xs font-bold text-[#151f00]">
                Sub-12ms Mesh
              </span>
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              {kernel.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#bef529]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{item.title}</span>
                    <span className="text-xs text-[#7ba190] leading-relaxed">{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Metrics & Case Study ---------- */

function MetricsAndCase({ data }: { data?: HomePageData['metricsSection'] }) {
  const metricsData = data || DEFAULT_HOME_PAGE_FALLBACK.metricsSection!
  const metrics = metricsData.metrics || DEFAULT_HOME_PAGE_FALLBACK.metricsSection!.metrics!
  const spotlight = metricsData.spotlight || DEFAULT_HOME_PAGE_FALLBACK.metricsSection!.spotlight!

  return (
    <section className="w-full bg-[var(--bg-secondary)] px-4 py-20 md:px-8" data-scroll-reveal="fade-in">
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-2xl glass-panel hover-lift p-6 shadow-sm">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                {m.label}
              </span>
              <span className="font-serif text-3xl font-normal text-[var(--text-main)] md:text-4xl">
                {m.value}
              </span>
              <span className="font-sans text-xs text-[var(--text-muted)]">{m.description}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-10 rounded-3xl glass-panel hover-lift p-8 shadow-md lg:flex-row md:p-12">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="font-mono rounded-full bg-[#bef529] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#151f00]">
                {spotlight.badge || 'Customer Spotlight'}
              </span>
              <span className="font-sans text-sm font-semibold text-[var(--text-main)]">
                {spotlight.company || 'Veloce Global Logistics AG'}
              </span>
            </div>
            <blockquote className="font-serif text-xl font-medium leading-snug text-[var(--text-main)] sm:text-2xl md:text-3xl">
              "{spotlight.quote}"
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="font-sans flex h-12 w-12 items-center justify-center rounded-full bg-[#002116] text-sm font-bold text-white">
                {spotlight.authorName ? spotlight.authorName.split(' ').map(n => n[0]).join('') : 'ER'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text-main)]">{spotlight.authorName}</span>
                <span className="text-xs text-[var(--text-muted)]">{spotlight.authorRole}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-6 lg:w-80">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Deployment Summary
            </span>
            <div className="flex flex-col gap-3">
              {(spotlight.deploymentStats || []).map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{stat.label}</span>
                  <span className="font-mono font-semibold text-[var(--text-main)]">{stat.value}</span>
                </div>
              ))}
            </div>
            <Link
              to={spotlight.caseStudyLink || '/crm'}
              className="mt-2 rounded-lg bg-[#002116] py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#12372a]"
            >
              Read Full Case Study
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. FAQ Accordion ---------- */

function Faq({ data }: { data?: HomePageData['faqsSection'] }) {
  const [open, setOpen] = useState<number | null>(null)
  const faqData = data || DEFAULT_HOME_PAGE_FALLBACK.faqsSection!
  const faqs = faqData.faqs || DEFAULT_HOME_PAGE_FALLBACK.faqsSection!.faqs!

  return (
    <section className="mx-auto max-w-4xl px-4 py-24 md:px-8" data-scroll-reveal="fade-in">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>{faqData.eyebrow || '03 // Architectural Inquiries'}</Eyebrow>
          <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-[var(--text-main)] sm:text-4xl md:text-5xl">
            {faqData.title || 'Frequently asked questions by enterprise engineering & leadership'}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] transition-all duration-200"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-bold text-[var(--text-main)]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#4d6700] dark:text-[#d2ff3a]' : 'text-[#717974]'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 font-sans text-sm leading-relaxed text-[var(--text-muted)]">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Bottom Conversion CTA ---------- */

function FinalCta({ data }: { data?: HomePageData['bottomCta'] }) {
  const cta = data || DEFAULT_HOME_PAGE_FALLBACK.bottomCta!
  const guarantees = cta.guarantees || DEFAULT_HOME_PAGE_FALLBACK.bottomCta!.guarantees!

  return (
    <section className="w-full bg-[#002116] dark:bg-[#090a0b] border-t border-[var(--border-subtle)] px-4 py-20 text-white md:px-8" data-scroll-reveal="fade-in">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 py-10 text-center">
        <div className="font-mono inline-flex items-center gap-2 rounded-full bg-[#12372a] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#bef529]">
          {cta.badge || 'Autonomous Enterprise Orchestration'}
        </div>
        <h2 className="font-serif max-w-3xl text-3xl font-normal leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
          {cta.title || 'Reclaim command of your global operations today.'}
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-[#7ba190]">
          {cta.subtitle || 'Speak directly with a Principal Enterprise Solutions Architect or spin up an isolated staging sandbox loaded with your sample catalog and node taxonomy.'}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <a
            href={cta.primaryCtaLink || 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true'}
            className="inline-flex items-center justify-center rounded-xl bg-[#bef529] px-8 py-4 text-xs font-bold uppercase tracking-wider text-[#151f00] shadow-lg transition-all hover:bg-[#a4d700] hover:shadow-xl"
          >
            {cta.primaryCtaText || 'Start 14-Day Enterprise Trial'}
          </a>
          <Link
            to={cta.secondaryCtaLink || '/pricing'}
            className="inline-flex items-center justify-center rounded-xl bg-[#12372a] px-8 py-4 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#003923]"
          >
            {cta.secondaryCtaText || 'Schedule Architecture Review'}
          </Link>
        </div>
        <div className="font-mono mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#7ba190]">
          {guarantees.map((t, i) => (
            <span key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" />
              {t}
              {i < guarantees.length - 1 && <span className="ml-4 text-white/30">•</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Page Layout ---------- */

function HomeComponent() {
  const { homeData, siteSettings } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[#bef529] selection:text-[#151f00] transition-colors">
      <Header settings={siteSettings} />
      <main className="w-full pt-20">
        <Hero data={homeData.hero} />
        <Pillars data={homeData.pillarsSection} />
        <Paradigm data={homeData.paradigmSection} />
        <MetricsAndCase data={homeData.metricsSection} />
        <Faq data={homeData.faqsSection} />
        <FinalCta data={homeData.bottomCta} />
      </main>
      <Footer settings={siteSettings} />
    </div>
  )
}
