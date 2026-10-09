import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'

export const Route = createFileRoute('/docs/webhooks')({
  component: WebhooksPage
})

function WebhooksPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Bell className="w-3.5 h-3.5" /> Webhooks & Event Streams
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Public Webhooks</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Configure real-time webhooks for M-Pesa STK push notifications, Sentry error alerts, and incoming webhooks.
        </p>
      </div>
    </div>
  )
}
