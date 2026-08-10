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
      description: 'Override the default page title for search engines.',
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      description: 'Override the default page description for search engines.',
    }),
    defineField({
      name: 'keywords',
      title: 'Meta Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Keywords for search engines.',
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
