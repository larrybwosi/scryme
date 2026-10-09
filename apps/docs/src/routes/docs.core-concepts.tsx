import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, ShieldCheck, Database, Building2 } from 'lucide-react'

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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Core System Architecture</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Key architecture principles powering Scryme V3: Database-level tenant isolation, multi-location stock tracking, and BOLA security defenses.
        </p>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Building2 className="w-4 h-4 text-slate-700" /> Multi-Tenant Isolation & BOLA Defense
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All database operations on models lacking composite unique constraints employ strict database-level filtering (`updateMany`, `deleteMany` scoped by `organizationId`) followed by entity verification to eliminate Broken Object Level Authorization (BOLA) risks.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Database className="w-4 h-4 text-slate-700" /> Multi-Location Variant Stocking
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Product variants store stock levels per physical location inside the `variantStocks` relation. Low stock automation workflows aggregate total location balances in memory prior to firing alerts.
          </p>
        </div>
      </div>
    </div>
  )
}
