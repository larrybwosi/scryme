import { defineField, defineType } from 'sanity'

export const accessibleImageType = defineType({
  name: 'accessibleImage',
  title: 'Accessible Image',
  type: 'image',
  options: {
    hotspot: true,
  },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      description: 'Important for SEO and accessibility.',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
  ],
})
