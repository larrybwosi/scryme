import { defineField, defineType } from 'sanity'

export const seoObject = defineType({
  name: 'seo',
  title: 'SEO & Social Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Optimal length: 50-60 characters.',
      validation: (Rule) => Rule.max(70).warning('Titles over 70 characters may be truncated by search engines.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Optimal length: 140-160 characters.',
      validation: (Rule) => Rule.max(180).warning('Descriptions over 180 characters may be truncated by search engines.'),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image (Social Sharing)',
      type: 'image',
      description: 'Recommended size: 1200x630px.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'ogType',
      title: 'Open Graph Type',
      type: 'string',
      initialValue: 'website',
      options: {
        list: [
          { title: 'Website', value: 'website' },
          { title: 'Article / Guide', value: 'article' },
          { title: 'Product / App', value: 'product' },
        ],
      },
    }),
    defineField({
      name: 'twitterCard',
      title: 'Twitter Card Format',
      type: 'string',
      initialValue: 'summary_large_image',
      options: {
        list: [
          { title: 'Summary Large Image', value: 'summary_large_image' },
          { title: 'Summary', value: 'summary' },
        ],
      },
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL Override',
      type: 'url',
      description: 'Leave blank to use default page URL.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines (noindex)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
