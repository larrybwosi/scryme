import { createFileRoute } from '@tanstack/react-router'
import { Layers } from 'lucide-react'

export const Route = createFileRoute('/docs/components')({
  component: ComponentsPage
})

function ComponentsPage() {
  const components = [
    {
      title: 'PreorderCard',
      description: 'Displays reservation state, deposit totals, payment milestones, and schedule-specific notes for customer orders.'
    },
    {
      title: 'PaymentProgress',
      description: 'Shows outstanding balances, progress to completion, and staged payment status inside POS or CRM workflows.'
    },
    {
      title: 'InventorySummary',
      description: 'Combines warehouse, location, and product variant metrics into a compact operational overview for managers.'
    },
    {
      title: 'TimelineEvent',
      description: 'Highlights order, fulfillment, or stock movement milestones for frontline teams handling time-sensitive tasks.'
    }
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Layers className="w-3.5 h-3.5" /> UI Components & Primitives
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Core UI patterns for operations teams</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme’s frontend patterns are designed for high-traffic checkout, stock visibility, and field-team workflows. They prioritize clarity, speed, and actionable state at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {components.map((component) => (
          <div key={component.title} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-900">{component.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{component.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
