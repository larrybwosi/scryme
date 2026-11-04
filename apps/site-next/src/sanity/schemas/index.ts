// Objects
import { seoObject } from './objects/seo'
import { heroBlock } from './objects/hero'
import { comparisonMatrixBlock } from './objects/comparisonMatrix'
import { featureGridBlock } from './objects/featureGrid'
import { bentoGridBlock } from './objects/bentoGrid'
import { logoCloudBlock } from './objects/logoCloud'
import { workflowStepsBlock } from './objects/workflowSteps'
import { statsBarBlock } from './objects/statsBar'
import { testimonialsBlock } from './objects/testimonials'
import { faqAccordionBlock } from './objects/faqAccordion'
import { ctaBannerBlock } from './objects/ctaBanner'
import { portableTextBlock } from './objects/portableTextBlock'

// Documents
import { siteSettings } from './documents/siteSettings'
import { homePage } from './documents/homePage'
import { cmsPage } from './documents/cmsPage'
import { crmPage } from './documents/crmPage'
import { paymentsPage } from './documents/paymentsPage'
import { pricingConfig } from './documents/pricingConfig'
import { pageDocument } from './documents/page'
import { comparisonPage } from './documents/comparisonPage'
import { caseStudy } from './documents/caseStudy'
import { post, author, category } from './documents/post'

export const schemaTypes = [
  // Objects
  seoObject,
  heroBlock,
  comparisonMatrixBlock,
  featureGridBlock,
  bentoGridBlock,
  logoCloudBlock,
  workflowStepsBlock,
  statsBarBlock,
  testimonialsBlock,
  faqAccordionBlock,
  ctaBannerBlock,
  portableTextBlock,

  // Global & Core Documents
  siteSettings,
  homePage,
  pricingConfig,
  cmsPage,
  crmPage,
  paymentsPage,

  // Marketing & Editorial Documents
  pageDocument,
  comparisonPage,
  caseStudy,
  post,
  author,
  category,
]
