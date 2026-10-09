import { createFileRoute } from '@tanstack/react-router'
import { ShoppingBag, Tag, Code2 } from 'lucide-react'

export const Route = createFileRoute('/api-reference/pos')({
  component: ApiPosPage
})

function ApiPosPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShoppingBag className="w-3.5 h-3.5" /> POS & Sales V3 Module
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">POS & Sales Endpoints</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Create transactions, record payments, manage preorders, and query sales analytics.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Endpoint Card 1 */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-bold font-mono">POST</span>
            <span className="font-mono text-xs font-semibold text-slate-800">/v3/:orgSlug/pos/sales</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Process Sale or Preorder</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Calculates payment status automatically (`PAID`, `PARTIALLY_PAID`, or `UNPAID`), handles preorders (`PREORDER` txn status), and dispatches automated alerts.
          </p>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono">
            <pre>{`// JSON Request Body
{
  "locationId": "loc_main_01",
  "txnStatus": "PREORDER",
  "items": [
    { "variantId": "var_custom_cake", "quantity": 1, "unitPrice": 85.00 }
  ],
  "payments": [
    { "method": "MPESA", "amount": 30.00 }
  ]
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
