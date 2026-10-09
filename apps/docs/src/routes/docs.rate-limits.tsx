import { createFileRoute } from '@tanstack/react-router'
import { Gauge } from 'lucide-react'

export const Route = createFileRoute('/docs/rate-limits')({
  component: RateLimitsPage
})

function RateLimitsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Gauge className="w-3.5 h-3.5" /> Rate Limits
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">API Rate Limits & Quotas</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          V3 REST API endpoints enforce a standard baseline quota of 1,000 requests per minute per organization token.
        </p>
      </div>
    </div>
  )
}
