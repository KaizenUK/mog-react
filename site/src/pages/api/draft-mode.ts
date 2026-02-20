/**
 * /api/draft-mode
 *
 * Toggles Sanity draft/preview mode via a cookie.
 * The Sanity Presentation tool calls ?action=enable when opening a preview,
 * and ?action=disable to exit.
 *
 * Usage:
 *   /api/draft-mode?action=enable&redirect=/
 *   /api/draft-mode?action=disable&redirect=/
 */

// This endpoint must be server-rendered (not pre-rendered at build time)
export const prerender = false

import type { APIRoute } from 'astro'

const COOKIE_NAME = 'sanity-draft-mode'
const PREVIEW_SECRET_PARAM = 'sanity-preview-secret'
const PREVIEW_PATHNAME_PARAM = 'sanity-preview-pathname'

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const action = url.searchParams.get('action')
  const previewPathname = url.searchParams.get(PREVIEW_PATHNAME_PARAM)
  const redirectTo = previewPathname ?? url.searchParams.get('redirect') ?? '/'
  const hasPreviewSecret = url.searchParams.has(PREVIEW_SECRET_PARAM)
  const isHttps = url.protocol === 'https:'

  if (action === 'enable' || hasPreviewSecret) {
    cookies.set(COOKIE_NAME, '1', {
      path: '/',
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      maxAge: 60 * 60, // 1 hour
    })
    return redirect(redirectTo, 307)
  }

  if (action === 'disable') {
    cookies.delete(COOKIE_NAME, { path: '/' })
    return redirect(redirectTo, 307)
  }

  // If this endpoint is loaded directly in the preview iframe (without params),
  // bounce back to the homepage so Presentation doesn't get stuck on JSON.
  if (!action && !hasPreviewSecret) {
    return redirect('/', 307)
  }

  return new Response(
    JSON.stringify({ draftMode: cookies.get(COOKIE_NAME)?.value === '1' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
