import { notFound } from 'next/navigation'
import React from 'react'

interface PageProps {
  params: Promise<{
    orgSlug: string
    pageSlug: string
  }>
}

export async function generateMetadata({ params }: PageProps) {
  const { orgSlug, pageSlug } = await params
  return {
    title: `${pageSlug.replace(/-/g, ' ')} | ${orgSlug} Product Marketing`,
    description: `Product marketing showcase and campaign page for ${orgSlug}`,
  }
}

export default async function OrganizationMarketingPage({ params }: PageProps) {
  const { orgSlug, pageSlug } = await params

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-6 py-12 max-w-5xl mx-auto">
      <header className="border-b border-neutral-800 pb-8 mb-8">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono">
          Organization Marketing • {orgSlug}
        </span>
        <h1 className="text-4xl font-bold mt-2 capitalize">{pageSlug.replace(/-/g, ' ')}</h1>
      </header>

      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-emerald-300">Featured Campaign & Showcase</h2>
        <p className="text-neutral-400 leading-relaxed mb-6">
          This marketing page is powered by Payload CMS multi-tenant product marketing architecture.
          Content and campaigns are isolated by organization.
        </p>
        <div className="flex gap-4">
          <a
            href={`/login`}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-medium rounded-lg text-sm transition"
          >
            Manage Campaigns
          </a>
        </div>
      </section>
    </div>
  )
}
