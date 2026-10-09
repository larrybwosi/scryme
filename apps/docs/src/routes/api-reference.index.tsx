import { createFileRoute, Link } from '@tanstack/react-router'
import { Code2, ShoppingBag, Package, DollarSign, Users, Factory, Bell, Play } from 'lucide-react'

export const Route = createFileRoute('/api-reference/')({
  component: ApiReferenceIndexPage
})

function ApiReferenceIndexPage() {
  const domainModules = [
    { title: 'POS & Sales V3', desc: 'Process POS sales, preorders, payments, and view transaction history.', icon: ShoppingBag, to: '/api-reference/pos' },
    { title: 'Inventory & Stocking V3', desc: 'Manage stock transfers, physical reconciliations, and purchase orders.', icon: Package, to: '/api-reference/stocking' },
    { title: 'Interactive Scalar Playground', desc: 'Live OpenAPI console with request runner and code snippet generator.', icon: Play, to: '/api-reference/playground' }
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white">
          <Code2 className="w-3.5 h-3.5" /> V3 REST API Documentation
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scryme V3 API Reference</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Explore structured REST API endpoint documentation for Scryme V3 modules or test live calls using our embedded Scalar API playground.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {domainModules.map(module => {
          const Icon = module.icon
          return (
            <Link
              key={module.title}
              to={module.to}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{module.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{module.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
