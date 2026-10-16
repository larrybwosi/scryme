import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, ShieldCheck, Database, Building2, Warehouse } from 'lucide-react'

export const Route = createFileRoute('/docs/core-concepts')({
  component: CoreConceptsPage
})

function CoreConceptsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <BookOpen className="w-3.5 h-3.5" /> Guides & Architecture
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Core platform concepts</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme is built around tenant-aware access, location-aware inventory, and event-driven operations that work across POS, stock control, and service booking.
        </p>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Building2 className="w-4 h-4 text-slate-700" /> Multi-tenant security model
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every major resource is tied to an organization context and filtered by membership, role, and tenant scope. This keeps staff, departments, and customer-facing apps from crossing boundaries without explicit authorization.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Database className="w-4 h-4 text-slate-700" /> Inventory and stock operations
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Product variants and stock levels are tracked at a location-aware level so a store, warehouse, or production site can reconcile supply independently. Stock calculations aggregate movement data before alerts and reorder logic are triggered.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Warehouse className="w-4 h-4 text-slate-700" /> Operational workflows
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Scryme connects POS transactions, incoming stock, purchase orders, service bookings, and production scheduling in the same operational ledger. This lets teams manage both retail and back-office execution from a common data model.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-slate-700" /> BOLA defense patterns
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            High-risk mutation endpoints should scope updates by organization and then verify that the target object belongs to the same tenant before applying changes. This reduces the risk of unauthorized vertical or lateral access.
          </p>
        </div>
      </div>
    </div>
  )
}
