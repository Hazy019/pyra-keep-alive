'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { getCsrfToken } from '@/lib/csrf-client'

export default function VerifyButton({ targetId }: { targetId: string }) {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleCheck() {
    setChecking(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/targets/${targetId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
      })
      const data = (await res.json()) as { message?: string; error?: string; method?: string }

      if (res.ok) {
        const methodLabel =
          data.method === 'html_meta'
            ? 'HTML <meta> tag'
            : data.method === 'http_header'
              ? 'HTTP response header'
              : data.method === 'json_response'
                ? 'JSON payload'
                : data.method === 'dns_txt'
                  ? 'DNS TXT record'
                  : 'well-known HTTP file'

        setVerified(true)
        setMessage(`Domain ownership confirmed via ${methodLabel}! High-frequency ping cadences are now unlocked.`)
        setTimeout(() => {
          router.push(`/dashboard/targets/${targetId}`)
          router.refresh()
        }, 1500)
      } else {
        setErrorMessage(
          data.error ??
            'Verification check failed. Ensure the DNS TXT record or well-known route is accessible and has propagated.',
        )
      }
    } catch {
      setErrorMessage('Network connection error while contacting verification service. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      {message && (
        <div
          style={{
            background: 'rgba(76, 122, 70, 0.12)',
            border: '1px solid rgba(76, 122, 70, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 14,
            color: 'var(--color-success)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          role="status"
          id="verify-success-banner"
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          {message}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: 'rgba(178, 58, 46, 0.08)',
            border: '1px solid rgba(178, 58, 46, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 14,
            color: 'var(--color-danger, #b23a2e)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          role="alert"
          id="verify-error-banner"
        >
          <AlertCircle size={16} aria-hidden="true" />
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking || verified}
          className="btn btn-primary"
          id="verify-check-btn"
        >
          {checking ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              Querying DNS & HTTP…
            </>
          ) : verified ? (
            <>
              <CheckCircle2 size={15} aria-hidden="true" />
              Verified
            </>
          ) : (
            <>
              Check Verification Now
              <ArrowRight size={15} aria-hidden="true" />
            </>
          )}
        </button>

        <span style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>
          DNS updates can take up to 5 minutes to propagate globally.
        </span>
      </div>
    </div>
  )
}
