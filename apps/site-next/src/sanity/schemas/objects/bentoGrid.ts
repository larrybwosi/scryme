import { defineField, defineType } from 'sanity'

export const bentoGridBlock = defineType({
  name: 'bentoGridBlock',
  title: 'Bento Grid Block',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Eyebrow Badge',
      type: 'string',
      initialValue: 'Platform Capabilities',
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'cards',
      title: 'Bento Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Card Title', type: 'string' }),
            defineField({ name: 'description', title: 'Card Description', type: 'text', rows: 2 }),
            defineField({
              name: 'colSpan',
              title: 'Column Span (1-3)',
              type: 'string',
              options: {
                list: [
                  { title: '1 Column', value: '1' },
                  { title: '2 Columns', value: '2' },
                  { title: '3 Columns (Full Width)', value: '3' },
                ],
              },
              initialValue: '1',
            }),
            defineField({ name: 'badge', title: 'Card Badge / Tag', type: 'string' }),
            defineField({ name: 'icon', title: 'Lucide Icon Name', type: 'string' }),
            defineField({ name: 'image', title: 'Illustration / Screenshot', type: 'image' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      badge: 'badge',
    },
    prepare({ title, badge }) {
      return {
        title: title || 'Bento Grid Block',
        subtitle: badge ? `Badge: ${badge}` : 'Bento layout',
      }
    },
  },
})
