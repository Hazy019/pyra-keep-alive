import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://pyra-keep-alive-web.vercel.app'
  const baseUrl = rawUrl.replace(/\/+$/, '')

  const disallowRoutes = [
    '/api/',
    '/api',
    '/admin/',
    '/admin',
    '/dashboard/',
    '/dashboard',
    '/onboarding/',
    '/onboarding',
  ]

  const allowRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/privacy',
    '/terms',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: allowRoutes,
        disallow: disallowRoutes,
      },
      {
        userAgent: 'Googlebot',
        allow: allowRoutes,
        disallow: disallowRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

