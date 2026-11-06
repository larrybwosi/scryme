import { createFileRoute, Link } from '@tanstack/react-router'
import { Package, Send, CheckCircle2, FileSpreadsheet, Truck, ArrowLeft, ArrowRight } from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/api-reference/stocking')({
  head: () =>
    createDocSeo({
      title: 'Stocking & Inventory V3 REST API Reference',
      description:
        'Technical specifications for V3 stocking endpoints: inter-location transfers, purchase order receiving, physical count reconciliations, and driver dispatch.',
      pathname: '/api-reference/stocking',
      keywords: ['Stocking API', 'Inventory Endpoints', 'Stock Transfers API', 'Purchase Orders API', 'Physical Reconciliation API']
    }),
  component: ApiStockingPage
})

function ApiStockingPage() {
  const endpoints = [
    {
      method: 'GET',
      path: '/v3/:orgSlug/stocking/transfers',
      badge: 'bg-blue-600',
      title: 'List Stock Transfers',
      desc: 'Retrieves paginated stock transfer records filtered by source location, destination, and status (DRAFT, SHIPPED, RECEIVED).'
    },
    {
      method: 'POST',
      path: '/v3/:orgSlug/stocking/transfers',
      badge: 'bg-emerald-600',
      title: 'Create Stock Transfer',
      desc: 'Initiates a new inter-location transfer request between authorized inventory locations with line item variant allocations.'
    },
    {
      method: 'POST',
      path: '/v3/:orgSlug/stocking/transfers/:id/ship',
      badge: 'bg-purple-600',
      title: 'Ship Stock Transfer',
      desc: 'Deducts stock from origin location, locks items in transit status, and generates packing slip.'
    },
    {
      method: 'POST',
      path: '/v3/:orgSlug/stocking/transfers/:id/receive',
      badge: 'bg-purple-600',
      title: 'Receive Stock Transfer',
      desc: 'Confirms receipt of in-transit goods at destination location, allocating stock batches to target inventory.'
    },
    {
      method: 'GET',
      path: '/v3/:orgSlug/stocking/purchases',
      badge: 'bg-blue-600',
      title: 'List Purchase Orders',
      desc: 'Retrieves vendor purchase orders across organization branches with item line pricing and delivery status.'
    },
    {
      method: 'POST',
      path: '/v3/:orgSlug/stocking/purchases/:id/receive',
      badge: 'bg-emerald-600',
      title: 'Receive Purchase Order Items',
      desc: 'Receives supplier delivery items into active inventory, creating new StockBatch records and setting expiry tags.'
    },
    {
      method: 'GET',
      path: '/v3/:orgSlug/stocking/physical-reconciliations',
      badge: 'bg-blue-600',
      title: 'List Physical Reconciliations',
      desc: 'Fetches scheduled and completed stocktaking audit sessions with variance summaries.'
    },
    {
      method: 'POST',
      path: '/v3/:orgSlug/stocking/physical-reconciliations',
      badge: 'bg-emerald-600',
      title: 'Submit Physical Reconciliation',
      desc: 'Submits blind physical shelf counts, calculates shrinkage or surplus, and posts balancing ledger adjustments.'
    },
    {
      method: 'GET',
      path: '/v3/:orgSlug/stocking/physical-reconciliations/:id/report',
      badge: 'bg-slate-800',
      title: 'Download Reconciliation PDF Report',
      desc: 'Streams an immutable PDF audit document detailing counted variants, expected vs actual counts, and financial loss.'
    },
    {
      method: 'POST',
      path: '/v3/:orgSlug/stocking/reconciliation/dispatch',
      badge: 'bg-emerald-600',
      title: 'Dispatch Delivery Orders',
      desc: 'Assigns drivers and vehicles to orders pending fulfillment, emitting delivery tracking updates.'
    }
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Package className="w-3.5 h-3.5" /> Inventory & Stocking V3 Module
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stocking & Inventory Endpoints</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Comprehensive REST API endpoints for managing multi-branch stock transfers, supplier purchase order check-in,
          physical cycle counts, and proof-of-delivery logistics.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.map((ep) => (
          <div key={ep.path + ep.method} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 ${ep.badge} text-white rounded-md text-xs font-bold font-mono`}>
                  {ep.method}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-800">{ep.path}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{ep.title}</span>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">{ep.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/stocking"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Stocking Operations Guide
        </Link>
        <Link
          to="/api-reference/playground"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Interactive API Playground <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
