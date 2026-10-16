import { createFileRoute } from '@tanstack/react-router'
import { Headphones } from 'lucide-react'

export const Route = createFileRoute('/docs/support')({
  component: SupportPage
})

function SupportPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Headphones className="w-3.5 h-3.5" /> Developer Support
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Support & getting help</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          If a tenant issue, integration failure, or deployment problem is affecting production, route the request with the exact tenant, time, and symptom so the team can triage it correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Before contacting support</h2>
          <ul className="text-xs text-slate-500 leading-relaxed space-y-2">
            <li>• Confirm the tenant, location, and product area affected.</li>
            <li>• Capture the exact API request, response, and timestamp.</li>
            <li>• Note whether the issue is isolated to a single device or all stores in the org.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Support channels</h2>
          <ul className="text-xs text-slate-500 leading-relaxed space-y-2">
            <li>• Engineering support: support@scryme.tech</li>
            <li>• Internal incident escalation for production issues</li>
            <li>• Developer community and triage threads for non-urgent integration questions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
