'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Pause, Play, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'
import { getCsrfToken } from '@/lib/csrf-client'

interface TargetRowActionsProps {
  targetId: string
  url: string
  initialActive: boolean
  canManage: boolean
  viewHref?: string
}

export function TargetRowActions({
  targetId,
  url,
  initialActive,
  canManage,
  viewHref,
}: TargetRowActionsProps) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(initialActive)
  const [isToggling, setIsToggling] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggleActive() {
    if (!canManage || isToggling) return
    setIsToggling(true)
    setError(null)
    const nextState = !isActive

    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({ active: nextState }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to update target status')
      }

      setIsActive(nextState)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
      // Revert optimistic state
      setIsActive(!nextState)
    } finally {
      setIsToggling(false)
    }
  }

  async function handleDelete() {
    if (!canManage || isDeleting) return
    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      })

      if (!res.ok && res.status !== 204) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to delete target')
      }

      setDeleteOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {canManage && (
          <>
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isToggling}
              className={isActive ? 'btn btn-secondary btn-sm' : 'btn btn-sm'}
              title={isActive ? 'Pause keep-alive pings' : 'Resume keep-alive pings'}
              aria-label={isActive ? `Pause monitoring for ${url}` : `Resume monitoring for ${url}`}
              style={{
                padding: '6px 11px',
                fontSize: 12.5,
                gap: 5,
                ...(isActive
                  ? {}
                  : {
                      background: 'rgba(234, 179, 8, 0.12)',
                      color: 'var(--color-warning, #f59e0b)',
                      borderColor: 'rgba(234, 179, 8, 0.3)',
                    }),
              }}
            >
              {isToggling ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : isActive ? (
                <Pause size={13} aria-hidden="true" />
              ) : (
                <Play size={13} aria-hidden="true" />
              )}
              <span>{isActive ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="btn btn-ghost btn-sm"
              title="Delete target"
              aria-label={`Delete target ${url}`}
              style={{
                padding: '6px 8px',
                color: 'var(--color-text-dim)',
                transition: 'color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-error)'
                e.currentTarget.style.background = 'rgba(178, 58, 46, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-dim)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </>
        )}

        {viewHref && (
          <a
            href={viewHref}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px', fontSize: 12.5 }}
          >
            View →
          </a>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(13, 15, 18, 0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <Dialog.Content
              className="card"
              style={{
                width: '100%',
                maxWidth: 460,
                position: 'relative',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-raised)',
                padding: 24,
              }}
            >
              <Dialog.Close asChild>
                <button
                  type="button"
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(178, 58, 46, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} color="var(--color-error)" aria-hidden="true" />
                </div>
                <Dialog.Title
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 600,
                    margin: 0,
                    color: 'var(--color-text)',
                  }}
                >
                  Delete Target
                </Dialog.Title>
              </div>

              <Dialog.Description
                style={{
                  fontSize: 13.5,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                Are you sure you want to stop monitoring and delete this endpoint?
              </Dialog.Description>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  background: 'var(--color-surface-2)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  wordBreak: 'break-all',
                  marginBottom: 16,
                  color: 'var(--color-text)',
                }}
              >
                {url}
              </div>

              <div
                style={{
                  background: 'rgba(178, 58, 46, 0.08)',
                  border: '1px solid rgba(178, 58, 46, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  marginBottom: 20,
                  fontSize: 12.5,
                  color: 'var(--color-error)',
                  lineHeight: 1.45,
                }}
              >
                ⚠️ All scheduled keep-alive pings will stop, and all historical ping logs and uptime metrics for this target will be permanently deleted. This action cannot be undone.
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(178, 58, 46, 0.15)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: 12.5,
                    color: 'var(--color-error)',
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </Dialog.Close>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-danger btn-sm"
                  style={{ gap: 6 }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} aria-hidden="true" />
                      Delete Target
                    </>
                  )}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

