import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings & Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      initialValue: 'Scryme - Next-Gen ERP Platform',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site Default Meta Description',
      type: 'text',
      rows: 3,
      initialValue: 'Sub-second ERP operating kernel coordinating sales velocity, multi-node inventories, 360° relationship intelligence, and decoupled catalog engines.',
    }),
    defineField({
      name: 'announcementBanner',
      title: 'Announcement Banner',
      type: 'object',
      fields: [
        defineField({ name: 'enabled', title: 'Show Banner', type: 'boolean', initialValue: false }),
        defineField({ name: 'text', title: 'Banner Text', type: 'string' }),
        defineField({ name: 'linkText', title: 'Link Text', type: 'string' }),
        defineField({ name: 'linkUrl', title: 'Link Destination', type: 'string' }),
      ],
    }),
    defineField({
      name: 'navItems',
      title: 'Header Navigation Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Menu Label', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'href', title: 'Link Destination (e.g. /pricing, /sales)', type: 'string' }),
            defineField({ name: 'isExternal', title: 'Open in new tab', type: 'boolean', initialValue: false }),
            defineField({
              name: 'children',
              title: 'Submenu Dropdown Items (Optional)',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({ name: 'label', title: 'Submenu Label', type: 'string', validation: (Rule) => Rule.required() }),
                    defineField({ name: 'description', title: 'Short description', type: 'string' }),
                    defineField({ name: 'href', title: 'Link URL', type: 'string', validation: (Rule) => Rule.required() }),
                    defineField({ name: 'badge', title: 'Badge tag (e.g. New)', type: 'string' }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'headerCtas',
      title: 'Header Action Buttons',
      type: 'object',
      fields: [
        defineField({
          name: 'loginLabel',
          title: 'Sign In Button Label',
          type: 'string',
          initialValue: 'Log In',
        }),
        defineField({
          name: 'loginUrl',
          title: 'Sign In URL',
          type: 'string',
          initialValue: 'https://app.scryme.tech/login',
        }),
        defineField({
          name: 'primaryCtaLabel',
          title: 'Primary CTA Button Label',
          type: 'string',
          initialValue: 'Start 14-Day Trial',
        }),
        defineField({
          name: 'primaryCtaUrl',
          title: 'Primary CTA Destination',
          type: 'string',
          initialValue: 'https://app.scryme.tech/signup?plan=scale&trial=true',
        }),
      ],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer Columns',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Column Header', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({
              name: 'links',
              title: 'Column Links',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({ name: 'label', title: 'Link Label', type: 'string', validation: (Rule) => Rule.required() }),
                    defineField({ name: 'href', title: 'Destination URL', type: 'string', validation: (Rule) => Rule.required() }),
                    defineField({ name: 'badge', title: 'Badge Label (Optional)', type: 'string' }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Media Profiles',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'platform', title: 'Platform (GitHub, Twitter, LinkedIn)', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'url', title: 'Profile URL', type: 'url', validation: (Rule) => Rule.required() }),
          ],
        },
      ],
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright Notice',
      type: 'string',
      initialValue: '© 2026 Scryme Systems Inc. All rights reserved.',
    }),
  ],
  preview: {
    select: {
      title: 'siteTitle',
    },
    prepare({ title }) {
      return {
        title: title || 'Site Settings & Navigation',
        subtitle: 'Global header, footer, metadata & actions',
      }
    },
  },
})
