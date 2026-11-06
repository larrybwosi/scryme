import { createFileRoute, Link } from '@tanstack/react-router'
import {
  PackageCheck,
  ArrowRight,
  ArrowLeft,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Boxes
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/stocking/reception')({
  head: () =>
    createDocSeo({
      title: 'Receiving Purchase Orders & Inward Batches',
      description:
        'Standard procedure for checking in supplier deliveries, hardware barcode verification, batch creation, expiry date capture, and GRN documents.',
      pathname: '/docs/stocking/reception',
      keywords: ['PO Reception', 'Purchase Orders', 'Inward Batches', 'Goods Received Note', 'GRN', 'Barcode Reception']
    }),
  component: PurchaseReceptionPage
})

function PurchaseReceptionPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <PackageCheck className="w-3.5 h-3.5" /> Supplier Reception Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Receiving Purchase Orders & Inward Batches
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Accurate goods reception guarantees that vendor deliveries are verified against authorized Purchase Orders,
          damaged items are quarantined, and new batches enter the inventory system with correct unit costs and expiration dates.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Reception Flow */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-emerald-600" /> 1. Goods Reception Standard Procedure
        </h2>
        <div className="space-y-3 pt-2 text-xs text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Step 1: Locate Approved Purchase Order</div>
            <p className="text-slate-600">
              Navigate to <strong>Stocking &gt; Reception</strong> (<code>/stocking/reception</code>).
              Open the matching Purchase Order in <code>SUBMITTED</code> or <code>PARTIALLY_RECEIVED</code> status.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Step 2: Barcode Scanner Item Verification</div>
            <p className="text-slate-600">
              Launch the <strong>Barcode Scanner Dialog</strong> to scan incoming packaging units.
              Scanning an item increments its received quantity count automatically, matching barcodes against vendor or internal SKUs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Step 3: Assign Batch Number & Expiry Date</div>
            <p className="text-slate-600">
              For perishable items, enter the manufacturer lot number and expiry date.
              The backend allocates a unique <code>StockBatch</code> code (e.g. <code>BATCH-PO-94021-01</code>) and binds the buying cost for FIFO inventory tracking.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Step 4: Attach Vendor Delivery Note & Settle</div>
            <p className="text-slate-600">
              Upload photos or scans of the vendor Delivery Note (DN) or commercial invoice using the <strong>Stock Attachment Manager</strong>.
              Click <strong>Confirm Reception</strong> to credit branch inventory and update the PO status to <code>RECEIVED</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Partial Receiving Safeguards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" /> 2. Partial Deliveries & Backorder Tracking
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Suppliers frequently fulfill large orders in staggered shipments:
        </p>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
          <li>If vendor delivers 60 of 100 ordered units, input <code>60</code> in the received field.</li>
          <li>Scryme automatically logs an incremental <code>StockMovement</code> for 60 units and transitions the order to <code>PARTIALLY_RECEIVED</code>.</li>
          <li>The remaining balance of 40 units stays on active backorder until the next delivery arrives.</li>
        </ul>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/stocking/reconciliation"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous: Physical Reconciliation
        </Link>
        <Link
          to="/docs/stocking/adjustments"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Waste Tracking & Adjustments <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
