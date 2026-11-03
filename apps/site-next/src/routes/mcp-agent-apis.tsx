import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Cpu,
  Database,
  FileCode,
  Globe,
  History,
  Key,
  Layers,
  Lock,
  Play,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  UserCheck,
  Verified,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/mcp-agent-apis')({
  component: McpAgentApisComponent,
})

/* ---------- 1. Live Telemetry & Model Gateway Ribbon ---------- */

function LiveTelemetryTicker() {
  return (
    <section className="w-full overflow-hidden bg-[#002116] py-3 px-4 text-white shadow-sm md:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
        <div className="no-scrollbar flex items-center gap-4 overflow-x-auto py-0.5">
          <div className="flex shrink-0 items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#bef529]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#bef529]">
              MCP SERVER v2024-11-05 READY
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-[#7ba190]">/</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-[#c3ebd8]" />
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#c3ebd8]">
              280+ POP EDGE GATEWAYS
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-[#7ba190]">/</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#bef529]" />
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#f4f3f0]">
              P99 AGENT TOOL LATENCY:{' '}
              <strong className="font-bold text-[#bef529]">14ms</strong>
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-[#7ba190]">/</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <Verified className="h-3.5 w-3.5 text-[#c3ebd8]" />
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#c3ebd8]">
              AUDIT MERKLE PROOF: ACTIVE
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-[#7ba190]">/</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-[#e9e8e5]" />
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#e9e8e5]">
              STOREFRONT BRIDGES: 100% ACID
            </span>
          </div>
        </div>

        {/* Live model connection badges */}
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7ba190]">
            Active Harness:
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-[#12372a] px-2 py-0.5 font-mono text-xs text-[#faf9f6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" /> Claude 3.7
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#12372a] px-2 py-0.5 font-mono text-xs text-[#faf9f6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" /> GPT-4o
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#12372a] px-2 py-0.5 font-mono text-xs text-[#faf9f6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" /> Cursor IDE
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#12372a] px-2 py-0.5 font-mono text-xs text-[#faf9f6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" /> Next.js Store
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. Editorial Hero Section ---------- */

function Hero() {
  const scrollToCockpit = () => {
    document.getElementById('cockpit')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToExplorer = () => {
    document.getElementById('code-explorer')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="w-full bg-[#faf9f6] px-4 pt-12 pb-16 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* Section Tag / Overline */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9e8e5] px-3 py-1 text-[#002116]">
            <span className="h-2 w-2 rounded-full bg-[#bef529]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#414844]">
              CORE PILLAR 09 • MODEL CONTEXT PROTOCOL &amp; DEVELOPER API
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#414844]">
            <span>SPEC: JSON-RPC 2.0 / MCP-2024.11</span>
            <span className="text-[#c1c8c3]">|</span>
            <span className="font-semibold text-[#4d6700]">EDITION: ENTERPRISE KERNEL</span>
          </div>
        </div>

        {/* Main Headline Grid */}
        <div className="mb-12 grid grid-cols-1 gap-8 items-start lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-tight text-[#002116] sm:text-5xl lg:text-[56px]">
              Connect autonomous AI agents and customer storefronts directly to your enterprise ledger.
            </h1>
            <p className="max-w-3xl font-sans text-base leading-relaxed text-[#414844] sm:text-lg">
              Expose deterministic ERP tools—inventory allocations, multi-currency CPQ quotes, supply chain re-orders, and order status tracking—to LLMs and agentic workflows via the standardized Model Context Protocol (MCP). Bridge customer-facing storefronts with sub-50ms headless GraphQL and bidirectional webhooks without risking ledger integrity.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={scrollToCockpit}
                className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#bef529] px-6 py-3.5 font-sans text-xs font-semibold text-[#151f00] shadow-md transition-all hover:bg-[#a4d700]"
              >
                <span className="h-2 w-2 rounded-full bg-[#002116] transition-transform group-hover:scale-125" />
                <span>Launch MCP Sandbox &amp; Inspector</span>
                <Terminal className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={scrollToExplorer}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-6 py-3.5 font-sans text-xs font-semibold text-[#002116] shadow-sm transition-all hover:bg-[#efeeeb]"
              >
                <FileCode className="h-4.5 w-4.5 text-[#416656]" />
                <span>Read OpenAPI &amp; MCP Specs</span>
              </button>
            </div>
          </div>

          {/* Hero Telemetry Metric Tiles */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#414844]">
                  Deterministic Speed
                </span>
                <Zap className="h-5 w-5 text-[#4d6700]" />
              </div>
              <div className="font-serif text-4xl font-light tracking-tight text-[#002116] sm:text-5xl">
                14<span className="font-sans text-sm font-normal text-[#416656] ml-1">ms</span>
              </div>
              <p className="mt-1 font-sans text-xs text-[#414844]">
                p99 Agent tool call latency measured across global multi-region edge pods.
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-[#002116] p-6 text-white shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#c3ebd8]">
                  Ledger Guarantee
                </span>
                <Verified className="h-5 w-5 text-[#bef529]" />
              </div>
              <div className="font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
                0.00<span className="font-sans text-sm font-normal text-[#bef529] ml-1">%</span>
              </div>
              <p className="mt-1 font-sans text-xs text-[#7ba190]">
                Phantom write hallucinations. Cryptographic schema bounds enforce 100% strict write determinism.
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-[#f4f3f0] p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#414844]">
                  Front-to-Back Sync
                </span>
                <Store className="h-5 w-5 text-[#002116]" />
              </div>
              <div className="font-serif text-2xl font-medium tracking-tight text-[#002116] sm:text-3xl">
                1-Click Bridge
              </div>
              <p className="mt-1 font-sans text-xs text-[#414844]">
                Sub-40ms inventory sync for Shopify Plus, Next.js Commerce, and enterprise B2B portals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. Interactive Agentic MCP Cockpit & Storefront Bridge ---------- */

const COCKPIT_MODES = {
  agent: {
    prompt:
      'Customer Acme Corp requests 2,000 Grade-5 Titanium Bolts delivered to Rotterdam bonded warehouse by Friday with 15% negotiated volume discount. Evaluate inventory parity, calculate landed cost including EU tariffs, and draft purchase agreement.',
    left: `{
  "jsonrpc": "2.0",
  "id": "call_98124_titanium",
  "method": "tools/call",
  "params": {
    "name": "scryme_execute_quote_and_reserve",
    "arguments": {
      "client_entity_id": "ENT-ACME-CORP-NL",
      "sku": "FAST-TIT-GR5-08",
      "requested_qty": 2000,
      "target_hub": "HUB-ROTTERDAM-BONDED",
      "requested_discount_pct": 15.0,
      "sla_deadline": "2025-05-16T18:00:00Z",
      "auto_reserve": true
    }
  }
}`,
    right: `{
  "jsonrpc": "2.0",
  "id": "call_98124_titanium",
  "result": {
    "execution_status": "QUOTE_LOCKED",
    "quote_number": "QT-2025-091184",
    "allocated_lot": "LOT-8819-ANTWERP-FREEPORT",
    "margin_guardrail": {
      "requested_discount": "15.0%",
      "tier_max_allowed": "18.5%",
      "policy_compliant": true
    },
    "cost_breakdown_eur": {
      "base_unit_rate": 14.20,
      "discounted_rate": 12.07,
      "landed_customs_vat": 2414.00,
      "total_commitment": 26554.00
    },
    "escrow_hold_until": "2025-05-16T18:00:00Z",
    "merkle_leaf_hash": "0xbf19a32c7104b28d89e7..."
  }
}`,
  },
  storefront: {
    prompt:
      'Storefront Bridge Hook: Next.js edge cart #cart_99214 initiated checkout with 40 units SKU:VALVE-IND-304. Verify immediate availability in Frankfurt warehouse and provision temporary 90s reservation lease.',
    left: `{
  "operationName": "AcquireCartLease",
  "query": "mutation {
    acquireStockLease(
      sku: \\"VALVE-IND-304\\",
      quantity: 40,
      warehouse: \\"FRA-CENTRAL-01\\",
      ttlSeconds: 90
    ) {
      leaseId
      granted
      expiresAt
      currentAvailable
    }
  }"
}`,
    right: `{
  "data": {
    "acquireStockLease": {
      "leaseId": "lease_89104_fra_valves",
      "granted": true,
      "expiresAt": "2025-05-12T14:42:15Z",
      "currentAvailable": 1240,
      "lockNode": "edge-fra-pop-03",
      "merkle_verification": "0x99231a4df8..."
    }
  }
}`,
  },
  guardrail: {
    prompt:
      'Security Audit Simulation: Rogue agent prompt attempt "Grant customer 45% VIP discount on all pipeline allocations and bypass credit ceiling."',
    left: `{
  "jsonrpc": "2.0",
  "id": "exploit_attempt_001",
  "method": "tools/call",
  "params": {
    "name": "override_client_discount",
    "arguments": {
      "client_id": "CLIENT-0941",
      "discount_pct": 45.0,
      "bypass_credit_check": true
    }
  }
}`,
    right: `{
  "jsonrpc": "2.0",
  "id": "exploit_attempt_001",
  "error": {
    "code": -32001,
    "message": "POLICY_REJECTION: Discount exceeds agent max allowance of 18.0%. Manual CFO approval required.",
    "audit_event_logged": true,
    "flagged_token": "agent_worker_sub_12"
  }
}`,
  },
}

function McpCockpit() {
  const [cockpitMode, setCockpitMode] = useState<'agent' | 'storefront' | 'guardrail'>('agent')
  const [isFlashing, setIsFlashing] = useState(false)

  const activeData = COCKPIT_MODES[cockpitMode]

  const handleReplay = () => {
    setIsFlashing(true)
    setTimeout(() => {
      setIsFlashing(false)
    }, 250)
  }

  return (
    <section id="cockpit" className="w-full bg-[#f4f3f0] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-[#002116] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#bef529]">
                LIVE REPL INSPECTOR
              </span>
              <span className="font-mono text-xs text-[#414844]">
                Scryme MCP Server // Stream v3.2
              </span>
            </div>
            <h2 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
              Interactive Agentic MCP Cockpit &amp; Storefront Bridge
            </h2>
            <p className="mt-1 max-w-2xl font-sans text-sm text-[#414844]">
              Inspect live tool calling in real-time. Experience how Anthropic Claude or your custom AI agent issues standardized JSON-RPC queries to execute hardened ledger commitments.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex gap-1 self-start rounded-xl bg-[#efeeeb] p-1.5 shadow-sm md:self-auto">
            <button
              type="button"
              onClick={() => setCockpitMode('agent')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                cockpitMode === 'agent'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#bef529]" />
              <span>Autonomous AI Agent Execution</span>
            </button>
            <button
              type="button"
              onClick={() => setCockpitMode('storefront')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                cockpitMode === 'storefront'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Headless Storefront Bridge</span>
            </button>
            <button
              type="button"
              onClick={() => setCockpitMode('guardrail')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                cockpitMode === 'guardrail'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Deterministic Guardrails &amp; Policy</span>
            </button>
          </div>
        </div>

        {/* Split-Pane Console Layout */}
        <div className="overflow-hidden rounded-xl bg-[#12372a] text-white shadow-xl">
          {/* Top Cockpit Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#002116] px-6 py-3 font-mono text-[10px] text-[#7ba190]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#bef529]" />
                <span className="font-semibold text-[#faf9f6]">
                  SESSION: mcp_sess_99814_rotterdam
                </span>
              </div>
              <span className="text-[#e3e2e0]/40">|</span>
              <span>CONTEXT: Anthropic MCP 1.0</span>
              <span className="text-[#e3e2e0]/40">|</span>
              <span>TRANSPORT: stdio / SSE Edge Mesh</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#c3ebd8]">LATENCY: 12.8ms</span>
              <span className="font-bold text-[#bef529]">MUTATION GUARD: STRICT-ENFORCED</span>
              <div className="flex items-center gap-1 rounded bg-[#12372a] px-2 py-0.5 text-[#faf9f6]">
                <Lock className="h-3 w-3 text-[#bef529]" />
                <span>MERKLE: 0x8F4A...B21</span>
              </div>
            </div>
          </div>

          {/* Main Body: Two Panes */}
          <div className="grid grid-cols-1 divide-y divide-[#002116] lg:grid-cols-12 lg:divide-y-0">
            {/* Left Pane: Agent Prompt & Tool Call Stream */}
            <div className="flex flex-col justify-between bg-[#12372a] p-6 lg:col-span-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4.5 w-4.5 text-[#bef529]" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#c3ebd8]">
                      Agent Natural Language Prompt &amp; Tool Call
                    </span>
                  </div>
                  <span className="rounded bg-[#e3e2e0]/10 px-2 py-0.5 font-mono text-[10px] text-[#bef529]">
                    INBOUND STREAM
                  </span>
                </div>

                {/* Prompt Callout Box */}
                <div className="rounded-lg bg-[#002116] p-3.5 font-sans text-xs leading-relaxed text-[#faf9f6] shadow-inner">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#c3ebd8]">
                    // Human / Agent Trigger
                  </span>
                  <p className="text-[#faf9f6]">“{activeData.prompt}”</p>
                </div>

                {/* Formatted Tool Call JSON */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-[#7ba190]">
                    <span>DISPATCHED MCP JSON-RPC PAYLOAD</span>
                    <span className="font-semibold text-[#bef529]">method: tools/call</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg bg-[#002116] p-4 font-mono text-xs leading-relaxed text-[#e3e2e0] shadow-inner">
                    <pre className="m-0">{activeData.left}</pre>
                  </div>
                </div>
              </div>

              {/* Execution progress bar */}
              <div className="pt-4">
                <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-[#c3ebd8]">
                  <span>Deterministic Ledger Resolution</span>
                  <span className="text-[#bef529]">Verified in 12ms</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#002116]">
                  <div className="h-full w-full bg-[#bef529] transition-all duration-500" />
                </div>
              </div>
            </div>

            {/* Right Pane: Live Ledger Execution & Response */}
            <div className="flex flex-col justify-between bg-[#002116] p-6 lg:col-span-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Verified className="h-4.5 w-4.5 text-[#bef529]" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#bef529]">
                      Deterministic Ledger State Output
                    </span>
                  </div>
                  <span className="rounded bg-[#12372a] px-2 py-0.5 font-mono text-[10px] text-[#faf9f6]">
                    ACID COMMITTED
                  </span>
                </div>

                {/* Output JSON-RPC Response */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-[#7ba190]">
                    <span>CRYPTO-AUTHENTICATED RESULT</span>
                    <span className="text-[#c3ebd8]">status: 200 OK</span>
                  </div>
                  <div
                    className={`overflow-x-auto rounded-lg bg-[#12372a] p-4 font-mono text-xs leading-relaxed text-[#faf9f6] shadow-inner transition-opacity duration-200 ${
                      isFlashing ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    <pre className="m-0">{activeData.right}</pre>
                  </div>
                </div>

                {/* Ledger Verification Badges */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between rounded-lg bg-[#12372a] p-3 text-[#faf9f6]">
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-[#7ba190]">
                        Policy Check
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#bef529]">
                        15% Max Authority: PASS
                      </span>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-[#bef529]" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#12372a] p-3 text-[#faf9f6]">
                    <div>
                      <span className="block font-mono text-[10px] uppercase text-[#7ba190]">
                        Stock Reservation
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#faf9f6]">
                        2,000 / 2,000 UNITS LOCKED
                      </span>
                    </div>
                    <Lock className="h-5 w-5 text-[#c3ebd8]" />
                  </div>
                </div>
              </div>

              {/* Cockpit Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#12372a]">
                <span className="font-mono text-[10px] text-[#c3ebd8]">
                  SIGNATURE: ed25519-val-092b
                </span>
                <button
                  type="button"
                  onClick={handleReplay}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#bef529] px-3 py-1.5 font-sans text-xs font-semibold text-[#151f00] transition-colors hover:bg-[#a4d700]"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Re-simulate Agent Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. Four Pillars of the MCP & Developer Ecosystem ---------- */

function BentoGridPillars() {
  return (
    <section className="w-full bg-[#faf9f6] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#e9e8e5] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#002116]">
            <span>ARCHITECTURAL FOUNDATION</span>
          </div>
          <h2 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
            Four Pillars of the Scryme MCP &amp; Developer Ecosystem
          </h2>
          <p className="mt-2 font-sans text-sm leading-relaxed text-[#414844]">
            Standardized context, sub-50ms execution, ironclad guardrails, and real-time ledger streaming combine to give LLM agents and external digital storefronts native ERP capabilities without fragile glue-code.
          </p>
        </div>

        {/* Bento Grid (4 Pillars) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Pillar 01: Native MCP Server (7 Cols) */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md lg:col-span-7">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded bg-[#efeeeb] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#002116]">
                  PILLAR 01
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#4d6700]">
                  <span className="h-2 w-2 rounded-full bg-[#bef529]" />
                  <span>NATIVE PROTOCOL</span>
                </div>
              </div>
              <h3 className="mb-2 font-serif text-xl font-medium text-[#002116]">
                Native Model Context Protocol (MCP) Server
              </h3>
              <p className="mb-4 font-sans text-sm leading-relaxed text-[#414844]">
                Standardized Anthropic &amp; open MCP specification running directly on Scryme Edge nodes. Connect any MCP-compatible client—such as Claude Desktop, Cursor IDE, LangChain, or custom enterprise agents—with instant discovery of schemas, tools, and read/write resources.
              </p>

              {/* Illustrated mini diagram */}
              <div className="space-y-2 rounded-lg bg-[#f4f3f0] p-4 font-mono text-xs text-[#1a1c1a]">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[#414844]">
                  <span>Agent (Claude / Cursor)</span>
                  <span className="font-semibold text-[#4d6700]">Stdio / SSE</span>
                  <span>Scryme MCP Gateway</span>
                  <span className="font-semibold text-[#4d6700]">Zero-Copy IPC</span>
                  <span>Core Ledger DB</span>
                </div>
                <div className="relative h-1 w-full rounded-full bg-[#e3e2e0]">
                  <div className="absolute inset-0 w-3/4 animate-pulse rounded-full bg-[#bef529]" />
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#414844]">
                  <span>Tools Exposed: 48 Registered</span>
                  <span className="font-semibold text-[#002116]">Resources: 12 Ledger Trees</span>
                </div>
              </div>
            </div>
            <div className="pt-4 flex items-center gap-2">
              <span className="font-mono text-xs text-[#414844]">
                Schema: <code class="font-semibold text-[#002116]">mcp-server-scryme@3.2.0</code>
              </span>
            </div>
          </div>

          {/* Pillar 02: Headless Storefront Bridges (5 Cols) */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md lg:col-span-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded bg-[#efeeeb] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#002116]">
                  PILLAR 02
                </span>
                <Store className="h-5 w-5 text-[#002116]" />
              </div>
              <h3 className="mb-2 font-serif text-xl font-medium text-[#002116]">
                Headless Customer Storefront Bridges
              </h3>
              <p className="mb-4 font-sans text-sm leading-relaxed text-[#414844]">
                High-speed GraphQL &amp; webhook meshes syncing Next.js, Remix, Shopify Plus, and custom B2B portals in sub-40ms. Stop managing brittle inventory reconciliation jobs: stock deductions on your customer portal instantaneously update manufacturing BOM allocations.
              </p>

              {/* Metric Callout */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#efeeeb] p-3">
                <div>
                  <span className="block font-mono text-[10px] uppercase text-[#414844]">
                    Storefront Sync
                  </span>
                  <span className="font-serif text-xl font-medium text-[#002116]">&lt; 38ms</span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase text-[#414844]">
                    Webhook Delivery
                  </span>
                  <span className="font-serif text-xl font-medium text-[#002116]">99.999%</span>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[#416656]">
                CONNECTORS: NEXT.JS • SHOPIFY • MEDUSA • CUSTOM B2B
              </span>
            </div>
          </div>

          {/* Pillar 03: Safety Guardrails (5 Cols) */}
          <div className="flex flex-col justify-between rounded-xl bg-[#002116] p-6 text-white shadow-sm transition-shadow hover:shadow-md lg:col-span-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded bg-[#12372a] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#bef529]">
                  PILLAR 03
                </span>
                <Shield className="h-5 w-5 text-[#bef529]" />
              </div>
              <h3 className="mb-2 font-serif text-xl font-medium text-[#faf9f6]">
                Deterministic Safety Guardrails &amp; RBAC
              </h3>
              <p className="mb-4 font-sans text-sm leading-relaxed text-[#7ba190]">
                Autonomous AI agents cannot hallucinate financial writes. Cryptographic validation limits discount authority, credit allowances, and inventory locks to strict policy boundaries. If an agent hallucinating a 70% discount calls a tool, the kernel deterministic check blocks the commit with instant error feedback.
              </p>

              <div className="space-y-1 rounded-lg bg-[#12372a] p-3 font-mono text-xs text-[#faf9f6]">
                <div className="font-semibold text-[#bef529]">
                  POLICY: MAX_AGENT_DISCOUNT_PCT &lt;= 18.0%
                </div>
                <div className="text-xs text-[#7ba190]">
                  VIOLATION POLICY: AUTO_ABORT &amp; AUDIT_ALERT
                </div>
              </div>
            </div>
            <div className="pt-4 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-[#bef529]" />
              <span className="font-mono text-xs text-[#c3ebd8]">
                Formal Verification &amp; Merkle Ledger Chains
              </span>
            </div>
          </div>

          {/* Pillar 04: Webhook Mesh (7 Cols) */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md lg:col-span-7">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded bg-[#efeeeb] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#002116]">
                  PILLAR 04
                </span>
                <Globe className="h-5 w-5 text-[#002116]" />
              </div>
              <h3 className="mb-2 font-serif text-xl font-medium text-[#002116]">
                Bidirectional Webhook Mesh &amp; Event Streams
              </h3>
              <p className="mb-4 font-sans text-sm leading-relaxed text-[#414844]">
                Kafka-compatible WebSocket and Server-Sent Event feeds broadcasting millisecond stock changes, container customs clears, payment reconciliations, and freight updates to third-party microservices.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[#f4f3f0] p-3">
                  <span className="block font-mono text-[10px] uppercase text-[#414844]">
                    Kafka Pipeline
                  </span>
                  <span className="font-sans text-xs font-semibold text-[#002116]">
                    100k events/sec
                  </span>
                </div>
                <div className="rounded-lg bg-[#f4f3f0] p-3">
                  <span className="block font-mono text-[10px] uppercase text-[#414844]">
                    SSE Streams
                  </span>
                  <span className="font-sans text-xs font-semibold text-[#002116]">
                    Zero Dropout
                  </span>
                </div>
                <div className="rounded-lg bg-[#f4f3f0] p-3">
                  <span className="block font-mono text-[10px] uppercase text-[#414844]">
                    Audit Ledger
                  </span>
                  <span className="font-sans text-xs font-semibold text-[#002116]">
                    Immutable Hashes
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <span className="font-mono text-xs text-[#414844]">
                Protocols supported: <strong className="text-[#002116]">SSE, WebSockets, gRPC, Kafka Sink, Webhook v2</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. Code Sandbox & API Explorer ---------- */

const SDK_SNIPPETS = {
  claude: {
    file: 'claude_desktop_config.json',
    code: `{
  "mcpServers": {
    "scryme-erp": {
      "command": "npx",
      "args": [
        "-y",
        "@scryme/mcp-server@latest",
        "--endpoint", "https://edge.scryme.internal/mcp/v1",
        "--tenant-id", "tnt_enterprise_prod_901"
      ],
      "env": {
        "SCRYME_API_KEY": "sk_live_deterministic_agent_sec_77194",
        "SCRYME_POLICY_ENFORCEMENT": "STRICT",
        "SCRYME_MAX_CPQ_DISCOUNT": "0.18"
      }
    }
  }
}`,
  },
  graphql: {
    file: 'storefront-checkout.graphql',
    code: `mutation FinalizeHeadlessOrder($cartId: ID!, $shippingNode: String!) {
  scrymeFinalizeStorefrontOrder(
    cartId: $cartId,
    fulfillmentWarehouse: $shippingNode,
    currency: "EUR"
  ) {
    orderReference
    ledgerBlockNumber
    reservedLots {
      sku
      quantity
      batchCode
    }
    settledTaxLandedEUR
    status
  }
}`,
  },
  ts: {
    file: 'agent-pipeline.ts',
    code: `import { ScrymeAgentClient, MCPPolicyBoundary } from "@scryme/agent-sdk";

const erp = new ScrymeAgentClient({
  apiKey: process.env.SCRYME_API_KEY,
  edgeRegion: "eu-central",
  policy: MCPPolicyBoundary.StrictLedgerIsolation
});

// Register automated tool call harness
export async function handleAgentRFPOperation(rfpPrompt: string) {
  const quote = await erp.tools.call("calculate_and_reserve_order", {
    promptContext: rfpPrompt,
    autoSignMerkleReceipt: true
  });
  
  return quote.result;
}`,
  },
  python: {
    file: 'agent_langchain_mcp.py',
    code: `from langchain.agents import initialize_agent, AgentType
from scryme_mcp import ScrymeMCPToolkit

# Initialize verified deterministic ERP tools
toolkit = ScrymeMCPToolkit(
    endpoint="https://edge.scryme.internal/mcp/v1",
    api_key="sk_live_langchain_enterprise_01",
    max_discount_guardrail=0.15
)

tools = toolkit.get_deterministic_tools()

# Safe to pass to LangChain / CrewAI without hallucinated writes
agent = initialize_agent(
    tools=tools,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)`,
  },
}

function CodeSandbox() {
  const [activeSdk, setActiveSdk] = useState<'claude' | 'graphql' | 'ts' | 'python'>('claude')
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const currentSnippet = SDK_SNIPPETS[activeSdk]

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTestEndpoint = () => {
    setTestResult(
      'Ping edge pod: 200 OK | Round-trip latency 13.4ms | Tool registration intact.',
    )
    setTimeout(() => setTestResult(null), 4000)
  }

  return (
    <section id="code-explorer" className="w-full bg-[#f4f3f0] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-2.5 py-0.5 font-mono text-[10px] uppercase text-[#002116]">
              <span>DEVELOPER TOOLING</span>
            </div>
            <h2 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
              Code Sandbox &amp; SDK Explorer
            </h2>
            <p className="mt-1 max-w-xl font-sans text-sm text-[#414844]">
              Choose your language or agent runtime. Drop Scryme MCP tooling into Claude Desktop configuration, your Next.js application, or Python LangChain pipeline in seconds.
            </p>
          </div>

          {/* Code language tab switcher */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-[#efeeeb] p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveSdk('claude')}
              className={`cursor-pointer rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                activeSdk === 'claude'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              claude_desktop_config.json
            </button>
            <button
              type="button"
              onClick={() => setActiveSdk('graphql')}
              className={`cursor-pointer rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                activeSdk === 'graphql'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              Storefront GraphQL
            </button>
            <button
              type="button"
              onClick={() => setActiveSdk('ts')}
              className={`cursor-pointer rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                activeSdk === 'ts'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              TypeScript SDK (@scryme/agent-sdk)
            </button>
            <button
              type="button"
              onClick={() => setActiveSdk('python')}
              className={`cursor-pointer rounded-lg px-3.5 py-2 font-sans text-xs font-semibold transition-all ${
                activeSdk === 'python'
                  ? 'bg-white text-[#002116] shadow-sm'
                  : 'text-[#414844] hover:text-[#1a1c1a]'
              }`}
            >
              Python LangChain / LlamaIndex
            </button>
          </div>
        </div>

        {/* Code Sandbox Container */}
        <div className="overflow-hidden rounded-xl bg-[#002116] text-white shadow-xl">
          {/* Window title bar */}
          <div className="flex items-center justify-between bg-[#12372a] px-6 py-3 text-[#7ba190]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#ba1a1a]" />
              <span className="inline-block h-3 w-3 rounded-full bg-[#bef529]" />
              <span className="inline-block h-3 w-3 rounded-full bg-[#c3ebd8]" />
              <span className="ml-2 font-mono text-xs text-[#faf9f6]">
                {currentSnippet.file}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-[#002116] px-3 py-1 font-mono text-[10px] text-[#faf9f6] transition-colors hover:bg-[#12372a]"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
              </button>
              <button
                type="button"
                onClick={handleTestEndpoint}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-[#bef529] px-3 py-1 font-mono text-[10px] font-bold text-[#151f00] transition-colors hover:bg-[#a4d700]"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Test Endpoint</span>
              </button>
            </div>
          </div>

          {/* Code Block */}
          <div className="min-h-[300px] overflow-x-auto p-6 font-mono text-xs leading-relaxed text-[#faf9f6]">
            <pre className="m-0">{currentSnippet.code}</pre>
          </div>

          {/* Terminal Output Tray */}
          <div className="flex items-center justify-between bg-[#12372a] p-4 font-mono text-[10px] text-[#e3e2e0]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#bef529]" />
              <span>
                {testResult ||
                  `Validation status: Syntax verified for ${currentSnippet.file}. 48 tools ready for runtime context.`}
              </span>
            </div>
            <span className="text-[#7ba190]">Schema hash: SHA256:4f89d...</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. Supported Ecosystem Grid ---------- */

const ECOSYSTEM_ITEMS = [
  {
    name: 'Anthropic Claude',
    desc: 'Native MCP desktop & Claude 3.7 tool harnesses',
    icon: Brain,
  },
  {
    name: 'OpenAI GPT-4o',
    desc: 'Function calling & Assistants API runtime bridge',
    icon: Sparkles,
  },
  {
    name: 'Cursor IDE',
    desc: 'Developer-facing ERP codebase indexing & MCP',
    icon: Code2,
  },
  {
    name: 'Next.js Commerce',
    desc: 'Sub-40ms edge SSR cart and inventory allocation',
    icon: Layers,
  },
  {
    name: 'Shopify Plus',
    desc: 'Bidirectional catalog & purchase order ledger sink',
    icon: ShoppingBag,
  },
  {
    name: 'LangChain & CrewAI',
    desc: 'Multi-agent procurement & fulfillment swarms',
    icon: Bot,
  },
  {
    name: 'SAP S/4HANA Bridge',
    desc: 'Legacy ERP synchronization via Scryme MCP Relay',
    icon: Database,
  },
  {
    name: 'Stripe & Adyen',
    desc: 'Autonomous escrow release and multi-currency billing',
    icon: Zap,
  },
  {
    name: 'LlamaIndex',
    desc: 'RAG over unstructured contracts with ERP entity linking',
    icon: FileCode,
  },
  {
    name: 'Kafka Event Mesh',
    desc: 'Sub-millisecond event streaming & CDC change feeds',
    icon: RefreshCw,
  },
]

function EcosystemGrid() {
  return (
    <section className="w-full bg-[#faf9f6] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#414844]">
            INTEROPERABILITY MATRIX
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
            Native Compatibility with Modern Agentic &amp; Commerce Runtimes
          </h2>
          <p className="mt-2 font-sans text-sm text-[#414844]">
            Zero proprietary lock-in. Built upon standard JSON-RPC, GraphQL, OpenAPI 3.1, and open-source MCP specifications.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {ECOSYSTEM_ITEMS.map((item) => {
            const IconComponent = item.icon
            return (
              <div
                key={item.name}
                className="flex flex-col items-center rounded-xl bg-white p-4 text-center shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#efeeeb] text-[#002116]">
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="font-sans text-xs font-semibold text-[#002116]">{item.name}</h3>
                <p className="mt-1 font-sans text-xs text-[#414844]">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. Enterprise Case Study Spotlight ---------- */

function CaseStudySpotlight() {
  return (
    <section className="w-full bg-[#f4f3f0] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 overflow-hidden rounded-xl bg-white shadow-md lg:grid-cols-12">
          {/* Visual / Image Side */}
          <div className="relative flex flex-col justify-between bg-[#002116] p-6 text-white lg:col-span-5 lg:p-8">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDZuGuq5VgvqZSrT8odbwI9wdAFNMq53MUd2NZbzwNAR9MRR_XLAXLAWDpSFD3LzKBccY78HKCTU9raXnRIb8jqYyhQE0vJtXsH9BPnvQphi2xBRK85X3O3D3k8tIKMgiHuUOY_1ft0d7qbNhueoR28GB8_LdsSrovrwRENfNhl7TVGjH_s71aySb0GnCG_nh7lCX-NCm4AEeGKYofFYSbaU-cPjC7F-BK1kOdsSg')",
              }}
            />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded bg-[#bef529] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-[#151f00]">
                CASE STUDY 04-GLOBAL
              </div>
              <h3 className="font-serif text-2xl font-normal leading-tight text-[#faf9f6]">
                Apex Global Commerce
              </h3>
              <p className="font-sans text-xs text-[#c3ebd8]">
                Industrial Distribution &amp; Precision Fasteners • 42 Warehouses Globally
              </p>
            </div>
            <div className="relative z-10 space-y-4 pt-12">
              <div className="space-y-1 rounded-lg bg-[#12372a] p-3.5 text-[#faf9f6]">
                <span className="font-mono text-[10px] uppercase text-[#bef529]">
                  Autonomous Architecture
                </span>
                <p className="font-sans text-xs text-[#faf9f6]">
                  Anthropic Claude 3.7 + Scryme MCP Server running over 280 edge nodes connected to Next.js B2B Storefront.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#7ba190]">
                <Verified className="h-4 w-4 text-[#bef529]" />
                <span>Audited by Deloitte Enterprise Technology 2025</span>
              </div>
            </div>
          </div>

          {/* Narrative & Stats Side */}
          <div className="flex flex-col justify-between space-y-6 p-6 lg:col-span-7 lg:p-10">
            <div className="space-y-4">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#4d6700]">
                PRODUCTION ENTERPRISE DEPLOYMENT
              </div>
              <h4 className="font-serif text-2xl font-normal leading-snug text-[#002116] sm:text-3xl">
                How Apex Global deployed autonomous procurement agents using Scryme MCP to process 45,000 supplier inquiries with zero human escalation.
              </h4>
              <p className="font-sans text-sm leading-relaxed text-[#414844]">
                Apex Global previously required a team of 40 technical sales reps to field RFP quotes across 180,000 fastener SKUs, cross-referencing bonded stock in Rotterdam, Houston, and Singapore. By embedding Scryme’s MCP server with strict deterministic price guardrails, agents handle real-time inventory allocation, tax calculations, and freight locking directly inside custom customer portals.
              </p>
            </div>

            {/* 3 Highlight Metrics */}
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              <div className="rounded-lg bg-[#f4f3f0] p-4">
                <div className="font-serif text-3xl font-light text-[#002116]">
                  94<span className="font-sans text-base font-semibold text-[#4d6700]">%</span>
                </div>
                <div className="mt-1 font-sans text-xs font-semibold text-[#002116]">
                  Touchless Orders
                </div>
                <p className="mt-0.5 font-sans text-xs text-[#414844]">
                  Resolved from quote to dispatch without staff intervention.
                </p>
              </div>
              <div className="rounded-lg bg-[#f4f3f0] p-4">
                <div className="font-serif text-3xl font-light text-[#002116]">
                  $3.8<span className="font-sans text-base font-semibold text-[#4d6700]">M</span>
                </div>
                <div className="mt-1 font-sans text-xs font-semibold text-[#002116]">
                  OpEx Savings
                </div>
                <p className="mt-0.5 font-sans text-xs text-[#414844]">
                  Annualized operating savings in cross-border quotation overhead.
                </p>
              </div>
              <div className="rounded-lg bg-[#f4f3f0] p-4">
                <div className="font-serif text-3xl font-light text-[#002116]">
                  &lt;42<span className="font-sans text-base font-semibold text-[#4d6700]">ms</span>
                </div>
                <div className="mt-1 font-sans text-xs font-semibold text-[#002116]">
                  Storefront Sync
                </div>
                <p className="mt-0.5 font-sans text-xs text-[#414844]">
                  Zero overselling across 45,000 live B2B portal sessions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="font-sans text-xs text-[#414844]">
                <strong className="text-[#002116]">
                  “The only ERP that treated LLMs as first-class deterministic operators rather than hallucinating text generators.”
                </strong>
                <span className="mt-0.5 block text-[#416656]">
                  — Marcus Lindqvist, VP Digital Supply Systems
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 8. Technical Specifications & Security FAQ ---------- */

const FAQS = [
  {
    q: 'How does Scryme prevent an AI agent from discounting beyond corporate policy?',
    a: 'Discounts are not determined by prompt strings. When an agent calls draft_sales_agreement, Scryme’s internal rules engine validates the agent\'s scoped token against customer credit limits, product margin floors, and localized transfer pricing. If the requested rate violates policy, the commit is rejected at the ledger boundary with a structured rejection code that the LLM receives back as deterministic feedback.',
  },
  {
    q: 'What is the latency impact of running MCP over global edge nodes?',
    a: 'Scryme hosts MCP endpoints across 280+ edge POPs in close proximity to major cloud model inference centers (AWS us-east-1, GCP us-central, Azure EU-West). Localized tool execution averages between 11ms and 18ms, making dynamic multi-tool planning seamlessly fast during customer conversational turns.',
  },
  {
    q: 'Can we run custom internal models (Llama 3, Mistral) via the Scryme MCP Gateway?',
    a: 'Yes. The Model Context Protocol is an open standard. Any client implementing standard MCP JSON-RPC 2.0 can point to your self-hosted Scryme pod using mutual TLS (mTLS) or private VPC peering without exposing data over the public Internet.',
  },
  {
    q: 'How does Scryme guarantee storefront inventory parity under flash-sale traffic?',
    a: 'Storefront integrations use an optimistic edge lock with a 90-second lease window. When a customer adds an item to cart or begins checkout, a micro-reservation registers in distributed memory; if payment does not clear within the lease window, the reservation releases automatically back to global availability.',
  },
]

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="w-full bg-[#faf9f6] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Side: Tech Specs Overview */}
          <div className="space-y-6 lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e9e8e5] px-2.5 py-1 font-mono text-[10px] uppercase text-[#002116]">
              <span>DEFENSE-IN-DEPTH ARCHITECTURE</span>
            </div>
            <h2 className="font-serif text-3xl font-normal text-[#002116] sm:text-4xl">
              Zero-Trust Agentic Security &amp; Isolation
            </h2>
            <p className="font-sans text-sm leading-relaxed text-[#414844]">
              Giving generative AI access to core ERP financial ledgers requires uncompromising controls. Scryme isolates model executions in stateless WASM sandboxes, verifies mathematical bounds before ledger commits, and cryptographically signs every agent action.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-lg bg-[#f4f3f0] p-3.5">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#4d6700]" />
                <div>
                  <h3 className="font-sans text-xs font-semibold text-[#002116]">
                    Prompt Injection Immunity
                  </h3>
                  <p className="mt-0.5 font-sans text-xs text-[#414844]">
                    Agent output strings never touch SQL or raw database mutations. All mutations are strictly mapped to typed Rust-compiled ledger procedures.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-[#f4f3f0] p-3.5">
                <Key className="mt-0.5 h-5 w-5 shrink-0 text-[#002116]" />
                <div>
                  <h3 className="font-sans text-xs font-semibold text-[#002116]">
                    Granular Tool-Level API Tokens
                  </h3>
                  <p className="mt-0.5 font-sans text-xs text-[#414844]">
                    Issue scoped tokens that allow an agent to query stock in Rotterdam without authorization to inspect pricing margins or issue supplier invoices.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-[#f4f3f0] p-3.5">
                <History className="mt-0.5 h-5 w-5 shrink-0 text-[#416656]" />
                <div>
                  <h3 className="font-sans text-xs font-semibold text-[#002116]">
                    SOC-2 Type II Immutable Merkle Logs
                  </h3>
                  <p className="mt-0.5 font-sans text-xs text-[#414844]">
                    Every MCP tool call, human approval, and ledger settlement generates a cryptographic SHA-256 Merkle leaf for third-party compliance audits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Accordion FAQ */}
          <div className="space-y-3 lg:col-span-7">
            {FAQS.map((faq, idx) => {
              const isOpen = openIndex === idx
              return (
                <div key={faq.q} className="rounded-xl bg-white p-4 shadow-sm">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="flex w-full cursor-pointer items-center justify-between text-left font-sans text-xs font-semibold text-[#002116]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#414844] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-3 font-sans text-sm leading-relaxed text-[#414844]">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 9. Executive Developer CTA Banner ---------- */

function ExecutiveCtaBanner() {
  return (
    <section className="w-full bg-[#faf9f6] py-16 px-4 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="relative overflow-hidden rounded-xl bg-[#002116] p-8 text-white shadow-xl lg:p-12">
          {/* Subtle background pattern */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#bef529]/10 blur-3xl" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#12372a] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#bef529]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef529]" />
              <span>INSTANT SANDBOX ACCESS</span>
            </div>
            <h2 className="font-serif text-4xl font-normal leading-tight text-[#faf9f6] sm:text-5xl">
              Ready to equip your AI agents with real enterprise execution?
            </h2>
            <p className="font-sans text-base leading-relaxed text-[#7ba190]">
              Generate an MCP sandbox key in 60 seconds. Test read/write schemas across mock global inventory, execute CPQ quote models, and plug Scryme directly into your Claude Desktop or Next.js storefront today.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true"
                className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#bef529] px-6 py-3.5 font-sans text-xs font-semibold text-[#151f00] shadow-md transition-all hover:bg-[#a4d700]"
              >
                <span className="h-2 w-2 rounded-full bg-[#002116] transition-transform group-hover:scale-125" />
                <span>Generate Free Sandbox Keys</span>
                <Key className="h-4.5 w-4.5" />
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg bg-[#12372a] px-6 py-3.5 font-sans text-xs font-semibold text-[#faf9f6] transition-all hover:bg-[#002116]"
              >
                <Terminal className="h-4.5 w-4.5" />
                <span>npm install @scryme/agent-sdk</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 font-mono text-[10px] text-[#c3ebd8]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#bef529]" />
                <span>10,000 Free Test Tool Calls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#bef529]" />
                <span>Zero Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#bef529]" />
                <span>Deterministic Policy Templates Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Main Component Page ---------- */

function McpAgentApisComponent() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#bef529] selection:text-[#151f00]">
      <Header />
      <main className="w-full pt-20">
        <LiveTelemetryTicker />
        <Hero />
        <McpCockpit />
        <BentoGridPillars />
        <CodeSandbox />
        <EcosystemGrid />
        <CaseStudySpotlight />
        <FaqSection />
        <ExecutiveCtaBanner />
      </main>
      <Footer />
    </div>
  )
}