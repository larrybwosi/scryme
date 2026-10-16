import { createFileRoute } from '@tanstack/react-router'
import { Package, Terminal, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/docs/installation')({
  component: InstallationPage
})

function InstallationPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Package className="w-3.5 h-3.5" /> Installation & SDK
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Install and configure the stack</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme supports a monorepo-based development workflow, a TypeScript SDK, and Docker-based infrastructure so teams can run secure local demo environments and production-ready integrations.
        </p>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Prerequisites</h2>
        <ul className="space-y-3 text-sm text-slate-600">
          {[
            'Node.js 22+ and pnpm 9+ or 10+',
            'Docker and Docker Compose for the API, Redis, databases, and local infrastructure',
            'Rust toolchain if you are building native POS or bakery desktop apps'
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 text-blue-600"><CheckCircle2 className="w-4 h-4" /></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Workspace bootstrap</h2>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2">
          <p className="text-slate-400"># Install workspace dependencies</p>
          <p>pnpm install</p>
          <p className="text-slate-400"># Start local infrastructure</p>
          <p>docker compose up -d</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Create an integration app</h2>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2">
          <p className="text-slate-400"># Scaffold a new Scryme-enabled app</p>
          <p>pnpm create scryme-app my-store-integration</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">TypeScript / Node SDK</h2>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2">
          <p className="text-slate-400"># Install the core SDK package</p>
          <p>pnpm add @scryme/sdk</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Recommended development flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Terminal className="w-4 h-4" /> Local validation</div>
            <p className="mt-2 text-xs text-slate-500">Use the local Docker stack and demo data to verify API contracts before rolling out to a live tenant.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Package className="w-4 h-4" /> Production readiness</div>
            <p className="mt-2 text-xs text-slate-500">Keep API keys, secrets, and webhook verification in a hardened environment and rotate credentials on a schedule.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
