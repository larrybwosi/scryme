import { defineField, defineType } from 'sanity'

export const crmPage = defineType({
  name: 'crmPage',
  title: '360° Relationship CRM Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Page Title',
      type: 'string',
      initialValue: 'CRM Page',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        defineField({ name: 'badge', title: 'Top Badge', type: 'string', initialValue: '360° Relationship CRM • Enterprise Graph' }),
        defineField({ name: 'headline', title: 'Headline', type: 'string', initialValue: 'Real-Time Customer Graph Driven by Operational Truth' }),
        defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 3, initialValue: 'Bridge commercial pipelines, account health metrics, billing status, and warehouse fulfillments into one unified customer graph. Prevent churn before it happens.' }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Start 14-Day Free Trial' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=growth&trial=true' }),
        defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Book Enterprise Demo' }),
        defineField({ name: 'secondaryCtaLink', title: 'Secondary CTA Link', type: 'string', initialValue: '/pricing' }),
      ],
    }),
    defineField({
      name: 'features',
      title: 'CRM Capabilities Grid',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'icon', title: 'Lucide Icon', type: 'string' }),
            defineField({ name: 'title', title: 'Capability Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'description', title: 'Capability Description', type: 'text', rows: 3 }),
            defineField({ name: 'metricBadge', title: 'Metric Highlight (Optional)', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'testimonials',
      title: 'Customer Feedback & Stories',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 3 }),
            defineField({ name: 'authorName', title: 'Customer Name', type: 'string' }),
            defineField({ name: 'authorRole', title: 'Role / Title', type: 'string' }),
            defineField({ name: 'company', title: 'Company Name', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'bottomCta',
      title: 'Bottom CTA Banner',
      type: 'object',
      fields: [
        defineField({ name: 'badge', title: 'Badge', type: 'string', initialValue: 'Accelerate Growth' }),
        defineField({ name: 'title', title: 'Title', type: 'string', initialValue: 'Turn customer interactions into lasting enterprise relationships' }),
        defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2, initialValue: 'Experience CRM seamlessly interwoven with inventory, finance, and POS.' }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Deploy Growth Workspace' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=growth' }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || '360° Relationship CRM',
        subtitle: '/crm Route Configuration',
      }
    },
  },
})
