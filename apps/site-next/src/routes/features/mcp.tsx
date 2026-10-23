import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import {
  Terminal,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Play,
  Cpu,
  Layers,
  Activity,
  Server,
  Lock,
  Database,
  Code
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/features/mcp')({
  component: McpFeatureComponent,
})

function McpFeatureComponent() {
  const [copied, setCopied] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<'json' | 'ts' | 'python' | 'curl'>('json')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionCount, setExecutionCount] = useState(142)
  const [executionResult, setExecutionResult] = useState<string | null>(null)

  const commandText = 'npx @scryme/mcp-server --cluster=eu-central-01'

  const copyCommand = () => {
    navigator.clipboard.writeText(commandText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTestInvocation = () => {
    setIsExecuting(true)
    setExecutionResult(null)
    setTimeout(() => {
      setIsExecuting(false)
      setExecutionCount(prev => prev + 1)
      setExecutionResult(
        JSON.stringify(
          {
            status: 'SUCCESS',
            execution_time_ms: 11.2,
            consensus: 'Immediate Single-Node',
            tls: '1.3 / ecdsa',
            allocation: {
              warehouse_id: 'NL-RTM-14',
              sku: 'SKU-992-OPTIC',
              units_allocated: 1000,
              ledger_hash: '0x7f8a8162...e01a',
              dual_auth: 'VALIDATED'
            }
          },
          null,
          2
        )
      )
    }, 600)
  }

  return (
    <div className="theme-editorial min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#bef529] selection:text-[#12372a]">
      <Header />

      {/* Top Protocol Ticker Status Bar */}
      <div className="w-full bg-[#f4f3f0] border-b border-[rgba(18,55,42,0.08)] py-2 px-4 text-data-mono text-[#414844] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#12372a] text-[#bef529] font-bold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#bef529] animate-pulse" />
            MCP SERVER RUNTIME: v1.6.2 READY
          </span>
          <span className="hidden sm:inline text-[#717974]">KERNEL PROTOCOL: stdio / mse-2024-11-05</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#5f6662]">
          <span>⚡ P99 Latency: <strong className="text-[#12372a]">14.2ms</strong></span>
          <span>🔌 MCP Tools: <strong className="text-[#12372a]">28 Available</strong></span>
          <span>🔒 Vector Drift: <strong className="text-[#12372a]">Zero-Drift In-Memory</strong></span>
          <span className="hidden md:inline">📡 Stream: <strong>1,200 tok/sec</strong></span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Headlines & Callouts */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9e8e5] border border-[rgba(18,55,42,0.1)] text-label-xs text-[#12372a]">
              <span className="w-2 h-2 rounded-full bg-[#bef529]" />
              Model Context Protocol (MCP) & Enterprise APIs
            </div>

            <h1 className="text-display-xl text-[#002116] leading-tight">
              Turn your ERP into an autonomous agent runtime with native MCP & sub-second APIs.
            </h1>

            <p className="text-body-lg text-[#414844] max-w-xl">
              Connect Claude, OpenAI, custom enterprise AI agents, and internal microservices directly to physical inventory, sales ledgers, customer graphs, and catalog clouds with cryptographic role-based guards.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://app.scryme.tech/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#12372a] text-[#ffffff] font-semibold text-sm rounded-md hover:bg-[#002116] transition shadow-sm"
              >
                <Terminal className="w-4 h-4 text-[#bef529]" />
                <span>Deploy Scryme MCP Server (npx / docker)</span>
              </a>
              <a
                href="#interactive-sandbox"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#ffffff] border border-[rgba(18,55,42,0.18)] text-[#12372a] font-semibold text-sm rounded-md hover:bg-[#f4f3f0] transition"
              >
                <span>Explore API Interactive Playground</span>
              </a>
            </div>

            {/* Command Box */}
            <div className="ee-card-level1 p-3.5 flex items-center justify-between gap-4 font-mono text-data-mono text-xs text-[#12372a] bg-[#ffffff] border border-[rgba(18,55,42,0.12)] max-w-lg">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[#717974]">$</span>
                <span className="truncate">{commandText}</span>
              </div>
              <button
                onClick={copyCommand}
                className="px-3 py-1 bg-[#f4f3f0] hover:bg-[#e9e8e5] border border-[rgba(18,55,42,0.1)] rounded text-label-xs text-[#12372a] flex items-center gap-1.5 transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#4d6700]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Agent Execution Terminal Card */}
          <div className="lg:col-span-6">
            <div className="ee-card-level2 bg-[#12372a] text-[#ffffff] p-6 rounded-lg space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.12)]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#bef529]">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Live MCP Agent Pipeline</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-[#003923] text-[#70a487] rounded uppercase tracking-wider font-semibold">
                  DETERMINISTIC PROOF
                </span>
              </div>

              {/* Agent Flow Steps */}
              <div className="space-y-3 text-data-mono text-xs">
                <div className="p-2.5 bg-[#002116] rounded border border-[rgba(255,255,255,0.08)] space-y-1">
                  <div className="flex justify-between text-[#7ba190] text-[11px]">
                    <span>USER / CLAUDE AGENT SESSION</span>
                    <span className="text-[#bef529]">Client Prompt</span>
                  </div>
                  <p className="text-[#f2f1ee] font-sans text-xs italic">
                    "Check inventory in Rotterdam Bay 14, draft PO if stock is below safe threshold, and notify account lead."
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[#7ba190] text-[11px]">
                    <span>MCP TOOL CHAIN ORCHESTRATION</span>
                    <span>11.2ms Elapsed</span>
                  </div>

                  <div className="p-2 bg-[#002116]/80 rounded border-l-2 border-[#bef529] flex items-center justify-between text-xs">
                    <span className="text-[#bef529] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#bef529]" />
                      scryme_get_warehouse_stock
                    </span>
                    <span className="text-[11px] text-[#70a487]">node: 'NL-RTM-14', sku: 'SKU-8924-ALUM', onHand: 42 (min: 100)</span>
                  </div>

                  <div className="p-2 bg-[#002116]/80 rounded border-l-2 border-[#bef529] flex items-center justify-between text-xs">
                    <span className="text-[#bef529] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#bef529]" />
                      scryme_eval_margin_guardrail
                    </span>
                    <span className="text-[11px] text-[#70a487]">RBAC Check Passed: Tier 1 Supplier Unit Cap &lt; €450k</span>
                  </div>

                  <div className="p-2 bg-[#002116]/80 rounded border-l-2 border-[#bef529] flex items-center justify-between text-xs">
                    <span className="text-[#bef529] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#bef529]" />
                      scryme_dispatch_autonomous_po
                    </span>
                    <span className="text-[11px] text-[#70a487]">PO-2025-0912 dispatched via Edifact/API</span>
                  </div>
                </div>

                <div className="p-3 bg-[#002116] rounded border border-[rgba(255,255,255,0.1)] text-[11px] space-y-1 text-[#70a487]">
                  <div className="flex justify-between text-[#bef529] font-bold">
                    <span>RETURN: JSON-RPC 2.0 (Verified)</span>
                    <span className="text-[#bef529]">Status: SUCCESS</span>
                  </div>
                  <p className="text-[#7ba190]">{`{`}</p>
                  <p className="pl-4">"po_id": "PO-2025-0912",</p>
                  <p className="pl-4">"dispatched_qty": 200,</p>
                  <p className="pl-4">"ledger_hash": "0x7f8a8162...e01a",</p>
                  <p className="pl-4">"crypto_signature": "ecdsa-p256/valid",</p>
                  <p className="pl-4">"actor": "claude-3-7-sonnet@mcp.scryme.cloud"</p>
                  <p className="text-[#7ba190]">{`}`}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4-Pillar Architectural Superiority */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-[rgba(18,55,42,0.08)]">
        <div className="text-left mb-12">
          <span className="text-label-xs text-[#416656]">ARCHITECTURAL SUPERIORITY</span>
          <h2 className="text-headline-lg text-[#002116] mt-1">
            High-fidelity computational architecture for modern commerce.
          </h2>
          <p className="text-body-md text-[#414844] mt-2 max-w-3xl">
            Engineered from the ground up for agentic execution. Traditional ERPs rely on fragmented REST endpoints wrapped in slow middleware. Scryme gives autonomous agents native, typed tool primitives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">Native MCP Tooling for Agents</h3>
            <p className="text-body-sm text-[#414844]">
              Zero custom glue code. Expose balance sheets, serialized warehouses, inventory buffers, and discount authorizations as declarative JSON schemas directly to LLM context windows.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              Schema Compliant
            </div>
          </div>

          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">Sub-15ms Direct GraphQL & REST</h3>
            <p className="text-body-sm text-[#414844]">
              Bypass batch ETL jobs and multi-layered database caches. Write and read concurrently against distributed in-memory state with strict ACID persistence and type-safe SDKs.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              TS, Py, Go, Rust SDKs
            </div>
          </div>

          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">Real-Time Kafka Event Fabric</h3>
            <p className="text-body-sm text-[#414844]">
              Subscribe to 140+ lifecycle events like StockReallocated, ManifestSigned, or LedgerReconciled with sub-second delivery guarantees and automatic dead-letter queueing.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              140+ Lifecycle Events
            </div>
          </div>

          <div className="ee-card-level1 p-6 space-y-4 hover:border-[rgba(18,55,42,0.2)] transition">
            <div className="w-10 h-10 rounded bg-[#efeeeb] flex items-center justify-center text-[#12372a]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-title-md text-[#002116]">Cryptographic RBAC & Geofences</h3>
            <p className="text-body-sm text-[#414844]">
              Autonomous agents run with zero risk of unconstrained hallucination. Hard-coded monetary limits, location geofencing, and dual mTLS token verification protect every write.
            </p>
            <div className="pt-2 text-label-xs text-[#416656] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12372a]" />
              Dual-Key Validation
            </div>
          </div>
        </div>
      </section>

      {/* Interactive API Sandbox */}
      <section id="interactive-sandbox" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="ee-card-level2 bg-[#ffffff] p-6 md:p-8 rounded-lg border border-[rgba(18,55,42,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(18,55,42,0.08)]">
            <div>
              <span className="text-label-xs text-[#416656]">DEVELOPER RUNTIME EXPLORER</span>
              <h2 className="text-headline-md text-[#002116]">Inspect the Protocol. Run live ERP tools in sandbox.</h2>
              <p className="text-body-sm text-[#414844] mt-1">
                Toggle through our standardized MCP implementation and multi-language SDK interfaces. Hit "Execute Tool" to simulate an instant stock allocation round-trip.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#bef529]" />
              <span className="text-data-mono text-xs text-[#414844]">Cluster: Sandbox-US-East</span>
            </div>
          </div>

          {/* Language Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 my-6">
            <div className="flex items-center gap-1 bg-[#efeeeb] p-1 rounded-md border border-[rgba(18,55,42,0.08)]">
              {(['json', 'ts', 'python', 'curl'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-3 py-1.5 rounded text-label-xs transition ${
                    activeLanguage === lang
                      ? 'bg-[#12372a] text-[#ffffff] font-bold shadow-sm'
                      : 'text-[#414844] hover:bg-[#e3e2e0]'
                  }`}
                >
                  {lang === 'json' && 'Model Context Protocol (JSON-RPC)'}
                  {lang === 'ts' && 'TypeScript SDK'}
                  {lang === 'python' && 'Python Agent Loop'}
                  {lang === 'curl' && 'cURL / REST'}
                </button>
              ))}
            </div>

            <button
              onClick={handleTestInvocation}
              disabled={isExecuting}
              className="px-5 py-2.5 bg-[#bef529] hover:bg-[#a4d700] text-[#151f00] font-bold text-xs uppercase tracking-wider rounded-md flex items-center gap-2 transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Executing In-Memory Tool...' : 'Test Tool Invocation'}</span>
            </button>
          </div>

          {/* Code Viewer Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#002116] text-[#ffffff] p-5 rounded-md font-mono text-data-mono text-xs overflow-x-auto border border-[rgba(18,55,42,0.2)]">
              {activeLanguage === 'json' && (
                <pre className="text-[#a8cfbd]">{`// MCP Tool Definition: scryme_allocate_inventory
{
  "name": "scryme_allocate_inventory",
  "description": "Atomically locks & allocates stock across fulfillment hubs with strict margin protection.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "warehouse_id": { "type": "string", "pattern": "^[A-Z]{2}-[A-Z]{3}-[0-9]{2}$" },
      "sku": { "type": "string", "example": "SKU-992-OPTIC" },
      "units": { "type": "integer", "minimum": 1, "maximum": 50000 },
      "dual_auth_token": { "type": "string" }
    },
    "required": ["warehouse_id", "sku", "units", "dual_auth_token"]
  }
}`}</pre>
              )}

              {activeLanguage === 'ts' && (
                <pre className="text-[#a8cfbd]">{`import { ScrymeClient } from '@scryme/sdk';

const scryme = new ScrymeClient({ apiKey: process.env.SCRYME_API_KEY });

// Execute atomic allocation
const result = await scryme.inventory.allocate({
  warehouseId: 'NL-RTM-14',
  sku: 'SKU-992-OPTIC',
  units: 1000,
  dualAuthToken: 'sat_live_99218204'
});

console.log('Allocation Ledger Hash:', result.ledgerHash);`}</pre>
              )}

              {activeLanguage === 'python' && (
                <pre className="text-[#a8cfbd]">{`from scryme import ScrymeAgentRuntime

agent = ScrymeAgentRuntime(mcp_endpoint="https://mcp.scryme.cloud/v1")

@agent.on_tool_call("scryme_allocate_inventory")
def handle_allocation(params):
    stock = agent.inventory.get_stock(params["sku"])
    if stock.on_hand >= params["units"]:
        return agent.inventory.commit_allocation(params)
    return {"status": "INSUFFICIENT_STOCK", "reorder_triggered": True}`}</pre>
              )}

              {activeLanguage === 'curl' && (
                <pre className="text-[#a8cfbd]">{`curl -X POST https://api.scryme.tech/api/v3/mcp/invoke \\
  -H "Authorization: Bearer scryme_live_key_992" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "scryme_allocate_inventory",
      "arguments": { "warehouse_id": "NL-RTM-14", "sku": "SKU-992-OPTIC", "units": 1000 }
    },
    "id": 1
  }'`}</pre>
              )}
            </div>

            {/* Sandbox Execution Output Console */}
            <div className="lg:col-span-5 bg-[#f4f3f0] p-5 rounded-md border border-[rgba(18,55,42,0.1)] font-mono text-data-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(18,55,42,0.1)] text-[#414844]">
                <span className="flex items-center gap-1.5 font-bold text-[#12372a]">
                  <span className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-[#4d6700] animate-ping' : 'bg-[#10b981]'}`} />
                  EXECUTION ENGINE: {isExecuting ? 'RUNNING...' : 'IDLE / READY'}
                </span>
                <span className="text-[11px] text-[#717974]">{executionResult ? '11.2ms' : '0.0ms'}</span>
              </div>

              {!executionResult && !isExecuting && (
                <div className="py-8 text-center text-[#717974] space-y-2">
                  <Terminal className="w-6 h-6 mx-auto text-[#a8cfbd]" />
                  <p className="text-body-sm">Ready to receive call.</p>
                  <p className="text-[11px]">Press "Test Tool Invocation" above to trigger runtime validation.</p>
                  <p className="text-[11px] text-[#416656]">Verifies warehouse capacity, tasks lot IDs, and signs ledger transaction.</p>
                </div>
              )}

              {isExecuting && (
                <div className="py-8 text-center text-[#12372a] space-y-2">
                  <Activity className="w-6 h-6 mx-auto animate-spin text-[#4d6700]" />
                  <p className="text-label-md">Dispatching tool execution over mTLS...</p>
                </div>
              )}

              {executionResult && !isExecuting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-label-xs text-[#4d6700]">
                    <span>STATUS: 200 OK</span>
                    <span>Invocation #{executionCount}</span>
                  </div>
                  <pre className="text-[11px] text-[#002116] bg-[#ffffff] p-3 rounded border border-[rgba(18,55,42,0.12)] overflow-x-auto">
                    {executionResult}
                  </pre>
                </div>
              )}

              <div className="pt-2 border-t border-[rgba(18,55,42,0.1)] flex justify-between text-[11px] text-[#5f6662]">
                <span>Consensus: Immediate Single-Node</span>
                <span>TLS 1.3 / ecdsa</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-[rgba(18,55,42,0.08)]">
        <div className="text-left mb-10">
          <span className="text-label-xs text-[#416656]">INTEGRATION COMPARISON MATRIX</span>
          <h2 className="text-headline-lg text-[#002116] mt-1">
            Legacy ERP Middleware vs. Scryme Agent Substrate
          </h2>
          <p className="text-body-md text-[#414844] mt-2">
            See why forward-looking engineering teams are replacing monolithic enterprise service buses (ESB) and scheduled sync jobs with Scryme's native Model Context Protocol server.
          </p>
        </div>

        <div className="ee-card-level1 overflow-hidden border border-[rgba(18,55,42,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f1ec] border-b border-[rgba(18,55,42,0.08)]">
                  <th className="py-3.5 px-6 text-label-xs text-[#5f6662]">METRIC / DIMENSION</th>
                  <th className="py-3.5 px-6 text-label-xs text-[#5f6662]">TRADITIONAL ERP (SAP / NETSUITE / SFDC)</th>
                  <th className="py-3.5 px-6 text-label-xs text-[#12372a] bg-[#e9e8e5]">SCRYME MCP & DEVELOPER SUBSTRATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(18,55,42,0.06)] text-body-sm text-[#1a1c1a]">
                <tr className="hover:bg-[#f4f3f0]/50 transition">
                  <td className="py-4 px-6 font-semibold text-[#002116]">Time to Agent Integration</td>
                  <td className="py-4 px-6 text-[#5f6662]">3 to 6 months per integration unit via complex middleware</td>
                  <td className="py-4 px-6 bg-[#f4f3f0] font-bold text-[#12372a]">
                    &lt; 48 hours — Native npx / docker MCP stdio runtime
                  </td>
                </tr>
                <tr className="hover:bg-[#f4f3f0]/50 transition">
                  <td className="py-4 px-6 font-semibold text-[#002116]">Agent Context Latency</td>
                  <td className="py-4 px-6 text-[#5f6662]">12 to 30 seconds across chained REST and SOAP batch APIs</td>
                  <td className="py-4 px-6 bg-[#f4f3f0] font-bold text-[#12372a]">
                    &lt; 15 milliseconds — Direct in-memory ledger reads
                  </td>
                </tr>
                <tr className="hover:bg-[#f4f3f0]/50 transition">
                  <td className="py-4 px-6 font-semibold text-[#002116]">Middleware Maintenance</td>
                  <td className="py-4 px-6 text-[#5f6662]">High fragility. Brittle point-to-point transformations & custom glue code</td>
                  <td className="py-4 px-6 bg-[#f4f3f0] font-bold text-[#12372a]">
                    Zero Custom Glue Code — Self-describing standardized schema
                  </td>
                </tr>
                <tr className="hover:bg-[#f4f3f0]/50 transition">
                  <td className="py-4 px-6 font-semibold text-[#002116]">Auditability & Risk Control</td>
                  <td className="py-4 px-6 text-[#5f6662]">Decentralized logs, prone to silent hallucination writes</td>
                  <td className="py-4 px-6 bg-[#f4f3f0] font-bold text-[#12372a]">
                    Cryptographic Ledger Parity — Enforced dual-key authorization
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Metric Cards Banner */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="ee-card-level1 p-8 space-y-2">
            <div className="text-display-xl text-[#002116] font-serif">82%</div>
            <h4 className="text-title-sm text-[#002116]">Reduction in Custom Middleware</h4>
            <p className="text-body-sm text-[#5f6662]">
              Eliminates fragile Zapier, Celigo, or MuleSoft ETL cron scripts connecting AI agents to core business operations.
            </p>
          </div>

          <div className="ee-card-level1 p-8 space-y-2">
            <div className="text-display-xl text-[#12372a] font-serif">&lt; 15ms</div>
            <h4 className="text-title-sm text-[#002116]">Roundtrip Agent Execution</h4>
            <p className="text-body-sm text-[#5f6662]">
              Sustained P99 response time for tools querying 250,000+ serialized stock keeping units and active orders.
            </p>
          </div>

          <div className="ee-card-level1 p-8 space-y-2">
            <div className="text-display-xl text-[#4d6700] font-serif">100%</div>
            <h4 className="text-title-sm text-[#002116]">Deterministic Execution Parity</h4>
            <p className="text-body-sm text-[#5f6662]">
              Every tool invocation produces a cryptographically signed receipt matching ledger transactions exactly.
            </p>
          </div>
        </div>
      </section>

      {/* Customer Case Study Quote */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="ee-card-level1 p-8 md:p-12 bg-[#f4f3f0] border border-[rgba(18,55,42,0.1)] flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-full bg-[#12372a] text-[#bef529] flex items-center justify-center shrink-0 font-mono font-bold text-xl">
            &gt;_
          </div>
          <div className="space-y-3 text-left">
            <span className="text-label-xs text-[#416656]">ENTERPRISE CASE STUDY: TRANS-ATLANTIC FREIGHT & CARGO AG</span>
            <blockquote className="text-headline-sm text-[#002116] italic font-serif">
              "Deploying the Scryme MCP Server took less than one afternoon. Our Claude-based automated dispatchers now manage inventory reallocations across 16 European bonded terminals without a single custom middleware service or unverified purchase order."
            </blockquote>
            <p className="text-title-sm text-[#12372a]">
              Dr. Hendrik Van Der Meer <span className="font-normal text-[#5f6662]">— VP of Platform Engineering, Trans-Atlantic Logistics</span>
            </p>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-[#12372a] text-[#ffffff] p-10 md:p-16 rounded-lg text-center relative overflow-hidden space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#002116] border border-[rgba(255,255,255,0.15)] text-label-xs text-[#bef529]">
            <span>ENTERPRISE EVALUATION RUNTIME</span>
          </div>

          <h2 className="text-display-xl text-[#ffffff] max-w-3xl mx-auto">
            Ready to build on the Scryme Developer Kernel?
          </h2>

          <p className="text-body-lg text-[#a8cfbd] max-w-2xl mx-auto">
            Spin up an isolated sandbox cluster with 50,000 synthetic items, live ERP state, and full MCP stdio/SSE protocol access in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="https://app.scryme.tech/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#bef529] hover:bg-[#a4d700] text-[#151f00] font-bold text-sm uppercase tracking-wider rounded-md transition shadow-md"
            >
              <span>Provision Sandbox Cluster</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://docs.scryme.tech"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[rgba(255,255,255,0.25)] hover:bg-[#002116] text-[#ffffff] font-semibold text-sm rounded-md transition"
            >
              <Code className="w-4 h-4 text-[#7ba190]" />
              <span>Read Whitepaper</span>
            </a>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-data-mono text-xs text-[#7ba190]">
            <span>✓ SOC 2 Type II Certified</span>
            <span>✓ ISO 27001 Validated</span>
            <span>✓ OpenAPI 3.1 & MCP Specification Compliant</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
