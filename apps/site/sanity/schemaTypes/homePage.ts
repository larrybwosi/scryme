import { defineArrayMember, defineField, defineType } from 'sanity'

export const homePageType = defineType({
  name: 'homePage',
  title: 'Home Page',
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
      name: 'heroImage',
      title: 'Hero Visual Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          description: 'Alternative text for SEO and accessibility.',
        }),
      ],
    }),
    defineField({
      name: 'reconciledToday',
      title: 'Reconciled Today Target Value',
      type: 'number',
    }),
    defineField({
      name: 'brands',
      title: 'Brands (Trust Bar)',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'modules',
      title: 'Modules (The Manifest)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'moduleItem',
          fields: [
            defineField({ name: 'code', title: 'Code', type: 'string' }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text' }),
            defineField({
              name: 'image',
              title: 'Module Image',
              type: 'image',
              options: {
                hotspot: true,
              },
              fields: [
                defineField({
                  name: 'alt',
                  type: 'string',
                  title: 'Alternative text',
                  description: 'Alternative text for SEO and accessibility.',
                }),
              ],
            }),
            defineField({
              name: 'connectsTo',
              title: 'Connects To',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
            }),
            defineField({ name: 'href', title: 'Href', type: 'string' }),
            defineField({ name: 'accent', title: 'Accent Color', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Stats (Stats Strip)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'statItem',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string' }),
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'sublabel', title: 'Sublabel', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'testimonialItem',
          fields: [
            defineField({ name: 'quote', title: 'Quote', type: 'text' }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'company', title: 'Company', type: 'string' }),
            defineField({ name: 'ticker', title: 'Ticker', type: 'string' }),
            defineField({ name: 'initials', title: 'Initials', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'storefrontTitle',
      title: 'Storefront Solution Title',
      type: 'string',
    }),
    defineField({
      name: 'storefrontSubtitle',
      title: 'Storefront Solution Subtitle',
      type: 'text',
    }),
    defineField({
      name: 'storefrontImage',
      title: 'Storefront Solution Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }),
      ],
    }),
    defineField({
      name: 'multiBranchTitle',
      title: 'Multi-Branch Orchestration Title',
      type: 'string',
    }),
    defineField({
      name: 'multiBranchSubtitle',
      title: 'Multi-Branch Orchestration Subtitle',
      type: 'text',
    }),
    defineField({
      name: 'multiBranchImage',
      title: 'Multi-Branch Orchestration Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }),
      ],
    }),
    defineField({
      name: 'stockManagementTitle',
      title: 'Stock Management Title',
      type: 'string',
    }),
    defineField({
      name: 'stockManagementSubtitle',
      title: 'Stock Management Subtitle',
      type: 'text',
    }),
    defineField({
      name: 'stockManagementImage',
      title: 'Stock Management Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }),
      ],
    }),
  ],
})
