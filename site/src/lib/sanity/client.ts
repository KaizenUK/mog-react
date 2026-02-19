import {createClient} from '@sanity/client'

const projectId =
  import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID
const dataset =
  import.meta.env.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET
const apiVersion =
  import.meta.env.PUBLIC_SANITY_API_VERSION ??
  process.env.PUBLIC_SANITY_API_VERSION ??
  '2025-02-01'

// Helpful debug (remove once working)
console.log('[sanity] env', {projectId, dataset, apiVersion})

if (!projectId) throw new Error('Missing SANITY projectId (PUBLIC_SANITY_PROJECT_ID)')
if (!dataset) throw new Error('Missing SANITY dataset (PUBLIC_SANITY_DATASET)')

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})
