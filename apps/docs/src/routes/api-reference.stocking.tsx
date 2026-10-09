import { createFileRoute } from '@tanstack/react-router'
import { Package } from 'lucide-react'

export const Route = createFileRoute('/api-reference/stocking')({
  component: ApiStockingPage
})

function ApiStockingPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Package className="w-3.5 h-3.5" /> Inventory & Stocking V3 Module
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stocking & Inventory Endpoints</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Manage stock transfers between locations, physical stock count reconciliations, and purchase order receptions.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Endpoint Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-bold font-mono">POST</span>
            <span className="font-mono text-xs font-semibold text-slate-800">/v3/:orgSlug/stocking/transfers</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Create Stock Transfer</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Initiates inter-location inventory movements with status mutation protection.
          </p>
        </div>
      </div>
    </div>
  )
}
