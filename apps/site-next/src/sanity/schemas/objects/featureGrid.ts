import { defineField, defineType } from 'sanity'

export const featureGridBlock = defineType({
  name: 'featureGridBlock',
  title: 'Feature Grid Cards',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Eyebrow Badge',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'columns',
      title: 'Columns Layout',
      type: 'string',
      options: {
        list: [
          { title: '2 Columns', value: '2' },
          { title: '3 Columns', value: '3' },
          { title: '4 Columns', value: '4' },
        ],
      },
      initialValue: '3',
    }),
    defineField({
      name: 'features',
      title: 'Feature Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'feature',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon Name (Lucide Icon)',
              type: 'string',
              description: 'e.g. ShieldCheck, Zap, CreditCard, Layers, BarChart3, Globe, Smartphone, RefreshCw',
            }),
            defineField({
              name: 'title',
              title: 'Feature Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Feature Description',
              type: 'text',
              rows: 3,
            }),
            defineField({
              name: 'tag',
              title: 'Highlight Tag (Optional)',
              type: 'string',
              description: 'e.g. "Exclusive", "Included free"',
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'badge',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Feature Grid Block',
        subtitle: subtitle ? `Feature Grid • ${subtitle}` : 'Feature Grid Block',
      }
    },
  },
})
