'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Code,
  Globe,
  FileCode,
} from 'lucide-react'
import { getCsrfToken } from '@/lib/csrf-client'

interface CreatedTargetData {
  id: string
  url: string
  verificationToken?: string
  pingIntervalMinutes: number
  initialPing?: {
    success: boolean
    statusCode: number | null
    latencyMs: number | null
    errorMessage: string | null
  } | null
}

/**
 * Add Target Button + 2-Step Seamless Creation Wizard.
 *
 * Step 1: Endpoint URL, Auth credentials, and Interval setup.
 * Step 2: Immediate Pre-flight Handshake result + Domain Ownership Verification.
 */
export default function AddTargetButton() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [url, setUrl] = useState('')
  const [authHeader, setAuthHeader] = useState('')
  const [interval, setInterval] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 2 state
  const [createdTarget, setCreatedTarget] = useState<CreatedTargetData | null>(null)
  const [verificationMethod, setVerificationMethod] = useState<'meta' | 'header' | 'dns'>('meta')
  const [copied, setCopied] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const isSupabaseUrl = url.toLowerCase().includes('.supabase.co') || url.toLowerCase().includes('.supabase.in')
  const isClientEcho = url.toLowerCase().includes('client-echo')
  const isJwt = authHeader.trim().startsWith('ey')

  function resetState() {
    setStep(1)
    setUrl('')
    setAuthHeader('')
    setInterval(5)
    setError(null)
    setCreatedTarget(null)
    setVerifyLoading(false)
    setVerifySuccess(false)
    setVerifyError(null)
    setCopied(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && createdTarget) {
      // If closing after target creation, navigate directly to target details
      window.location.href = `/dashboard/targets/${createdTarget.id}`
      return
    }
    setOpen(nextOpen)
    if (!nextOpen) {
      resetState()
    }
  }

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

      const created = (await response.json()) as CreatedTargetData
      setCreatedTarget(created)
      setStep(2)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOwnership() {
    if (!createdTarget || verifyLoading) return
    setVerifyLoading(true)
    setVerifyError(null)

    try {
      const res = await fetch(`/api/targets/${createdTarget.id}/verify`, {
        method: 'POST',
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      })

      const data = (await res.json()) as { error?: string; message?: string }
      if (!res.ok) {
        setVerifyError(data.error ?? 'Verification check could not detect the token yet.')
        return
      }

      setVerifySuccess(true)
    } catch {
      setVerifyError('Network error while verifying. Please try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const token = createdTarget?.verificationToken ?? 'pyra_token'
  let targetHostname = 'example.com'
  try {
    if (createdTarget?.url) targetHostname = new URL(createdTarget.url).hostname
  } catch {
    targetHostname = 'example.com'
  }

  function getSnippet(method: 'meta' | 'header' | 'dns'): string {
    switch (method) {
      case 'meta':
        return `<meta name="pyra-verification" content="${token}" />`
      case 'header':
        return `x-pyra-verification: ${token}`
      case 'dns':
        return `_pyra-verify.${targetHostname} TXT "pyra-verify=${token}"`
    }
  }

  function handleCopy(text: string) {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button className="btn btn-primary btn-sm" id="add-target-btn">
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
              maxWidth: step === 2 ? 540 : 480,
              position: 'relative',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-raised)',
              padding: 28,
              transition: 'max-width 0.2s ease',
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

            {/* ─── STEP 1: Add Target Form ──────────────────────────────────── */}
            {step === 1 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Dialog.Title
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 20,
                      fontWeight: 600,
                      margin: 0,
                      color: 'var(--color-text)',
                    }}
                  >
                    Add target
                  </Dialog.Title>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      background: 'var(--color-surface-2)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    Step 1 of 2
                  </span>
                </div>

                <Dialog.Description
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}
                >
                  Enter your endpoint. Pyra will run an immediate pre-flight connectivity check and guide you to verification.
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
                        Pyra will ping PostgREST (<code>/rest/v1/</code>) and automatically send both <code>apikey</code> and <code>Authorization: Bearer</code> headers using your anon key.
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
                        How we store credentials →
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
                      Next, you will review the live handshake and ownership confirmation options.
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
                      <button type="button" className="btn btn-ghost btn-sm">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={loading || !url}
                      id="add-target-submit"
                      style={{ gap: 6 }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                          <span>Testing & Adding…</span>
                        </>
                      ) : (
                        <>
                          <span>Add Target & Continue</span>
                          <ArrowRight size={13} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ─── STEP 2: Live Handshake & Domain Ownership Confirmation ─── */}
            {step === 2 && createdTarget && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Dialog.Title
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 20,
                      fontWeight: 600,
                      margin: 0,
                      color: 'var(--color-text)',
                    }}
                  >
                    {verifySuccess ? 'Target Confirmed' : 'Step 2: Confirm & Verify Target'}
                  </Dialog.Title>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: verifySuccess ? 'var(--color-success)' : 'var(--color-primary)',
                      background: verifySuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(232, 98, 44, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {verifySuccess ? 'Verified ✓' : 'Step 2 of 2'}
                  </span>
                </div>

                <Dialog.Description
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    marginBottom: 18,
                    lineHeight: 1.5,
                  }}
                >
                  {verifySuccess
                    ? 'Domain ownership confirmed! High-frequency keep-alive monitoring is active.'
                    : 'Target created! Review the immediate pre-flight handshake result and verify domain ownership.'}
                </Dialog.Description>

                {/* Pre-flight Handshake Result Banner */}
                <div
                  style={{
                    background: createdTarget.initialPing?.success
                      ? 'rgba(34, 197, 94, 0.08)'
                      : 'rgba(217, 119, 6, 0.08)',
                    border: `1px solid ${
                      createdTarget.initialPing?.success
                        ? 'rgba(34, 197, 94, 0.25)'
                        : 'rgba(217, 119, 6, 0.25)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {createdTarget.initialPing?.success ? (
                      <CheckCircle2 size={18} color="var(--color-success)" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={18} color="var(--color-warning, #d97706)" style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                        {createdTarget.initialPing?.success
                          ? `Pre-flight Handshake: HTTP ${createdTarget.initialPing.statusCode} OK`
                          : `Pre-flight Check: ${createdTarget.initialPing?.errorMessage || `HTTP ${createdTarget.initialPing?.statusCode ?? 'Unreachable'}`}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                        {createdTarget.initialPing?.success
                          ? `Endpoint responded in ${createdTarget.initialPing.latencyMs}ms. First ping telemetry recorded.`
                          : 'Endpoint was not reachable during pre-flight. Scheduled pings will retry.'}
                      </div>
                    </div>
                  </div>
                  {createdTarget.initialPing?.latencyMs !== null && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      {createdTarget.initialPing?.latencyMs}ms
                    </span>
                  )}
                </div>

                {verifySuccess ? (
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      textAlign: 'center',
                      marginBottom: 20,
                    }}
                  >
                    <ShieldCheck size={36} color="var(--color-success)" style={{ margin: '0 auto 10px' }} />
                    <h5 style={{ margin: '0 0 6px', color: 'var(--color-text)' }}>Ownership Confirmed!</h5>
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text-muted)' }}>
                      High-frequency 5m and 1m ping cadences are now unlocked.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="label" style={{ marginBottom: 0 }}>
                          Confirm Domain Ownership
                        </label>
                        <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                          Choose any 1 method
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 12 }}>
                        Add the snippet below to your website or API to confirm domain ownership:
                      </p>
                    </div>

                    {/* Method Selector Tabs */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        marginBottom: 10,
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setVerificationMethod('meta')}
                        style={{
                          background: verificationMethod === 'meta' ? 'var(--color-surface-2)' : 'none',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: verificationMethod === 'meta' ? 600 : 400,
                          color: verificationMethod === 'meta' ? 'var(--color-text)' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Code size={13} aria-hidden="true" /> HTML &lt;meta&gt;
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerificationMethod('header')}
                        style={{
                          background: verificationMethod === 'header' ? 'var(--color-surface-2)' : 'none',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: verificationMethod === 'header' ? 600 : 400,
                          color: verificationMethod === 'header' ? 'var(--color-text)' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <FileCode size={13} aria-hidden="true" /> HTTP Header
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerificationMethod('dns')}
                        style={{
                          background: verificationMethod === 'dns' ? 'var(--color-surface-2)' : 'none',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: verificationMethod === 'dns' ? 600 : 400,
                          color: verificationMethod === 'dns' ? 'var(--color-text)' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Globe size={13} aria-hidden="true" /> DNS TXT
                      </button>
                    </div>

                    {/* Code Snippet Box */}
                    <div
                      style={{
                        position: 'relative',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px',
                        marginBottom: 16,
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-text)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          paddingRight: 40,
                        }}
                      >
                        {getSnippet(verificationMethod)}
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy(getSnippet(verificationMethod))}
                        title="Copy to clipboard"
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 4,
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11.5,
                          color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
                        }}
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {verifyError && (
                      <div
                        style={{
                          background: 'rgba(217, 119, 6, 0.08)',
                          border: '1px solid rgba(217, 119, 6, 0.25)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          fontSize: 12.5,
                          color: 'var(--color-warning, #d97706)',
                          marginBottom: 16,
                        }}
                      >
                        ⚠ {verifyError}
                        <div style={{ color: 'var(--color-text-muted)', marginTop: 2, fontSize: 11.5 }}>
                          If you just deployed the tag, it may take a moment to propagate. You can also verify anytime from the target details page.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/dashboard/targets/${createdTarget.id}`
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    {verifySuccess ? 'Close' : "I'll Verify Later"}
                  </button>

                  {verifySuccess ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/dashboard/targets/${createdTarget.id}`
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ gap: 6 }}
                    >
                      <span>Go to Target Dashboard</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleVerifyOwnership()}
                      disabled={verifyLoading}
                      className="btn btn-primary btn-sm"
                      style={{ gap: 6 }}
                    >
                      {verifyLoading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                          <span>Checking Token…</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} aria-hidden="true" />
                          <span>Verify Ownership Now</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
