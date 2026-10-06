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

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
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
