import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: {
    default: 'Pyra — Keep-Alive & Uptime Service',
    template: '%s | Pyra',
  },
  description:
    'Pyra pings your HTTP endpoints on a schedule so they never pause, sleep, or get forgotten. Free for solo builders, paid team tier with shared workspaces and fast intervals.',
  keywords: ['keep-alive', 'uptime', 'ping', 'monitoring', 'cron', 'render', 'railway'],
  authors: [{ name: 'Pyra' }],
  openGraph: {
    title: 'Pyra — Keep-Alive & Uptime Service',
    description: 'Keep your services awake. Free for solo builders.',
    type: 'website',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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

