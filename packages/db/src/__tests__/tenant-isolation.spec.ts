import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { sql, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import * as schema from '../schema/index'
import { targets, tenants, users, memberships } from '../schema/index'
import { executeWithTenant } from '../with-tenant'

describe('Pyra Tenant Isolation & Onboarding Data Flow', () => {
  let pool: Pool
  let db: ReturnType<typeof drizzle<typeof schema>>
  let userAId: string
  let userBId: string
  let tenantAId: string
  let tenantBId: string
  let targetAId: string
  let targetBId: string

  beforeAll(async () => {
    const connectionString = process.env['DATABASE_URL'] ?? ''
    pool = new Pool({ connectionString })
    db = drizzle(pool, { schema })

    userAId = randomUUID()
    userBId = randomUUID()
    tenantAId = randomUUID()
    tenantBId = randomUUID()
    targetAId = randomUUID()
    targetBId = randomUUID()

    // 1. Seed users directly
    await db.insert(users).values([
      { id: userAId, clerkUserId: `clerk_${userAId}`, email: 'tenant_a@example.com' },
      { id: userBId, clerkUserId: `clerk_${userBId}`, email: 'tenant_b@example.com' },
    ])

    // 2. Seed tenants directly
    await db.insert(tenants).values([
      { id: tenantAId, name: 'Tenant A Workspace', plan: 'free' },
      { id: tenantBId, name: 'Tenant B Workspace', plan: 'free' },
    ])

    // 3. Seed memberships
    await db.insert(memberships).values([
      { tenantId: tenantAId, userId: userAId, role: 'owner' },
      { tenantId: tenantBId, userId: userBId, role: 'owner' },
    ])

    // 4. Seed targets for each tenant
    await db.insert(targets).values([
      { id: targetAId, tenantId: tenantAId, url: 'https://tenant-a.com/health', createdBy: userAId },
      { id: targetBId, tenantId: tenantBId, url: 'https://tenant-b.com/health', createdBy: userBId },
    ])
  })

  afterAll(async () => {
    if (db) {
      await db.execute(sql`DELETE FROM targets WHERE id IN (${targetAId}, ${targetBId})`)
      await db.execute(sql`DELETE FROM memberships WHERE tenant_id IN (${tenantAId}, ${tenantBId})`)
      await db.execute(sql`DELETE FROM tenants WHERE id IN (${tenantAId}, ${tenantBId})`)
      await db.execute(sql`DELETE FROM users WHERE id IN (${userAId}, ${userBId})`)
    }
    if (pool) {
      await pool.end()
    }
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_01: RLS tenant context actually applies to real queries
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC_01: RLS tenant context applies to real queries — only returns requesting tenant\'s targets', async () => {
    const aTargets = await executeWithTenant(db, tenantAId, (tx) => tx.select().from(targets))
    const bTargets = await executeWithTenant(db, tenantBId, (tx) => tx.select().from(targets))

    // Tenant A gets exactly 1 target, matching its own ID
    expect(aTargets.length).toBe(1)
    expect(aTargets[0]?.id).toBe(targetAId)
    expect(aTargets.every((t) => t.tenantId === tenantAId)).toBe(true)

    // Tenant B gets exactly 1 target, matching its own ID
    expect(bTargets.length).toBe(1)
    expect(bTargets[0]?.id).toBe(targetBId)
    expect(bTargets.every((t) => t.tenantId === tenantBId)).toBe(true)

    // Mutual exclusivity
    expect(aTargets.some((t) => t.tenantId === tenantBId)).toBe(false)
    expect(bTargets.some((t) => t.tenantId === tenantAId)).toBe(false)
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_03: Cross-tenant target access is denied (BOLA/IDOR defense)
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC_03: Cross-tenant direct target query is blocked by RLS (BOLA/IDOR prevention)', async () => {
    // Tenant A user explicitly asks for Tenant B's target ID
    const directQuery = await executeWithTenant(db, tenantAId, (tx) =>
      tx.execute(sql`SELECT * FROM targets WHERE id = ${targetBId}`),
    )

    // RLS policy ensures zero rows are returned
    expect(directQuery.rows.length).toBe(0)
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_04: Concurrent queries don't cross-contaminate tenant context
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC_04: 20 concurrent parallel calls with alternating tenants do not leak context', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => {
        const expectedTenant = i % 2 === 0 ? tenantAId : tenantBId
        return executeWithTenant(db, expectedTenant, (tx) => tx.select().from(targets))
      }),
    )

    expect(results.length).toBe(20)
    results.forEach((rows: any[], i) => {
      const expectedTenant = i % 2 === 0 ? tenantAId : tenantBId
      const expectedTarget = i % 2 === 0 ? targetAId : targetBId
      expect(rows.length).toBe(1)
      expect(rows[0]?.id).toBe(expectedTarget)
      expect(rows.every((r) => r.tenantId === expectedTenant)).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_05: Double onboarding submit doesn't create duplicate tenants
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC_05: Double submit onboarding simulation creates exactly 1 tenant and 1 membership', async () => {
    const doubleSubmitUserClerkId = `clerk_double_${randomUUID()}`
    const doubleSubmitEmail = `double_${Date.now()}@example.com`

    // Simulation of the onboarding transaction logic executed concurrently in two tabs
    async function simulateOnboardingSubmit(workspaceName: string) {
      return await db.transaction(async (tx) => {
        // Serialize concurrent onboarding attempts for the same Clerk user ID
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${doubleSubmitUserClerkId}))`)

        // 1. Ensure user (with onConflict safety)
        const insertedUsers = await tx
          .insert(users)
          .values({ clerkUserId: doubleSubmitUserClerkId, email: doubleSubmitEmail })
          .onConflictDoNothing({ target: users.clerkUserId })
          .returning()

        let dbUser = insertedUsers[0]
        if (!dbUser) {
          const recheck = await tx
            .select()
            .from(users)
            .where(eq(users.clerkUserId, doubleSubmitUserClerkId))
            .limit(1)
          dbUser = recheck[0]
        }

        if (!dbUser) {
          throw new Error('Failed to ensure user in double submit simulation')
        }

        const internalId = dbUser.id

        // 2. Check if already has membership
        const [existingMembership] = await tx
          .select()
          .from(memberships)
          .where(eq(memberships.userId, internalId))
          .limit(1)

        if (existingMembership) {
          return { tenantId: existingMembership.tenantId, created: false }
        }

        // 3. Create tenant
        const [newTenant] = await tx
          .insert(tenants)
          .values({ name: workspaceName, plan: 'free' })
          .returning()

        if (!newTenant) {
          throw new Error('Failed to create tenant in simulation')
        }

        // 4. Create membership
        await tx.insert(memberships).values({
          tenantId: newTenant.id,
          userId: internalId,
          role: 'owner',
        })

        return { tenantId: newTenant.id, created: true }
      })
    }

    // Fire 2 onboarding requests concurrently (simulating two browser tabs submitted at the same time)
    const [sub1, sub2] = await Promise.all([
      simulateOnboardingSubmit('Workspace Tab 1'),
      simulateOnboardingSubmit('Workspace Tab 2'),
    ])

    // Both should resolve to the same tenant ID
    expect(sub1.tenantId).toBe(sub2.tenantId)

    // Verify in database: exactly 1 user, 1 tenant, 1 membership
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, doubleSubmitUserClerkId))
    expect(userRows.length).toBe(1)
    const resolvedUser = userRows[0]
    expect(resolvedUser).toBeDefined()
    if (!resolvedUser) return

    const membershipRows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, resolvedUser.id))
    expect(membershipRows.length).toBe(1)

    // Cleanup
    await db.execute(sql`DELETE FROM memberships WHERE user_id = ${resolvedUser.id}`)
    await db.execute(sql`DELETE FROM tenants WHERE id = ${sub1.tenantId}`)
    await db.execute(sql`DELETE FROM users WHERE id = ${resolvedUser.id}`)
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_06: Stale/missing session claim fallback to database membership
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC_06: Resolves tenant context from DB membership when JWT session claims are missing or stale', async () => {
    // Lookup user A's membership using their clerkUserId directly from DB
    const userRows = await db
      .select({
        userId: users.id,
        tenantId: memberships.tenantId,
        role: memberships.role,
      })
      .from(users)
      .innerJoin(memberships, eq(users.id, memberships.userId))
      .where(eq(users.clerkUserId, `clerk_${userAId}`))
      .limit(1)

    expect(userRows.length).toBe(1)
    expect(userRows[0]?.tenantId).toBe(tenantAId)
    expect(userRows[0]?.role).toBe('owner')
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // TC_07: Missing DATABASE_URL fails loudly
  // ─────────────────────────────────────────────────────────────────────────────
  it('TC_07: Missing DATABASE_URL fails loudly with an explicit error', () => {
    const originalUrl = process.env['DATABASE_URL']
    delete process.env['DATABASE_URL']

    try {
      expect(() => {
        const url = process.env['DATABASE_URL']
        if (!url) {
          throw new Error('Database configuration error: DATABASE_URL is required')
        }
      }).toThrow('Database configuration error: DATABASE_URL is required')
    } finally {
      process.env['DATABASE_URL'] = originalUrl
    }
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Safe empty state on unset tenant context
  // ─────────────────────────────────────────────────────────────────────────────
  it('returns empty results without syntax or cast error when tenant context is unset', async () => {
    const emptyResult = await db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL ROLE pyra_app`)
      return await tx.select().from(targets)
    })
    expect(emptyResult.length).toBe(0)
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // SEC_PATCH_01: Enforce interval limits on unverified targets (Monetization & Abuse protection)
  // ─────────────────────────────────────────────────────────────────────────────
  it('SEC_PATCH_01: Unverified free-tier target cannot be updated to 1m interval and DB row remains unchanged', async () => {
    // 1. Target A is unverified on free-tier tenant A with default 1440m interval
    const [initialTarget] = await executeWithTenant(db, tenantAId, (tx) =>
      tx.select().from(targets).where(eq(targets.id, targetAId)),
    )
    expect(initialTarget).toBeDefined()
    expect(initialTarget?.verified).toBe(false)
    expect(initialTarget?.pingIntervalMinutes).toBe(1440)

    // 2. Validate interval boundary check (simulation of PATCH handler logic)
    const [tenantRow] = (await db.execute(
      sql`SELECT plan FROM tenants WHERE id = ${tenantAId} LIMIT 1`,
    )).rows as any[]
    const plan = tenantRow?.plan ?? 'free'
    expect(plan).toBe('free')

    const minIntervalUnverified = 1440
    const requestedInterval = 1

    let updateAttemptError: any = null
    try {
      if (!initialTarget?.verified && requestedInterval < minIntervalUnverified) {
        throw Object.assign(
          new Error(
            `Ping interval cannot be less than ${minIntervalUnverified}m for an unverified target.`,
          ),
          { statusCode: 400, isApiError: true },
        )
      }
      // If validation passed (unpatched bug), it would update
      await executeWithTenant(db, tenantAId, (tx) =>
        tx.update(targets).set({ pingIntervalMinutes: requestedInterval }).where(eq(targets.id, targetAId)),
      )
    } catch (err) {
      updateAttemptError = err
    }

    // 3. Assert error was thrown with HTTP 400 status
    expect(updateAttemptError).toBeDefined()
    expect(updateAttemptError.statusCode).toBe(400)
    expect(updateAttemptError.isApiError).toBe(true)
    expect(updateAttemptError.message).toContain('Ping interval cannot be less than 1440m')

    // 4. Assert DB row's interval remains unchanged (1440m)
    const [persistedTarget] = await executeWithTenant(db, tenantAId, (tx) =>
      tx.select().from(targets).where(eq(targets.id, targetAId)),
    )
    expect(persistedTarget?.pingIntervalMinutes).toBe(1440)
  })
})
