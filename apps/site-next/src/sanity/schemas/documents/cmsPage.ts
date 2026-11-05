import { defineField, defineType } from 'sanity'

export const cmsPage = defineType({
  name: 'cmsPage',
  title: 'Headless CMS & Catalog Cloud Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Page Title',
      type: 'string',
      initialValue: 'Headless CMS Page',
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
        defineField({ name: 'badge', title: 'Top Badge', type: 'string', initialValue: 'Headless CMS & Catalog Cloud • v3.4' }),
        defineField({ name: 'headline', title: 'Headline', type: 'string', initialValue: 'Single-Source Content & Dynamic Catalog Mesh' }),
        defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 3, initialValue: 'Synchronize localized merchandising, multi-brand marketing copy, and real-time inventory pricing directly from your ERP core to any frontend framework.' }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Deploy Free Workspace' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=free' }),
        defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Explore Catalog APIs' }),
        defineField({ name: 'secondaryCtaLink', title: 'Secondary CTA Link', type: 'string', initialValue: '/developers/apps' }),
      ],
    }),
    defineField({
      name: 'features',
      title: 'CMS Feature Grid',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'icon', title: 'Icon Name', type: 'string' }),
            defineField({ name: 'title', title: 'Feature Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'description', title: 'Feature Description', type: 'text', rows: 3 }),
            defineField({ name: 'badge', title: 'Badge Tag', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'architecturePoints',
      title: 'Architecture & Engine Highlights',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Highlight Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
            defineField({ name: 'codeSnippet', title: 'Code Example (GraphQL / JSON)', type: 'text', rows: 4 }),
          ],
        },
      ],
    }),
    defineField({
      name: 'bottomCta',
      title: 'Bottom CTA Banner',
      type: 'object',
      fields: [
        defineField({ name: 'badge', title: 'Badge', type: 'string', initialValue: 'Omnichannel Publishing' }),
        defineField({ name: 'title', title: 'Title', type: 'string', initialValue: 'Power your storefronts with live ERP content' }),
        defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2, initialValue: 'Zero headless disconnects. Build fast, scalable commerce experiences with Scryme.' }),
        defineField({ name: 'primaryCtaText', title: 'Primary CTA Text', type: 'string', initialValue: 'Get Started with Free Tier' }),
        defineField({ name: 'primaryCtaLink', title: 'Primary CTA Link', type: 'string', initialValue: 'https://app.scryme.tech/signup?plan=free' }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Headless CMS & Catalog Cloud',
        subtitle: '/cms Route Configuration',
      }
    },
  },
})
