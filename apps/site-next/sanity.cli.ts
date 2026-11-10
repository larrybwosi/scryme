import { defineCliConfig } from 'sanity/cli'

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.VITE_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID

const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.VITE_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  'production'

export default defineCliConfig({
  api: {
    projectId:'25pbas6k',
    dataset,
  },
})
