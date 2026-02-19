import {createClient} from '@sanity/client'

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID
const dataset = import.meta.env.PUBLIC_SANITY_DATASET
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2025-02-01'

if (!projectId) throw new Error('Missing PUBLIC_SANITY_PROJECT_ID')
if (!dataset) throw new Error('Missing PUBLIC_SANITY_DATASET')

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // ✅ cached + cheap for public
  perspective: 'published', // ✅ avoids drafts unless you explicitly opt in
})
