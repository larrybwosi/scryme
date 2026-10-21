import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  Database,
  ArrowRight,
  Zap,
  Globe,
  Code2,
  Server,
  Terminal,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Smartphone,
  Store,
  Building2,
  Lock
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/cms')({
  component: CmsComponent,
})

function CmsComponent() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#bef529] selection:text-[#12372a]">
      <Header />

      {/* Edge Status Ticker Sub-Header */}
      <div className="bg-[#efeeeb] border-b border-[#12372a]/10 px-4 py-2 text-[11px] font-mono tracking-wider uppercase text-[#414844]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#12372a]">
              <span className="w-2 h-2 rounded-full bg-[#bef529] animate-pulse" />
              EDGE KERNEL CDN ACTIVE
            </span>
            <span className="text-[#717974]">•</span>
            <span>POP_GLOBAL_SYNC: 312 NODES HEALTHY</span>
          </div>
          <div className="flex items-center gap-4">
            <span>MEAN EDGE TTFB: <strong className="text-[#12372a]">38.2ms</strong></span>
            <span className="text-[#717974]">•</span>
            <span>SCHEMA VERSION: <strong className="text-[#12372a]">v1.8.2-HEADLESS</strong></span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-12 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-md bg-[#e3e2e0] text-[#12372a] text-[11px] font-mono font-bold tracking-wider uppercase border border-[#12372a]/10">
                CORE PILLAR 04 • HEADLESS CMS & CATALOG CLOUD
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bef529] text-[#12372a] text-[11px] font-mono font-bold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
                Sub-50ms Universal TTL
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#171a19] tracking-tight leading-[1.1] mb-6 font-normal">
              Publish localized catalogs to global storefronts in <span className="italic text-[#12372a]">sub-50 milliseconds</span>.
            </h1>

            <p className="text-base sm:text-lg text-[#414844] max-w-2xl leading-relaxed mb-8">
              Synchronize multi-brand marketing pages, regional localized product catalogs, and custom enterprise portals directly from your ERP core without re-authoring content or managing brittle webhooks.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 pt-2">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full inline-flex items-center justify-between px-6 py-3.5 bg-[#12372a] text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#1e5139] transition shadow-sm group"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#bef529]" />
                Test GraphQL API in Sandbox
              </span>
              <ExternalLink className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <a
              href="#schema"
              className="w-full inline-flex items-center justify-between px-6 py-3.5 bg-white border border-[#12372a]/15 text-[#171a19] rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#f4f3f0] transition"
            >
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#12372a]" />
                View Schema Docs
              </span>
              <ArrowRight className="w-4 h-4 text-[#717974]" />
            </a>

            <div className="p-3.5 rounded-lg bg-[#f4f3f0] border border-[#12372a]/10 flex items-center gap-2.5 text-[11px] text-[#414844] font-mono">
              <ShieldCheck className="w-4 h-4 text-[#12372a] shrink-0" />
              <span>Deterministic cache validation across 150+ countries</span>
            </div>
          </div>
        </div>

        {/* Interactive Architecture Panel (pipeline-preview) */}
        <div className="mt-10 rounded-xl bg-[#002116] border border-[#12372a] p-6 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#bef529]" />
              <span className="text-[#bef529] font-bold">scryme://kernel.edge-catalog/pipeline-preview</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-white/60">REGION: GLOBAL MULTI-REGION</span>
              <span className="px-2 py-0.5 rounded bg-[#bef529] text-[#002116] font-bold">LIVE REPLICATION</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div className="p-5 rounded-lg bg-[#00170f] border border-white/10 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-[#70a487]">
                <span className="font-bold">01 • ERP SINGLE SOURCE</span>
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white font-sans">Master Catalog & Stock Ledger</h4>
              <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                Direct read from Scryme in-memory ledger. No batch imports, no detached intermediate PIM.
              </p>
              <div className="pt-2 text-[10px] space-y-1 text-white/80 border-t border-white/10">
                <div className="flex justify-between"><span>SKU:</span><span className="text-[#bef529]">VLT-CHAIR-BLK-09</span></div>
                <div className="flex justify-between"><span>Base MSRP:</span><span>€1,420.00 EUR</span></div>
                <div className="flex justify-between"><span>Available Nodes:</span><span className="text-[#bef529]">4,812 units (4 hubs)</span></div>
                <div className="flex justify-between"><span>Localized Variants:</span><span>32 Geographies</span></div>
              </div>
              <div className="pt-2 flex justify-between text-[10px] text-[#70a487] font-bold">
                <span>LEDGER SYNC LATENCY</span>
                <span className="text-[#bef529]">0.4ms</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-5 rounded-lg bg-[#00170f] border border-[#bef529]/30 font-mono text-xs space-y-3 relative">
              <div className="flex items-center justify-between text-[#bef529]">
                <span className="font-bold">02 • EDGE DYNAMIC COMPILER</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white font-sans">Real-Time Currency & VAT Engine</h4>
              <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                Calculates import tariffs, landed costs, geolocation pricing tiers, and tax matrices at the Cloudflare / Vercel Edge compute plane.
              </p>
              <div className="p-2.5 rounded bg-[#00281b] border border-[#bef529]/20 text-[10px] space-y-1">
                <div className="text-[#bef529] font-bold flex justify-between">
                  <span>RESOLVER_PIPELINE</span>
                  <span>100% CONSISTENT</span>
                </div>
                <div className="text-white/80">Tokyo (JPY): ¥218,800</div>
                <div className="text-white/80">Zurich (CHF): 1,380.-</div>
                <div className="text-white/80">London (GBP): £1,230</div>
                <div className="text-white/80">NYC (USD): $1,540</div>
              </div>
              <div className="pt-2 flex justify-between text-[10px] text-[#bef529] font-bold">
                <span>EDGE EDGE RESOLUTION</span>
                <span>14.3ms</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-5 rounded-lg bg-[#00170f] border border-white/10 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-[#70a487]">
                <span className="font-bold">03 • STOREFRONT ENDPOINTS</span>
                <Server className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white font-sans">Decoupled Omnichannel Runtimes</h4>
              <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                Instant invalidation across Next.js SSR, React Native, Swift native apps, and wholesale checkout portals.
              </p>
              <div className="pt-1 text-[10px] space-y-2 font-sans">
                <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono"><Globe className="w-3 h-3 text-[#bef529]" /> Web (Next.js App Router)</span>
                  <span className="font-mono text-[#bef529] font-bold">38ms TTFB</span>
                </div>
                <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono"><Smartphone className="w-3 h-3 text-[#bef529]" /> Mobile App (iOS / Swift)</span>
                  <span className="font-mono text-[#bef529] font-bold-[41ms TTFB] font-bold">41ms TTFB</span>
                </div>
                <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono"><Building2 className="w-3 h-3 text-[#bef529]" /> B2B Wholesale Portal</span>
                  <span className="font-mono text-[#bef529] font-bold">29ms TTFB</span>
                </div>
              </div>
              <div className="pt-2 flex justify-between text-[10px] text-[#70a487] font-bold font-mono">
                <span>INVALIDATION METHOD</span>
                <span className="text-white">ON-DEMAND PURGE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Enterprise Benchmarks */}
      <section className="py-12 bg-[#efeeeb] border-y border-[#12372a]/10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#414844]">VERIFIED ENTERPRISE BENCHMARKS</span>
              <h2 className="text-2xl md:text-3xl font-serif text-[#171a19] mt-1">SLA guarantee backed by hardware-isolated edge workers.</h2>
            </div>
            <p className="text-xs text-[#5f6662] max-w-md font-sans">
              Independent telemetry verified across 25 global availability regions spanning North America, EMEA, and Asia-Pacific.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-[#12372a]/10 shadow-sm">
              <div className="text-[11px] font-mono font-bold uppercase text-[#5f6662] mb-1">SLA RESILIENCE</div>
              <div className="text-4xl font-serif text-[#12372a] mb-2 font-normal">99.99% <span className="text-xs font-sans font-bold uppercase text-[#5f6662]">Uptime</span></div>
              <p className="text-xs text-[#414844] leading-relaxed mb-4">
                Financially backed service-level agreement with multi-provider redundancy and instantaneous edge failover.
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono pt-3 border-t border-[#12372a]/10 text-[#5f6662]">
                <span>DOWNTIME PER ANNUM</span>
                <span className="font-bold text-[#171a19]">&lt; 52.6 min max</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#12372a]/10 shadow-sm">
              <div className="text-[11px] font-mono font-bold uppercase text-[#5f6662] mb-1">GLOBAL EDGE LATENCY</div>
              <div className="text-4xl font-serif text-[#12372a] mb-2 font-normal">38ms <span className="text-xs font-sans font-bold uppercase text-[#5f6662]">p95 TTFB</span></div>
              <p className="text-xs text-[#414844] leading-relaxed mb-4">
                Product manifests and localized currency matrices served directly from memory inside 312 Edge Points of Presence.
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono pt-3 border-t border-[#12372a]/10 text-[#5f6662]">
                <span>CACHE HIT RATIO</span>
                <span className="font-bold text-[#12372a]">99.4% Global</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#12372a]/10 shadow-sm">
              <div className="text-[11px] font-mono font-bold uppercase text-[#5f6662] mb-1">ENGINEERING VELOCITY</div>
              <div className="text-4xl font-serif text-[#12372a] mb-2 font-normal">10× <span className="text-xs font-sans font-bold uppercase text-[#5f6662]">Faster Launch</span></div>
              <p className="text-xs text-[#414844] leading-relaxed mb-4">
                Spin up regional brands, localized landing pages, or private wholesale portals without schema migrations or custom backend scaffolding.
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono pt-3 border-t border-[#12372a]/10 text-[#5f6662]">
                <span>STOREFRONT DEPLOY</span>
                <span className="font-bold text-[#171a19]">Under 2 hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Capabilities (4-grid) */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5f6662]">ARCHITECTURE CAPABILITIES</span>
          <h2 className="text-3xl md:text-5xl font-serif text-[#171a19] mt-2 mb-4">
            Engineered for digital engineering teams who refuse tradeoffs.
          </h2>
          <p className="text-sm md:text-base text-[#414844] max-w-2xl leading-relaxed">
            Break the barrier between cold ERP databases and high-converting, blazing-fast storefront user experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature 01 */}
          <div className="bg-white p-8 rounded-lg border border-[#12372a]/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded bg-[#bef529] text-[#12372a] text-[10px] font-mono font-bold uppercase">FEATURE 01</span>
                <span className="text-[10px] font-mono text-[#5f6662]">312 GLOBAL POPs</span>
              </div>
              <h3 className="text-2xl font-serif text-[#171a19] mb-3">Edge-Cached Product Catalog with Sub-50ms Worldwide TTFB</h3>
              <p className="text-xs text-[#414844] leading-relaxed mb-6">
                Every SKU, attribute set, and multi-resolution media asset is pre-warmed across distributed edge nodes. Users in Frankfurt, Singapore, and São Paulo experience simultaneous, uncompromised load times.
              </p>
            </div>

            {/* Latency Bar Chart Mock */}
            <div className="p-4 rounded-lg bg-[#f4f3f0] border border-[#12372a]/10 font-mono text-[11px] space-y-2">
              <div className="flex justify-between text-[10px] text-[#5f6662] mb-1 font-bold">
                <span>EDGE REGION LATENCIES (ROUNDTRIP)</span>
                <span className="text-[#12372a]">ALL SYSTEMS NOMINAL</span>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1"><span>FRA-01 (Frankfurt)</span><span>18ms</span></div>
                <div className="w-full bg-[#e3e2e0] h-2 rounded-full overflow-hidden"><div className="bg-[#12372a] h-full w-[25%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1"><span>IAD-02 (Virginia)</span><span>27ms</span></div>
                <div className="w-full bg-[#e3e2e0] h-2 rounded-full overflow-hidden"><div className="bg-[#12372a] h-full w-[38%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1"><span>TYO-04 (Tokyo)</span><span>39ms</span></div>
                <div className="w-full bg-[#e3e2e0] h-2 rounded-full overflow-hidden"><div className="bg-[#12372a] h-full w-[55%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1"><span>SYD-01 (Sydney)</span><span>46ms</span></div>
                <div className="w-full bg-[#e3e2e0] h-2 rounded-full overflow-hidden"><div className="bg-[#12372a] h-full w-[65%]" /></div>
              </div>
            </div>
          </div>

          {/* Feature 02 */}
          <div className="bg-white p-8 rounded-lg border border-[#12372a]/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded bg-[#e3e2e0] text-[#12372a] text-[10px] font-mono font-bold uppercase">FEATURE 02</span>
                <span className="text-[10px] font-mono text-[#5f6662]">COMPLIANCE READY</span>
              </div>
              <h3 className="text-2xl font-serif text-[#171a19] mb-3">Dynamic Localized Pricing & Currency Compliance</h3>
              <p className="text-xs text-[#414844] leading-relaxed mb-6">
                Prices automatically resolve at runtime based on the shopper's IP, applying localized value-added tax (VAT), regional duty estimates, and custom tiered wholesale pricing rules.
              </p>
            </div>

            {/* Price Engine Box */}
            <div className="p-5 rounded-lg bg-[#002116] text-white font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-[10px] border-b border-white/10 pb-2">
                <span className="text-[#bef529] font-bold">MULTI-CURRENCY ENGINE</span>
                <span className="px-2 py-0.5 rounded bg-[#bef529] text-[#002116] font-bold">LIVE PURSUT</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-white/70">Gross Checkout Price</span>
                <span className="text-xl font-bold text-[#bef529]">€2,490.00 Incl. 19% MwSt</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-white/80 pt-2 border-t border-white/10">
                <span>Inland Freight / Landed Duty</span>
                <span className="text-[#bef529]">€0.00 (EU Nexus)</span>
              </div>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="bg-white p-8 rounded-lg border border-[#12372a]/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded bg-[#e3e2e0] text-[#12372a] text-[10px] font-mono font-bold uppercase">FEATURE 03</span>
                <span className="text-[10px] font-mono text-[#5f6662]">TYPE-SAFE SDKs</span>
              </div>
              <h3 className="text-2xl font-serif text-[#171a19] mb-3">Unified GraphQL & REST with Generated Typings</h3>
              <p className="text-xs text-[#414844] leading-relaxed mb-6">
                Auto-generate TypeScript types, Swift models, or Kotlin data classes whenever your ERP operations team updates custom catalog schemas or category taxonomies.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <span className="px-3 py-1.5 rounded-full bg-[#f4f3f0] border border-[#12372a]/15 text-[#12372a] font-mono text-xs font-bold">@scryme/react</span>
              <span className="px-3 py-1.5 rounded-full bg-[#f4f3f0] border border-[#12372a]/15 text-[#12372a] font-mono text-xs font-bold">@scryme/vue</span>
              <span className="px-3 py-1.5 rounded-full bg-[#f4f3f0] border border-[#12372a]/15 text-[#12372a] font-mono text-xs font-bold">Swift Package</span>
              <span className="px-3 py-1.5 rounded-full bg-[#f4f3f0] border border-[#12372a]/15 text-[#12372a] font-mono text-xs font-bold">Flutter SDK</span>
            </div>
          </div>

          {/* Feature 04 */}
          <div className="bg-white p-8 rounded-lg border border-[#12372a]/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded bg-[#bef529] text-[#12372a] text-[10px] font-mono font-bold uppercase">FEATURE 04</span>
                <span className="text-[10px] font-mono text-[#5f6662]">1,800+ SITES SYNCED</span>
              </div>
              <h3 className="text-2xl font-serif text-[#171a19] mb-3">Instant Omni-Channel Publishing via Single ERP Commitment</h3>
              <p className="text-xs text-[#414844] leading-relaxed mb-6">
                When product managers modify specifications or warehouse teams restock regional distribution points, Scryme propagates updates through Webhook meshes and edge cache revalidation tags in under 1.2 seconds.
              </p>
            </div>

            {/* 3-Step Timeline */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="p-2.5 rounded bg-[#f4f3f0] border border-[#12372a]/10">
                <div className="text-[#5f6662] mb-1">STEP 1</div>
                <div className="font-bold text-[#12372a]">ERP SKU Update</div>
                <div className="text-[9px] text-[#5f6662] mt-1">Committed to Postgres Core</div>
              </div>
              <div className="p-2.5 rounded bg-[#f4f3f0] border border-[#12372a]/10">
                <div className="text-[#5f6662] mb-1">STEP 2</div>
                <div className="font-bold text-[#12372a]">Edge Tag Purge</div>
                <div className="text-[9px] text-[#5f6662] mt-1">312 edge caches invalidated</div>
              </div>
              <div className="p-2.5 rounded bg-[#f4f3f0] border border-[#12372a]/10">
                <div className="text-[#5f6662] mb-1">STEP 3</div>
                <div className="font-bold text-[#12372a]">Storefront Refresh</div>
                <div className="text-[9px] text-[#5f6662] mt-1">Zero downtime for shoppers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Telemetry (Code Console) */}
      <section id="schema" className="py-16 bg-[#002116] text-white px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded bg-[#bef529] text-[#002116] font-mono text-[10px] font-bold uppercase tracking-wider">DEVELOPER TELEMETRY</span>
              <h2 className="text-3xl md:text-5xl font-serif text-white mt-3">
                Unified GraphQL Schema with Real-Time ERP Ledger Attachment
              </h2>
              <p className="text-sm text-white/70 max-w-2xl mt-2">
                One query provides the full CMS presentation content alongside active physical warehouse stock counts and regional price rules.
              </p>
            </div>
            <div className="p-2 rounded bg-[#00170f] border border-white/10 font-mono text-[11px] text-[#bef529]">
              ENDPOINT: https://api.scryme.cloud/graphql/v2
            </div>
          </div>

          {/* Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Query Editor */}
            <div className="lg:col-span-7 bg-[#00170f] rounded-lg border border-white/10 p-5 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-white ml-2">FetchCatalogProductWithStock.gql</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-[11px] text-[#bef529] hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Query'}</span>
                </button>
              </div>

              <pre className="text-emerald-300 overflow-x-auto text-[11px] leading-relaxed p-2">
{`<span className="text-[#bef529]">query</span> GetStorefrontProduct($sku: String!, $region: Spec!) {
  product(sku: $sku) {
    id
    sku
    title
    localizedMarketingCopy(region: $region) {
      headline
      heroImage { url blurhash }
      specifications
    }
    <span className="text-white/60"># real-time ERP ledger quantities attached at edge</span>
    inventory(fulfillmentMode: Spec) {
      availableToShip
      reservedQuantity
      nextRestockDate
      nodeLocations
    }
    pricing(currencyRegion: Spec) {
      currency
      amountFormatted
      vatPercentage
      dutiesIncluded
    }
  }
}`}
              </pre>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-white/60">
                <span>Estimated Query Execution: <strong className="text-[#bef529]">11.8ms</strong></span>
                <span>Query Cost: 2 / 10,000 req/s limit</span>
              </div>
            </div>

            {/* JSON Payload Preview */}
            <div className="lg:col-span-5 bg-[#00170f] rounded-lg border border-white/10 p-5 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px]">
                <span className="text-white font-bold">HTTP/2 200 OK • 38ms TTFB</span>
                <span className="text-[#70a487]">JSON Payload</span>
              </div>

              <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed p-2">
{`{
  <span className="text-[#bef529]">"data"</span>: {
    <span className="text-[#bef529]">"product"</span>: {
      <span className="text-[#70a487]">"sku"</span>: <span className="text-[#bef529]">"VLT-CHAIR-BLK-09"</span>,
      <span className="text-[#70a487]">"title"</span>: <span className="text-[#bef529]">"Surpme Executive Chair v2"</span>,
      <span className="text-[#70a487]">"inventory"</span>: {
        <span className="text-[#70a487]">"availableToShip"</span>: <span className="text-[#bef529]">142</span>,
        <span className="text-[#70a487]">"fulfillmentNode"</span>: <span className="text-[#bef529]">"FRA-CENTRAL"</span>,
        <span className="text-[#70a487]">"reorderInDays"</span>: <span className="text-[#bef529]">0.3</span>
      },
      <span className="text-[#70a487]">"pricing"</span>: {
        <span className="text-[#70a487]">"currency"</span>: <span className="text-[#bef529]">"EUR"</span>,
        <span className="text-[#70a487]">"amountFormatted"</span>: <span className="text-[#bef529]">"€1,420.00"</span>
      }
    }
  }
}`}
              </pre>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-white/60">
                <span>GLOBAL REVALIDATION TAG</span>
                <span className="text-[#bef529]">tag:sku:VLT-CHAIR-BLK-09</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Headless in Production (Showcase Cards) */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5f6662]">HEADLESS IN PRODUCTION</span>
            <h2 className="text-3xl md:text-5xl font-serif text-[#171a19] mt-2">
              Single catalog master. Endless storefront experiences.
            </h2>
          </div>
          <a href="https://app.scryme.tech/signup" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#12372a] hover:underline">
            <span>Explore enterprise customer case studies</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 01 */}
          <div className="bg-white rounded-lg border border-[#12372a]/10 overflow-hidden shadow-sm flex flex-col group">
            <div className="relative h-52 bg-slate-900 overflow-hidden flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div className="relative z-20 text-center space-y-2">
                <Store className="w-10 h-10 text-[#bef529] mx-auto opacity-80" />
                <span className="px-2.5 py-1 rounded bg-[#bef529] text-[#002116] font-mono text-[10px] font-bold uppercase inline-block">
                  Wholesale iPad POS
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-serif text-[#171a19] mb-2">In-Store Luxury Showrooms</h3>
                <p className="text-xs text-[#414844] leading-relaxed">
                  Showroom sales associates access live inventory reserves and customer bespoke pricing straight through native iPad apps.
                </p>
              </div>
            </div>
          </div>

          {/* Card 02 */}
          <div className="bg-white rounded-lg border border-[#12372a]/10 overflow-hidden shadow-sm flex flex-col group">
            <div className="relative h-52 bg-slate-900 overflow-hidden flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div className="relative z-20 text-center space-y-2">
                <Globe className="w-10 h-10 text-[#bef529] mx-auto opacity-80" />
                <span className="px-2.5 py-1 rounded bg-[#bef529] text-[#002116] font-mono text-[10px] font-bold uppercase inline-block">
                  Next.js 15 Web
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-serif text-[#171a19] mb-2">Global Consumer Flagship Storefront</h3>
                <p className="text-xs text-[#414844] leading-relaxed">
                  2.5 million daily sessions served via Next.js SSR with zero performance degradation during high-traffic drops.
                </p>
              </div>
            </div>
          </div>

          {/* Card 03 */}
          <div className="bg-white rounded-lg border border-[#12372a]/10 overflow-hidden shadow-sm flex flex-col group">
            <div className="relative h-52 bg-slate-900 overflow-hidden flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div className="relative z-20 text-center space-y-2">
                <Building2 className="w-10 h-10 text-[#bef529] mx-auto opacity-80" />
                <span className="px-2.5 py-1 rounded bg-[#bef529] text-[#002116] font-mono text-[10px] font-bold uppercase inline-block">
                  B2B Partner Matrix
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-serif text-[#171a19] mb-2">Self-Serve Dealer Portal</h3>
                <p className="text-xs text-[#414844] leading-relaxed">
                  Automated volume discounting schedules and live purchase order financing calculated at the API gateway layer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Sovereignty CTA Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-[#002116] text-white rounded-2xl p-8 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#bef529]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#bef529]">ARCHITECTURAL SOVEREIGNTY</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-serif text-white font-normal leading-tight">
              Upgrade your commerce infrastructure to sub-second ERP edge sync.
            </h2>

            <p className="text-sm text-white/80 leading-relaxed max-w-xl">
              Connect your existing Next.js, Nuxt, Shopify Plus, or mobile applications in hours. Dedicated technical migration architects provided for every enterprise implementation.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <a
                href="https://app.scryme.tech/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#bef529] text-[#002116] rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#a4d700] transition shadow-md"
              >
                <span>Request Technical Architecture Review</span>
              </a>

              <a
                href="#schema"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#00170f] border border-white/20 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition"
              >
                <span>Access Developer Sandbox</span>
              </a>
            </div>
          </div>

          {/* SLA Table Card */}
          <div className="lg:col-span-5 bg-[#00170f] rounded-xl border border-white/15 p-6 font-mono text-xs space-y-4">
            <div className="text-[#bef529] font-bold text-xs pb-3 border-b border-white/10 tracking-wider">
              SCRYME HEADLESS SLA GUARANTEES
            </div>

            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between items-center text-white/80">
                <span>Edge TTFB Commitment:</span>
                <span className="text-[#bef529] font-bold">&lt; 50ms (Global)</span>
              </div>
              <div className="flex justify-between items-center text-white/80">
                <span>Uptime Contractual SLA:</span>
                <span className="text-white font-bold">99.99%</span>
              </div>
              <div className="flex justify-between items-center text-white/80">
                <span>Cache Invalidation Speed:</span>
                <span className="text-[#bef529] font-bold">&lt; 1,200ms Worldwide</span>
              </div>
              <div className="flex justify-between items-center text-white/80">
                <span>SDK Coverage:</span>
                <span className="text-white font-bold">TypeScript, Swift, Kotlin, Go</span>
              </div>
              <div className="flex justify-between items-center text-white/80">
                <span>Data Sovereignty:</span>
                <span className="text-white font-bold">SOC2 Type II, DPA 27001, GDPR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
