import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pyra.dev'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sign-in', '/sign-up', '/pricing', '/privacy', '/terms'],
        disallow: ['/dashboard/', '/api/', '/onboarding/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
