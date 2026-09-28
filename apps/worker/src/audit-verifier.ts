/**
 * Audit Log Chain Verifier — scheduled background task that verifies the cryptographic
 * integrity of the audit_log hash chain across all tenant spaces.
 *
 * If any row was modified, inserted without correct linkage, or deleted from
 * the ledger, verifyAuditChain() detects the break and triggers a high-severity security alert.
 */

import { sql } from 'drizzle-orm'
import type { Db } from '@pyra/db'
import { logger } from '@pyra/shared/logger'
import { verifyAuditChain, type AuditChainRow } from '@pyra/shared/audit'

const AUDIT_VERIFY_INTERVAL_MS = Number(process.env['AUDIT_VERIFY_INTERVAL_MS'] ?? 3600_000) // 1 hour

interface AuditRowFromDb {
  id: string
  tenant_id: string
  prev_hash: string
  row_hash: string
  action: string
  metadata: unknown
  created_at: Date | string
}

export function createAuditVerifier(db: Db) {
  let timer: ReturnType<typeof setInterval> | null = null
  let initialTimeout: ReturnType<typeof setTimeout> | null = null
  let running = false

  async function verifyAllTenants(): Promise<{
    tenantsChecked: number
    totalRows: number
    violations: Array<{ tenantId: string; brokenRowId: string | null; reason?: string }>
  }> {
    const startMs = Date.now()
    logger.info({ event: 'audit.verify.start' }, 'Audit hash chain verification sweep started')

    try {
      // Fetch all audit rows ordered by tenant and creation time
      const result = await db.execute(sql`
        SELECT
          id,
          tenant_id,
          prev_hash,
          row_hash,
          action,
          metadata,
          created_at
        FROM audit_log
        ORDER BY tenant_id, created_at ASC
      `)

      const rows = result.rows as unknown as AuditRowFromDb[]

      // Group rows by tenantId
      const tenantRowsMap = new Map<string, AuditChainRow[]>()
      for (const row of rows) {
        let list = tenantRowsMap.get(row.tenant_id)
        if (!list) {
          list = []
          tenantRowsMap.set(row.tenant_id, list)
        }
        list.push({
          id: row.id,
          prevHash: row.prev_hash,
          rowHash: row.row_hash,
          action: row.action,
          metadata: (row.metadata as Record<string, unknown>) ?? null,
          createdAt: row.created_at,
        })
      }

      const violations: Array<{ tenantId: string; brokenRowId: string | null; reason?: string }> = []
      let totalRows = 0

      for (const [tenantId, tenantRows] of tenantRowsMap.entries()) {
        totalRows += tenantRows.length
        const checkResult = verifyAuditChain(tenantRows, { expectGenesis: true })
        if (!checkResult.valid) {
          const violation: { tenantId: string; brokenRowId: string | null; reason?: string } = {
            tenantId,
            brokenRowId: checkResult.brokenRowId,
          }
          if (checkResult.reason) {
            violation.reason = checkResult.reason
          }
          violations.push(violation)
          logger.error(
            {
              event: 'security.audit_chain.tampered',
              tenantId,
              brokenAtIndex: checkResult.brokenAtIndex,
              brokenRowId: checkResult.brokenRowId,
              reason: checkResult.reason,
            },
            'CRITICAL SECURITY ALERT: Audit hash chain integrity violation detected!',
          )
        }
      }

      logger.info(
        {
          event: 'audit.verify.complete',
          tenantsChecked: tenantRowsMap.size,
          totalRows,
          violationsCount: violations.length,
          durationMs: Date.now() - startMs,
        },
        violations.length === 0
          ? `Audit chain verification verified ${totalRows} rows across ${tenantRowsMap.size} tenants with zero violations`
          : `ALERT: Audit chain verification detected ${violations.length} tenant chain violation(s)!`,
      )

      return {
        tenantsChecked: tenantRowsMap.size,
        totalRows,
        violations,
      }
    } catch (err) {
      logger.error({ event: 'audit.verify.error', err }, 'Audit hash chain verification sweep failed')
      return { tenantsChecked: 0, totalRows: 0, violations: [] }
    }
  }

  return {
    start() {
      if (running) return
      running = true
      logger.info(
        { event: 'audit_verifier.start', intervalMs: AUDIT_VERIFY_INTERVAL_MS },
        'Audit log chain verifier started',
      )

      // Initial run after brief delay to avoid thundering startup
      initialTimeout = setTimeout(() => {
        void verifyAllTenants()
      }, 10_000)

      timer = setInterval(() => {
        void verifyAllTenants()
      }, AUDIT_VERIFY_INTERVAL_MS)
    },
    stop() {
      if (initialTimeout) {
        clearTimeout(initialTimeout)
        initialTimeout = null
      }
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      running = false
      logger.info({ event: 'audit_verifier.stop' }, 'Audit log chain verifier stopped')
    },
    isRunning() {
      return running
    },
    /** Exposed for testing and manual on-demand execution */
    verifyAllTenants,
  }
}
