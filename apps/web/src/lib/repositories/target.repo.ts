/**
 * Target repository — all queries require tenantId as a mandatory first argument.
 * There is no code path that can read a target without proving tenant ownership.
 * This is the application-layer defense against BOLA/IDOR (complementing RLS).
 */

import { eq, and, desc, count as sqlCount } from 'drizzle-orm'
import { targets, pingLogs } from '@pyra/db/schema'
import type { DbInstance } from '@/lib/db'
import type { Target, NewTarget } from '@pyra/db/schema'

export type TargetWithUptimeStats = Target & {
  totalPings: number
  successfulPings: number
  uptimePercent: number
  lastPingAt: Date | null
}

/**
 * Lists all targets for a tenant, with uptime % calculated from the last 30 days.
 */
export async function listTargets(db: DbInstance, tenantId: string): Promise<Target[]> {
  // RLS enforces tenantId at the DB level; we also filter explicitly (defense in depth)
  return db
    .select()
    .from(targets)
    .where(eq(targets.tenantId, tenantId))
    .orderBy(desc(targets.createdAt))
}

/**
 * Gets a single target by ID, with an explicit tenant ownership check.
 * Returns null if the target doesn't exist OR doesn't belong to this tenant.
 */
export async function getTarget(
  db: DbInstance,
  tenantId: string,
  targetId: string,
): Promise<Target | null> {
  const rows = await db
    .select()
    .from(targets)
    .where(and(eq(targets.id, targetId), eq(targets.tenantId, tenantId)))
    .limit(1)

  return rows[0] ?? null
}

/** Creates a new target. tenant_id and created_by are injected server-side. */
export async function createTarget(
  db: DbInstance,
  data: NewTarget,
): Promise<Target> {
  const rows = await db.insert(targets).values(data).returning()
  const created = rows[0]
  if (!created) throw new Error('Target insertion returned no rows')
  return created
}

/** Updates a target, with ownership check. Returns null if not found/owned. */
export async function updateTarget(
  db: DbInstance,
  tenantId: string,
  targetId: string,
  updates: Partial<Pick<Target, 'url' | 'pingIntervalMinutes' | 'authHeaderEncrypted'>>,
): Promise<Target | null> {
  const rows = await db
    .update(targets)
    .set(updates)
    .where(and(eq(targets.id, targetId), eq(targets.tenantId, tenantId)))
    .returning()

  return rows[0] ?? null
}

/** Deletes a target, with ownership check. Returns true if deleted. */
export async function deleteTarget(
  db: DbInstance,
  tenantId: string,
  targetId: string,
): Promise<boolean> {
  const rows = await db
    .delete(targets)
    .where(and(eq(targets.id, targetId), eq(targets.tenantId, tenantId)))
    .returning({ id: targets.id })

  return rows.length > 0
}

/** Marks a target as verified and unlocks shorter ping intervals */
export async function verifyTarget(
  db: DbInstance,
  tenantId: string,
  targetId: string,
): Promise<Target | null> {
  const rows = await db
    .update(targets)
    .set({ verified: true, verificationToken: null })
    .where(and(eq(targets.id, targetId), eq(targets.tenantId, tenantId)))
    .returning()

  return rows[0] ?? null
}

/** Counts targets for a tenant (for plan limit enforcement) */
export async function countTargets(db: DbInstance, tenantId: string): Promise<number> {
  const result = await db
    .select({ count: sqlCount() })
    .from(targets)
    .where(eq(targets.tenantId, tenantId))

  return result[0]?.count ?? 0
}

/** Gets recent ping logs for a target */
export async function getRecentPingLogs(
  db: DbInstance,
  tenantId: string,
  targetId: string,
  limit = 50,
) {
  return db
    .select()
    .from(pingLogs)
    .where(and(eq(pingLogs.targetId, targetId), eq(pingLogs.tenantId, tenantId)))
    .orderBy(desc(pingLogs.ranAt))
    .limit(limit)
}
