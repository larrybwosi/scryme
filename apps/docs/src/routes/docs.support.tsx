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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Support & Getting Help</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Need technical assistance? Reach out to our engineering team at support@scryme.tech or post on our developer community.
        </p>
      </div>
    </div>
  )
}
