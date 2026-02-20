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

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const action = url.searchParams.get('action')
  const redirectTo = url.searchParams.get('redirect') ?? '/'

  if (action === 'enable') {
    cookies.set(COOKIE_NAME, '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60, // 1 hour
    })
    return redirect(redirectTo, 307)
  }

  if (action === 'disable') {
    cookies.delete(COOKIE_NAME, { path: '/' })
    return redirect(redirectTo, 307)
  }

  return new Response(
    JSON.stringify({ draftMode: cookies.get(COOKIE_NAME)?.value === '1' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
