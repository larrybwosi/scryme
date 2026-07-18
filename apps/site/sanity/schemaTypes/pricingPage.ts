import { defineArrayMember, defineField, defineType } from 'sanity'

export const pricingPageType = defineType({
  name: 'pricingPage',
  title: 'Pricing Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
    }),
    defineField({
      name: 'plans',
      title: 'Pricing Plans',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'planItem',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'price', title: 'Price', type: 'string' }),
            defineField({ name: 'period', title: 'Period', type: 'string' }),
            defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
            defineField({ name: 'cta', title: 'CTA Label', type: 'string' }),
            defineField({ name: 'href', title: 'CTA Link', type: 'string' }),
            defineField({ name: 'highlight', title: 'Highlight Plan', type: 'boolean' }),
            defineField({ name: 'badge', title: 'Badge Label (Optional)', type: 'string' }),
            defineField({
              name: 'features',
              title: 'Features List',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'comparisonRows',
      title: 'Feature Comparison Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'comparisonRowItem',
          fields: [
            defineField({ name: 'feature', title: 'Feature Name', type: 'string' }),
            defineField({ name: 'starter', title: 'Starter Value', type: 'string' }),
            defineField({ name: 'growth', title: 'Growth Value', type: 'string' }),
            defineField({ name: 'enterprise', title: 'Enterprise Value', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'q', title: 'Question', type: 'string' }),
            defineField({ name: 'a', title: 'Answer', type: 'text' }),
          ],
        }),
      ],
    }),
  ],
})
