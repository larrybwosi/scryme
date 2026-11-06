import { createFileRoute } from '@tanstack/react-router'
import {
  Bot,
  Terminal,
  Server,
  Key,
  ShieldCheck,
  Zap,
  RotateCcw,
  Boxes,
  CheckCircle2,
  Copy,
  Layers,
  FileCode2,
  Workflow,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/mcp')({
  head: () =>
    createDocSeo({
      title: 'Model Context Protocol (MCP) Guide',
      description:
        'Comprehensive documentation on connecting Claude Desktop, Cursor, and autonomous AI agents to your Scryme workspace data via MCP.',
      pathname: '/docs/mcp',
      keywords: [
        'Model Context Protocol',
        'MCP',
        'Claude Desktop',
        'Cursor MCP',
        'AI Agents',
        'Tool Calling',
        'Stdio Transport',
        'Server-Sent Events',
      ],
    }),
  component: McpDocumentationPage,
})

export function McpDocumentationPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const claudeDesktopConfig = `{
  "mcpServers": {
    "scryme": {
      "command": "npx",
      "args": ["-y", "@scryme/mcp-server"],
      "env": {
        "SCRYME_API_KEY": "mcp_live_your_workspace_key_here",
        "SCRYME_API_URL": "https://api.scryme.tech"
      }
    }
  }
}`

  const cursorConfig = `{
  "mcpServers": {
    "scryme": {
      "command": "npx",
      "args": ["-y", "@scryme/mcp-server"],
      "env": {
        "SCRYME_API_KEY": "mcp_live_your_workspace_key_here"
      }
    }
  }
}`

  const sseRemoteConfig = `{
  "mcpServers": {
    "scryme-remote": {
      "url": "https://api.scryme.tech/v3/mcp/sse",
      "headers": {
        "Authorization": "Bearer mcp_live_your_workspace_key_here"
      }
    }
  }
}`

  const curlToolCall = `curl -X POST "https://api.scryme.tech/v3/mcp/tools/execute" \\
  -H "Authorization: Bearer mcp_live_your_workspace_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "query_inventory",
    "arguments": {
      "search": "espresso",
      "limit": 5
    }
  }'`

  const coreTools = [
    {
      group: 'Inventory and Catalog Read Tools',
      items: [
        {
          name: 'query_inventory',
          purpose: 'Inspect variant stock counts, batch allocations, and quantities across physical locations.',
          parameters: 'search (string), locationId (string), limit (number)',
        },
        {
          name: 'search_products',
          purpose: 'Query product catalog records with category filters, barcode matches, and pricing profiles.',
          parameters: 'query (string), categoryId (string), limit (number)',
        },
      ],
    },
    {
      group: 'Sales, Orders, and Analytics Tools',
      items: [
        {
          name: 'list_orders',
          purpose: 'Search transactions and sales orders filtered by status, customer, or creation date range.',
          parameters: 'status (string), customerId (string), startDate (string), endDate (string), limit (number)',
        },
        {
          name: 'get_order_details',
          purpose: 'Retrieve the complete line item breakdown, payments, and fulfillment records for an order.',
          parameters: 'transactionId (string, required)',
        },
        {
          name: 'search_customers',
          purpose: 'Locate customer contact details, profile information, and accumulated loyalty points.',
          parameters: 'query (string), limit (number)',
        },
        {
          name: 'get_sales_analytics',
          purpose: 'Calculate gross revenue, net revenue, tax aggregates, and average order value for a timeframe.',
          parameters: 'timeframe ("today" | "week" | "month" | "year")',
        },
        {
          name: 'get_top_selling_products',
          purpose: 'Rank highest performing products based on total sales volume and overall revenue.',
          parameters: 'limit (number)',
        },
      ],
    },
    {
      group: 'Staff and Operations Tools',
      items: [
        {
          name: 'list_staff_tasks',
          purpose: 'Review team assignments, priority ratings, due dates, and progress states.',
          parameters: 'status (string), assignedMemberId (string), limit (number)',
        },
        {
          name: 'get_shift_schedules',
          purpose: 'Retrieve scheduled employee shifts and active workspace attendance for any date.',
          parameters: 'date (string), locationId (string)',
        },
      ],
    },
    {
      group: 'Draft Staging and Reversible Mutation Tools',
      items: [
        {
          name: 'list_drafts',
          purpose: 'Inspect staged drafts, proposed changes, review statuses, and target entities.',
          parameters: 'status (DRAFT | APPLIED | REVERTED | DISCARDED), entityType (PRODUCT | PRICE | ORDER | FULFILLMENT | STAFF_TASK), limit (number)',
        },
        {
          name: 'get_draft_diff',
          purpose: 'Examine field level before and after diff comparisons prior to applying mutations live.',
          parameters: 'draftId (string, required)',
        },
        {
          name: 'publish_draft',
          purpose: 'Commit a staged draft change directly into the database inside an ACID transaction.',
          parameters: 'draftId (string, required), confirm (boolean, required)',
        },
        {
          name: 'revert_draft',
          purpose: 'Roll back an applied draft change cleanly using its recorded before state snapshot.',
          parameters: 'draftId (string, required), confirm (boolean, required)',
        },
        {
          name: 'discard_draft',
          purpose: 'Drop an unapplied draft change safely without affecting any live workspace tables.',
          parameters: 'draftId (string, required)',
        },
        {
          name: 'create_product',
          purpose: 'Stage creation of a new catalog product with SKU, category, and variant pricing.',
          parameters: 'name, sku, categoryId, description, barcode, variants, autoPublish (boolean)',
        },
        {
          name: 'update_product_price',
          purpose: 'Stage modifications to variant retail price, wholesale price, or buying cost.',
          parameters: 'variantId (required), retailPrice, wholesalePrice, buyingPrice, autoPublish (boolean)',
        },
        {
          name: 'create_order',
          purpose: 'Stage a customer transaction with line items, unit pricing, and fulfillment location.',
          parameters: 'locationId (required), items (required), customerId, notes, autoPublish (boolean)',
        },
        {
          name: 'update_order_status',
          purpose: 'Transition transaction status with full event tracking across the workspace lifecycle.',
          parameters: 'transactionId (required), status (required), autoPublish (boolean)',
        },
        {
          name: 'create_staff_task',
          purpose: 'Assign operational responsibilities, priorities, and deadlines to workspace members.',
          parameters: 'title (required), description, priority, dueDate, memberId, locationId, autoPublish (boolean)',
        },
      ],
    },
  ]

  return (
    <div className="space-y-12 max-w-4xl pb-16">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Bot className="w-3.5 h-3.5" /> Model Context Protocol (MCP)
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Connect intelligent AI assistants directly to your workspace
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          The Model Context Protocol gives external AI tools such as Claude Desktop, Cursor, and custom autonomous agents safe, real time access to your Scryme platform. You can query stock counts, inspect sales numbers, examine schedules, and stage safe database modifications through tenant isolated endpoints.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Zap className="w-4 h-4" /> Live Workspace Data
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Query products, stock batches, orders, customer records, and financial summaries directly without manual data exports.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" /> Strict Tenant Isolation
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every read and write operation is scoped strictly to your organization ID, ensuring complete separation and security.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
            <RotateCcw className="w-4 h-4" /> Safe Draft Lifecycle
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            AI updates are staged as reviewable drafts with diff summaries, atomic commit confirmations, and one click rollback.
          </p>
        </div>
      </div>

      {/* Architecture and Transport Options */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2>Transport protocols and connection choices</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Scryme supports two standard transport methods defined by the open Model Context Protocol specification:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Stdio CLI Transport</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Best for local workstation applications such as Claude Desktop and Cursor. The assistant spawns our lightweight command line runner via npx or pnpm, communicating over standard input and output streams.
            </p>
            <div className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
              npx -y @scryme/mcp-server
            </div>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Remote HTTP and Server-Sent Events</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Best for cloud agents, web platforms, and remote infrastructure. Your assistant opens a persistent streaming connection to receive events, sending JSON-RPC 2.0 messages over standard HTTP POST.
            </p>
            <div className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
              https://api.scryme.tech/v3/mcp/sse
            </div>
          </div>
        </div>
      </section>

      {/* Authentication and Generating Keys */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <Key className="w-5 h-5 text-indigo-600" />
          <h2>Authentication and security keys</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Before connecting any AI tool, you need an authorized token. Scryme provides dual authentication pathways to fit your setup:
        </p>

        <div className="space-y-3 text-sm text-slate-700 bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Dedicated MCP API Keys (Recommended):</span>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Generate keys starting with <code className="text-indigo-600 font-mono">mcp_live_</code> inside the web portal at <code className="text-slate-800 font-mono">/integrations/mcp</code>. The server stores only cryptographic SHA-256 hashes, keeping your credentials secure.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">OAuth2 and Bearer Tokens:</span>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                For custom agent pipelines, you can provide an HS256 signed JSON Web Token holding the <code className="text-slate-800 font-mono">mcp:read</code> and <code className="text-slate-800 font-mono">mcp:write</code> scopes along with your organization ID.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Configuration Examples */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <FileCode2 className="w-5 h-5 text-indigo-600" />
          <h2>Client setup and configuration files</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Here are ready to use snippets for popular AI client platforms. Replace <code className="text-indigo-600 font-mono">mcp_live_your_workspace_key_here</code> with the token created in your workspace settings.
        </p>

        {/* Claude Desktop Config */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-600" /> Claude Desktop (claude_desktop_config.json)
            </span>
            <button
              onClick={() => copyToClipboard(claudeDesktopConfig, 'claude')}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              <Copy className="w-3 h-3" />
              {copiedKey === 'claude' ? 'Copied' : 'Copy Snippet'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-indigo-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {claudeDesktopConfig}
          </pre>
          <p className="text-[11px] text-slate-500">
            Locate this file on macOS at <code className="text-slate-700 font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code> or on Windows at <code className="text-slate-700 font-mono">%APPDATA%\Claude\claude_desktop_config.json</code>.
          </p>
        </div>

        {/* Cursor IDE Config */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-600" /> Cursor IDE (.cursor/mcp.json)
            </span>
            <button
              onClick={() => copyToClipboard(cursorConfig, 'cursor')}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              <Copy className="w-3 h-3" />
              {copiedKey === 'cursor' ? 'Copied' : 'Copy Snippet'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-indigo-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {cursorConfig}
          </pre>
        </div>

        {/* Remote SSE Config */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-600" /> Remote Server-Sent Events Endpoint
            </span>
            <button
              onClick={() => copyToClipboard(sseRemoteConfig, 'sse')}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              <Copy className="w-3 h-3" />
              {copiedKey === 'sse' ? 'Copied' : 'Copy Snippet'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {sseRemoteConfig}
          </pre>
        </div>

        {/* Direct cURL Tool Execution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Direct HTTP Tool Execution
            </span>
            <button
              onClick={() => copyToClipboard(curlToolCall, 'curl')}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              <Copy className="w-3 h-3" />
              {copiedKey === 'curl' ? 'Copied' : 'Copy Command'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {curlToolCall}
          </pre>
        </div>
      </section>

      {/* Staged Draft Lifecycle and Safety */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <Workflow className="w-5 h-5 text-indigo-600" />
          <h2>The staged draft lifecycle and change safety</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Allowing automated models to alter products or create sales records requires strong guardrails. Scryme uses a two phase staged mutation pattern:
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-indigo-600 block mb-1">1. Stage Draft</span>
              <span>Tool proposes changes and records initial state snapshot.</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-blue-600 block mb-1">2. Review Diff</span>
              <span>Inspect field level diff summary with get_draft_diff.</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-emerald-600 block mb-1">3. Apply Atomically</span>
              <span>Run publish_draft with confirm true in an ACID transaction.</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-rose-600 block mb-1">4. Safe Rollback</span>
              <span>Use revert_draft anytime to restore initial snapshot state.</span>
            </div>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
            Note: For trusted automated tasks, tools also accept an optional parameter <code className="text-slate-800 font-mono">autoPublish: true</code> to stage and publish changes immediately in one roundtrip.
          </p>
        </div>
      </section>

      {/* Available Tools Reference */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <Boxes className="w-5 h-5 text-indigo-600" />
          <h2>Complete catalog of MCP tools</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          External assistants have access to the following workspace tools. Each tool strictly honors your organization boundary and permissions:
        </p>

        <div className="space-y-6">
          {coreTools.map((category) => (
            <div key={category.group} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                {category.group}
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 bg-white shadow-2xs">
                {category.items.map((tool) => (
                  <div key={tool.name} className="p-4 space-y-1.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-bold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {tool.name}
                      </code>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{tool.purpose}</p>
                    <div className="text-[11px] text-slate-500 font-mono">
                      <span className="text-slate-400">Inputs:</span> {tool.parameters}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
