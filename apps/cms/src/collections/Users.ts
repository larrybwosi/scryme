import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Administration',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['member'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Member', value: 'member' },
      ],
    },
    {
      name: 'organizations',
      type: 'array',
      fields: [
        {
          name: 'organization',
          type: 'relationship',
          relationTo: 'tenants',
          required: true,
        },
        {
          name: 'role',
          type: 'select',
          defaultValue: 'MEMBER',
          options: [
            { label: 'Owner', value: 'OWNER' },
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Manager', value: 'MANAGER' },
            { label: 'Member', value: 'MEMBER' },
          ],
        },
      ],
    },
  ],
};
