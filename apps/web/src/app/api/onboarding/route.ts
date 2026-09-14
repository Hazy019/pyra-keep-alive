import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tenants, users, memberships } from '@pyra/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { workspaceName?: string }
    const workspaceName = body.workspaceName?.trim() || 'My Workspace'

    let tenantId: any = randomUUID()
    let internalUserId: any = randomUUID()

    // Try DB insertion if DATABASE_URL is available
    if (process.env['DATABASE_URL']) {
      try {
        const dbClient = db()

        // 1. Ensure user row exists
        const existingUsers = await dbClient
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

          const insertedUsers = await dbClient
            .insert(users)
            .values({
              clerkUserId: userId,
              email: primaryEmail,
            })
            .returning()
          dbUser = insertedUsers[0]
        }

        if (dbUser) {
          internalUserId = dbUser.id
        }

        // 2. Create tenant
        const insertedTenants = await dbClient
          .insert(tenants)
          .values({
            name: workspaceName,
            plan: 'free',
          })
          .returning()

        const dbTenant = insertedTenants[0]
        if (dbTenant) {
          tenantId = dbTenant.id
        }

        // 3. Create owner membership
        await dbClient.insert(memberships).values({
          tenantId: tenantId as any,
          userId: internalUserId as any,
          role: 'owner',
        })
      } catch (dbErr) {
        console.warn('[onboarding] DB operation failed, falling back to session metadata only:', dbErr)
      }
    }

    // 4. Sync tenant and role into Clerk user metadata
    try {
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          tenantId,
          internalUserId,
          role: 'owner',
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
