import { createClient, type SanityClient } from '@sanity/client'

const rawProjectId = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const hasValidProjectId =
  Boolean(rawProjectId) &&
  rawProjectId !== 'placeholder-project-id' &&
  rawProjectId !== 'placeholder_project_id'

export const sanityConfig = hasValidProjectId
  ? {
      projectId: rawProjectId!,
      dataset: process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: process.env.NODE_ENV === 'production',
    }
  : null

export const sanityClient: SanityClient | null = sanityConfig
  ? createClient(sanityConfig)
  : null
