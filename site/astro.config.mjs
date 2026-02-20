import {defineConfig} from 'astro/config'
import sanity from '@sanity/astro'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import node from '@astrojs/node'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  site: "https://midlandoilgroup.co.uk",
  markdown: {
    syntaxHighlight: false,
  },
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.PUBLIC_SANITY_DATASET,
      apiVersion: process.env.PUBLIC_SANITY_API_VERSION || '2025-02-01',
      useCdn: false,
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '^/studio(?:/.*)?$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
        '^/static(?:/.*)?$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
        '^/vendor(?:/.*)?$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
        '^/\\.sanity(?:/.*)?$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
        '^/sanity\\.config\\.(?:ts|js)$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
        '^/node_modules/\\.sanity(?:/.*)?$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
        '^/schemaTypes(?:/.*)?$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
        '^/lib/presentation(?:/.*)?$': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },
})
