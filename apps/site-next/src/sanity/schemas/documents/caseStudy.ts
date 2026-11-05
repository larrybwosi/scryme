import { defineField, defineType } from 'sanity'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Customer Case Study',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Case Study Title',
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
    }),
    defineField({
      name: 'companyName',
      title: 'Customer / Company Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'companyLogo',
      title: 'Company Logo',
      type: 'image',
    }),
    defineField({
      name: 'industry',
      title: 'Industry Sector',
      type: 'string',
      initialValue: 'Logistics & Supply Chain',
    }),
    defineField({
      name: 'summary',
      title: 'Executive Summary',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'highlightMetrics',
      title: 'Highlight Metrics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Metric Label', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'value', title: 'Metric Value (e.g. 88%, 4 seconds)', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'subtext', title: 'Subtext Explanation', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'challenge',
      title: 'The Challenge & Legacy Pain',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'solution',
      title: 'The Solution & Deployment',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'quote',
      title: 'Featured Quote',
      type: 'object',
      fields: [
        defineField({ name: 'text', title: 'Quote Text', type: 'text', rows: 3 }),
        defineField({ name: 'authorName', title: 'Author Name', type: 'string' }),
        defineField({ name: 'authorRole', title: 'Author Role / Title', type: 'string' }),
        defineField({ name: 'avatar', title: 'Author Avatar', type: 'image' }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO Meta Settings',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      company: 'companyName',
      media: 'companyLogo',
    },
    prepare({ title, company, media }) {
      return {
        title: title || 'Untitled Case Study',
        subtitle: company ? `Customer: ${company}` : 'Case Study',
        media,
      }
    },
  },
})
