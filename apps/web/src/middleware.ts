import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Protected route patterns ─────────────────────────────────────────────────
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/targets(.*)',
  '/team(.*)',
  '/settings(.*)',
])
const isAdminRoute = createRouteMatcher(['/api/admin(.*)'])
const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(
  async (auth, request: NextRequest) => {
    // ─── Per-request CSP nonce (removes unsafe-inline and unsafe-eval from script-src) ──
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    const isDev = process.env.NODE_ENV === 'development'

    // script-src: strict-dynamic + nonce (no unsafe-inline or unsafe-eval in production)
    // img-src: named origins only (no wildcard https:)
    // font-src: 'self' only (self-hosted with next/font)
    const cspHeader = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.pyra.dev${isDev ? " 'unsafe-eval'" : ''}`,
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev",
      "connect-src 'self' https://clerk.pyra.dev https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com",
      "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', cspHeader)

    // ─── Protect all app routes using Clerk's native handshake-aware protect ────
    if (isProtectedRoute(request)) {
      await auth.protect()
    }

    const { userId } = await auth()

    // ─── Admin routes: require authentication (role enforced in route handler) ──
    if (isAdminRoute(request) && !userId) {
      const res = NextResponse.json(
        { error: 'Unauthorized', correlationId: crypto.randomUUID() },
        { status: 401 },
      )
      res.headers.set('Content-Security-Policy', cspHeader)
      return res
    }

    // ─── CSRF protection for state-changing API methods ──────────────────────────
    // Double-submit cookie pattern: header value must match the cookie value.
    if (isApiRoute(request) && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      const csrfHeader = request.headers.get('x-csrf-token')
      const csrfCookie = request.cookies.get('pyra-csrf')?.value

      if (request.nextUrl.pathname === '/api/onboarding') {
        // Replaced blanket exemption with strict origin check
        const origin = request.headers.get('origin')
        const host = request.headers.get('host')
        const secFetchSite = request.headers.get('sec-fetch-site')

        let isSameOrigin = false
        if (origin && host) {
          try {
            isSameOrigin = new URL(origin).host === host
          } catch {
            isSameOrigin = false
          }
        }
        const isSameSiteFetch = secFetchSite === 'same-origin' || secFetchSite === 'same-site'
        const hasValidCsrf = Boolean(csrfHeader && csrfCookie && csrfHeader === csrfCookie)

        if (!hasValidCsrf && !isSameOrigin && !isSameSiteFetch) {
          const res = NextResponse.json(
            { error: 'Cross-origin onboarding request rejected', correlationId: crypto.randomUUID() },
            { status: 403 },
          )
          res.headers.set('Content-Security-Policy', cspHeader)
          return res
        }
      } else if (
        request.nextUrl.pathname !== '/api/webhooks/stripe' &&
        !request.nextUrl.pathname.startsWith('/api/cron')
      ) {
        if (userId && (!csrfHeader || csrfHeader !== csrfCookie)) {
          const res = NextResponse.json(
            { error: 'CSRF token mismatch', correlationId: crypto.randomUUID() },
            { status: 403 },
          )
          res.headers.set('Content-Security-Policy', cspHeader)
          return res
        }
      }
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Set response CSP header
    response.headers.set('Content-Security-Policy', cspHeader)

    // ─── Set CSRF cookie for authenticated users (VULN-002 fix) ─────────────────
    // Non-HttpOnly so JS can read it for the double-submit pattern.
    // SameSite=Strict + Secure — not a bearer token, just a correlation nonce.
    if (userId && !request.cookies.get('pyra-csrf')) {
      const csrfToken = crypto.randomUUID()
      response.cookies.set('pyra-csrf', csrfToken, {
        httpOnly: false, // Must be readable by JS
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      })
    }

    return response
  },
  {
    clockSkewInMs: 300000, // 5-minute leeway to tolerate local OS clock drift
  },
)

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
