import { createClient } from '@sanity/client'
import { env } from '@repo/env'

const SANITY_REQUEST_TIMEOUT_MS = 2_000
const DEFAULT_SANITY_PROJECT_ID = '25pbas6k'

const rawProjectId =
  env.SANITY_PROJECT_ID ||
  env.SANITY_STUDIO_PROJECT_ID ||
  env.VITE_SANITY_PROJECT_ID

const projectId =
  rawProjectId &&
  rawProjectId !== 'placeholder-project-id' &&
  rawProjectId !== 'placeholder_project_id'
    ? rawProjectId
    : DEFAULT_SANITY_PROJECT_ID

export const sanityConfig = {
  projectId,
  dataset:
    env.SANITY_DATASET ||
    env.SANITY_STUDIO_DATASET ||
    env.VITE_SANITY_DATASET ||
    env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
    'production',
  apiVersion: '2024-01-01',
  useCdn: env.NODE_ENV === 'production',
  timeout: SANITY_REQUEST_TIMEOUT_MS,
  maxRetries: 0,
}

export const sanityClient = createClient(sanityConfig)
