import type { Metadata } from 'next'
import { Inter, Fraunces, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

const rawSiteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://pyra-keep-alive-web.vercel.app'

const siteUrl = rawSiteUrl.replace(/\/+$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pyra — Keep-Alive & Uptime Engine for Cloud Databases & APIs',
    template: '%s | Pyra',
  },
  description:
    'Pyra automatically pings your HTTP endpoints, Supabase, Render, and Railway databases on schedule so they never pause, sleep, or suffer cold start latencies.',
  keywords: [
    'kyrell santillan',
    'Kyrell Santillan',
    'Hazy019',
    'hazy019',
    'hazy.cosedevs.com',
    'keep-alive',
    'uptime monitoring',
    'database keep-alive',
    'supabase keep alive',
    'render keep alive',
    'railway sleep prevention',
    'neon keep alive',
    'cron ping',
    'health check',
    'api monitor',
    'serverless ping',
    'cold start latency prevention',
    'background worker ping',
    'http heartbeat',
    'database sleep prevention',
  ],
  authors: [
    { name: 'Kyrell Santillan', url: 'https://hazy.cosedevs.com/' },
    { name: 'Pyra Engineering', url: siteUrl },
  ],
  creator: 'Kyrell Santillan',
  publisher: 'Pyra',
  applicationName: 'Pyra',
  category: 'Developer Tools',
  classification: 'Cloud Infrastructure & Monitoring',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
    title: 'Pyra — Keep-Alive & Uptime Engine for Cloud Databases & APIs',
    description:
      'Keep your cloud databases (Supabase, Render, Railway) and backend APIs awake automatically with scheduled, encrypted keep-alive pings.',
    url: siteUrl,
    siteName: 'Pyra',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/Pyra-logo.png',
        width: 512,
        height: 512,
        alt: 'Pyra — Keep-Alive & Uptime Engine Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary',
    site: '@hazy019',
    creator: '@hazy019',
    title: 'Pyra — Database & Service Keep-Alive Infrastructure',
    description:
      'Prevent database hibernation and API cold starts with encrypted, scheduled keep-alive signals.',
    images: ['/Pyra-logo.png'],
  },
  verification: {
    google: 'jurX14tSOTCPj1zMR21guSGjlv22Q17yRsd9fNjop5g',
  },
  icons: {
    icon: [
      {
        url: '/favicon-dark.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favicon-light.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: `${siteUrl}/`,
  },
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isClerkConfigured = Boolean(
  publishableKey &&
  publishableKey.startsWith('pk_') &&
  !publishableKey.includes('placeholder') &&
  !publishableKey.includes('...') &&
  publishableKey !== 'pk_test_Y2xlcmsucHlyYS5kZXYk',
)

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://hazy.cosedevs.com/#person',
      name: 'Kyrell Santillan',
      alternateName: ['Hazy019', 'Kyrell'],
      url: 'https://hazy.cosedevs.com/',
      jobTitle: 'Full-Stack Software Engineer & Systems Architect',
      sameAs: [
        'https://hazy.cosedevs.com/',
        'https://github.com/Hazy019',
        'https://x.com/hazy019',
      ],
    },
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
        width: 512,
        height: 512,
      },
      image: `${siteUrl}/Pyra-logo.png`,
      description:
        'Developer platform for automated keep-alive pings, endpoint monitoring, and cloud database sleep prevention.',
      founder: {
        '@id': 'https://hazy.cosedevs.com/#person',
      },
      sameAs: ['https://github.com/Hazy019/pyra-keep-alive'],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Pyra',
      description:
        'High-availability keep-alive and uptime engine for cloud databases and APIs.',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      creator: {
        '@id': 'https://hazy.cosedevs.com/#person',
      },
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Pyra Keep-Alive Engine',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cloud',
      url: siteUrl,
      description:
        'Automated keep-alive infrastructure that pings HTTP endpoints, Supabase, Render, and Railway databases to eliminate cold starts and inactive hibernation.',
      softwareVersion: '1.0.0',
      author: {
        '@id': 'https://hazy.cosedevs.com/#person',
      },
      creator: {
        '@id': 'https://hazy.cosedevs.com/#person',
      },
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Tier',
          price: '0',
          priceCurrency: 'USD',
          description:
            'Free keep-alive monitoring with 5-minute ping intervals for up to 3 endpoints.',
        },
        {
          '@type': 'Offer',
          name: 'Team Tier',
          price: '12',
          priceCurrency: 'USD',
          description:
            'Production keep-alive monitoring with 1-minute ping intervals, RBAC, and tamper-evident audit logs.',
        },
      ],
      featureList: [
        'Intervals down to 1 minute',
        'AES-256-GCM envelope-encrypted auth-header pings',
        'Actionable failure alerts and latency tracking',
        'Shared team workspaces with RBAC',
        'Tamper-evident hash-chained audit log',
        'PostgreSQL Row-Level Security multi-tenant isolation',
      ],
    },
    {
      '@type': 'WebPage',
      '@id': `${siteUrl}/#webpage`,
      url: siteUrl,
      name: 'Pyra — Keep-Alive & Uptime Engine for Cloud Databases & APIs',
      isPartOf: {
        '@id': `${siteUrl}/#website`,
      },
      about: {
        '@id': `${siteUrl}/#software`,
      },
      author: {
        '@id': 'https://hazy.cosedevs.com/#person',
      },
      inLanguage: 'en-US',
      description:
        'Pyra automatically pings your HTTP endpoints, Supabase, Render, and Railway databases on schedule so they never pause, sleep, or suffer cold start latencies.',
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Dynamic Theme-Aware Favicons for Browser Tabs */}
        <link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon-light.svg" type="image/svg+xml" media="(prefers-color-scheme: light)" />
        <link rel="alternate icon" href="/favicon.ico" />

        {/* Interconnected Schema.org JSON-LD Knowledge Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
