import type { CollectionConfig } from 'payload';
import { tenantAccess, publicOrTenantAccess } from '../access/tenantAccess';
import { setTenantBeforeChange } from '../hooks/tenantHooks';

export const Banners: CollectionConfig = {
  slug: 'banners',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'placement', 'organization', 'isActive'],
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
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'actionUrl',
      type: 'text',
    },
    {
      name: 'actionText',
      type: 'text',
    },
    {
      name: 'placement',
      type: 'select',
      defaultValue: 'top-bar',
      options: [
        { label: 'Top Notification Bar', value: 'top-bar' },
        { label: 'Hero Banner', value: 'hero' },
        { label: 'Footer Banner', value: 'footer' },
        { label: 'Popup Overlay', value: 'popup' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
