import { createFileRoute, Link } from '@tanstack/react-router'
import { Play, ArrowRight, CheckCircle2 } from 'lucide-react'

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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Build on the Scryme platform</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme unifies multi-location retail operations, stock movements, production workflows, CRM, and POS processes under one tenant-aware platform.
          The quickest path to success is understanding how data, authentication, and operational flows are organized before integrating your app.
        </p>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">What to do first</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="font-semibold text-sm text-slate-900">Create a tenant context</h3>
            <p className="text-xs text-slate-500">Map your organization, staff access, and brand settings before issuing API credentials.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">2</div>
            <h3 className="font-semibold text-sm text-slate-900">Secure the integration</h3>
            <p className="text-xs text-slate-500">Use member JWTs, device keys, and scoped access so each tenant and operation stays isolated.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">3</div>
            <h3 className="font-semibold text-sm text-slate-900">Call the V3 endpoints</h3>
            <p className="text-xs text-slate-500">Integrate sales, stock, reservation, and webhook signals as part of your operational workflow.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Typical request flow</h2>
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono">
          <pre>{`curl -X GET "https://api.scryme.tech/v3/my-org/pos/sales" \\
  -H "Authorization: Bearer <member_jwt_token>" \\
  -H "X-API-KEY: <device_key>" \\
  -H "Content-Type: application/json"`}</pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Core platform responsibilities</h2>
        <ul className="space-y-3 text-sm text-slate-600">
          {[
            'Multi-tenant resource isolation across orgs, users, and locations.',
            'Store and stock management with location-aware inventory data and reconciliation.',
            'POS, preorder, and production workflows connected to the same backend engine.',
            'Webhook, notification, and event-driven integration patterns for real-time updates.'
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
