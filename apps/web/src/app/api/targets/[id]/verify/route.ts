/**
 * POST /api/targets/[id]/verify
 *
 * Verifies domain ownership via either:
 * a) DNS TXT record:     `_pyra-verify.<hostname>` = `pyra-verify=<token>`
 * b) Well-known file:   `https://<hostname>/.well-known/pyra-verify` contains the token
 *
 * On success: marks target verified, audit logs the event, and unlocks shorter intervals.
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { promises as dns } from 'node:dns'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { getTarget, verifyTarget } from '@/lib/repositories/target.repo'
import { AUDIT_ACTIONS } from '@pyra/shared/types'
import { sql } from 'drizzle-orm'
import type { DbInstance } from '@/lib/db'
import type { AuditDb } from '@pyra/shared/audit'
import { writeAuditLog } from '@pyra/shared/audit'
import { validateTargetUrl } from '@pyra/shared/ssrf'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, ctx: RouteContext) {
  const correlationId = randomUUID()
  try {
    const { id } = await ctx.params
    const sessionCtx = await requireRole('member')

    const verificationResult = await withTenant(sessionCtx.tenantId, async (db) => {
      const target = await getTarget(db, sessionCtx.tenantId, id)
      if (!target) return { status: 'not_found' as const }
      if (target.verified) return { status: 'already_verified' as const }

      const token = target.verificationToken
      if (!token) return { status: 'no_token' as const }

      const parsed = new URL(target.url)
      const hostname = parsed.hostname

      // Attempt DNS TXT verification first
      let verified = false
      let method = ''

      try {
        const txtRecords = await dns.resolveTxt(`_pyra-verify.${hostname}`)
        const flat = txtRecords.flat()
        if (flat.some((r) => r === `pyra-verify=${token}`)) {
          verified = true
          method = 'dns_txt'
        }
      } catch {
        // DNS lookup failed — try well-known file
      }

      // If DNS failed, try well-known file (with SSRF protection)
      if (!verified) {
        try {
          const wellKnownUrl = `${parsed.protocol}//${hostname}/.well-known/pyra-verify`
          await validateTargetUrl(wellKnownUrl) // SSRF check

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          const response = await fetch(wellKnownUrl, { signal: controller.signal })
          clearTimeout(timeout)

          if (response.ok) {
            const text = (await response.text()).trim()
            if (text === token || text === `pyra-verify=${token}`) {
              verified = true
              method = 'well_known'
            }
          }
        } catch {
          // Well-known check failed
        }
      }

      if (!verified) {
        return { status: 'not_verified' as const, token }
      }

      // Mark as verified
      await verifyTarget(db, sessionCtx.tenantId, id)

      await writeAuditLog(makeAuditDb(db), {
        tenantId: sessionCtx.tenantId,
        actorUserId: sessionCtx.userId,
        action: AUDIT_ACTIONS.TARGET_VERIFIED,
        targetResource: id,
        metadata: { url: target.url, method },
      })

      return { status: 'verified' as const, method }
    })

    if (verificationResult.status === 'not_found') {
      return NextResponse.json({ error: 'Not found', correlationId }, { status: 404 })
    }

    if (verificationResult.status === 'already_verified') {
      return NextResponse.json({ message: 'Target is already verified' })
    }

    if (verificationResult.status === 'not_verified') {
      return NextResponse.json(
        {
          error: 'Verification failed. Ensure the DNS TXT record or well-known file is in place.',
          token: verificationResult.token,
          correlationId,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      message: 'Target verified successfully',
      method: verificationResult.method,
    })
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}

function makeAuditDb(db: DbInstance): AuditDb {
  return {
    async getLastRowHash(tenantId: string): Promise<string | null> {
      const result = await db.execute(
        sql`SELECT row_hash FROM audit_log WHERE tenant_id = ${tenantId} ORDER BY created_at DESC LIMIT 1`,
      )
      const row = result.rows[0] as Record<string, unknown> | undefined
      return (row?.['row_hash'] as string) ?? null
    },
    async insertAuditRow(entry) {
      await db.execute(sql`
        INSERT INTO audit_log (id, tenant_id, actor_user_id, action, target_resource, metadata, prev_hash, row_hash, created_at)
        VALUES (${entry.id}, ${entry.tenantId}, ${entry.actorUserId}, ${entry.action}, ${entry.targetResource}, ${JSON.stringify(entry.metadata)}, ${entry.prevHash}, ${entry.rowHash}, ${entry.createdAt.toISOString()})
      `)
    },
  }
}
