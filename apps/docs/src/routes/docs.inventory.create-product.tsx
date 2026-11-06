import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Tag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  ArrowLeft
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/inventory/create-product')({
  head: () =>
    createDocSeo({
      title: 'Creating Catalog Products & Initial Stock',
      description:
        'Step-by-step operator manual for creating products, dynamic SKU and slug uniqueness validation, gross margin calculators, and initial batch provisioning.',
      pathname: '/docs/inventory/create-product',
      keywords: ['Create Product', 'Product Sheet', 'SKU Generation', 'Gross Margin', 'Stock Provisioning']
    }),
  component: CreateProductPage
})

function CreateProductPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Tag className="w-3.5 h-3.5" /> Inventory & Catalog Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Creating Products & Initial Stock
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          This comprehensive operational guide walks store operators and managers through creating a new catalog item,
          verifying SKU uniqueness in real time, calculating margins, and auto-provisioning initial stock batches.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Section 1: Accessing the Sheet */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" /> 1. Accessing the Product Creation Sheet
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Store staff with operator or manager permissions can register new merchandise or prepared goods using the slide-out sheet:
        </p>
        <ol className="text-xs text-slate-700 list-decimal pl-5 space-y-2">
          <li>Navigate to <strong>Inventory</strong> (<code>/inventory</code>) in the main dashboard navigation.</li>
          <li>In the upper right action bar, click the <strong>Add Item</strong> button.</li>
          <li>The <strong>New Product Sheet</strong> smoothly slides open from the right without leaving your active catalog view.</li>
        </ol>
      </div>

      {/* Section 2: Basic Identity */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600" /> 2. Step 1: Basic Information & Taxonomy
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The first section establishes product identity, search indexing, and classification rules:
        </p>

        <div className="space-y-3 pt-2">
          <div className="border border-slate-200 p-4 rounded-xl space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900">Product Name (Required)</h3>
            <p className="text-xs text-slate-600">
              Enter the full official title of the item (e.g. <code>Artisan Sourdough Loaf</code>).
              As you type, Scryme’s client dynamically derives initial suggestions for SKU and URL slug.
            </p>
          </div>

          <div className="border border-slate-200 p-4 rounded-xl space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900">SKU & URL Slug Uniqueness Verification</h3>
            <p className="text-xs text-slate-600">
              The system automatically defaults to a 3-letter prefix plus a 5-digit integer (e.g. <code>ART-48291</code>).
              A debounced backend lookup checks tenant uniqueness in real time:
            </p>
            <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
              <li><strong className="text-emerald-700">Green Checkmark</strong>: SKU is available across your active organization.</li>
              <li><strong className="text-red-700">Red Alert Callout</strong>: SKU already exists in this tenant. You must adjust the code before saving.</li>
            </ul>
          </div>

          <div className="border border-slate-200 p-4 rounded-xl space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900">Category & Item Type Selection</h3>
            <p className="text-xs text-slate-600">
              Select the parent category or click <strong>Create Inline</strong> to register a new category without losing form progress.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <strong>Finished Good</strong>: Baked goods or finished retail items sold to customers.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <strong>Raw Material</strong>: Ingredients or packaging tracked strictly by buying cost.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <strong>Merchandise</strong>: Pre-packaged goods purchased from vendors and resold directly.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <strong>Other</strong>: Miscellaneous non-standard inventory items.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Pricing & Gross Margin */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" /> 3. Step 2: Costs, Retail Pricing & Dynamic Gross Margin
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Define financial boundaries per base unit. The sheet automatically evaluates gross margin health:
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="font-mono text-xs font-bold text-slate-800">
            Gross Margin % = ((Retail Price - Cost Price) / Retail Price) × 100
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
              <strong>Healthy (≥ 20%)</strong>: Standard target profit margin.
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              <strong>Low Margin (0% - 20%)</strong>: Triggers warning alert.
            </div>
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-800">
              <strong>Negative (&lt; 0%)</strong>: Retail price is below buying cost.
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <span className="font-bold">Raw Material Pricing Safeguard:</span>
            <p>
              When <code>RAW_MATERIAL</code> is selected, the Retail Price input is automatically locked.
              Raw materials are consumed via bakery recipes and production bills of materials (BOM), never sold as single retail lines.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Initial Stock Provisioning */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 4. Initial Stock Provisioning & Batch Generation
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Entering an initial count automatically performs transactional ledger initialization:
        </p>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
          <li>Creates the parent <code>Product</code> record and its default <code>ProductVariant</code>.</li>
          <li>Initializes a location stock record (<code>ProductVariantStock</code>) for the store location.</li>
          <li>Generates an immutable enterprise batch code (e.g. <code>INIT-ART-48291-1024</code>).</li>
          <li>Appends an initial adjustment record to the inventory movement ledger for complete fiscal auditability.</li>
        </ul>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/inventory-lifecycle"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Inventory Lifecycle Overview
        </Link>
        <Link
          to="/docs/inventory/manage-variants"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Next: Manage Variants & Scanners <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
