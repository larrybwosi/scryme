import { defineField, defineType } from 'sanity'

export const statsBarBlock = defineType({
  name: 'statsBarBlock',
  title: 'Stats & Metrics Bar',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title (Optional)',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle (Optional)',
      type: 'string',
    }),
    defineField({
      name: 'stats',
      title: 'Metric Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'stat',
          fields: [
            defineField({
              name: 'value',
              title: 'Value / Number',
              type: 'string',
              description: 'e.g. "99.9%", "10x", "$0", "24/7"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label / Heading',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'subtext',
              title: 'Supporting Context',
              type: 'string',
              description: 'e.g. "Compared to legacy desktop POS systems"',
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Stats & Metrics Bar',
        subtitle: 'Key Stats Highlight',
      }
    },
  },
})
