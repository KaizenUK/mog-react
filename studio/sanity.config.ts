import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'
import {locations, mainDocuments} from './lib/presentation/resolve'
import { assist } from '@sanity/assist'

console.log(process.env.SANITY_STUDIO_PROJECT_ID)

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
        draftMode: {
          enable: 'http://localhost:4321/api/draft-mode?action=enable',
        },
      },
      resolve: {locations, mainDocuments},
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
