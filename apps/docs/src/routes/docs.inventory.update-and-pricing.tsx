import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Scale,
  DollarSign,
  Truck,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Building,
  CheckCircle2
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/inventory/update-and-pricing')({
  head: () =>
    createDocSeo({
      title: 'Updating Details & Multi-Unit Pricing',
      description:
        'Configuring multi-tier selling units, base units, automated unit conversion multipliers, volume price lists, and automated reorder points.',
      pathname: '/docs/inventory/update-and-pricing',
      keywords: ['Multi-Unit Pricing', 'Selling Units', 'Unit Conversions', 'Reorder Rules', 'Suppliers']
    }),
  component: UpdateAndPricingPage
})

function UpdateAndPricingPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Scale className="w-3.5 h-3.5" /> Pricing & Unit Operations
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Details, Multi-Unit Conversions & Location Reorder Rules
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme allows businesses to purchase products in bulk wholesale units (such as crates, sacks, or cartons)
          while seamlessly selling in consumer units with real-time stock conversion multipliers.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Product Details Updating */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" /> 1. Updating Product Information & Taxonomy
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          From the product details view (<code>/inventory/products/[id]</code>), operators can manage core properties:
        </p>
        <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
          <li><strong>Product Title & Slug Synchronization</strong>: Edit titles and click <em>Regenerate</em> to update URLs.</li>
          <li><strong>Category & Department Reassignment</strong>: Move items across departmental hierarchies with live category breadcrumbs.</li>
          <li><strong>Search Tags</strong>: Add searchable keywords (e.g. <code>gluten-free</code>, <code>seasonal</code>, <code>wholesale-only</code>).</li>
        </ul>
      </div>

      {/* Multi-Unit Hierarchy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" /> 2. Multi-Unit Conversion Hierarchy
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          In the <strong>Units</strong> tab, define units and automatic stock deduction factors:
        </p>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th className="py-2 font-semibold">Unit Tier</th>
                <th className="py-2 font-semibold">Packaging Unit</th>
                <th className="py-2 font-semibold">Multiplier</th>
                <th className="py-2 font-semibold">Retail Price</th>
                <th className="py-2 font-semibold">Stock Ledger Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="py-2.5 font-mono font-bold text-indigo-700">Base Unit</td>
                <td>Piece (pc)</td>
                <td className="font-mono">1.0</td>
                <td>$2.00</td>
                <td>Counts indivisible stock batch quantities</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-bold text-blue-700">Selling Unit</td>
                <td>Pack of 6</td>
                <td className="font-mono">6.0</td>
                <td>$10.50</td>
                <td>Automatically deducts 6 base pieces at POS sale</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-bold text-emerald-700">Stocking Unit</td>
                <td>Carton (24 pcs)</td>
                <td className="font-mono">24.0</td>
                <td>$38.00</td>
                <td>Receives 24 base pieces per PO carton checked in</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Rules */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-600" /> 3. Customer Price Lists & Tiered Volume Discounts
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Under the <strong>Pricing</strong> tab, configure contextual pricing strategies:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h3 className="text-xs font-bold text-slate-900">Price Lists</h3>
            <p className="text-[11px] text-slate-600">Assign wholesale or VIP prices based on customer account tier.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h3 className="text-xs font-bold text-slate-900">Volume Discounts</h3>
            <p className="text-[11px] text-slate-600">Automatic discounts triggered when purchase quantity exceeds thresholds.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h3 className="text-xs font-bold text-slate-900">Date Promotions</h3>
            <p className="text-[11px] text-slate-600">Time-bounded campaign prices with automatic start and expiration dates.</p>
          </div>
        </div>
      </div>

      {/* Location Reorder Rules */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-slate-700" /> 4. Location Reorder Rules & Preferred Suppliers
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Prevent stockouts by configuring automated replenishment parameters per branch:
        </p>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
          <li><strong>Minimum Stock Threshold</strong>: Triggers immediate operational alerts on management dashboards.</li>
          <li><strong>Reorder Quantity</strong>: Pre-filled standard order amount for supplier purchase orders.</li>
          <li><strong>Auto-Generate Purchase Order</strong>: Automatically drafts purchase orders to the linked Preferred Supplier when inventory drops below minimum.</li>
        </ul>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/inventory/manage-variants"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous: Manage Variants & Scanners
        </Link>
        <Link
          to="/docs/inventory/archive-and-restore"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Archiving, Disabling & Restoring <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
