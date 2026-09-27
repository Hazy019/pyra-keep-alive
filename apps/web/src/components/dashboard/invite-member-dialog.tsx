'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { UserPlus, X, Loader2, Shield, Sparkles } from 'lucide-react'
import { getCsrfToken } from '@/lib/csrf-client'

export default function InviteMemberDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      })

      const data = (await res.json()) as { error?: string; message?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to send invitation')
      }

      setSuccessMsg(data.message ?? 'Invitation sent successfully!')
      setEmail('')
      router.refresh()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="btn btn-primary btn-sm" id="invite-member-btn" style={{ gap: 6 }}>
          <UserPlus size={14} aria-hidden="true" />
          <span>Invite member</span>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Dialog.Title
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                Invite Team Member
              </Dialog.Title>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'rgba(232, 98, 44, 0.1)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Sparkles size={10} /> Team Feature
              </span>
            </div>

            <Dialog.Description
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Collaborate seamlessly with shared keep-alive endpoints, granular RBAC, and incident alerts.
            </Dialog.Description>

            <form onSubmit={(e) => void handleInvite(e)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="member-email" className="label">
                  Email address *
                </label>
                <input
                  id="member-email"
                  className="input"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="member-role" className="label">
                  Workspace Role
                </label>
                <select
                  id="member-role"
                  className="input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'viewer')}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="admin">Admin — Full management, member invites & alerts</option>
                  <option value="member">Member — Add, configure, and monitor endpoints</option>
                  <option value="viewer">Viewer — Read-only telemetry and health graphs</option>
                </select>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 5 }}>
                  {role === 'admin'
                    ? 'Admins can manage targets, invite colleagues, and receive automated outage alerts.'
                    : role === 'member'
                      ? 'Members can create endpoints, run live test pings, and edit configurations.'
                      : 'Viewers have read-only access to ping telemetry and cannot modify endpoints.'}
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

              {successMsg && (
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--color-success)',
                  }}
                >
                  ✓ {successMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={loading}>
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading || !email}
                  style={{ gap: 6 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      <span>Sending Invite…</span>
                    </>
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
