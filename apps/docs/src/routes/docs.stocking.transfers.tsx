import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Truck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  Send,
  Download
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/stocking/transfers')({
  head: () =>
    createDocSeo({
      title: 'Inter-Location Stock Transfers Procedure',
      description:
        'Operational procedures for branch stock transfers: initiating requests, shipping transit manifests, printable packing lists, and receiving goods.',
      pathname: '/docs/stocking/transfers',
      keywords: ['Stock Transfers', 'Inter-branch replenishment', 'Transit manifest', 'Packing list', 'Stock reception']
    }),
  component: StockTransfersPage
})

function StockTransfersPage() {
  const steps = [
    {
      badge: 'Step 1',
      title: 'Initiate Stock Transfer (Draft State)',
      desc: 'Navigate to Stocking > Transfers (/stocking/transfers) and click New Transfer. Select Source Location (dispatch warehouse) and Destination Location (target store branch). Add the required variant SKUs and transfer quantities.'
    },
    {
      badge: 'Step 2',
      title: 'Dispatch & Shipping (In Transit)',
      desc: 'When warehouse staff pick the goods, click Ship Transfer. The system immediately decrements available stock from the source location, tags the inventory as IN_TRANSIT, and assigns a vehicle or driver identifier.'
    },
    {
      badge: 'Step 3',
      title: 'Download & Print Packing Slip',
      desc: 'A printable PDF packing slip is automatically compiled (/api/stocking/transfers/[id]/packing-list) with QR codes, batch serials, and destination signatures for the delivery driver.'
    },
    {
      badge: 'Step 4',
      title: 'Destination Branch Receiving (Completed)',
      desc: 'Upon driver arrival, destination staff inspect incoming parcels against the packing list and click Receive Transfer. The inventory engine allocates batches to destination stock records and marks the transfer status as COMPLETED.'
    }
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3.5 h-3.5" /> Transfer Logistics Manual
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Inter-Location Stock Transfers
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Safely move inventory between central distribution centers, production commissaries, and retail storefronts
          with complete chain-of-custody tracking and zero stock duplication.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Transfer Lifecycle Flow */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" /> Transfer State Lifecycle & Protection Rules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-xs text-slate-700 uppercase">1. DRAFT</span>
            <p className="text-[11px] text-slate-600 mt-1">
              Editable proposal. Quantities are not reserved until dispatch.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <span className="font-bold text-xs text-blue-800 uppercase">2. SHIPPED (Transit)</span>
            <p className="text-[11px] text-blue-700 mt-1">
              Source stock is deducted; inventory locked in transit custody.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="font-bold text-xs text-emerald-800 uppercase">3. RECEIVED</span>
            <p className="text-[11px] text-emerald-700 mt-1">
              Stock credited to receiving location ledger; transfer archived.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Procedures */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Standard Operating Procedure</h2>
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.badge} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                  {s.badge}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{s.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safeguards Callout */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <span className="font-bold">Variance & Shortage Protection:</span>
          <p>
            If received goods differ from shipped quantities due to transit breakage or lost parcels,
            receiving operators must enter the actual physical quantity received. The residual variance is automatically
            logged as a <code>TRANSIT_SHORTAGE</code> stock adjustment requiring manager review.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/stocking"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Stocking Overview
        </Link>
        <Link
          to="/docs/stocking/reconciliation"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Physical Count Reconciliation <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
