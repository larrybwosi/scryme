import { createFileRoute } from '@tanstack/react-router'
import { ApiReferenceReact } from '@scalar/api-reference-react'
import { openApiSpec } from '../openapi-spec'
import { createDocSeo } from '../lib/seo'
import '@scalar/api-reference-react/style.css'

export const Route = createFileRoute('/api-reference/playground')({
  head: () =>
    createDocSeo({
      title: 'Interactive Scalar API Playground',
      description:
        'Live interactive OpenAPI test console for Scryme V3: test endpoints, review request bodies, and generate client code.',
      pathname: '/api-reference/playground',
      keywords: ['API Playground', 'Scalar API', 'Interactive Console', 'OpenAPI Test Console']
    }),
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
