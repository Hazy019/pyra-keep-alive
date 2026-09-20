/**
 * Auth helpers — server-side only.
 *
 * ALL tenant context comes from the Clerk session, never from client-supplied params.
 * This is the single enforcement point for "never trust client-supplied tenantId".
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Role } from '@pyra/shared/types'
import { hasRole, ROLE_WEIGHT } from '@pyra/shared/types'

// ─── Session helpers ──────────────────────────────────────────────────────────

export interface SessionContext {
  userId: string
  tenantId: string
  role: Role
  clerkUserId: string
}

/**
 * Returns the current session context.
 * Throws a structured error if the session is invalid or missing tenant context.
 */
export async function getSessionContext(): Promise<SessionContext> {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    throw new AuthError('Not authenticated', 401)
  }

  const clerkUserId = userId
  const claimedTenantId = sessionClaims?.['tenantId'] as string | undefined
  let internalUserId = sessionClaims?.['internalUserId'] as string | undefined
  let role = (sessionClaims?.['role'] as Role | undefined) ?? 'viewer'
  let tenantId: string | undefined

  if (process.env['DATABASE_URL']) {
    try {
      const { db } = await import('@/lib/db')
      const schema = await import('@pyra/db/schema')
      const { eq, and } = await import('drizzle-orm')

      const dbClient = db()

      // If claims provide tenantId, verify it matches an actual membership row (guards against forged/stale JWT claims)
      if (claimedTenantId && internalUserId) {
        const verifiedMembership = await dbClient
          .select({
            role: schema.memberships.role,
          })
          .from(schema.memberships)
          .where(
            and(
              eq(schema.memberships.userId, internalUserId),
              eq(schema.memberships.tenantId, claimedTenantId),
            ),
          )
          .limit(1)

        if (verifiedMembership[0]) {
          tenantId = claimedTenantId
          role = verifiedMembership[0].role as Role
        }
      }

      // If claims were missing or did not match an active membership (e.g. fresh onboarding or stale token), resolve from DB
      if (!tenantId) {
        const userRows = await dbClient
          .select({
            userId: schema.users.id,
            tenantId: schema.memberships.tenantId,
            role: schema.memberships.role,
          })
          .from(schema.users)
          .innerJoin(schema.memberships, eq(schema.users.id, schema.memberships.userId))
          .where(eq(schema.users.clerkUserId, clerkUserId))
          .limit(1)

        if (userRows[0]) {
          internalUserId = userRows[0].userId
          tenantId = userRows[0].tenantId
          role = userRows[0].role as Role
        }
      }
    } catch (dbErr) {
      console.warn('[auth] DB session lookup error:', dbErr)
    }
  }

  if (!tenantId || !internalUserId) {
    // This happens when a user has signed up but hasn't completed onboarding or has forged claim
    throw new AuthError('No tenant context in session — complete onboarding first', 403)
  }

  return { userId: internalUserId, tenantId, role, clerkUserId }
}

// ─── RBAC enforcement ─────────────────────────────────────────────────────────

/**
 * Asserts the current session has at least the required role.
 * Throws `AuthError` (403) if not.
 */
export async function requireRole(minRole: Role): Promise<SessionContext> {
  let ctx: SessionContext
  try {
    ctx = await getSessionContext()
  } catch (err) {
    if (err instanceof AuthError && (err.statusCode === 403 || err.message.includes('onboarding'))) {
      redirect('/onboarding')
    }
    throw err
  }

  if (!hasRole(ctx.role, minRole)) {
    throw new AuthError(
      `Insufficient permissions — requires ${minRole} (current: ${ctx.role})`,
      403,
    )
  }

  return ctx
}

/** Same as requireRole but for admin actions that also require MFA */
export async function requireAdminWithMfa(): Promise<SessionContext> {
  const ctx = await requireRole('admin')
  const { sessionClaims } = await auth()

  const mfaVerified = sessionClaims?.['mfa'] as boolean | undefined
  if (!mfaVerified) {
    throw new AuthError('This action requires MFA verification', 403)
  }

  return ctx
}

// ─── Shared error type ────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 401 | 403 = 401,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export { hasRole, ROLE_WEIGHT }
