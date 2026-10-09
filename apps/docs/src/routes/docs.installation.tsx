import { createFileRoute } from '@tanstack/react-router'
import { Package, Terminal } from 'lucide-react'

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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Client Installation</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Install official SDK packages or utilize our scaffold CLI to integrate Scryme V3 services into custom applications.
        </p>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">CLI Scaffolding</h2>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2">
          <p className="text-slate-400"># Create a new Scryme integrated application</p>
          <p>pnpm create scryme-app my-store-integration</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">TypeScript / Node SDK Installation</h2>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2">
          <p className="text-slate-400"># Install core SDK package</p>
          <p>pnpm add @scryme/sdk</p>
        </div>
      </div>
    </div>
  )
}
