import { createFileRoute } from '@tanstack/react-router'
import { HelpCircle } from 'lucide-react'

export const Route = createFileRoute('/docs/faq')({
  component: FaqPage
})

function FaqPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FAQ</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Common questions regarding Scryme V3 multi-tenant architecture, POS offline support, and API credentials.
        </p>
      </div>
    </div>
  )
}
