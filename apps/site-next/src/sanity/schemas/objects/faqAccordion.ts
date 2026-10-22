import { defineField, defineType } from 'sanity'

export const faqAccordionBlock = defineType({
  name: 'faqAccordionBlock',
  title: 'FAQ Accordion',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Eyebrow Badge',
      type: 'string',
      initialValue: 'Frequently Asked Questions',
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Got Questions? We Have Answers',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'faqs',
      title: 'Questions & Answers',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faq',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 4,
              validation: (Rule) => Rule.required(),
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
        title: title || 'FAQ Accordion',
        subtitle: subtitle ? `FAQ • ${subtitle}` : 'FAQ Accordion',
      }
    },
  },
})
