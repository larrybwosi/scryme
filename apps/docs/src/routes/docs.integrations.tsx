import { createFileRoute } from '@tanstack/react-router'
import { Plug } from 'lucide-react'

export const Route = createFileRoute('/docs/integrations')({
  component: IntegrationsPage
})

function IntegrationsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Plug className="w-3.5 h-3.5" /> Third-Party Integrations
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Integrations</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Connect Scryme Chat, M-Pesa payment gateways, and external CRM tools seamlessly.
        </p>
      </div>
    </div>
  )
}
