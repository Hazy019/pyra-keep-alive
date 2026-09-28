'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError] Captured uncaught dashboard error:', error)
  }, [error])

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '64px auto',
        padding: '36px 32px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-raised)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(178, 58, 46, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-error)',
          margin: '0 auto 20px',
        }}
      >
        <AlertTriangle size={26} aria-hidden="true" />
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: 10, color: 'var(--color-text)' }}>
        Unable to load dashboard data
      </h3>

      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
        {error.message && !error.message.includes('digest')
          ? error.message
          : 'A network or database connection error occurred while loading this view. Your scheduled pings remain operational in the background.'}
      </p>

      {error.digest && (
        <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)', marginBottom: 20 }}>
          Correlation ID: {error.digest}
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => reset()}
          className="btn btn-primary btn-sm"
          style={{ gap: 6 }}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Try again</span>
        </button>

        <Link
          href="/dashboard"
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Return to overview</span>
        </Link>
      </div>
    </div>
  )
}
