import type { CollectionConfig } from 'payload';
import { tenantAccess, publicOrTenantAccess } from '../access/tenantAccess';
import { setTenantBeforeChange } from '../hooks/tenantHooks';

export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'organization', '_status', 'updatedAt'],
    group: 'Content Management',
  },
  access: {
    read: publicOrTenantAccess,
    create: tenantAccess,
    update: tenantAccess,
    delete: tenantAccess,
  },
  hooks: {
    beforeChange: [setTenantBeforeChange],
  },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'heading',
          type: 'text',
        },
        {
          name: 'subheading',
          type: 'textarea',
        },
        {
          name: 'heroImage',
          type: 'relationship',
          relationTo: 'media',
        },
        {
          name: 'primaryCtaText',
          type: 'text',
        },
        {
          name: 'primaryCtaLink',
          type: 'text',
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
        },
        {
          name: 'ogImage',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
  ],
};
