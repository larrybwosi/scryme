import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, type ComponentType } from 'react'

export const Route = createFileRoute('/studio/$')({
  component: StudioComponent,
})

function StudioComponent() {
  const [StudioComp, setStudioComp] = useState<ComponentType<{ config: any }> | null>(null)
  const [sanityConfig, setSanityConfig] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      import('sanity'),
      import('../../../sanity.config')
    ]).then(([sanityModule, configModule]) => {
      setStudioComp(() => sanityModule.Studio)
      setSanityConfig(() => configModule.default)
    })
  }, [])

  if (!StudioComp || !sanityConfig) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-900 text-zinc-100">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium">Loading Sanity Studio...</div>
          <div className="text-sm text-zinc-400">Please wait while the editor loads.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <StudioComp config={sanityConfig} />
    </div>
  )
}
