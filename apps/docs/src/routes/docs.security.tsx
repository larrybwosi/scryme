import { createFileRoute } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/docs/security')({
  component: SecurityPage
})

function SecurityPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Security Best Practices
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security & BOLA Protection</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Ensure API keys are securely stored, member tokens are rotated periodically, and webhook signatures are validated.
        </p>
      </div>
    </div>
  )
}
