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
import { requireRoleApi } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { getTarget, verifyTarget } from '@/lib/repositories/target.repo'
import { AUDIT_ACTIONS } from '@pyra/shared/types'
import { sql } from 'drizzle-orm'
import type { DbInstance } from '@/lib/db'
import type { AuditDb } from '@pyra/shared/audit'
import { writeAuditLog } from '@pyra/shared/audit'
import { validateTargetUrl } from '@pyra/shared/ssrf'
import { checkRateLimit, targetVerifyRatelimit } from '@/lib/ratelimit'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, ctx: RouteContext) {
  const correlationId = randomUUID()
  try {
    const { id } = await ctx.params
    const sessionCtx = await requireRoleApi('member')

    // Rate limit: max 10 verification attempts per minute per tenant/target
    const rateLimit = await checkRateLimit(targetVerifyRatelimit, `${sessionCtx.tenantId}:${id}`)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        },
      )
    }

    const verificationResult = await withTenant(sessionCtx.tenantId, async (db) => {
      const target = await getTarget(db, sessionCtx.tenantId, id)
      if (!target) return { status: 'not_found' as const }
      if (target.verified) return { status: 'already_verified' as const }

      const token = target.verificationToken
      if (!token) return { status: 'no_token' as const }

      const parsed = new URL(target.url)
      const hostname = parsed.hostname

      let verified = false
      let method = ''

      // ─── 1. Direct Target URL Probe (HTML <meta>, HTTP Header, JSON) ─────
      // Ideal for Vercel, Render, Railway, Fly, and SPA apps on cloud subdomains
      try {
        await validateTargetUrl(target.url)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 6000)

        const response = await fetch(target.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Pyra-Verification/1.0 (+https://pyra-keep-alive-web.vercel.app)',
            'Accept': '*/*',
          },
          redirect: 'follow',
          signal: controller.signal,
        })
        clearTimeout(timeout)

        // 1a. Check HTTP Response Headers
        const headerVal = response.headers.get('x-pyra-verification') ||
          response.headers.get('pyra-verification') ||
          response.headers.get('x-pyra-token')

        if (headerVal && (headerVal.trim() === token || headerVal.trim() === `pyra-verify=${token}`)) {
          verified = true
          method = 'http_header'
        }

        // 1b. Check Response Body (HTML <meta> tag or JSON payload)
        if (!verified && response.ok) {
          const bodyText = await response.text()
          // Truncate check to first 128KB to prevent regex DOS on huge responses
          const sample = bodyText.slice(0, 131072)

          // HTML <meta> tag: <meta name="pyra-verification" content="..."> or <meta content="..." name="pyra-verification">
          const metaRegex = /<meta\s+[^>]*?(?:name=["'](?:pyra-verification|pyra_verification)["'][^>]*?content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*?name=["'](?:pyra-verification|pyra_verification)["'])[^>]*>/i
          const metaMatch = sample.match(metaRegex)
          if (metaMatch) {
            const extractedToken = (metaMatch[1] || metaMatch[2] || '').trim()
            if (extractedToken === token || extractedToken === `pyra-verify=${token}`) {
              verified = true
              method = 'html_meta'
            }
          }

          // JSON response: { "pyra": "...", "status": "ok" } or { "pyra_verification": "..." }
          if (!verified && (sample.trimStart().startsWith('{') || sample.trimStart().startsWith('['))) {
            try {
              const json = JSON.parse(sample) as Record<string, unknown>
              if (
                json['pyra'] === token ||
                json['pyra_verification'] === token ||
                json['pyra_verify'] === token ||
                json['pyra_challenge'] === token ||
                json['token'] === token
              ) {
                verified = true
                method = 'json_response'
              }
            } catch (_err) {
              // Not valid JSON, continue
            }
          }
        }
      } catch (_err) {
        // Direct probe failed, fallback to well-known & DNS
      }

      // ─── 2. Well-Known HTTP Route ──────────────────────────────────────────
      if (!verified) {
        const wellKnownPaths = ['/.well-known/pyra-challenge', '/.well-known/pyra-verify']
        for (const path of wellKnownPaths) {
          try {
            const wellKnownUrl = `${parsed.protocol}//${hostname}${path}`
            await validateTargetUrl(wellKnownUrl) // SSRF check

            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 5000)
            const response = await fetch(wellKnownUrl, {
              headers: { 'User-Agent': 'Pyra-Verification/1.0' },
              signal: controller.signal,
            })
            clearTimeout(timeout)

            if (response.ok) {
              const text = (await response.text()).trim()
              if (text === token || text === `pyra-verify=${token}`) {
                verified = true
                method = 'well_known'
                break
              }
            }
          } catch {
            // Well-known candidate failed
          }
        }
      }

      // ─── 3. DNS TXT Record (Custom apex domains) ───────────────────────────
      if (!verified) {
        const dnsCandidates = [`_pyra-challenge.${hostname}`, `_pyra-verify.${hostname}`]
        for (const hostCandidate of dnsCandidates) {
          try {
            const txtRecords = await dns.resolveTxt(hostCandidate)
            const flat = txtRecords.flat()
            if (flat.some((r) => r === `pyra-verify=${token}` || r === token)) {
              verified = true
              method = 'dns_txt'
              break
            }
          } catch {
            // Candidate failed, try next
          }
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
          error:
            'Verification check failed. We checked: 1) HTML <meta> tag, 2) HTTP x-pyra-verification header, 3) JSON pyra property, 4) /.well-known/pyra-challenge, and 5) DNS TXT. None matched your token.',
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
