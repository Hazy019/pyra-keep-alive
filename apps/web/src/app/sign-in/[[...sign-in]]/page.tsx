import { SignIn, ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, ArrowRight, ExternalLink, Loader2 } from 'lucide-react'
import SignedInRedirect from '@/components/auth/signed-in-redirect'

export const metadata = {
  title: 'Sign In — Pyra',
}

export default async function SignInPage(props: {
  searchParams?: Promise<{ redirect_url?: string }>
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined
  const { userId } = await auth()

  if (userId) {
    const rawRedirect = searchParams?.redirect_url
    let destination = '/dashboard'
    if (rawRedirect) {
      if (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) {
        destination = rawRedirect
      } else {
        try {
          const parsed = new URL(rawRedirect, 'http://localhost:3000')
          destination = parsed.pathname + parsed.search + parsed.hash
        } catch {
          destination = '/dashboard'
        }
      }
    }
    redirect(destination)
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isConfigured = Boolean(
    publishableKey &&
    publishableKey.startsWith('pk_') &&
    !publishableKey.includes('placeholder') &&
    !publishableKey.includes('...') &&
    publishableKey !== 'pk_test_Y2xlcmsucHlyYS5kZXYk'
  )

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--color-text)',
            textDecoration: 'none',
          }}
        >
          Pyr<span style={{ color: 'var(--color-accent)' }}>a</span>
        </Link>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 6 }}>
          Sign in to your keep-alive workspace
        </p>
      </div>

      {isConfigured ? (
        <>
          <ClerkLoading>
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                minHeight: 460,
                borderRadius: '16px',
                border: '1px solid var(--color-border, #E7DFD6)',
                background: 'var(--color-surface, #FFFFFF)',
                boxShadow: '0 8px 24px rgba(33, 29, 26, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                padding: '32px 24px',
              }}
            >
              <Loader2 size={28} className="spin" style={{ color: 'var(--color-accent, #E8622C)' }} />
              <p style={{ fontSize: 14, color: 'var(--color-text-muted, #6B6460)' }}>
                Connecting to authentication provider...
              </p>
            </div>
          </ClerkLoading>
          <ClerkLoaded>
            <SignedIn>
              <SignedInRedirect />
            </SignedIn>
            <SignedOut>
              <SignIn
                fallbackRedirectUrl="/dashboard"
                signUpUrl="/sign-up"
                appearance={{
                  variables: {
                    colorPrimary: '#E8622C',
                    colorBackground: '#FFFFFF',
                    colorText: '#211D1A',
                    colorTextSecondary: '#6B6460',
                    colorInputBackground: '#FFFFFF',
                    colorInputText: '#211D1A',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-body)',
                  },
                  elements: {
                    card: {
                      border: '1px solid #E7DFD6',
                      boxShadow: '0 8px 24px rgba(33, 29, 26, 0.10)',
                      borderRadius: '16px',
                    },
                    formButtonPrimary: {
                      backgroundColor: '#E8622C',
                      '&:hover': {
                        backgroundColor: '#DF551F',
                      },
                    },
                  },
                }}
              />
            </SignedOut>
          </ClerkLoaded>
        </>
      ) : (
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: 520,
            padding: '36px 32px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-raised)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent-glow)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <KeyRound size={22} aria-hidden="true" />
          </div>

          <h2 style={{ fontSize: '1.35rem', marginBottom: 8, fontWeight: 600 }}>
            Clerk Authentication Setup Required
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            To enable live authentication, Pyra requires real Clerk API keys. Set them in your local environment:
          </p>

          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              marginBottom: 24,
              color: 'var(--color-text)',
              lineHeight: 1.7,
            }}
          >
            <div style={{ color: 'var(--color-text-dim)', marginBottom: 4 }}># Add to .env.local:</div>
            <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...</div>
            <div>CLERK_SECRET_KEY=sk_test_...</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full"
              style={{ padding: '11px 20px', fontSize: 14 }}
            >
              Get Free Clerk Keys
              <ExternalLink size={14} aria-hidden="true" />
            </a>

            <Link
              href="/dashboard"
              className="btn btn-secondary w-full"
              style={{ padding: '11px 20px', fontSize: 14 }}
            >
              Explore Dashboard (Local Preview)
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
