import { defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Internal Title',
      type: 'string',
      initialValue: 'Home Page',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
    // 1. Hero
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        defineField({ name: 'badge', title: 'Top Badge', type: 'string', initialValue: 'Scryme ERP OS v3.2 • Unified Operational Kernel' }),
        defineField({ name: 'nodeCounterText', title: 'Live Node Counter Text', type: 'string', initialValue: '180+ NODES SYNCHRONIZED' }),
        defineField({ name: 'headline', title: 'Headline', type: 'string', initialValue: 'Run your entire operation from one system.', validation: (Rule) => Rule.max(60) }),
        defineField({ name: 'subtitle', title: 'Subtitle Description', type: 'text', rows: 2, initialValue: 'Manage sales, inventory, customers, and payments without disconnected tools.', validation: (Rule) => Rule.max(140) }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Start 14-Day Trial' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true' }),
        defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Book a Demo' }),
        defineField({ name: 'secondaryCtaLink', title: 'Secondary CTA Link', type: 'string', initialValue: '/pricing' }),
        defineField({ name: 'heroImage', title: 'Hero Background Image', type: 'image' }),
        defineField({ name: 'heroImageUrlFallback', title: 'Fallback Image URL', type: 'url' }),
        defineField({ name: 'heroImageCaption', title: 'Image Overlay Caption', type: 'string', initialValue: 'Manage operations across every location', validation: (Rule) => Rule.max(80) }),
        defineField({ name: 'syncStateText', title: 'Sync State Text', type: 'string', initialValue: 'Live operations' }),
      ],
    }),
    // 2. Pillars
    defineField({
      name: 'pillarsSection',
      title: 'Architectural Pillars Section',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: '01 // Platform' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'One platform. Four connected capabilities.', validation: (Rule) => Rule.max(60) }),
        defineField({ name: 'description', title: 'Description', type: 'text', rows: 2, initialValue: 'Sales, inventory, customer relationships, and content stay connected in real time.', validation: (Rule) => Rule.max(140) }),
        defineField({
          name: 'pillars',
          title: 'Pillars List',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'label', title: 'Label (e.g. Pillar 01 / Commercial)', type: 'string' }),
                defineField({ name: 'badge', title: 'Badge (e.g. 12ms Ledger Settlement)', type: 'string' }),
                defineField({ name: 'stat', title: 'Metric Highlight (e.g. +42% Win-Rate Velocity)', type: 'string' }),
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'body', title: 'Body Copy', type: 'text', rows: 3 }),
                defineField({ name: 'cta', title: 'CTA Label', type: 'string' }),
                defineField({ name: 'href', title: 'CTA Destination', type: 'string' }),
              ],
            },
          ],
        }),
      ],
    }),
    // 3. Paradigm Shift
    defineField({
      name: 'paradigmSection',
      title: 'Paradigm Shift Section',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: '02 // Why Scryme' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'Stop losing time to disconnected systems.', validation: (Rule) => Rule.max(60) }),
        defineField({ name: 'description', title: 'Description', type: 'text', rows: 2, initialValue: 'When sales, stock, finance, and customer tools do not share data, teams spend their time checking, correcting, and waiting.', validation: (Rule) => Rule.max(140) }),
        defineField({ name: 'calloutTitle', title: 'Cost Box Title', type: 'string', initialValue: 'The cost of disconnected tools' }),
        defineField({ name: 'calloutDescription', title: 'Cost Box Description', type: 'text', rows: 2, initialValue: 'Businesses can spend $184,000 each year maintaining syncs and fixing mismatched records.', validation: (Rule) => Rule.max(140) }),
        defineField({ name: 'boardroomImage', title: 'Boardroom / Telemetry Image', type: 'image' }),
        defineField({ name: 'boardroomImageUrlFallback', title: 'Fallback Image URL', type: 'url' }),
        defineField({
          name: 'legacyItems',
          title: 'Legacy Pitfalls',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
              ],
            },
          ],
        }),
        defineField({
          name: 'kernelItems',
          title: 'Scryme Kernel Advantages',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
              ],
            },
          ],
        }),
      ],
    }),
    // 4. Metrics & Case Study
    defineField({
      name: 'metricsSection',
      title: 'Metrics & Spotlight Section',
      type: 'object',
      fields: [
        defineField({
          name: 'metrics',
          title: 'Key Metrics Grid',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'label', title: 'Label', type: 'string' }),
                defineField({ name: 'value', title: 'Value', type: 'string' }),
                defineField({ name: 'description', title: 'Description', type: 'string' }),
              ],
            },
          ],
        }),
        defineField({
          name: 'spotlight',
          title: 'Customer Spotlight',
          type: 'object',
          fields: [
            defineField({ name: 'badge', title: 'Badge', type: 'string', initialValue: 'Customer Story' }),
            defineField({ name: 'company', title: 'Company Name', type: 'string', initialValue: 'Veloce Global Logistics AG' }),
            defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 3 }),
            defineField({ name: 'authorName', title: 'Author Name', type: 'string', initialValue: 'Elena Rostova' }),
            defineField({ name: 'authorRole', title: 'Author Title', type: 'string', initialValue: 'Chief Operating Officer, Veloce Global Logistics' }),
            defineField({
              name: 'deploymentStats',
              title: 'Deployment Stats Summary',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({ name: 'label', title: 'Metric Label', type: 'string' }),
                    defineField({ name: 'value', title: 'Metric Value', type: 'string' }),
                  ],
                },
              ],
            }),
            defineField({ name: 'caseStudyLink', title: 'Case Study URL', type: 'string', initialValue: '/crm' }),
          ],
        }),
      ],
    }),
    // 5. FAQs
    defineField({
      name: 'faqsSection',
      title: 'Frequently Asked Questions',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: '03 // Common Questions' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'Frequently asked questions', validation: (Rule) => Rule.max(60) }),
        defineField({
          name: 'faqs',
          title: 'FAQ List',
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
    }),
    // 6. Bottom CTA
    defineField({
      name: 'bottomCta',
      title: 'Bottom Conversion CTA',
      type: 'object',
      fields: [
        defineField({ name: 'badge', title: 'Badge', type: 'string', initialValue: 'Get started' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'Start running your operation in sync.', validation: (Rule) => Rule.max(60) }),
        defineField({ name: 'subtitle', title: 'Subtitle Description', type: 'text', rows: 2, initialValue: 'Try Scryme free for 14 days, or speak with our team about your needs.', validation: (Rule) => Rule.max(140) }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Start 14-Day Trial' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true' }),
        defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Book a Demo' }),
        defineField({ name: 'secondaryCtaLink', title: 'Secondary CTA Link', type: 'string', initialValue: 'mailto:enterprise@scryme.tech' }),
        defineField({
          name: 'guarantees',
          title: 'Trust Badges / Guarantees',
          type: 'array',
          of: [{ type: 'string' }],
          initialValue: ['NO EXTRA CONNECTORS', 'REGIONAL HOSTING', '99.999% AVAILABILITY'],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Home Page Configuration',
        subtitle: 'Landing page hero, pillars, metrics & FAQ',
      }
    },
  },
})
