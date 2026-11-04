import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Scryme ERP Content')
    .items([
      // 1. Global Site Settings & Navigation (Singleton)
      S.listItem()
        .title('Site Settings & Navigation')
        .id('siteSettingsListItem')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Global Site Settings')
        ),

      S.divider(),

      // 2. Core Page Configurations (Singletons)
      S.listItem()
        .title('Core Pages')
        .child(
          S.list()
            .title('Core Pages')
            .items([
              S.listItem()
                .title('Home Page')
                .id('homePageItem')
                .child(
                  S.document()
                    .schemaType('homePage')
                    .documentId('homePage')
                    .title('Home Page Configuration')
                ),
              S.listItem()
                .title('Pricing Configuration')
                .id('pricingConfigItem')
                .child(
                  S.document()
                    .schemaType('pricingConfig')
                    .documentId('pricingConfig')
                    .title('Pricing Configuration')
                ),
              S.listItem()
                .title('Headless CMS Page')
                .id('cmsPageItem')
                .child(
                  S.document()
                    .schemaType('cmsPage')
                    .documentId('cmsPage')
                    .title('CMS Page Configuration')
                ),
              S.listItem()
                .title('360° Relationship CRM Page')
                .id('crmPageItem')
                .child(
                  S.document()
                    .schemaType('crmPage')
                    .documentId('crmPage')
                    .title('CRM Page Configuration')
                ),
              S.listItem()
                .title('Payments & Settlement Page')
                .id('paymentsPageItem')
                .child(
                  S.document()
                    .schemaType('paymentsPage')
                    .documentId('paymentsPage')
                    .title('Payments Page Configuration')
                ),
            ])
        ),

      // 3. Marketing Pages & Comparisons
      S.listItem()
        .title('Marketing Pages')
        .child(
          S.documentTypeList('page')
            .title('Modular Landing Pages (/pages/*)')
        ),

      S.listItem()
        .title('Competitor Comparisons')
        .child(
          S.documentTypeList('comparisonPage')
            .title('Comparison Pages (/compare/*)')
        ),

      S.divider(),

      // 4. Stories & Content Marketing
      S.listItem()
        .title('Customer Case Studies')
        .child(
          S.documentTypeList('caseStudy')
            .title('Customer Case Studies')
        ),

      S.listItem()
        .title('Editorial & Blog')
        .child(
          S.list()
            .title('Editorial & Blog')
            .items([
              S.listItem()
                .title('Articles & Posts')
                .child(S.documentTypeList('post').title('All Posts')),
              S.listItem()
                .title('Authors')
                .child(S.documentTypeList('author').title('Authors')),
              S.listItem()
                .title('Categories')
                .child(S.documentTypeList('category').title('Categories')),
            ])
        ),
    ])
