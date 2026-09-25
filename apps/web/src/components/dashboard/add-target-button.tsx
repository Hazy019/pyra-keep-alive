'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { getCsrfToken } from '@/lib/csrf-client'

/**
 * Add Target Button + inline modal.
 *
 * Client component with accessible Radix Dialog primitive:
 * - role="dialog", aria-modal="true"
 * - aria-labelledby & aria-describedby via Dialog.Title & Dialog.Description
 * - Automatic focus trap and Escape key dismissal
 */
export default function AddTargetButton() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [authHeader, setAuthHeader] = useState('')
  const [interval, setInterval] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          url,
          ...(authHeader ? { authHeader } : {}),
          pingIntervalMinutes: interval,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error: string }
        setError(data.error ?? 'Something went wrong')
        return
      }

      // Success — reload the page to show new target
      window.location.reload()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="btn btn-primary btn-sm"
          id="add-target-btn"
        >
          + Add target
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="dialog-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(33, 29, 26, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <Dialog.Content
            className="card dialog-content"
            style={{
              width: '100%',
              maxWidth: 480,
              position: 'relative',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-raised)',
              padding: 28,
            }}
          >
            <Dialog.Close asChild>
              <button
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                }}
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </Dialog.Close>

            <Dialog.Title
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 6,
                color: 'var(--color-text)',
              }}
            >
              Add target
            </Dialog.Title>
            <Dialog.Description
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Pyra will start pinging this URL immediately after creation.
            </Dialog.Description>

            <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="target-url" className="label">Endpoint URL *</label>
                <input
                  id="target-url"
                  className="input"
                  type="url"
                  placeholder="https://myapp.onrender.com/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="target-auth" className="label">
                  Auth header{' '}
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="target-auth"
                  className="input"
                  type="password"
                  placeholder="Bearer sk-..."
                  value={authHeader}
                  onChange={(e) => setAuthHeader(e.target.value)}
                  autoComplete="off"
                />
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Stored AES-256-GCM encrypted. Never logged.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="target-interval" className="label">Ping interval</label>
                <select
                  id="target-interval"
                  className="input"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  style={{ cursor: 'pointer' }}
                >
                  <option value={10}>Every 10 minutes (Recommended for Render, Fly, Railway)</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                  <option value={5}>Every 5 minutes (Verified domain)</option>
                  <option value={1}>Every minute (Verified + Team plan)</option>
                </select>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Default 10-minute cadence keeps free-tier containers alive without requiring domain verification.
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

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading || !url}
                  id="add-target-submit"
                >
                  {loading ? 'Adding…' : 'Add target'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
