import type { CollectionConfig } from 'payload';
import { tenantAccess, publicOrTenantAccess } from '../access/tenantAccess';
import { setTenantBeforeChange } from '../hooks/tenantHooks';

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'organization', 'active', 'startDate', 'endDate'],
    group: 'Product Marketing',
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
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'bannerImage',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'discountText',
      type: 'text',
    },
    {
      name: 'targetAudience',
      type: 'text',
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'startDate',
      type: 'date',
    },
    {
      name: 'endDate',
      type: 'date',
    },
    {
      name: 'actionUrl',
      type: 'text',
    },
  ],
};
