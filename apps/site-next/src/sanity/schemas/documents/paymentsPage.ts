import { defineField, defineType } from 'sanity'

export const paymentsPage = defineType({
  name: 'paymentsPage',
  title: 'Payments & Settlement Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Page Title',
      type: 'string',
      initialValue: 'Payments Infrastructure Page',
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
        defineField({ name: 'badge', title: 'Top Badge', type: 'string', initialValue: 'Omnichannel Payment Infrastructure • Sub-2s Settlement' }),
        defineField({ name: 'headline', title: 'Headline', type: 'string', initialValue: 'Unified Payment Processing & Automated Ledger Reconciliation' }),
        defineField({ name: 'subtitle', title: 'Subtitle Description', type: 'text', rows: 3, initialValue: 'Accept localized M-Pesa mobile payments, global credit cards, Apple Pay, and wire transfers directly inside your POS and checkout workflows with zero reconciliation friction.' }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Deploy Scale Workspace' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=scale&trial=true' }),
        defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Start Free Testing ($0/mo)' }),
        defineField({ name: 'secondaryCtaLink', title: 'Secondary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=free' }),
      ],
    }),
    defineField({
      name: 'channels',
      title: 'Supported Payment Channels',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Channel Title (e.g. Safaricom M-Pesa)', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'badge', title: 'Badge Label (e.g. STK Push / Paybill)', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
            defineField({ name: 'icon', title: 'Lucide Icon Name', type: 'string' }),
            defineField({
              name: 'highlights',
              title: 'Highlights / Features',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'settlementPoints',
      title: 'Settlement & Ledger Guarantees',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Guarantee Title', type: 'string' }),
            defineField({ name: 'description', title: 'Guarantee Description', type: 'text', rows: 2 }),
            defineField({ name: 'stat', title: 'Metric / SLA', type: 'string' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Payments Infrastructure Page',
        subtitle: '/payments Route Configuration',
      }
    },
  },
})
