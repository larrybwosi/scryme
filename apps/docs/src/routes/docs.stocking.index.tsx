import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Boxes,
  Truck,
  RotateCcw,
  PackageCheck,
  AlertOctagon,
  ArrowRight,
  ArrowUpRight,
  Layers,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/stocking/')({
  head: () =>
    createDocSeo({
      title: 'Stocking Operations & Inventory Control Guide',
      description:
        'End-to-end operational documentation for inter-branch stock transfers, cycle counts, purchase order receiving, and waste/damage adjustments.',
      pathname: '/docs/stocking',
      keywords: ['Stocking Guide', 'Stock Transfers', 'Cycle Counts', 'Stock Reconciliation', 'Purchase Orders', 'Waste Adjustments']
    }),
  component: StockingOverviewPage
})

function StockingOverviewPage() {
  const stockingPillars = [
    {
      title: 'Inter-Location Stock Transfers',
      path: '/docs/stocking/transfers' as const,
      icon: Truck,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      description:
        'Initiating inter-branch stock requisitions, shipping transit manifests, printable packing slips, and destination delivery confirmation.'
    },
    {
      title: 'Physical Stocktaking & Count Reconciliation',
      path: '/docs/stocking/reconciliation' as const,
      icon: FileSpreadsheet,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      description:
        'Conducting scheduled blind cycle counts, comparing system ledger versus on-hand inventory, approving variance write-offs, and PDF audits.'
    },
    {
      title: 'Receiving Purchase Orders & Inward Batches',
      path: '/docs/stocking/reception' as const,
      icon: PackageCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description:
        'Supplier delivery check-in, barcode scanner quantity verification, batch number allocation, expiry tagging, and PO document attachments.'
    },
    {
      title: 'Waste Tracking & Manual Adjustments',
      path: '/docs/stocking/adjustments' as const,
      icon: AlertOctagon,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      description:
        'Recording shrinkage, breakage, expired food disposal, batch write-downs, and maintaining a tamper-evident stock movement ledger.'
    }
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Boxes className="w-3.5 h-3.5" /> Warehouse & Stock Operations Manual
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Stocking Operations & Inventory Control
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Comprehensive step-by-step procedures for managing warehouse logistics, branch replenishment,
          physical count reconciliations, receiving vendor purchase orders, and logging inventory adjustments.
        </p>
      </div>

      {/* Stocking Architecture Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Truck className="w-4 h-4 text-blue-600" /> Multi-Branch Movement
          </div>
          <h3 className="font-bold text-base text-slate-900">Chain Traceability</h3>
          <p className="text-xs text-slate-600">
            Transit stock locks prevent double-allocations while goods travel between central warehouses and retail stores.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <FileCheck2 className="w-4 h-4 text-emerald-600" /> Inward Receiving
          </div>
          <h3 className="font-bold text-base text-slate-900">Batch Integrity</h3>
          <p className="text-xs text-slate-600">
            Every supplier reception assigns immutable batch IDs with expiration and buying cost markers to support FIFO auditing.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <RotateCcw className="w-4 h-4 text-purple-600" /> Audit Ledger
          </div>
          <h3 className="font-bold text-base text-slate-900">Immutable Movements</h3>
          <p className="text-xs text-slate-600">
            All physical variance reconciliations and waste write-offs are permanently indexed with actor and timestamp proofs.
          </p>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Pillars Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Stocking Workflow Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stockingPillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <Link
                key={pillar.path}
                to={pillar.path}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${pillar.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{pillar.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{pillar.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                  Read procedure &rarr;
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/inventory-lifecycle"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          ← Inventory & Variant Lifecycle
        </Link>
        <Link
          to="/api-reference/stocking"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Stocking REST API Reference <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
