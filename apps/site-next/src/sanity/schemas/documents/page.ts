import { defineField, defineType } from 'sanity'

export const pageDocument = defineType({
  name: 'page',
  title: 'Page Builder Landing Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'URL path slug (e.g. enterprise-pos -> available at /pages/enterprise-pos)',
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Meta Settings',
      type: 'seo',
    }),
    defineField({
      name: 'modules',
      title: 'Page Builder Modules',
      type: 'array',
      description: 'Add, reorder, and configure page section blocks',
      of: [
        { type: 'heroBlock' },
        { type: 'comparisonMatrixBlock' },
        { type: 'featureGridBlock' },
        { type: 'statsBarBlock' },
        { type: 'testimonialsBlock' },
        { type: 'faqAccordionBlock' },
        { type: 'ctaBannerBlock' },
        { type: 'portableTextBlock' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    prepare({ title, slug }) {
      return {
        title: title || 'Untitled Page',
        subtitle: slug ? `/pages/${slug}` : 'Missing slug',
      }
    },
  },
})
