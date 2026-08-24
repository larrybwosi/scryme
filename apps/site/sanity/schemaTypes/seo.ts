import { defineField, defineType } from 'sanity'

export const seoType = defineType({
  name: 'seo',
  title: 'SEO & Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Meta Title',
      type: 'string',
      description: 'Aim for 45–60 characters. The brand suffix is added by the site.',
      validation: (Rule) => Rule.max(60).warning('Search results may truncate titles longer than 60 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      description: 'Summarize the page benefit in 120–160 characters.',
      validation: (Rule) => Rule.max(160).warning('Search results may truncate descriptions longer than 160 characters.'),
    }),
    defineField({
      name: 'keywords',
      title: 'Meta Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Keywords for search engines.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'Optional. Use only when this page should point search engines to another canonical URL.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Custom social sharing image for this page.',
      options: {
        hotspot: true,
      },
    }),
  ],
})
