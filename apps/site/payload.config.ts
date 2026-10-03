import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const MarketingPagesCollection = {
  slug: 'marketing-pages',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: ({ req }: any) => {
      const orgId = req.headers.get?.('x-organization-id') || req.user?.organizationId
      if (!orgId) return true // Public marketing pages can be viewed
      return {
        organizationId: {
          equals: orgId,
        },
      }
    },
    create: ({ req }: any) => {
      return Boolean(req.user?.organizationId || req.headers.get?.('x-organization-id'))
    },
    update: ({ req }: any) => {
      const orgId = req.headers.get?.('x-organization-id') || req.user?.organizationId
      if (!orgId) return false
      return {
        organizationId: {
          equals: orgId,
        },
      }
    },
    delete: ({ req }: any) => {
      const orgId = req.headers.get?.('x-organization-id') || req.user?.organizationId
      if (!orgId) return false
      return {
        organizationId: {
          equals: orgId,
        },
      }
    },
  },
  fields: [
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
      name: 'organizationId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Multi-tenant Scryme Organization ID owner',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'heroHeader',
      type: 'text',
    },
    {
      name: 'heroSubheader',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor(),
    },
    {
      name: 'featuredProducts',
      type: 'json',
      admin: {
        description: 'Array of featured product IDs and metadata for marketing showcase',
      },
    },
    {
      name: 'seoTitle',
      type: 'text',
    },
    {
      name: 'seoDescription',
      type: 'textarea',
    },
  ],
}

export const ProductCampaignsCollection = {
  slug: 'product-campaigns',
  admin: {
    useAsTitle: 'campaignName',
  },
  access: {
    read: ({ req }: any) => {
      const orgId = req.headers.get?.('x-organization-id') || req.user?.organizationId
      if (!orgId) return true
      return {
        organizationId: {
          equals: orgId,
        },
      }
    },
    create: ({ req }: any) => Boolean(req.user?.organizationId || req.headers.get?.('x-organization-id')),
    update: ({ req }: any) => {
      const orgId = req.headers.get?.('x-organization-id') || req.user?.organizationId
      if (!orgId) return false
      return { organizationId: { equals: orgId } }
    },
    delete: ({ req }: any) => {
      const orgId = req.headers.get?.('x-organization-id') || req.user?.organizationId
      if (!orgId) return false
      return { organizationId: { equals: orgId } }
    },
  },
  fields: [
    {
      name: 'campaignName',
      type: 'text',
      required: true,
    },
    {
      name: 'organizationId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'bannerHeadline',
      type: 'text',
      required: true,
    },
    {
      name: 'callToActionUrl',
      type: 'text',
    },
    {
      name: 'callToActionText',
      type: 'text',
    },
    {
      name: 'discountCode',
      type: 'text',
    },
    {
      name: 'activeFrom',
      type: 'date',
    },
    {
      name: 'activeUntil',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Expired', value: 'expired' },
      ],
    },
  ],
}

export const MarketingMediaCollection = {
  slug: 'marketing-media',
  upload: true,
  access: {
    read: () => true,
    create: ({ req }: any) => Boolean(req.user?.organizationId || req.headers.get?.('x-organization-id')),
    update: ({ req }: any) => Boolean(req.user?.organizationId || req.headers.get?.('x-organization-id')),
    delete: ({ req }: any) => Boolean(req.user?.organizationId || req.headers.get?.('x-organization-id')),
  },
  fields: [
    {
      name: 'altText',
      type: 'text',
      required: true,
    },
    {
      name: 'organizationId',
      type: 'text',
      required: true,
      index: true,
    },
  ],
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'scryme-payload-cms-secret-key-32-chars-min',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/scryme_db',
    },
  }),
  collections: [
    MarketingPagesCollection,
    ProductCampaignsCollection,
    MarketingMediaCollection,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
