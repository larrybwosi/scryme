import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'
import { structure } from './src/sanity/structure'

const rawProjectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || ''
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
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || 'production',
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
