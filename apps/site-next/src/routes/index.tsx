import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Scryme Site Next</h1>
        <p className="text-sm text-slate-600">Scaffolding initialized with TanStack Start & Sanity.</p>
      </div>
    </main>
  )
}
