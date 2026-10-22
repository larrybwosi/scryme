import { defineField, defineType } from 'sanity'

export const testimonialsBlock = defineType({
  name: 'testimonialsBlock',
  title: 'Testimonials & Social Proof',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Eyebrow Badge',
      type: 'string',
      initialValue: 'Customer Reviews',
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Trusted by high-growth merchants across East Africa',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'items',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'testimonial',
          fields: [
            defineField({
              name: 'quote',
              title: 'Quote Text',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'authorName',
              title: 'Author Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'authorRole',
              title: 'Role / Title',
              type: 'string',
              description: 'e.g. "Head of Operations"',
            }),
            defineField({
              name: 'companyName',
              title: 'Company Name',
              type: 'string',
              description: 'e.g. "Nairobi Artisan Bakery"',
            }),
            defineField({
              name: 'avatar',
              title: 'Author Avatar / Photo',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'rating',
              title: 'Star Rating (1-5)',
              type: 'number',
              initialValue: 5,
              validation: (Rule) => Rule.min(1).max(5),
            }),
            defineField({
              name: 'switchedFrom',
              title: 'Switched From (Optional)',
              type: 'string',
              description: 'e.g. "Switched from Square POS"',
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
        title: title || 'Testimonials Block',
        subtitle: subtitle ? `Testimonials • ${subtitle}` : 'Testimonials Block',
      }
    },
  },
})
