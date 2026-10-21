import React from 'react'
import { HeroBlock } from './HeroBlock'
import { ComparisonMatrixBlock } from './ComparisonMatrixBlock'
import { FeatureGridBlock } from './FeatureGridBlock'
import { StatsBarBlock } from './StatsBarBlock'
import { TestimonialsBlock } from './TestimonialsBlock'
import { FaqAccordionBlock } from './FaqAccordionBlock'
import { CtaBannerBlock } from './CtaBannerBlock'
import { PortableTextBlock } from './PortableTextBlock'

export interface PageBuilderProps {
  modules?: any[]
}

export const PageBuilder: React.FC<PageBuilderProps> = ({ modules = [] }) => {
  if (!modules || modules.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col w-full">
      {modules.map((module, idx) => {
        const key = module._key || `module-${idx}`

        switch (module._type) {
          case 'heroBlock':
            return <HeroBlock key={key} {...module} />
          case 'comparisonMatrixBlock':
            return <ComparisonMatrixBlock key={key} {...module} />
          case 'featureGridBlock':
            return <FeatureGridBlock key={key} {...module} />
          case 'statsBarBlock':
            return <StatsBarBlock key={key} {...module} />
          case 'testimonialsBlock':
            return <TestimonialsBlock key={key} {...module} />
          case 'faqAccordionBlock':
            return <FaqAccordionBlock key={key} {...module} />
          case 'ctaBannerBlock':
            return <CtaBannerBlock key={key} {...module} />
          case 'portableTextBlock':
            return <PortableTextBlock key={key} {...module} />
          default:
            console.warn(`[PageBuilder] Unknown module type: ${module._type}`)
            return null
        }
      })}
    </div>
  )
}
