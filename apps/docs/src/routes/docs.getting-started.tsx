import { createFileRoute, Link } from '@tanstack/react-router'
import { Play, CheckCircle2, ArrowRight, ShieldCheck, Terminal, Layers } from 'lucide-react'

export const Route = createFileRoute('/docs/getting-started')({
  component: GettingStartedPage
})

function GettingStartedPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Play className="w-3.5 h-3.5" /> Getting Started Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome to Scryme Platform</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme is an enterprise multi-tenant point-of-sale, stock management, production, and CRM platform powered by NestJS V3 REST APIs and modern React applications.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Quick Steps */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Quick Setup Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="font-semibold text-sm text-slate-900">Authenticate</h3>
            <p className="text-xs text-slate-500">Obtain an API key or member JWT bearer token for your organization.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">2</div>
            <h3 className="font-semibold text-sm text-slate-900">Configure Tenant</h3>
            <p className="text-xs text-slate-500">All V3 requests mandate high-security organization context headers.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">3</div>
            <h3 className="font-semibold text-sm text-slate-900">Invoke V3 APIs</h3>
            <p className="text-xs text-slate-500">Integrate POS sales, stock transfers, preorders, and webhook workflows.</p>
          </div>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Example Request</h2>
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono">
          <pre>{`curl -X GET "https://api.scryme.tech/v3/my-org/pos/sales" \\
  -H "Authorization: Bearer <member_jwt_token>" \\
  -H "X-API-KEY: <device_key>" \\
  -H "Content-Type: application/json"`}</pre>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          to="/docs/installation"
          className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
        >
          Proceed to Installation <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
