import type { CollectionConfig } from 'payload';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    group: 'Administration',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.roles?.includes('admin') ?? false,
    update: ({ req }) => req.user?.roles?.includes('admin') ?? false,
    delete: ({ req }) => req.user?.roles?.includes('admin') ?? false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'domain',
      type: 'text',
      unique: true,
    },
    {
      name: 'logoUrl',
      type: 'text',
    },
    {
      name: 'isSuspended',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
};
