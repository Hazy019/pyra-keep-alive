'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react'
import { getCsrfToken } from '@/lib/csrf-client'

interface TeamMemberActionsProps {
  membershipId: string
  memberEmail: string
  role: string
  canManage: boolean
}

export function TeamMemberActions({
  membershipId,
  memberEmail,
  role,
  canManage,
}: TeamMemberActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Owners cannot be removed
  if (role === 'owner' || !canManage) {
    return null
  }

  async function handleRemove() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/team/members/${membershipId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to remove member')
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', color: 'var(--color-error)' }}
            title={`Remove ${memberEmail}`}
            aria-label={`Remove ${memberEmail}`}
          >
            <Trash2 size={13} aria-hidden="true" />
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
                maxWidth: 440,
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
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: 4,
                  }}
                  aria-label="Close"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </Dialog.Close>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(178, 58, 46, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={16} color="var(--color-error)" />
                </div>
                <Dialog.Title
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 17,
                    fontWeight: 600,
                    margin: 0,
                    color: 'var(--color-text)',
                  }}
                >
                  Remove Team Member
                </Dialog.Title>
              </div>

              <Dialog.Description
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                Are you sure you want to remove <strong>{memberEmail}</strong> from this workspace? They will lose access immediately.
              </Dialog.Description>

              {error && (
                <div
                  style={{
                    background: 'rgba(178, 58, 46, 0.08)',
                    border: '1px solid rgba(178, 58, 46, 0.25)',
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
                  <button type="button" className="btn btn-secondary btn-sm" disabled={loading}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={loading}
                  className="btn btn-danger btn-sm"
                  style={{ gap: 6 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      <span>Removing…</span>
                    </>
                  ) : (
                    <span>Remove Member</span>
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
