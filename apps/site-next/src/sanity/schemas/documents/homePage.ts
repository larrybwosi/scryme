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
        defineField({ name: 'headline', title: 'Headline', type: 'string', initialValue: 'Can one smarter engine scale your entire enterprise?' }),
        defineField({ name: 'subtitle', title: 'Subtitle Description', type: 'text', rows: 3, initialValue: 'Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship intelligence, and decoupled catalog engines across an immutable sub-millisecond mesh. Zero fragmented connectors.' }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Start 14-Day Enterprise Trial' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true' }),
        defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Schedule Enterprise Demo' }),
        defineField({ name: 'secondaryCtaLink', title: 'Secondary CTA Link', type: 'string', initialValue: '/pricing' }),
        defineField({ name: 'heroImage', title: 'Hero Background Image', type: 'image' }),
        defineField({ name: 'heroImageUrlFallback', title: 'Fallback Image URL', type: 'url' }),
        defineField({ name: 'heroImageCaption', title: 'Image Overlay Caption', type: 'string', initialValue: 'Autonomous Global Operations Command • Sub-12ms Telemetry Fabric across 180+ Enterprise Nodes' }),
        defineField({ name: 'syncStateText', title: 'Sync State Text', type: 'string', initialValue: '0.008s Consensus' }),
      ],
    }),
    // 2. Pillars
    defineField({
      name: 'pillarsSection',
      title: 'Architectural Pillars Section',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: '01 // Architectural Pillars' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'Four specialized engines. Zero operational friction.' }),
        defineField({ name: 'description', title: 'Description', type: 'text', rows: 2, initialValue: 'Explore the modular, single-state systems powering multinational enterprises. Every action updates the kernel in sub-millisecond real time.' }),
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
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: '02 // Paradigm Shift' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'Stop paying the middleware tax on broken operational data.' }),
        defineField({ name: 'description', title: 'Description', type: 'text', rows: 2, initialValue: 'Enterprise systems failed because they bolted isolated SaaS point solutions together with duct-tape webhooks. When data is replicated across 9 different vendors, truth becomes obsolete within 15 minutes.' }),
        defineField({ name: 'calloutTitle', title: 'Cost Box Title', type: 'string', initialValue: 'The True Cost of Legacy SaaS Sprawl' }),
        defineField({ name: 'calloutDescription', title: 'Cost Box Description', type: 'text', rows: 2, initialValue: 'The average $100M+ enterprise spends $184,000 annually maintaining API sync scripts, reconciling ledger mismatches, and investigating phantom inventory orders.' }),
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
            defineField({ name: 'badge', title: 'Badge', type: 'string', initialValue: 'Customer Spotlight' }),
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
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: '03 // Architectural Inquiries' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'Frequently asked questions by enterprise engineering & leadership' }),
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
        defineField({ name: 'badge', title: 'Badge', type: 'string', initialValue: 'Autonomous Enterprise Orchestration' }),
        defineField({ name: 'title', title: 'Headline', type: 'string', initialValue: 'Reclaim command of your global operations today.' }),
        defineField({ name: 'subtitle', title: 'Subtitle Description', type: 'text', rows: 2, initialValue: 'Speak directly with a Principal Enterprise Solutions Architect or spin up an isolated staging sandbox loaded with your sample catalog and node taxonomy.' }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Start 14-Day Enterprise Trial' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=scale&billing=annual&trial=true' }),
        defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Schedule Architecture Review' }),
        defineField({ name: 'secondaryCtaLink', title: 'Secondary CTA Link', type: 'string', initialValue: '/pricing' }),
        defineField({
          name: 'guarantees',
          title: 'Trust Badges / Guarantees',
          type: 'array',
          of: [{ type: 'string' }],
          initialValue: ['NO LEGACY CONNECTORS NEEDED', 'DEDICATED SOVEREIGN HOSTING', '99.999% RUNTIME SLA'],
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
