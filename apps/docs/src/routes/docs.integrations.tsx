import { createFileRoute } from '@tanstack/react-router'
import { Plug, MessageSquareText, Wallet, DatabaseZap } from 'lucide-react'

export const Route = createFileRoute('/docs/integrations')({
  component: IntegrationsPage
})

function IntegrationsPage() {
  const integrations = [
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon
          return (
            <div key={integration.title} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">{integration.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{integration.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
