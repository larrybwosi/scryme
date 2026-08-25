import {defineField, defineType} from 'sanity'

export const pageType = defineType({
  name: 'page', title: 'Marketing page', type: 'document',
  groups: [{name: 'content', title: 'Content', default: true}, {name: 'seo', title: 'SEO'}],
  fields: [
    defineField({name: 'title', title: 'Internal title', type: 'string', group: 'content', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'URL', type: 'slug', group: 'content', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'pageType', title: 'Page purpose', type: 'string', group: 'content', initialValue: 'marketing', options: {list: [{title: 'Marketing', value: 'marketing'}, {title: 'Resource', value: 'resource'}, {title: 'Legal', value: 'legal'}]}}),
    defineField({name: 'sections', title: 'Page sections', type: 'pageBuilder', group: 'content'}),
    defineField({name: 'seo', title: 'Search and social', type: 'seo', group: 'seo'}),
  ],
  preview: {select: {title: 'title', slug: 'slug.current', type: 'pageType'}, prepare: ({title, slug, type}) => ({title, subtitle: `/${slug || ''} · ${type || 'marketing'}`})},
})

export const productPageType = defineType({
  name: 'productPage', title: 'Product page', type: 'document',
  groups: [{name: 'content', title: 'Content', default: true}, {name: 'seo', title: 'SEO'}],
  fields: [
    defineField({name: 'title', title: 'Product name', type: 'string', group: 'content', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Product URL', type: 'slug', group: 'content', options: {source: 'title'}, validation: (Rule) => Rule.required()}),
    defineField({name: 'summary', title: 'Short summary', type: 'text', rows: 3, group: 'content', validation: (Rule) => Rule.required().max(220)}),
    defineField({name: 'icon', title: 'Product icon', type: 'accessibleImage', group: 'content'}),
    defineField({name: 'sections', title: 'Page sections', type: 'pageBuilder', group: 'content'}),
    defineField({name: 'seo', title: 'Search and social', type: 'seo', group: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'summary', media: 'icon'}},
})
