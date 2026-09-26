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
  const [interval, setInterval] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupabaseUrl = url.toLowerCase().includes('.supabase.co') || url.toLowerCase().includes('.supabase.in')
  const isClientEcho = url.toLowerCase().includes('client-echo')
  const isJwt = authHeader.trim().startsWith('ey')

  function handleUrlBlur() {
    try {
      const u = new URL(url.trim())
      if (
        (u.hostname.endsWith('.supabase.co') || u.hostname.endsWith('.supabase.in')) &&
        (u.pathname === '' || u.pathname === '/')
      ) {
        u.pathname = '/rest/v1/'
        setUrl(u.toString())
      }
    } catch (_err) {
      // Fallback if URL is incomplete
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Normalize URL if user submitted a bare Supabase project URL
    let targetUrl = url.trim()
    try {
      const u = new URL(targetUrl)
      if (
        (u.hostname.endsWith('.supabase.co') || u.hostname.endsWith('.supabase.in')) &&
        (u.pathname === '' || u.pathname === '/')
      ) {
        u.pathname = '/rest/v1/'
        targetUrl = u.toString()
      }
    } catch (_err) {
      // Fallback if URL is incomplete
    }

    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          url: targetUrl,
          ...(authHeader.trim() ? { authHeader: authHeader.trim() } : {}),
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
                  onBlur={handleUrlBlur}
                  required
                  autoFocus
                />
              </div>

              {isSupabaseUrl && (
                <div
                  style={{
                    background: 'rgba(232, 98, 44, 0.08)',
                    border: '1px solid rgba(232, 98, 44, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: 'var(--color-primary)',
                    lineHeight: 1.45,
                  }}
                >
                  <strong>⚡ Supabase Database Detected</strong>
                  <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Pyra will ping PostgREST (<code>/rest/v1/</code>) and automatically send both <code>apikey</code> and <code>Authorization: Bearer</code> headers using your anon key to keep your database active.
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="target-auth" className="label">
                  {isSupabaseUrl || isClientEcho ? 'Supabase Anon Key' : 'Auth header'}{' '}
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                    {isSupabaseUrl || isClientEcho ? '(required for Supabase keep-alive)' : '(optional)'}
                  </span>
                </label>
                <input
                  id="target-auth"
                  className="input"
                  type="password"
                  placeholder={
                    isSupabaseUrl || isClientEcho
                      ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                      : 'Bearer sk-... or anon key'
                  }
                  value={authHeader}
                  onChange={(e) => setAuthHeader(e.target.value)}
                  autoComplete="off"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 4 }}>
                  <p style={{ fontSize: 12, color: isJwt ? 'var(--color-primary)' : 'var(--color-text-muted)', margin: 0 }}>
                    {isJwt
                      ? '✓ Supabase JWT detected — Pyra will send both apikey and Bearer headers automatically.'
                      : isSupabaseUrl || isClientEcho
                        ? 'Paste your Supabase anon public key. Stored with AES-256-GCM authenticated encryption.'
                        : 'Stored with AES-256-GCM authenticated encryption.'}
                  </p>
                  <a
                    href="/privacy#security"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11.5, color: 'var(--color-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    How we store your credentials →
                  </a>
                </div>
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
                  <option value={5}>Every 5 minutes (Recommended — prevents container sleep)</option>
                  <option value={10}>Every 10 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                  <option value={1}>Every minute (Team plan)</option>
                </select>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Any valid HTTP/HTTPS endpoint works immediately.{' '}
                  <span style={{ color: 'var(--color-text-dim)' }}>
                    Verifying domain ownership also protects other sites from being pinged on your behalf.
                  </span>
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
