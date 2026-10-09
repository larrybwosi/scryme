import { createFileRoute } from '@tanstack/react-router'
import { Layers } from 'lucide-react'

export const Route = createFileRoute('/docs/components')({
  component: ComponentsPage
})

function ComponentsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Layers className="w-3.5 h-3.5" /> UI Components & Primitives
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform UI Primitives</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Pre-built React and Tailwind CSS v4 design components matching POS transactions, stock tables, and preorder schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
          <h3 className="font-bold text-sm text-slate-900">PreorderCard</h3>
          <p className="text-xs text-slate-500">Presents preorder completion schedules, deposit breakdowns, and inline notes updates.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
          <h3 className="font-bold text-sm text-slate-900">PaymentProgress</h3>
          <p className="text-xs text-slate-500">Visual progress indicators tracking deposit and balance payments across orders.</p>
        </div>
      </div>
    </div>
  )
}
