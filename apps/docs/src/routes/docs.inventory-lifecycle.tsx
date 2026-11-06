import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Boxes,
  Layers,
  Archive,
  ArrowRight,
  Tag,
  DollarSign,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/inventory-lifecycle')({
  head: () =>
    createDocSeo({
      title: 'Inventory & Variant Lifecycle Overview',
      description:
        'Comprehensive operational hub for managing catalog items, product variants, hardware barcode scanners, multi-unit pricing, and lifecycle transitions.',
      pathname: '/docs/inventory-lifecycle',
      keywords: ['Inventory Lifecycle', 'Catalog Management', 'Product Variants', 'Store Operations']
    }),
  component: InventoryLifecycleOverviewPage
})

function InventoryLifecycleOverviewPage() {
  const sections = [
    {
      title: '1. Create Products & Initial Batches',
      path: '/docs/inventory/create-product' as const,
      icon: Tag,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description:
        'Step-by-step operator manual for creating products, dynamic SKU/slug uniqueness verification, profit margin badges, and automatic batch generation.'
    },
    {
      title: '2. Manage Variants & Barcode Hardware',
      path: '/docs/inventory/manage-variants' as const,
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      description:
        'Manage product variations, attribute matrices, USB/Bluetooth barcode scanner integration with 45ms burst detection, and expiry alerts.'
    },
    {
      title: '3. Details, Multi-Units & Reorder Rules',
      path: '/docs/inventory/update-and-pricing' as const,
      icon: DollarSign,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description:
        'Configure multi-tier selling units with conversion multipliers, customer price lists, volume discounts, and location-based automated replenishment.'
    },
    {
      title: '4. Archiving, Disabling & Restoring',
      path: '/docs/inventory/archive-and-restore' as const,
      icon: Archive,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      description:
        'Lifecycle comparison (Active vs Disabled vs Archived vs Deleted), soft vault archiving, unarchiving, and point-in-time state reversion.'
    }
  ]

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

      {/* Structured Guides Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Inventory Documentation Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.path}
                to={section.path}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${section.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{section.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{section.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                  Read documentation &rarr;
                </div>
              </Link>
            )
          })}
        </div>
      </div>

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
          Stocking V3 API <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
