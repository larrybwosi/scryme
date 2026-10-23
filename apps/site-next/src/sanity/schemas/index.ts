import { seoObject } from './objects/seo'
import { heroBlock } from './objects/hero'
import { comparisonMatrixBlock } from './objects/comparisonMatrix'
import { featureGridBlock } from './objects/featureGrid'
import { statsBarBlock } from './objects/statsBar'
import { testimonialsBlock } from './objects/testimonials'
import { faqAccordionBlock } from './objects/faqAccordion'
import { ctaBannerBlock } from './objects/ctaBanner'
import { portableTextBlock } from './objects/portableTextBlock'

import { comparisonPage } from './documents/comparisonPage'
import { pageDocument } from './documents/page'
import { pricingConfig } from './documents/pricingConfig'

export const schemaTypes = [
  // Objects
  seoObject,
  heroBlock,
  comparisonMatrixBlock,
  featureGridBlock,
  statsBarBlock,
  testimonialsBlock,
  faqAccordionBlock,
  ctaBannerBlock,
  portableTextBlock,

  // Documents
  comparisonPage,
  pageDocument,
  pricingConfig,
]
