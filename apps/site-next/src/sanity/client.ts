import { createClient, type SanityClient } from '@sanity/client'
import { env } from '@repo/env'

const rawProjectId =
  env.SANITY_PROJECT_ID ||
  env.SANITY_STUDIO_PROJECT_ID ||
  env.VITE_SANITY_PROJECT_ID ||
  env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID
const hasValidProjectId =
  Boolean(rawProjectId) &&
  rawProjectId !== 'placeholder-project-id' &&
  rawProjectId !== 'placeholder_project_id'

export const sanityConfig = hasValidProjectId
  ? {
      projectId: rawProjectId!,
      dataset:
        env.SANITY_DATASET ||
        env.SANITY_STUDIO_DATASET ||
        env.VITE_SANITY_DATASET ||
        env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
        'production',
      apiVersion: '2024-01-01',
      useCdn: env.NODE_ENV === 'production',
    }
  : null

export const sanityClient: SanityClient | null = sanityConfig
  ? createClient(sanityConfig)
  : null
