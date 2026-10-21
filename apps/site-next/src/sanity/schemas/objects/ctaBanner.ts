import { defineField, defineType } from 'sanity'

export const ctaBannerBlock = defineType({
  name: 'ctaBannerBlock',
  title: 'Call to Action Banner',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Highlight Badge',
      type: 'string',
      initialValue: 'Ready to Switch?',
    }),
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
      initialValue: 'Start simplifying your business operations today',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle / Details',
      type: 'text',
      rows: 2,
      initialValue: 'No credit card required. Instant 14-day full access trial.',
    }),
    defineField({
      name: 'primaryCtaText',
      title: 'Primary CTA Text',
      type: 'string',
      initialValue: 'Start 14-Day Free Trial',
    }),
    defineField({
      name: 'primaryCtaLink',
      title: 'Primary CTA Link',
      type: 'string',
      initialValue: 'https://app.scryme.tech/signup',
    }),
    defineField({
      name: 'secondaryCtaText',
      title: 'Secondary CTA Text',
      type: 'string',
      initialValue: 'Contact Sales',
    }),
    defineField({
      name: 'secondaryCtaLink',
      title: 'Secondary CTA Link',
      type: 'string',
      initialValue: 'mailto:sales@scryme.tech',
    }),
    defineField({
      name: 'theme',
      title: 'Visual Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Accent Lime Glow', value: 'lime' },
          { title: 'Dark Slate Premium', value: 'dark' },
          { title: 'Gradient Enterprise', value: 'gradient' },
        ],
      },
      initialValue: 'lime',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'badge',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'CTA Banner',
        subtitle: subtitle ? `CTA • ${subtitle}` : 'CTA Banner',
      }
    },
  },
})