interface TargetDetailManagementProps {
  targetId: string
  url: string
  initialActive: boolean
  canManage: boolean
}

export function TargetDetailManagement({
  targetId,
  url,
  initialActive,
  canManage,
}: TargetDetailManagementProps) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(initialActive)
  const [isToggling, setIsToggling] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggleActive() {
    if (!canManage || isToggling) return
    setIsToggling(true)
    setError(null)
    const nextState = !isActive

    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({ active: nextState }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to update target status')
      }

      setIsActive(nextState)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
      setIsActive(!nextState)
    } finally {
      setIsToggling(false)
    }
  }

  async function handleDelete() {
    if (!canManage || isDeleting) return
    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      })

      if (!res.ok && res.status !== 204) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to delete target')
      }

      setDeleteOpen(false)
      router.push('/dashboard/targets')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
        <h5 style={{ margin: 0, color: 'var(--color-text)' }}>Lifecycle & Danger Zone</h5>

        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', marginBottom: 4 }}>
              {isActive ? 'Pause Keep-Alive Pings' : 'Resume Keep-Alive Pings'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 520, lineHeight: 1.45 }}>
              {isActive
                ? 'Temporarily pause scheduled pings for maintenance or downtime. Ping logs, configuration, and verification remain intact.'
                : 'Resume scheduled keep-alive pings on the configured interval immediately.'}
            </div>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isToggling}
              className={isActive ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
              style={{
                gap: 6,
                padding: '8px 16px',
                ...(isActive
                  ? {}
                  : {
                      background: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                    }),
              }}
            >
              {isToggling ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : isActive ? (
                <Pause size={14} aria-hidden="true" />
              ) : (
                <Play size={14} aria-hidden="true" />
              )}
              <span>{isActive ? 'Pause Target' : 'Resume Target'}</span>
            </button>
          )}
        </div>

        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            border: '1px solid rgba(178, 58, 46, 0.35)',
            background: 'rgba(178, 58, 46, 0.03)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-error)', marginBottom: 4 }}>
              Delete Target
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 520, lineHeight: 1.45 }}>
              Permanently remove this target from Pyra. All ping telemetry, response time history, and uptime logs will be wiped immediately.
            </div>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="btn btn-danger btn-sm"
              style={{ gap: 6, padding: '8px 16px' }}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Delete Target</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(13, 15, 18, 0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <Dialog.Content
              className="card"
              style={{
                width: '100%',
                maxWidth: 460,
                position: 'relative',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-raised)',
                padding: 24,
              }}
            >
              <Dialog.Close asChild>
                <button
                  type="button"
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(178, 58, 46, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} color="var(--color-error)" aria-hidden="true" />
                </div>
                <Dialog.Title
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 600,
                    margin: 0,
                    color: 'var(--color-text)',
                  }}
                >
                  Delete Target
                </Dialog.Title>
              </div>

              <Dialog.Description
                style={{
                  fontSize: 13.5,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                Are you sure you want to permanently delete this endpoint?
              </Dialog.Description>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  background: 'var(--color-surface-2)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  wordBreak: 'break-all',
                  marginBottom: 16,
                  color: 'var(--color-text)',
                }}
              >
                {url}
              </div>

              <div
                style={{
                  background: 'rgba(178, 58, 46, 0.08)',
                  border: '1px solid rgba(178, 58, 46, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  marginBottom: 20,
                  fontSize: 12.5,
                  color: 'var(--color-error)',
                  lineHeight: 1.45,
                }}
              >
                ⚠️ All scheduled keep-alive pings will stop, and all historical ping logs and uptime metrics for this target will be permanently deleted. This action cannot be undone.
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(178, 58, 46, 0.15)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: 12.5,
                    color: 'var(--color-error)',
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </Dialog.Close>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-danger btn-sm"
                  style={{ gap: 6 }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} aria-hidden="true" />
                      Delete Target
                    </>
                  )}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
