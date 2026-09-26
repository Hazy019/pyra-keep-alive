import { SignIn, ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  KeyRound,
  ArrowRight,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Zap,
  Bell,
  Activity,
} from 'lucide-react'
import SignedInRedirect from '@/components/auth/signed-in-redirect'

export const metadata = {
  title: 'Sign In — Pyra',
}

const brandFeatures = [
  {
    icon: Zap,
    title: 'Ping every 60 seconds',
    desc: 'High-frequency keep-alive for your most critical endpoints.',
  },
  {
    icon: ShieldCheck,
    title: 'AES-256-GCM encryption',
    desc: 'Auth headers stored with envelope encryption — never exposed in logs.',
  },
  {
    icon: Bell,
    title: 'Instant failure alerts',
    desc: 'Know the moment your service goes down, not minutes later.',
  },
]

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
    <main className="sign-in-outer">
      {/* ── LEFT: Rich brand panel ───────────────────────────────────── */}
      <div className="sign-in-brand">
        {/* Animated bg layers */}
        <div className="sign-in-brand-orb-1" aria-hidden="true" />
        <div className="sign-in-brand-orb-2" aria-hidden="true" />
        <div className="sign-in-brand-grid" aria-hidden="true" />

        {/* Top: Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--color-text-on-dark)',
              textDecoration: 'none',
              letterSpacing: '-0.03em',
            }}
          >
            Pyr<span style={{ color: 'var(--color-accent)' }}>a</span>
          </Link>
        </div>

        {/* Middle: Main brand content */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(12px, 2vh, 24px) 0' }}>
          {/* Live status badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(76,122,70,0.15)',
              border: '1px solid rgba(76,122,70,0.3)',
              borderRadius: 100,
              padding: '3px 12px',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#7CC87A',
              marginBottom: 16,
              letterSpacing: '0.03em',
              alignSelf: 'flex-start',
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#4C7A46',
                boxShadow: '0 0 0 3px rgba(76,122,70,0.25)',
                animation: 'pulse-green 2s ease-in-out infinite',
              }}
            />
            All systems operational
          </div>

          <h2
            style={{
              color: 'var(--color-text-on-dark)',
              fontSize: 'clamp(1.5rem, 2.4vw, 2.1rem)',
              marginBottom: 10,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Keep your services{' '}
            <span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>awake</span>{' '}
            around the clock.
          </h2>

          <p style={{ color: 'rgba(245,240,235,0.6)', fontSize: 13.5, lineHeight: 1.5, marginBottom: 20, maxWidth: 360 }}>
            Pyra pings your endpoints on schedule — no cold starts, no sleep modes, no forgotten cron jobs.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {brandFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    width: 32, height: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(232,98,44,0.15)',
                    border: '1px solid rgba(232,98,44,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-accent)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} aria-hidden="true" />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-on-dark)' }}>
                    {title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(245,240,235,0.5)', lineHeight: 1.4 }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Social proof stat strip */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            padding: '20px 0 0',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[
            { val: '14M+', label: 'Pings sent' },
            { val: '99.99%', label: 'Uptime rate' },
            { val: '8,450+', label: 'Endpoints' },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center',
                padding: '4px 8px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-text-on-dark)', lineHeight: 1.1 }}>
                {s.val}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(245,240,235,0.4)', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Sign-in form panel ────────────────────────────────── */}
      <div className="sign-in-form-panel">
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile-only logo (brand panel hidden on mobile) */}
          <div
            style={{ marginBottom: 32, textAlign: 'center' }}
            className="md:hidden"
          >
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--color-text)',
                textDecoration: 'none',
              }}
            >
              Pyr<span style={{ color: 'var(--color-accent)' }}>a</span>
            </Link>
          </div>

          {/* Header text */}
          <div style={{ marginBottom: 16 }}>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', margin: 0 }}>
              Sign in to your keep-alive workspace
            </p>
          </div>

          {isConfigured ? (
            <>
              <ClerkLoading>
                <div
                  style={{
                    width: '100%',
                    minHeight: 380,
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    boxShadow: 'var(--shadow-raised)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 14,
                    padding: '24px 20px',
                  }}
                >
                  <Loader2 size={28} className="spin" style={{ color: 'var(--color-accent)' }} />
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
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
                        rootBox: { width: '100%', margin: '0 auto' },
                        card: {
                          border: '1px solid var(--color-border, #E7DFD6)',
                          boxShadow: '0 8px 32px rgba(33, 29, 26, 0.08)',
                          borderRadius: '16px',
                          padding: '24px 28px',
                        },
                        header: {
                          display: 'none',
                        },
                        formButtonPrimary: {
                          backgroundColor: '#E8622C',
                          '&:hover': { backgroundColor: '#DF551F' },
                        },
                      },
                    }}
                  />
                </SignedOut>
              </ClerkLoaded>
            </>
          ) : (
            /* Clerk not configured — setup card */
            <div
              className="card"
              style={{
                width: '100%',
                padding: '32px 28px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-raised)',
              }}
            >
              <div
                style={{
                  width: 44, height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-accent-glow)',
                  color: 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <KeyRound size={22} aria-hidden="true" />
              </div>

              <h2 style={{ fontSize: '1.25rem', marginBottom: 8, fontWeight: 600 }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

          {/* Footer link only if Clerk is not configured */}
          {!isConfigured && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-dim)', marginTop: 20 }}>
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
                Sign up free
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
