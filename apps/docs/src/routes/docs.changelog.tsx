import { createFileRoute } from '@tanstack/react-router'
import { FileText } from 'lucide-react'

export const Route = createFileRoute('/docs/changelog')({
  component: ChangelogPage
})

function ChangelogPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FileText className="w-3.5 h-3.5" /> Changelog
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">V3 Platform Release Notes</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Version 3.0.0 release includes full multi-tenant security hardening, performance optimizations across booking and stock reconciliation services.
        </p>
      </div>
    </div>
  )
}
