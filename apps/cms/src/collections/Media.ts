import type { CollectionConfig } from 'payload';
import { tenantAccess } from '../access/tenantAccess';
import { setTenantBeforeChange } from '../hooks/tenantHooks';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 432,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
  },
  admin: {
    useAsTitle: 'filename',
    group: 'Product Marketing',
  },
  access: {
    read: () => true, // Publicly readable media assets
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
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
};
