'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function RedirectContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const rawRedirect = searchParams.get('redirect_url')
    let targetUrl = '/dashboard'

    if (rawRedirect) {
      if (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) {
        targetUrl = rawRedirect
      } else {
        try {
          const parsed = new URL(rawRedirect, window.location.origin)
          if (parsed.origin === window.location.origin) {
            targetUrl = parsed.pathname + parsed.search + parsed.hash
          }
        } catch {
          targetUrl = '/dashboard'
        }
      }
    }

    // Use full window navigation to guarantee fresh session cookies on server components
    window.location.href = targetUrl
  }, [searchParams])

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        minHeight: 320,
        borderRadius: '16px',
        border: '1px solid var(--color-border, #E7DFD6)',
        background: 'var(--color-surface, #FFFFFF)',
        boxShadow: '0 8px 24px rgba(33, 29, 26, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '36px 24px',
        textAlign: 'center',
      }}
    >
      <Loader2 size={32} className="spin" style={{ color: 'var(--color-accent, #E8622C)' }} />
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text, #211D1A)', marginBottom: 4 }}>
          Signed in successfully
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted, #6B6460)' }}>
          Directing you to your workspace…
        </p>
      </div>
    </div>
  )
}

export default function SignedInRedirect() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            minHeight: 320,
            borderRadius: '16px',
            border: '1px solid var(--color-border, #E7DFD6)',
            background: 'var(--color-surface, #FFFFFF)',
            boxShadow: '0 8px 24px rgba(33, 29, 26, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader2 size={32} className="spin" style={{ color: 'var(--color-accent, #E8622C)' }} />
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  )
}
