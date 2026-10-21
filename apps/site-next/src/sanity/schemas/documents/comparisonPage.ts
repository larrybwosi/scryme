import { defineField, defineType } from 'sanity'

export const comparisonPage = defineType({
  name: 'comparisonPage',
  title: 'Comparison Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Internal & display title for the comparison page',
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
      description: 'URL path slug (e.g. scryme-vs-square -> available at /compare/scryme-vs-square)',
    }),
    defineField({
      name: 'competitorName',
      title: 'Competitor Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Name of the platform being compared (e.g. "Square", "Lightspeed")',
    }),
    defineField({
      name: 'competitorLogo',
      title: 'Competitor Logo',
      type: 'image',
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
      competitor: 'competitorName',
    },
    prepare({ title, slug, competitor }) {
      return {
        title: title || 'Untitled Comparison Page',
        subtitle: slug ? `/compare/${slug} (vs ${competitor || 'Competitor'})` : 'Missing slug',
      }
    },
  },
})
