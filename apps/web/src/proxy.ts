import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Protected route patterns ─────────────────────────────────────────────────
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/targets(.*)', '/team(.*)', '/settings(.*)'])
const isAdminRoute = createRouteMatcher(['/api/admin(.*)'])
const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth()

  // ─── Redirect unauthenticated users away from protected routes ──────────────
  if (isProtectedRoute(request) && !userId) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // ─── Admin routes: require authentication (role enforced in route handler) ──
  if (isAdminRoute(request) && !userId) {
    return NextResponse.json({ error: 'Unauthorized', correlationId: crypto.randomUUID() }, { status: 401 })
  }

  // ─── CSRF protection for state-changing API methods ──────────────────────────
  // Double-submit cookie pattern: header value must match the cookie value.
  if (isApiRoute(request) && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    const csrfHeader = request.headers.get('x-csrf-token')
    const csrfCookie = request.cookies.get('pyra-csrf')?.value

    // Skip CSRF check for Stripe webhooks and first-time onboarding
    const isExemptApi =
      request.nextUrl.pathname === '/api/webhooks/stripe' ||
      request.nextUrl.pathname === '/api/onboarding'

    if (!isExemptApi && userId && (!csrfHeader || csrfHeader !== csrfCookie)) {
      return NextResponse.json(
        { error: 'CSRF token mismatch', correlationId: crypto.randomUUID() },
        { status: 403 },
      )
    }
  }

  const response = NextResponse.next()

  // ─── Set CSRF cookie for authenticated users (VULN-002 fix) ─────────────────
  // Non-HttpOnly so JS can read it for the double-submit pattern.
  // SameSite=Strict + Secure — not a bearer token, just a correlation nonce.
  if (userId && !request.cookies.get('pyra-csrf')) {
    const csrfToken = crypto.randomUUID()
    response.cookies.set('pyra-csrf', csrfToken, {
      httpOnly: false,        // Must be readable by JS
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,  // 24 hours
    })
  }

  // NOTE: x-pyra-tenant-id header intentionally NOT set on the response (VULN-003 fix).
  // Tenant context is read exclusively from Clerk session claims in requireRole().
  // A response header visible to the client is a latent injection point.

  return response
})

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
