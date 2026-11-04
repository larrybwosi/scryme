import { defineField, defineType } from 'sanity'

export const logoCloudBlock = defineType({
  name: 'logoCloudBlock',
  title: 'Logo Cloud Block',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Eyebrow Badge',
      type: 'string',
      initialValue: 'Trusted by Industry Leaders',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'logos',
      title: 'Brand Logos',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Company Name', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'logoImage', title: 'Logo Image', type: 'image' }),
            defineField({ name: 'svgCode', title: 'SVG / Text Fallback', type: 'text', rows: 2 }),
            defineField({ name: 'url', title: 'Website URL', type: 'url' }),
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
        title: title || 'Logo Cloud Block',
        subtitle: badge || 'Client and Partner Logos',
      }
    },
  },
})
