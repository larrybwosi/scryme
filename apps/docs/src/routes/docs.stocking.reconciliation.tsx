import { createFileRoute, Link } from '@tanstack/react-router'
import {
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck2,
  DollarSign
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/stocking/reconciliation')({
  head: () =>
    createDocSeo({
      title: 'Physical Stocktaking & Count Reconciliation',
      description:
        'Standard operating procedure for periodic cycle counting, system vs physical inventory reconciliation, variance write-offs, and PDF audit reports.',
      pathname: '/docs/stocking/reconciliation',
      keywords: ['Physical Reconciliation', 'Stocktaking', 'Cycle Count', 'Variance Analysis', 'Inventory Audit']
    }),
  component: PhysicalReconciliationPage
})

function PhysicalReconciliationPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Stocktaking & Audit Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Physical Stocktaking & Count Reconciliation
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Periodic physical inventory counts are vital to ensure theoretical system records mirror actual physical shelf stock.
          Scryme provides structured cycle count sessions, automated variance calculation, and immutable discrepancy reporting.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Cycle Count Stages */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-purple-600" /> 1. Stocktaking Workflow Stages
        </h2>
        <div className="space-y-3 pt-2 text-xs text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Stage 1: Initiate Reconciliation Session</div>
            <p className="text-slate-600">
              Navigate to <strong>Stocking &gt; Physical Reconciliations</strong> and click <strong>New Reconciliation</strong>.
              Select the branch location and optional product categories or zones. The system takes an instantaneous snapshot of system theoretical counts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Stage 2: Blind Physical Shelf Counting</div>
            <p className="text-slate-600">
              Staff walk aisles with handheld terminals or printed worksheets, scanning variant barcodes and recording physical tallies.
              Theoretical quantities remain concealed from counting operators to prevent cognitive bias.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Stage 3: Automated Discrepancy Evaluation</div>
            <p className="text-slate-600">
              Upon submitting counts, Scryme calculates:
              <br />
              <code>Variance = Physical Count - Expected System Count</code>
              <br />
              Items with zero variance are immediately verified. Discrepancies highlight shrinkage (missing stock) or surplus (unrecorded returns or receiving oversights).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Stage 4: Management Approval & Ledger Adjustment</div>
            <p className="text-slate-600">
              Store Managers review valuation impacts. Clicking <strong>Approve & Settle</strong> writes balancing <code>STOCK_RECONCILIATION</code>
              movements to the stock batch ledger and automatically recalculates on-hand levels.
            </p>
          </div>
        </div>
      </div>

      {/* PDF Reporting */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" /> 2. Immutable Reconciliation PDF Reports
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every completed reconciliation session compiles a formal audit document via the V3 Document Service:
        </p>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
          <li>Downloadable directly at <code>/api/stocking/physical-reconciliations/[id]/report</code>.</li>
          <li>Lists all counted items, expected values, physical totals, variance value in local currency, and signing managers.</li>
          <li>Provides regulatory and financial compliance documentation for external tax and audit reviews.</li>
        </ul>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/stocking/transfers"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous: Inter-Location Transfers
        </Link>
        <Link
          to="/docs/stocking/reception"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Receiving Purchase Orders <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
