import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Default Site Title',
      type: 'string',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Default Site Description',
      type: 'text',
    }),
    defineField({
      name: 'siteKeywords',
      title: 'Default Site Keywords',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'defaultOgImage',
      title: 'Default Open Graph Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})
