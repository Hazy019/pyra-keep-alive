import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { memberships, users } from '@pyra/db/schema'
import { eq } from 'drizzle-orm'
import { Shield, Sparkles } from 'lucide-react'
import InviteMemberDialog from '@/components/dashboard/invite-member-dialog'
import { TeamMemberActions } from '@/components/dashboard/team-member-actions'

export const metadata: Metadata = { title: 'Team Management' }

export default async function TeamPage() {
  const ctx = await requireRole('viewer')

  let teamMembers: Array<{
    id: string
    email: string
    role: string
    createdAt: Date
    clerkUserId?: string
  }> = []

  if (process.env['DATABASE_URL']) {
    try {
      teamMembers = await withTenant(ctx.tenantId, async (db) => {
        const rows = await db
          .select({
            id: memberships.id,
            email: users.email,
            role: memberships.role,
            createdAt: memberships.createdAt,
            clerkUserId: users.clerkUserId,
          })
          .from(memberships)
          .innerJoin(users, eq(memberships.userId, users.id))
          .where(eq(memberships.tenantId, ctx.tenantId))
        return rows
      })
    } catch {
      teamMembers = []
    }
  }

  // Fallback if no members returned from DB yet
  if (teamMembers.length === 0) {
    teamMembers = [
      {
        id: '1',
        email: 'workspace-owner@current.user',
        role: ctx.role,
        createdAt: new Date(),
        clerkUserId: ctx.clerkUserId,
      },
    ]
  }

  const canManageTeam = ctx.role === 'owner' || ctx.role === 'admin'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ marginBottom: 4 }}>Team & Access Control</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Manage workspace collaborators, assigned roles, and granular access permissions.
          </p>
        </div>

        {canManageTeam && <InviteMemberDialog />}
      </div>

      {/* Pro / Team Active Capabilities Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(232, 98, 44, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)',
          border: '1px solid rgba(232, 98, 44, 0.25)',
          padding: '16px 20px',
          marginBottom: 28,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(232, 98, 44, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
              Pro / Team Workspace Active
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Your workspace has 50 endpoint slots, 1-minute ping cadences, multi-user invitations, and admin outage alerts enabled.
            </div>
          </div>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginBottom: 32 }}>
        <table style={{ minWidth: 540 }}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Assigned Role</th>
              <th>Joined Date</th>
              <th>Status</th>
              {canManageTeam && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m) => {
              const isPending = m.clerkUserId?.startsWith('invited_')
              return (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--color-text)',
                        }}
                        aria-hidden="true"
                      >
                        {m.email.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{m.email}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        textTransform: 'capitalize',
                        fontSize: 13,
                        padding: '2px 8px',
                        background: 'var(--color-surface-2)',
                        borderRadius: 6,
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Shield size={11} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />
                      {m.role}
                    </span>
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(m.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    {isPending ? (
                      <span
                        className="badge badge-pending"
                        style={{
                          fontSize: 11,
                          background: 'rgba(217, 119, 6, 0.12)',
                          color: 'var(--color-warning, #d97706)',
                          borderColor: 'rgba(217, 119, 6, 0.3)',
                        }}
                      >
                        Invited
                      </span>
                    ) : (
                      <span className="badge badge-up" style={{ fontSize: 11 }}>
                        Active
                      </span>
                    )}
                  </td>
                  {canManageTeam && (
                    <td style={{ textAlign: 'right' }}>
                      <TeamMemberActions
                        membershipId={m.id}
                        memberEmail={m.email}
                        role={m.role}
                        canManage={canManageTeam}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div
        className="card"
        style={{
          background: 'var(--color-surface)',
          padding: 24,
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <h5 style={{ marginBottom: 12 }}>Role Permissions Overview</h5>
        <div className="grid-2" style={{ gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Owner & Admin
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Can add/delete targets, modify credentials, configure alert channels, invite colleagues, and receive automated outage notifications.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Member & Viewer
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Members can configure and test endpoints. Viewers can monitor real-time latency graphs, execution history, and target health telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
