import { createHash } from 'node:crypto'
import { randomUUID } from 'node:crypto'
import type { AuditAction } from './types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string
  tenantId: string
  actorUserId: string | null
  action: AuditAction
  targetResource: string | null
  metadata: Record<string, unknown> | null
  prevHash: string
  rowHash: string
  createdAt: Date
}

export interface WriteAuditLogParams {
  tenantId: string
  actorUserId: string | null
  action: AuditAction
  targetResource?: string
  metadata?: Record<string, unknown>
}

// ─── Database interface (DB-agnostic: caller passes in the query function) ───
// This keeps the audit module decoupled from Drizzle/pg specifics so it can
// be used from both the API (Drizzle) and the worker (raw pg) without circular deps.

export interface AuditDb {
  /** Returns the row_hash of the most recent audit log row for this tenant, or null if none */
  getLastRowHash(tenantId: string): Promise<string | null>
  /** Inserts a new audit log row (all fields provided) */
  insertAuditRow(entry: AuditLogEntry): Promise<void>
}

// ─── Hash computation ────────────────────────────────────────────────────────

const GENESIS_HASH = '0'.repeat(64) // Sentinel for the first row in a chain

function computeRowHash(params: {
  prevHash: string
  action: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}): string {
  const content = [
    params.prevHash,
    params.action,
    JSON.stringify(params.metadata ?? {}),
    params.createdAt.toISOString(),
  ].join('|')
  return createHash('sha256').update(content).digest('hex')
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Writes a tamper-evident audit log entry.
 *
 * Each row's hash includes the previous row's hash — any modification to a
 * historical row breaks the chain. Run `verifyAuditChain()` periodically
 * (e.g., nightly) to detect tampering.
 *
 * Must be called inside the same database transaction as the mutation it records.
 */
export async function writeAuditLog(db: AuditDb, params: WriteAuditLogParams): Promise<void> {
  const now = new Date()
  const prevHash = (await db.getLastRowHash(params.tenantId)) ?? GENESIS_HASH

  const rowHash = computeRowHash({
    prevHash,
    action: params.action,
    metadata: params.metadata ?? null,
    createdAt: now,
  })

  await db.insertAuditRow({
    id: randomUUID(),
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    action: params.action,
    targetResource: params.targetResource ?? null,
    metadata: params.metadata ?? null,
    prevHash,
    rowHash,
    createdAt: now,
  })
}

// ─── Chain verification ───────────────────────────────────────────────────────

export interface AuditChainRow {
  id: string
  prevHash: string
  rowHash: string
  action: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface ChainVerificationResult {
  valid: boolean
  /** Index of the first broken link, or -1 if chain is intact */
  brokenAtIndex: number
  /** ID of the first broken row, or null if intact */
  brokenRowId: string | null
}

/**
 * Verifies the integrity of an audit log chain for a given tenant.
 * Returns the index and ID of the first row whose hash doesn't match.
 */
export function verifyAuditChain(rows: AuditChainRow[]): ChainVerificationResult {
  if (rows.length === 0) return { valid: true, brokenAtIndex: -1, brokenRowId: null }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    const expectedHash = computeRowHash({
      prevHash: row.prevHash,
      action: row.action,
      metadata: row.metadata,
      createdAt: row.createdAt,
    })
    if (expectedHash !== row.rowHash) {
      return { valid: false, brokenAtIndex: i, brokenRowId: row.id }
    }
  }

  return { valid: true, brokenAtIndex: -1, brokenRowId: null }
}
