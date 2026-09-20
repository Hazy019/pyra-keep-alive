import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tenants, users, memberships } from '@pyra/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fail loudly if DATABASE_URL is not set (TC_07)
    if (!process.env['DATABASE_URL']) {
      console.error('[onboarding] DATABASE_URL is not set — failing loudly')
      return NextResponse.json(
        { error: 'Database configuration error: DATABASE_URL is required' },
        { status: 500 },
      )
    }

    const body = (await req.json()) as { workspaceName?: string }
    const workspaceName = body.workspaceName?.trim() || 'My Workspace'

    const dbClient = db()

    // Execute user check, tenant creation, and membership within a transaction (TC_05)
    const { tenantId, internalUserId, role } = await dbClient.transaction(async (tx) => {
      // Serialize concurrent onboarding attempts for the same Clerk user ID
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`)

      // 1. Ensure user row exists (with onConflict safety)
      const existingUsers = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1)

      let dbUser = existingUsers[0]
      if (!dbUser) {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)
        const primaryEmail =
          clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@placeholder.pyra.dev`

        const insertedUsers = await tx
          .insert(users)
          .values({
            clerkUserId: userId,
            email: primaryEmail,
          })
          .onConflictDoNothing({ target: users.clerkUserId })
          .returning()

        dbUser = insertedUsers[0]
        if (!dbUser) {
          const recheck = await tx
            .select()
            .from(users)
            .where(eq(users.clerkUserId, userId))
            .limit(1)
          dbUser = recheck[0]
        }
      }

      if (!dbUser) {
        throw new Error('Failed to ensure user record')
      }

      const currentUserId = dbUser.id

      // 2. Check if user already has a membership (idempotency against double-submit)
      const existingMemberships = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.userId, currentUserId))
        .limit(1)

      if (existingMemberships.length > 0 && existingMemberships[0]) {
        return {
          tenantId: existingMemberships[0].tenantId,
          internalUserId: currentUserId,
          role: existingMemberships[0].role,
        }
      }

      // 3. Create new tenant
      const insertedTenants = await tx
        .insert(tenants)
        .values({
          name: workspaceName,
          plan: 'free',
        })
        .returning()

      const dbTenant = insertedTenants[0]
      if (!dbTenant) {
        throw new Error('Failed to create tenant record')
      }

      const newTenantId = dbTenant.id

      // 4. Create owner membership
      await tx.insert(memberships).values({
        tenantId: newTenantId,
        userId: currentUserId,
        role: 'owner',
      })

      return {
        tenantId: newTenantId,
        internalUserId: currentUserId,
        role: 'owner',
      }
    })

    // 5. Sync tenant and role into Clerk user metadata
    try {
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          tenantId,
          internalUserId,
          role,
        },
      })
    } catch (clerkErr) {
      console.warn('[onboarding] Clerk updateUserMetadata failed:', clerkErr)
    }

    return NextResponse.json({ success: true, tenantId })
  } catch (err) {
    console.error('[onboarding] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
