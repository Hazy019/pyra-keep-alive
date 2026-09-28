import { describe, it, expect } from 'vitest'
import {
  GENESIS_HASH,
  computeRowHash,
  verifyAuditChain,
  type AuditChainRow,
} from '../audit'

function makeChain(count: number): AuditChainRow[] {
  const rows: AuditChainRow[] = []
  let prevHash = GENESIS_HASH

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(1700000000000 + i * 60000)
    const action = `target.event_${i}`
    const metadata = { index: i, note: `event ${i}` }
    const rowHash = computeRowHash({
      prevHash,
      action,
      metadata,
      createdAt,
    })

    rows.push({
      id: `row-${i}`,
      prevHash,
      rowHash,
      action,
      metadata,
      createdAt,
    })

    prevHash = rowHash
  }

  return rows
}

describe('verifyAuditChain', () => {
  it('returns valid for empty chains', () => {
    const result = verifyAuditChain([])
    expect(result.valid).toBe(true)
    expect(result.brokenAtIndex).toBe(-1)
    expect(result.brokenRowId).toBeNull()
  })

  it('validates a single intact genesis entry', () => {
    const chain = makeChain(1)
    const result = verifyAuditChain(chain, { expectGenesis: true })
    expect(result.valid).toBe(true)
    expect(result.brokenAtIndex).toBe(-1)
  })

  it('validates a multi-step intact chain', () => {
    const chain = makeChain(5)
    const result = verifyAuditChain(chain, { expectGenesis: true })
    expect(result.valid).toBe(true)
    expect(result.brokenAtIndex).toBe(-1)
  })

  it('detects content tampering in a row (row_hash_mismatch)', () => {
    const chain = makeChain(4)
    // Tamper with row 2's action
    chain[2]!.action = 'malicious.action'
    const result = verifyAuditChain(chain)
    expect(result.valid).toBe(false)
    expect(result.brokenAtIndex).toBe(2)
    expect(result.brokenRowId).toBe('row-2')
    expect(result.reason).toBe('row_hash_mismatch')
  })

  it('detects metadata tampering in a row', () => {
    const chain = makeChain(3)
    chain[1]!.metadata = { tampered: true }
    const result = verifyAuditChain(chain)
    expect(result.valid).toBe(false)
    expect(result.brokenAtIndex).toBe(1)
    expect(result.brokenRowId).toBe('row-1')
    expect(result.reason).toBe('row_hash_mismatch')
  })

  it('detects row deletion in the middle (prev_hash_mismatch)', () => {
    const chain = makeChain(4)
    // Delete row 1: chain now has row 0, row 2, row 3
    const brokenChain = [chain[0]!, chain[2]!, chain[3]!]
    const result = verifyAuditChain(brokenChain)
    expect(result.valid).toBe(false)
    expect(result.brokenAtIndex).toBe(1) // broken at index 1 (which is row-2)
    expect(result.brokenRowId).toBe('row-2')
    expect(result.reason).toBe('prev_hash_mismatch')
  })

  it('detects invalid genesis hash when expectGenesis is true', () => {
    const chain = makeChain(2)
    chain[0]!.prevHash = 'a'.repeat(64)
    // Recompute rowHash for row[0] so rowHash itself is internally consistent
    chain[0]!.rowHash = computeRowHash({
      prevHash: chain[0]!.prevHash,
      action: chain[0]!.action,
      metadata: chain[0]!.metadata,
      createdAt: chain[0]!.createdAt,
    })
    // And update row[1].prevHash
    chain[1]!.prevHash = chain[0]!.rowHash
    chain[1]!.rowHash = computeRowHash({
      prevHash: chain[1]!.prevHash,
      action: chain[1]!.action,
      metadata: chain[1]!.metadata,
      createdAt: chain[1]!.createdAt,
    })

    const result = verifyAuditChain(chain, { expectGenesis: true })
    expect(result.valid).toBe(false)
    expect(result.brokenAtIndex).toBe(0)
    expect(result.reason).toBe('genesis_mismatch')
  })
})
