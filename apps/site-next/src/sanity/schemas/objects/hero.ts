import { defineField, defineType } from 'sanity'

export const heroBlock = defineType({
  name: 'heroBlock',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Badge / Eyebrow Text',
      type: 'string',
      description: 'Small Pill text above title (e.g., "Scryme vs Square")',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle / Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'primaryCtaText',
      title: 'Primary CTA Text',
      type: 'string',
      initialValue: 'Start Free Trial',
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
      initialValue: 'Book Demo',
    }),
    defineField({
      name: 'secondaryCtaLink',
      title: 'Secondary CTA Link',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Hero Image / Graphic',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'ratingText',
      title: 'Rating / Social Proof Subtext',
      type: 'string',
      description: 'e.g., "Rated 4.9/5 by 500+ enterprises across East Africa"',
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      subtitle: 'badge',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Hero Block',
        subtitle: subtitle ? `Hero • ${subtitle}` : 'Hero Block',
        media,
      }
    },
  },
})
