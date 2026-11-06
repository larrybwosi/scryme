import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Archive,
  RotateCcw,
  ShieldAlert,
  History,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/inventory/archive-and-restore')({
  head: () =>
    createDocSeo({
      title: 'Archiving, Disabling & Restoring Products',
      description:
        'Managing catalog lifecycles: comparing Active vs Inactive vs Archived vs Deleted states, soft vault archiving, point-in-time state recovery.',
      pathname: '/docs/inventory/archive-and-restore',
      keywords: ['Archive Product', 'Unarchive', 'Audit History', 'State Recovery', 'Soft Delete']
    }),
  component: ArchiveAndRestorePage
})

function ArchiveAndRestorePage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Archive className="w-3.5 h-3.5" /> Lifecycle & Audit Operations
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Archiving, Disabling, Deleting & State Restoration
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Retiring discontinued merchandise requires strict accounting safety to avoid corrupting past fiscal reports,
          sales receipts, or warehouse batch movements.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* State Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Archive className="w-5 h-5 text-amber-600" /> 1. Four Lifecycle States Compared
        </h2>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th className="py-2 font-semibold">Lifecycle State</th>
                <th className="py-2 font-semibold"><code>isActive</code></th>
                <th className="py-2 font-semibold"><code>isArchived</code></th>
                <th className="py-2 font-semibold">POS Visibility</th>
                <th className="py-2 font-semibold">Accounting Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr className="bg-emerald-50/30">
                <td className="py-2 font-bold text-emerald-800">Active</td>
                <td><code>true</code></td>
                <td><code>false</code></td>
                <td>Visible & sellable</td>
                <td>Live in stock reports</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2 font-bold text-slate-700">Disabled (Inactive)</td>
                <td><code>false</code></td>
                <td><code>false</code></td>
                <td>Hidden from POS</td>
                <td>Preserved in inventory list</td>
              </tr>
              <tr className="bg-amber-50/30">
                <td className="py-2 font-bold text-amber-800">Archived</td>
                <td><code>false</code></td>
                <td><code>true</code></td>
                <td>Hidden from POS</td>
                <td>Moved to vault; historical data preserved</td>
              </tr>
              <tr className="bg-red-50/30">
                <td className="py-2 font-bold text-red-800">Permanently Deleted</td>
                <td>—</td>
                <td>—</td>
                <td>Erased</td>
                <td>Blocked if historical sales/batches exist</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Archive */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Archive className="w-5 h-5 text-amber-600" /> 2. Archiving a Product (Soft Deletion)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          When an item is discontinued, archiving ensures fiscal and transaction integrity:
        </p>
        <ol className="text-xs text-slate-700 list-decimal pl-5 space-y-2">
          <li>Open the item in the product view at <code>/inventory/products/[id]</code>.</li>
          <li>In the top sticky header, click the <strong>Archive Product</strong> button.</li>
          <li>
            The system executes an atomic transaction:
            <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
              <li>Sets <code>isArchived: true</code> and <code>isActive: false</code> on the product.</li>
              <li>Cascades <code>isActive: false</code> to all product variants.</li>
              <li>Writes an immutable entry to the tenant <code>AuditLog</code>.</li>
              <li>Emits real-time SSE / WebSocket events notifying open POS terminals to purge the item from active carts.</li>
            </ul>
          </li>
          <li>The product is relocated to the <strong>Archived Items Vault</strong> at <code>/inventory/archived</code>.</li>
        </ol>
      </div>

      {/* Restoring */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-emerald-600" /> 3. Restoring Archived Items
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Archived products can be reactivated at any time:
        </p>
        <ol className="text-xs text-slate-700 list-decimal pl-5 space-y-1.5">
          <li>Navigate to <code>/inventory/archived</code>.</li>
          <li>Search or select the item to open its details view.</li>
          <li>Click the <strong>Unarchive Product</strong> button in the top header.</li>
          <li>The product and its variants immediately return to active status and reappear in storefront and register catalogs.</li>
        </ol>
      </div>

      {/* Point-in-time Recovery */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" /> 4. Point-in-Time State Recovery (Activity Tab)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          For Owners and Administrators, every creation, modification, price update, and archive event is tracked in the <strong>Activity</strong> tab:
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <p>
            Each log entry includes the actor name, timestamp, and before-and-after JSON diffs.
            If an operator accidentally modified pricing or variant definitions, clicking <strong>Revert State</strong> restores the exact snapshot without loss of historical ledger data.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/inventory/update-and-pricing"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous: Details & Multi-Unit Pricing
        </Link>
        <Link
          to="/api-reference/stocking"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Stocking V3 API <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
