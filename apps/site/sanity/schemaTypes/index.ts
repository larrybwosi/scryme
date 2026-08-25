import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {homePageType} from './homePage'
import {aboutPageType} from './aboutPage'
import {pricingPageType} from './pricingPage'
import {seoType} from './seo'
import {siteSettingsType} from './siteSettings'
import {pageType, productPageType} from './page'
import {
  accessibleImageType,
  ctaSectionType,
  faqSectionType,
  featureSectionType,
  heroSectionType,
  linkType,
  mediaSectionType,
  metricsSectionType,
  pageBuilderType,
  testimonialSectionType,
} from './pageBuilder'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    linkType,
    accessibleImageType,
    heroSectionType,
    featureSectionType,
    mediaSectionType,
    metricsSectionType,
    testimonialSectionType,
    faqSectionType,
    ctaSectionType,
    pageBuilderType,
    pageType,
    productPageType,
    blockContentType,
    categoryType,
    postType,
    authorType,
    homePageType,
    aboutPageType,
    pricingPageType,
    seoType,
    siteSettingsType,
  ],
}
