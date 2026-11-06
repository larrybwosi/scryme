import { createFileRoute, Link } from '@tanstack/react-router'
import { Plug, MessageSquareText, Wallet, DatabaseZap, Bot, ArrowRight } from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/integrations')({
  head: () =>
    createDocSeo({
      title: 'Third-Party Integrations',
      description:
        'Integration patterns for AI assistants (MCP), payment gateways (M-Pesa, card settlements), multi-channel messaging (WhatsApp, Scryme Chat), and CRM data sync.',
      pathname: '/docs/integrations',
      keywords: ['Integrations', 'Model Context Protocol', 'MCP', 'Payments', 'M-Pesa', 'WhatsApp CRM', 'Webhooks']
    }),
  component: IntegrationsPage
})

function IntegrationsPage() {
  const integrations = [
    {
      title: 'Model Context Protocol (MCP)',
      description: 'Connect Claude Desktop, Cursor, and custom autonomous LLM agents directly to workspace inventory, sales, and task data.',
      icon: Bot,
      link: '/docs/mcp' as const,
      badge: 'AI & Agents'
    },
    {
      title: 'Scryme Chat',
      description: 'Connect messaging workflows and customer communication events through the same tenancy-aware platform.',
      icon: MessageSquareText
    },
    {
      title: 'M-Pesa / payments',
      description: 'Wire mobile money, settlement status, and transaction records into merchant operations and reconciliation.',
      icon: Wallet
    },
    {
      title: 'External CRM and data sync',
      description: 'Use webhooks and event streams to sync contacts, deals, pipeline activity, and customer records with external systems.',
      icon: DatabaseZap
    }
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Plug className="w-3.5 h-3.5" /> Third-Party Integrations
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Connect the systems your business already uses</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme’s integrations are designed to extend existing operations instead of forcing teams into a separate system. The recommended model is event-driven exchange with secure, tenant-scoped credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon
          const content = (
            <div className="h-full bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  {integration.badge && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {integration.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900">{integration.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{integration.description}</p>
              </div>

              {integration.link && (
                <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  <span>Explore MCP Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          )

          if (integration.link) {
            return (
              <Link key={integration.title} to={integration.link} className="block group">
                {content}
              </Link>
            )
          }

          return (
            <div key={integration.title}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
