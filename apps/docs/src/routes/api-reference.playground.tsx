import { createFileRoute } from '@tanstack/react-router'
import { ApiReferenceReact } from '@scalar/api-reference-react'
import { openApiSpec } from '../openapi-spec'
import '@scalar/api-reference-react/style.css'

export const Route = createFileRoute('/api-reference/playground')({
  component: ApiPlaygroundPage
})

function ApiPlaygroundPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900">Interactive Scalar API Console</h1>
        <p className="text-xs text-slate-500">Test V3 API endpoints live with full request formatting and response previews.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-[600px] shadow-sm">
        <ApiReferenceReact
          configuration={{
            spec: {
              content: openApiSpec
            },
            darkMode: false,
            withDefaultFonts: true,
            hideSearch: false
          }}
        />
      </div>
    </div>
  )
}
