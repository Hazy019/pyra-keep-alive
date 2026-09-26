import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pyra.dev'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pyra — Keep-Alive & Uptime Engine for Cloud Databases & APIs',
    template: '%s | Pyra',
  },
  description:
    'Pyra automatically pings your HTTP endpoints, Supabase, Render, and Railway databases on schedule so they never pause, sleep, or suffer cold start latencies.',
  keywords: [
    'keep-alive',
    'uptime monitoring',
    'database keep-alive',
    'supabase keep alive',
    'render keep alive',
    'railway sleep prevention',
    'cron ping',
    'health check',
    'api monitor',
    'serverless ping',
  ],
  authors: [{ name: 'Pyra Engineering', url: siteUrl }],
  creator: 'Pyra',
  publisher: 'Pyra Inc.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Pyra — Keep-Alive & Uptime Engine',
    description:
      'Reliable keep-alive infrastructure. Keep your cloud databases and backend APIs awake automatically.',
    url: siteUrl,
    siteName: 'Pyra',
    type: 'website',
    images: [
      {
        url: '/Pyra-logo.png',
        width: 512,
        height: 512,
        alt: 'Pyra Heartbeat Signal Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Pyra — Database & Service Keep-Alive Infrastructure',
    description:
      'Prevent database hibernation and API cold starts with encrypted, scheduled keep-alive signals.',
    images: ['/Pyra-logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.svg',
    apple: '/Pyra-logo.png',
  },
  alternates: {
    canonical: siteUrl,
  },
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isClerkConfigured = Boolean(
  publishableKey &&
  publishableKey.startsWith('pk_') &&
  !publishableKey.includes('placeholder') &&
  !publishableKey.includes('...') &&
  publishableKey !== 'pk_test_Y2xlcmsucHlyYS5kZXYk'
)

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Pyra',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        '@id': `${siteUrl}/#logo`,
        url: `${siteUrl}/Pyra-logo.png`,
        caption: 'Pyra Official Logo',
        width: '512',
        height: '512',
      },
      image: `${siteUrl}/Pyra-logo.png`,
      description:
        'Developer platform for automated keep-alive pings, endpoint monitoring, and database sleep prevention.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Pyra Keep-Alive Engine',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cloud',
      url: siteUrl,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Pings cloud endpoints and Postgres/Supabase databases automatically to eliminate sleep pauses and cold starts.',
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Pyra',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Google Structured Data / JSON-LD for Search Engine Logo & Entity Recognition */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {isClerkConfigured && publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
