import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'
import { structure } from './src/sanity/structure'
import { env } from '@repo/env'

const rawProjectId =
  env.SANITY_STUDIO_PROJECT_ID ||
  env.VITE_SANITY_PROJECT_ID ||
  env.SANITY_PROJECT_ID ||
  env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID ||
  ''
const projectId =
  rawProjectId &&
  rawProjectId !== 'placeholder-project-id' &&
  rawProjectId !== 'placeholder_project_id'
    ? rawProjectId
    : 'unconfigured-project-id'

export default defineConfig({
  name: 'default',
  title: 'Scryme Site Studio',
  projectId,
  dataset:
    env.SANITY_STUDIO_DATASET ||
    env.VITE_SANITY_DATASET ||
    env.SANITY_DATASET ||
    env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
    'production',
  basePath: '/studio',
  plugins: [
    structureTool({
      structure,
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
