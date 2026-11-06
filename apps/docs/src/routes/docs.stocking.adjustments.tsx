import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  History,
  ShieldCheck,
  Scale
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/stocking/adjustments')({
  head: () =>
    createDocSeo({
      title: 'Waste Tracking & Manual Stock Adjustments',
      description:
        'Standard procedure for logging shrinkage, damaged inventory write-offs, expired batch disposal, and maintaining the immutable stock ledger.',
      pathname: '/docs/stocking/adjustments',
      keywords: ['Waste Tracking', 'Stock Adjustments', 'Shrinkage Write-off', 'Expired Goods Disposal', 'Inventory Ledger']
    }),
  component: WasteAndAdjustmentsPage
})

function WasteAndAdjustmentsPage() {
  const reasonCodes = [
    { code: 'BURNT', desc: 'Bakery or production overcooking during oven bake cycle.' },
    { code: 'UNDERCOOKED', desc: 'Internal temperature failed minimum food safety audit.' },
    { code: 'SHAPE_DEFECT', desc: 'Cosmetic deformation exceeding retail customer presentation standards.' },
    { code: 'CONTAMINATED', desc: 'Dropped on floor, allergen cross-contact, or foreign object breach.' },
    { code: 'DOUGH_FAILURE', desc: 'Improper fermentation yeast proofing or dead starter culture.' },
    { code: 'OVER_PROOFED', desc: 'Excess proofing time resulting in collapsed loaf structure.' },
    { code: 'TRANSIT_DAMAGE', desc: 'Crushed packaging or handling damage during delivery transit.' },
    { code: 'EXPIRED_BATCH', desc: 'Shelf life limit passed without sale.' }
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertOctagon className="w-3.5 h-3.5" /> Loss Prevention & Audit Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Waste Tracking & Manual Stock Adjustments
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Operational protocol for logging spoiled ingredients, damaged retail merchandise, shrinkage,
          and production batch defects while preserving full fiscal accountability.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Standard Waste Reason Codes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" /> 1. Standard Waste Reason Classification
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every negative adjustment must be categorized under an authorized reason code to populate loss analytics:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {reasonCodes.map((r) => (
            <div key={r.code} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-mono font-bold text-xs text-slate-900">{r.code}</span>
              <p className="text-[11px] text-slate-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Logging an Adjustment Procedure */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" /> 2. Step-by-Step Operator Workflow
        </h2>
        <ol className="text-xs text-slate-700 list-decimal pl-5 space-y-2">
          <li>Navigate to <strong>Inventory &gt; Stock Batches</strong> or open the specific product view.</li>
          <li>Select the specific <strong>Stock Batch</strong> containing the damaged items.</li>
          <li>Click <strong>Record Adjustment / Waste</strong>.</li>
          <li>Enter the quantity to write off, select the appropriate <strong>Waste Reason Code</strong>, and append an optional note.</li>
          <li>
            Click <strong>Submit Adjustment</strong>:
            <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
              <li>Batch on-hand balance is immediately reduced.</li>
              <li>A permanent <code>WASTE_ADJUSTMENT</code> entry is written to the immutable movement ledger.</li>
              <li>The financial cost value is aggregated into the period’s Gross Loss ledger.</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* Auditing and Accountability */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" /> 3. Immutable Stock Movement Ledger
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          In Scryme, stock balances are never overwritten in place with arbitrary SQL updates.
          Current stock levels represent the aggregate sum of all historical transactions:
          Purchases (<code>+</code>), Sales (<code>-</code>), Transfers (<code>±</code>), and Waste Adjustments (<code>-</code>).
          This ensures full forensic auditability for financial inspectors.
        </p>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/stocking/reception"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous: Receiving Purchase Orders
        </Link>
        <Link
          to="/api-reference/stocking"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Stocking V3 REST API <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
