/**
 * GET /api/history — list recent ping logs for the authenticated tenant with live polling support
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { requireRoleApi } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { pingLogs, targets } from '@pyra/db/schema'
import { eq, desc } from 'drizzle-orm'
import { triggerOpportunisticSweep } from '@/lib/sweep-engine'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const correlationId = randomUUID()
  try {
    const ctx = await requireRoleApi('viewer')

    // Passive keep-alive: check and sweep overdue targets in background without blocking response
    triggerOpportunisticSweep()
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = Math.min(Math.max(1, Number(limitParam) || 100), 100)

    const rows = await withTenant(ctx.tenantId, async (db) => {
      return await db
        .select({
          id: pingLogs.id,
          targetUrl: targets.url,
          success: pingLogs.success,
          statusCode: pingLogs.statusCode,
          latencyMs: pingLogs.latencyMs,
          ranAt: pingLogs.ranAt,
        })
        .from(pingLogs)
        .leftJoin(targets, eq(pingLogs.targetId, targets.id))
        .where(eq(pingLogs.tenantId, ctx.tenantId))
        .orderBy(desc(pingLogs.ranAt))
        .limit(limit)
    })

    return NextResponse.json(
      { logs: rows },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    )
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}
