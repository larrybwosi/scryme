import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Boxes,
  Layers,
  Archive,
  RotateCcw,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  History,
  Tag,
  DollarSign,
  Scale
} from 'lucide-react'

export const Route = createFileRoute('/docs/inventory-lifecycle')({
  component: InventoryLifecyclePage,
})

function InventoryLifecyclePage() {
  const [activeTab, setActiveTab] = useState<'create' | 'variants' | 'pricing' | 'archive'>('create')

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Boxes className="w-3.5 h-3.5" /> Store Manager & Operator Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Product & Variant Lifecycle Management
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Comprehensive step-by-step operational manual for creating catalog items, managing product variants,
          handling barcode scanner automation, setting multi-unit pricing, and safely archiving or restoring products.
        </p>
      </div>

      {/* State Transitions Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Visible in POS, storefronts, and active stock tables. Ready for sales.
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Inactive (Disabled)
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Temporarily paused. Hidden from POS registers; accessible in inventory.
          </p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-800 uppercase tracking-wider">
            <Archive className="w-3 h-3 text-amber-600" /> Archived
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Soft-deleted to Vault. Variants deactivated; historical sales preserved.
          </p>
        </div>
        <div className="p-3 rounded-lg bg-red-50/60 border border-red-100">
          <div className="flex items-center gap-2 font-bold text-xs text-red-800 uppercase tracking-wider">
            <ShieldAlert className="w-3 h-3 text-red-600" /> Deleted
          </div>
          <p className="text-[11px] text-red-700 mt-1">
            Permanently erased. Blocked if historic sales or purchase items exist.
          </p>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'create', label: '1. Create Products', icon: Tag },
          { id: 'variants', label: '2. Manage Variants & Scanners', icon: Layers },
          { id: 'pricing', label: '3. Pricing & Multi-Units', icon: DollarSign },
          { id: 'archive', label: '4. Archive & Restore', icon: Archive },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab 1: Create Product */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" /> How to Create a New Catalog Product
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              When adding new merchandise or manufactured goods, store operators use the <strong>Product Sheet</strong>.
              Creating a product automatically sets up its Default Variant and provisions initial stock batches.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Step-by-Step Operator Workflow</h3>
              <ol className="space-y-3 text-xs text-slate-700 list-decimal pl-4">
                <li>
                  <strong>Open Product Sheet</strong>: Navigate to <code>/inventory</code> and click the <strong>Add Item</strong> button in the upper right.
                </li>
                <li>
                  <strong>Enter Product Identity</strong>:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                    <li><strong>Product Name</strong>: Title of item (e.g., <em>Artisan Sourdough Loaf</em>).</li>
                    <li><strong>SKU & Slug</strong>: Auto-generated on keystroke with real-time tenant uniqueness checking. A green check confirms availability.</li>
                    <li><strong>Category</strong>: Pick classification or click <em>Create Inline</em> to register a category instantly.</li>
                    <li><strong>Item Type</strong>: Choose <em>Finished Good</em>, <em>Raw Material</em>, <em>Merchandise</em>, or <em>Other</em>.</li>
                  </ul>
                </li>
                <li>
                  <strong>Enter Costs & Prices</strong>:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                    <li><strong>Cost Price</strong>: Purchase cost per base unit.</li>
                    <li><strong>Retail Price</strong>: Customer retail selling price.</li>
                    <li><strong>Gross Margin Indicator</strong>: Displays dynamic margin percentage with color-coded safety indicators (Green $\ge 20\%$, Amber $0-20\%$, Red Below Cost).</li>
                  </ul>
                </li>
                <li>
                  <strong>Initial Stock Provisioning</strong>:
                  <p className="mt-1 text-slate-600">
                    Entering an initial stock count automatically generates an active <code>StockBatch</code> (e.g. <code>INIT-ART-1024</code>),
                    creates a <code>ProductVariantStock</code> allocation, and logs an approved <code>StockMovement</code> in the inventory ledger.
                  </p>
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <span className="font-bold">Raw Material Note:</span>
                <p>When selecting <code>RAW_MATERIAL</code>, the Retail Price field is automatically disabled. Raw materials are tracked strictly by buying cost and consumed in bakery/production recipes.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Variants */}
      {activeTab === 'variants' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Product Variants, Attributes & Hardware Barcode Scanning
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Products can have multiple variants (e.g. different sizes, colors, flavors, or packaging).
              Each variant operates as its own distinct sellable unit with its own SKU, barcode, and pricing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Barcode className="w-4 h-4 text-emerald-600" /> Hardware Barcode Scanner Automation
                </div>
                <p className="text-xs text-slate-600">
                  When the Variant Dialog is open, the system displays a <span className="text-emerald-700 font-semibold">🟢 Scanner Ready</span> badge.
                  Physical USB/Bluetooth barcode scanners emit keystrokes in bursts under 45ms.
                  The interface intercepts scanner events, automatically populates the barcode, prevents accidental form submit, and displays confirmation toasts.
                </p>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Custom Attribute Matrix
                </div>
                <p className="text-xs text-slate-600">
                  Attach custom key-value pairs to represent any dimension (e.g., <code>Size: Large</code>, <code>Color: Matte Black</code>, <code>Roast: Medium</code>).
                  Attributes are stored as flexible JSON and displayed directly in POS carts and search filters.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiry & Serial Tracking Controls</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Expiry Tracking</strong>: Enable for perishables. Specify warning days (e.g. 2 days before expiry) to generate automated dashboard stock rotation alerts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Serial Tracking</strong>: Enable for serialized electronics or equipment requiring unique serial number capture during sales and stock movements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Variant Deletion Safeguard</strong>: A product must maintain at least one variant. The delete action is automatically disabled if only one variant remains.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pricing & Multi-Units */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> Multi-Unit Conversions & Location Reorder Rules
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scryme enables stores to receive products in bulk packaging units while selling in multiple consumer units with automated stock conversion multipliers.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2">Example: Beverage or Bakery Unit Hierarchy</h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600">
                      <th className="py-1.5 font-semibold">Unit Level</th>
                      <th className="py-1.5 font-semibold">Unit Name</th>
                      <th className="py-1.5 font-semibold">Conversion Multiplier</th>
                      <th className="py-1.5 font-semibold">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="py-2 font-mono font-bold text-indigo-700">Base Unit</td>
                      <td>Piece (pc)</td>
                      <td className="font-mono">1.0</td>
                      <td>Indivisible stock unit counted in inventory batches</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono font-bold text-blue-700">Selling Unit</td>
                      <td>Pack of 6</td>
                      <td className="font-mono">6.0</td>
                      <td>POS retail bundle (deducts 6 pieces automatically)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono font-bold text-emerald-700">Stocking Unit</td>
                      <td>Carton of 24</td>
                      <td className="font-mono">24.0</td>
                      <td>Purchase Order unit for receiving supplier deliveries</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Automated Restocking Rules</h3>
              <p className="text-xs text-slate-600">
                In the <strong>Stock & Locations</strong> tab, operators can configure branch-specific replenishment limits:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
                <li><strong>Minimum Quantity</strong>: Threshold triggering low-stock alerts on store management dashboards.</li>
                <li><strong>Reorder Quantity</strong>: Pre-filled order quantity for supplier purchase orders.</li>
                <li><strong>Auto-Generate PO</strong>: Automatically creates draft purchase orders to the linked Preferred Supplier when stock dips below minimum.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Archive & Restore */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-5 h-5 text-amber-600" /> Archiving, Disabling, Deleting & State Restoration
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Preserve accounting integrity and historical transactions when retiring obsolete products.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-600" /> How to Archive a Product
                </h3>
                <ol className="text-xs text-slate-600 list-decimal pl-4 space-y-1">
                  <li>Open the product at <code>/inventory/products/[id]</code>.</li>
                  <li>In the top sticky header, click the <strong>Archive Product</strong> button.</li>
                  <li>The product is marked <code>isArchived = true</code>, all variants are set to <code>isActive = false</code>, and real-time events notify POS registers to remove the item from local carts.</li>
                  <li>The item is immediately hidden from active inventory and stored in the <strong>Archived Items Vault</strong> (<code>/inventory/archived</code>).</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-600" /> Restoring Archived Items
                </h3>
                <ol className="text-xs text-slate-600 list-decimal pl-4 space-y-1">
                  <li>Navigate to <code>/inventory/archived</code>.</li>
                  <li>Locate the product and click to open its details view.</li>
                  <li>Click <strong>Unarchive Product</strong> in the header. The item and its variants return to active status instantly.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" /> Point-in-Time State Recovery (Activity Tab)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Owners and Admins have access to the <strong>Activity</strong> tab. Every creation, update, and archive event creates an immutable Audit Log with before-and-after JSON snapshots.
                  If an operator accidentally modified pricing or variant configurations, clicking <strong>Revert State</strong> restores the exact snapshot without data loss.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/docs/core-concepts"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          ← Platform Core Concepts
        </Link>
        <Link
          to="/api-reference/stocking"
          className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1.5"
        >
          Stocking & Inventory V3 API <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
