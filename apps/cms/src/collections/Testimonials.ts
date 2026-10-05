import type { CollectionConfig } from 'payload';
import { tenantAccess, publicOrTenantAccess } from '../access/tenantAccess';
import { setTenantBeforeChange } from '../hooks/tenantHooks';

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'company', 'organization', 'rating', 'isFeatured'],
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
      name: 'customerName',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'avatar',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
};
