import type {StructureResolver} from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], title: string, schemaType: string, documentId: string) =>
  S.listItem().title(title).child(S.document().schemaType(schemaType).documentId(documentId).title(title))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Scryme content')
    .items([
      singleton(S, 'Site settings', 'siteSettings', 'siteSettings'),
      S.divider(),
      S.listItem().title('Pages').child(
        S.list().title('Pages').items([
          singleton(S, 'Home', 'homePage', 'homePage'),
          singleton(S, 'About', 'aboutPage', 'aboutPage'),
          singleton(S, 'Pricing', 'pricingPage', 'pricingPage'),
          S.documentTypeListItem('page').title('Marketing, resource & legal pages'),
        ]),
      ),
      S.documentTypeListItem('productPage').title('Products'),
      S.listItem().title('Blog').child(
        S.list().title('Blog').items([
          S.documentTypeListItem('post').title('Posts'),
          S.documentTypeListItem('category').title('Categories'),
          S.documentTypeListItem('author').title('Authors'),
        ]),
      ),
    ])

export const singletonTypes = new Set(['siteSettings', 'homePage', 'aboutPage', 'pricingPage'])
