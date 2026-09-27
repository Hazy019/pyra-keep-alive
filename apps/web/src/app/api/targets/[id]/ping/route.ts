/**
 * POST /api/targets/[id]/ping
 *
 * Triggers an immediate on-demand live test ping for a target.
 * Validates SSRF, sends authenticated HTTP request, records telemetry to `ping_logs`,
 * and returns the live result.
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { requireRoleApi } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { getTarget } from '@/lib/repositories/target.repo'
import { decryptAuthHeader } from '@/lib/crypto'
import { executePing } from '@/lib/ping-service'
import { checkRateLimit, targetVerifyRatelimit } from '@/lib/ratelimit'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, ctx: RouteContext) {
  const correlationId = randomUUID()
  try {
    const { id } = await ctx.params
    const sessionCtx = await requireRoleApi('member')

    // Rate limit: max 10 manual pings per minute per target
    const rateLimit = await checkRateLimit(targetVerifyRatelimit, `${sessionCtx.tenantId}:${id}:ping`)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many test pings. Please wait a few seconds before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))),
          },
        },
      )
    }

    const result = await withTenant(sessionCtx.tenantId, async (db) => {
      const target = await getTarget(db, sessionCtx.tenantId, id)
      if (!target) return null

      let plainAuthHeader: string | null = null
      if (target.authHeaderEncrypted) {
        try {
          plainAuthHeader = decryptAuthHeader(target.authHeaderEncrypted)
        } catch (decryptErr) {
          console.warn('[POST /api/targets/[id]/ping] Auth header decryption failed:', decryptErr)
        }
      }

      const pingResult = await executePing(
        db,
        sessionCtx.tenantId,
        target.id,
        target.url,
        plainAuthHeader,
      )

      return pingResult
    })

    if (!result) {
      return NextResponse.json({ error: 'Target not found', correlationId }, { status: 404 })
    }

    return NextResponse.json({
      success: result.success,
      ping: result,
      correlationId,
    })
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}
