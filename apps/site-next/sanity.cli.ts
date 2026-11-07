import { defineCliConfig } from 'sanity/cli'
import { env } from '@repo/env'

export default defineCliConfig({
  api: {
    projectId:
      env.SANITY_STUDIO_PROJECT_ID ||
      env.VITE_SANITY_PROJECT_ID ||
      env.SANITY_PROJECT_ID ||
      env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID,
    dataset:
      env.SANITY_STUDIO_DATASET ||
      env.VITE_SANITY_DATASET ||
      env.SANITY_DATASET ||
      env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
      'production',
  },
})
