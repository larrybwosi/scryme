import { createClient } from '@sanity/client'

export const sanityConfig = {
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'placeholder_project_id',
  dataset: process.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
}

export const sanityClient = createClient(sanityConfig)
