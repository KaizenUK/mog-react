import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'
import {locations, mainDocuments} from './lib/presentation/resolve'

export default defineConfig({
  name: 'default',
  title: 'MOG',

  projectId: 'kq3z2s2d',
  dataset: 'production',
  basePath: '/studio',

  plugins: [
    structureTool(),
    visionTool(),
    presentationTool({
      previewUrl: {initial: 'http://localhost:4321'},
      allowOrigins: ['http://localhost:*'],
      resolve: {locations, mainDocuments},
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
