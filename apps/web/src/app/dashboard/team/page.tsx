import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { memberships, users } from '@pyra/db/schema'
import { eq } from 'drizzle-orm'
import { Users, UserPlus, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'Team Management' }

export default async function TeamPage() {
  const ctx = await requireRole('viewer')

  let teamMembers: Array<{
    id: string
    email: string
    role: string
    createdAt: Date
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
      },
    ]
  }

  const canManageTeam = ctx.role === 'owner' || ctx.role === 'admin'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ marginBottom: 4 }}>Team & Access Control</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Manage workspace members, roles, and granular permissions.
          </p>
        </div>

        {canManageTeam && (
          <button className="btn btn-primary btn-sm" disabled title="Team invitations are enabled on the Team plan">
            <UserPlus size={14} aria-hidden="true" />
            Invite member
          </button>
        )}
      </div>

      <div className="table-wrapper" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Assigned Role</th>
              <th>Joined Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m) => (
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
                  <span className="badge badge-up" style={{ fontSize: 11 }}>Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="card"
        style={{
          background: 'var(--color-surface)',
          padding: 24,
          border: '1px solid var(--color-border)',
        }}
      >
        <h5 style={{ marginBottom: 12 }}>Role Permissions Overview</h5>
        <div className="grid-2" style={{ gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Owner & Admin
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Can add/delete targets, modify credentials, configure alert channels, and invite team members.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Member & Viewer
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Can view real-time latency graphs, execution history, and target health telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
