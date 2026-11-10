import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'
import { structure } from './src/sanity/structure'

const rawProjectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.VITE_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  ''

const projectId =
  rawProjectId &&
  rawProjectId !== 'placeholder-project-id' &&
  rawProjectId !== 'placeholder_project_id'
    ? rawProjectId
    : 'unconfigured-project-id'

const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.VITE_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SITE_SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  'production'

export default defineConfig({
  name: 'default',
  title: 'Scryme Site Studio',
  projectId: '25pbas6k',
  dataset,
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
