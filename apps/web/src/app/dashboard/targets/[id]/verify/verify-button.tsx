'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'

export default function VerifyButton({ targetId }: { targetId: string }) {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleCheck() {
    setChecking(true)
    setMessage(null)

    // Simulate domain check / verification call
    setTimeout(() => {
      setChecking(false)
      setVerified(true)
      setMessage('Domain verified successfully! High-frequency intervals are now unlocked.')
      setTimeout(() => {
        router.push(`/dashboard/targets/${targetId}`)
        router.refresh()
      }, 1500)
    }, 1200)
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
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          {message}
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
