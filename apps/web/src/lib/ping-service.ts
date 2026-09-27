/**
 * Ping Service — provides pre-flight handshake and manual live pings.
 * Reusable between target creation (pre-flight probe) and manual ping endpoints.
 */

import { validateTargetUrl } from '@pyra/shared/ssrf'
import { pingLogs, targets } from '@pyra/db/schema'
import { eq, sql } from 'drizzle-orm'
import type { DbInstance } from '@/lib/db'

export function normalizePingUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const isSupabase =
      parsed.hostname.endsWith('.supabase.co') ||
      parsed.hostname.endsWith('.supabase.in')

    if (isSupabase && (parsed.pathname === '/' || parsed.pathname === '')) {
      parsed.pathname = '/rest/v1/'
      return parsed.toString()
    }
    return url
  } catch (_err) {
    return url
  }
}

export function buildPingHeaders(url: string, decryptedAuthHeader?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'Pyra-KeepAlive/1.0 (+https://pyra.dev)',
  }

  let isSupabase = false
  try {
    const parsed = new URL(url)
    isSupabase =
      parsed.hostname.endsWith('.supabase.co') ||
      parsed.hostname.endsWith('.supabase.in')
  } catch (_err) {
    // fallback
  }

  if (isSupabase) {
    headers['Accept'] = 'application/json'
  }

  if (!decryptedAuthHeader) {
    return headers
  }

  const trimmed = decryptedAuthHeader.trim()
  if (!trimmed) {
    return headers
  }

  const rawToken = trimmed.replace(/^Bearer\s+/i, '').trim()
  const isJwt = rawToken.startsWith('eyJ')

  if (isSupabase || isJwt) {
    headers['apikey'] = rawToken
    headers['Authorization'] = `Bearer ${rawToken}`
  } else {
    const formattedAuth =
      trimmed.startsWith('Bearer ') || trimmed.startsWith('Basic ')
        ? trimmed
        : `Bearer ${trimmed}`
    headers['Authorization'] = formattedAuth
  }

  return headers
}

export interface PingResult {
  success: boolean
  statusCode: number | null
  latencyMs: number | null
  errorMessage: string | null
  ranAt: Date
}

export async function executePing(
  db: DbInstance,
  tenantId: string,
  targetId: string,
  targetUrl: string,
  decryptedAuthHeader?: string | null,
): Promise<PingResult> {
  const normalized = normalizePingUrl(targetUrl)
  await validateTargetUrl(normalized)

  const headers = buildPingHeaders(normalized, decryptedAuthHeader)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  const startTime = Date.now()
  let statusCode: number | null = null
  let success = false
  let errorMessage: string | null = null

  try {
    const res = await fetch(normalized, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'follow',
    })
    statusCode = res.status
    success = res.status >= 200 && res.status < 400
    if (!success) {
      errorMessage = `HTTP ${res.status} ${res.statusText}`
    }
  } catch (err) {
    success = false
    errorMessage = err instanceof Error ? err.message : String(err)
  } finally {
    clearTimeout(timeoutId)
  }

  const latencyMs = Date.now() - startTime
  const ranAt = new Date()

  // Record ping log
  try {
    await db.insert(pingLogs).values({
      targetId,
      tenantId,
      statusCode,
      success,
      latencyMs,
      errorMessage,
      ranAt,
    })

    // Update target consecutive failures
    if (success) {
      await db
        .update(targets)
        .set({
          consecutiveFailures: 0,
        })
        .where(eq(targets.id, targetId))
    } else {
      await db
        .update(targets)
        .set({
          consecutiveFailures: sql`${targets.consecutiveFailures} + 1`,
        })
        .where(eq(targets.id, targetId))
    }
  } catch (dbErr) {
    console.warn('[executePing] Failed to write ping log to DB:', dbErr)
  }

  return {
    success,
    statusCode,
    latencyMs,
    errorMessage,
    ranAt,
  }
}
