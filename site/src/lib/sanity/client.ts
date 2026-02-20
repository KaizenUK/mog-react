import {createClient} from '@sanity/client'

const projectId =
  import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID
const dataset =
  import.meta.env.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET
const apiVersion =
  import.meta.env.PUBLIC_SANITY_API_VERSION ??
  process.env.PUBLIC_SANITY_API_VERSION ??
  '2025-02-01'

if (!projectId) throw new Error('Missing SANITY projectId (PUBLIC_SANITY_PROJECT_ID)')
if (!dataset) throw new Error('Missing SANITY dataset (PUBLIC_SANITY_DATASET)')

const isDev = import.meta.env.DEV

/** Standard client — CDN-backed, published perspective */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: !isDev,
  perspective: isDev ? 'drafts' : 'published',
  stega: isDev
    ? {
        enabled: true,
        studioUrl: '/studio',
      }
    : undefined,
})

/**
 * Stega client — used in draft/preview mode.
 * Strings include invisible stega markers so the visual editing
 * overlay knows which Studio document/field each value belongs to.
 */
export const stegaClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'drafts',
  stega: {
    enabled: true,
    studioUrl: '/studio',
  },
})

/**
 * Returns the appropriate client for the current request.
 * Pass `draftMode = true` (read from the draft-mode cookie)
 * to get the stega/previewDrafts client; otherwise returns
 * the standard published client.
 */
export function getClient(draftMode = false) {
  return draftMode ? stegaClient : sanityClient
}
