import { createFileRoute } from '@tanstack/react-router'
import { Studio } from 'sanity'
import sanityConfig from '../../../sanity.config'

export const Route = createFileRoute('/studio/$')({
  component: StudioComponent,
})

function StudioComponent() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <Studio config={sanityConfig} />
    </div>
  )
}
