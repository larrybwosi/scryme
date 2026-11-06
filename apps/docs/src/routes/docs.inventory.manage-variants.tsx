import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Layers,
  Barcode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Clock
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/inventory/manage-variants')({
  head: () =>
    createDocSeo({
      title: 'Managing Variants & Barcode Hardware Scanning',
      description:
        'Technical guide for product variants, attribute matrix, USB and Bluetooth hardware barcode scanner integration, and expiry tracking.',
      pathname: '/docs/inventory/manage-variants',
      keywords: ['Product Variants', 'Barcode Scanner', 'Hardware Scanners', 'Attributes Matrix', 'Expiry Tracking']
    }),
  component: ManageVariantsPage
})

function ManageVariantsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Layers className="w-3.5 h-3.5" /> Variants & Hardware Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Managing Variants, Attributes & Barcode Hardware
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Product variants represent distinct sellable variations of a product—differentiated by size, color, weight, material,
          or packaging. Each variant maintains its own independent SKU, barcode, cost structure, and stock allocation.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Adding a Variant */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" /> 1. Adding a New Product Variant
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every new product starts with a single Default Variant. When an item has multiple variations, operators can register additional sellable SKUs:
        </p>
        <ol className="text-xs text-slate-700 list-decimal pl-5 space-y-1.5">
          <li>Navigate to <strong>Inventory</strong> &gt; click on your target product to open <code>/inventory/products/[id]</code>.</li>
          <li>Select the <strong>Variants</strong> tab.</li>
          <li>Click the <strong>Add Variant</strong> button in the card header.</li>
          <li>Fill in the variant name, SKU suffix (defaults to <code>&lt;base-sku&gt;-&lt;index&gt;</code>), buying price, and retail price.</li>
        </ol>
      </div>

      {/* Hardware Barcode Automation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-600" /> 2. Hardware Barcode Scanner Automation
          </h2>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            🟢 Scanner Ready Active
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Scryme includes zero-configuration hardware listening for physical USB and Bluetooth barcode scanners (such as Honeywell, Zebra, or generic wireless laser scanners).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-600" /> High-Velocity Burst Detection
            </h3>
            <p className="text-xs text-slate-600">
              When the variant dialog is open, keystroke arrival intervals under <strong>45 milliseconds</strong> are automatically recognized as hardware scanner inputs rather than human typing.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Form Interception & Auto-fill
            </h3>
            <p className="text-xs text-slate-600">
              The scanner listener intercepts the terminal carriage return, fills the <code>Barcode</code> field, displays a confirmation toast, and prevents accidental form submission.
            </p>
          </div>
        </div>
      </div>

      {/* Attribute Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" /> 3. Dynamic Attribute Matrix (JSON Key-Value Pairs)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Attach arbitrary dimensions to represent any product characteristic:
        </p>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th className="py-2 font-semibold">Attribute Dimension</th>
                <th className="py-2 font-semibold">Sample Value</th>
                <th className="py-2 font-semibold">Front-End Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="py-2 font-mono text-purple-700 font-semibold">Size</td>
                <td><code>500g</code>, <code>1 kg</code>, <code>XL</code></td>
                <td>Rendered on POS order line items and receipt slips</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-purple-700 font-semibold">Color / Finish</td>
                <td><code>Matte Black</code>, <code>Silver</code></td>
                <td>Filterable in inventory search and web storefront catalog</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-purple-700 font-semibold">Roast / Flavor</td>
                <td><code>Dark Roast</code>, <code>Vanilla Bean</code></td>
                <td>Displayed on barista tickets and kitchen display screens</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Controls & Deletion Safeguards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" /> 4. Expiry Tracking & Deletion Safeguards
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <strong>Expiry Alerts</strong>: Configure shelf life duration and warning thresholds (e.g. 2 days prior to expiration) to generate automatic stock rotation reminders.
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <strong>Serial Number Capture</strong>: For serialized merchandise, require staff to scan unique serial IDs during sales and returns.
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong>Single-Variant Safeguard</strong>: Every catalog product must retain at least one variant. The delete button is disabled when only one variant remains.
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/inventory/create-product"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous: Create Products
        </Link>
        <Link
          to="/docs/inventory/update-and-pricing"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Details & Multi-Unit Pricing <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
