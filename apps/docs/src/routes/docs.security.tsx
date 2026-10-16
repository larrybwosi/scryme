import { createFileRoute } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/docs/security')({
  component: SecurityPage
})

function SecurityPage() {
  const controls = [
    'Use tenant-scoped credentials and never reuse a staff token across multiple organizations.',
    'Validate webhook signatures before updating downstream state or triggering workflows.',
    'Scope operations by organization and verify the target entity belongs to the active tenant before mutation.',
    'Keep secrets in environment variables or a hardened secret manager and rotate them on a defined schedule.',
    'Prefer least-privilege server-side permissions for admin, inventory, and payment workflows.'
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Security Best Practices
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Protect tenant data and operational integrity</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme’s strongest security posture comes from strict tenant isolation, least-privilege credentials, and explicit verification before every state-changing action.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Recommended controls</h2>
        <ul className="space-y-3 text-sm text-slate-600">
          {controls.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 text-rose-600">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
