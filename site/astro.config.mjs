import {defineConfig} from 'astro/config'
import sanity from '@sanity/astro'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  markdown: {
    syntaxHighlight: false,
  },
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.PUBLIC_SANITY_DATASET,
      apiVersion: process.env.PUBLIC_SANITY_API_VERSION || '2025-02-01',
      useCdn: true,
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
