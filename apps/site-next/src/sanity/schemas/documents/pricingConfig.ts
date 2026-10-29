import { defineField, defineType } from 'sanity'

export const pricingConfig = defineType({
  name: 'pricingConfig',
  title: 'Pricing Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Configuration Title',
      type: 'string',
      initialValue: 'Global Site Pricing Configuration',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroBadge',
      title: 'Hero Badge Text',
      type: 'string',
      initialValue: '14-Day Free Trial • Instant Deployment • Zero Risk',
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Main Headline',
      type: 'string',
      initialValue: 'Predictable Pricing Engineered for Limitless Enterprise Scale',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle Description',
      type: 'text',
      rows: 3,
      initialValue: 'No per-user penalties or hidden seat taxes. Unify your operational software stack under one transparent, telemetry-based billing model.',
    }),
    defineField({
      name: 'currencies',
      title: 'Currency Pricing Configurations',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'currencyConfig',
          fields: [
            defineField({ name: 'code', title: 'Currency Code (e.g. USD, KSH, EUR)', type: 'string' }),
            defineField({ name: 'symbol', title: 'Currency Symbol (e.g. $, KSh , €)', type: 'string' }),
            defineField({ name: 'name', title: 'Display Name (e.g. KSh (M-Pesa))', type: 'string' }),
            defineField({ name: 'badge', title: 'Currency Badge Label', type: 'string' }),
            defineField({
              name: 'free',
              title: 'Free Plan Pricing',
              type: 'object',
              fields: [
                defineField({
                  name: 'monthly',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                  ],
                }),
                defineField({
                  name: 'annual',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                    defineField({ name: 'billedNote', type: 'string' }),
                  ],
                }),
              ],
            }),
            defineField({
              name: 'growth',
              title: 'Growth Plan Pricing',
              type: 'object',
              fields: [
                defineField({
                  name: 'monthly',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                  ],
                }),
                defineField({
                  name: 'annual',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                    defineField({ name: 'billedNote', type: 'string' }),
                  ],
                }),
              ],
            }),
            defineField({
              name: 'scale',
              title: 'Scale Plan Pricing',
              type: 'object',
              fields: [
                defineField({
                  name: 'monthly',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                  ],
                }),
                defineField({
                  name: 'annual',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                    defineField({ name: 'billedNote', type: 'string' }),
                  ],
                }),
              ],
            }),
            defineField({
              name: 'enterprise',
              title: 'Enterprise Plan Pricing',
              type: 'object',
              fields: [
                defineField({
                  name: 'monthly',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                  ],
                }),
                defineField({
                  name: 'annual',
                  type: 'object',
                  fields: [
                    defineField({ name: 'amount', type: 'string' }),
                    defineField({ name: 'period', type: 'string' }),
                    defineField({ name: 'billedNote', type: 'string' }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'Frequently Asked Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'q', title: 'Question', type: 'string' }),
            defineField({ name: 'a', title: 'Answer', type: 'text', rows: 3 }),
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
        title: title || 'Pricing Configuration',
        subtitle: 'Site Pricing & Billing Tiers',
      }
    },
  },
})
