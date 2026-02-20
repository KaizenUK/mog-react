import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'
import {locations, mainDocuments} from './lib/presentation/resolve'
import { assist } from '@sanity/assist'

export default defineConfig({
  name: 'default',
  title: 'MOG',

  projectId: 'kq3z2s2d',
  dataset: 'production',
  basePath: '/studio',

  plugins: [
    structureTool(),
    visionTool(),
     assist(),
    presentationTool({
      previewUrl: {
        initial: 'http://localhost:4321',
        previewMode: {
          enable: 'http://localhost:4321/api/draft-mode',
          disable: 'http://localhost:4321/api/draft-mode?action=disable',
        },
      },
      resolve: {locations, mainDocuments},
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
