'use client'

import { useState } from 'react'
import { ArrowRight, Building2 } from 'lucide-react'

export default function OnboardingForm() {
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceName }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Failed to create workspace')
        return
      }

      // Success: navigate to dashboard with full session reload
      window.location.href = '/dashboard'
    } catch {
      setError('Network error — please check your connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="form-group">
        <label htmlFor="workspace-name" className="label">
          Workspace Name
        </label>
        <div style={{ position: 'relative' }}>
          <Building2
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-dim)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
          <input
            id="workspace-name"
            className="input"
            type="text"
            placeholder="e.g. Acme Production, Personal Projects"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            autoFocus
            style={{ paddingLeft: 38 }}
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-dim)', marginTop: 4 }}>
          You can rename this or add teammates later in Settings.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(178, 58, 46, 0.08)',
            border: '1px solid rgba(178, 58, 46, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--color-error)',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading || !workspaceName.trim()}
        id="onboarding-submit-btn"
        style={{ padding: '12px 20px', fontSize: 15 }}
      >
        {loading ? 'Setting up workspace…' : 'Continue to Dashboard'}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  )
}
