'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ScrollText,
  Lock,
} from 'lucide-react'
import type { ChainVerificationResult } from '@pyra/shared/audit'

interface AuditVerifyApiResponse {
  success: boolean
  verified: boolean
  count: number
  brokenRowId: string | null
  brokenAtIndex: number
  reason: 'genesis_mismatch' | 'prev_hash_mismatch' | 'row_hash_mismatch' | null
  timestamp: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  targetResource: string | null
  metadata: Record<string, unknown> | null
  prevHash: string
  rowHash: string
  createdAt: string
  actorUserId: string | null
}

interface ActivityViewProps {
  initialLogs: ActivityLogEntry[]
  initialVerification: ChainVerificationResult
}

export default function ActivityView({
  initialLogs,
  initialVerification,
}: ActivityViewProps) {
  const [logs] = useState<ActivityLogEntry[]>(initialLogs)
  const [verification, setVerification] = useState<ChainVerificationResult>(initialVerification)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedHash(id)
    setTimeout(() => setCopiedHash(null), 1800)
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await fetch('/api/audit/verify')
      if (res.ok) {
        const data = (await res.json()) as AuditVerifyApiResponse
        if (data.verified) {
          setVerification({
            valid: true,
            brokenAtIndex: -1,
            brokenRowId: null,
          })
        } else {
          setVerification({
            valid: false,
            brokenAtIndex: data.brokenAtIndex >= 0 ? data.brokenAtIndex : 0,
            brokenRowId: data.brokenRowId,
            reason: data.reason ?? 'row_hash_mismatch',
          })
        }
      }
    } catch {
      // Keep existing verification state on error
    } finally {
      setVerifying(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.targetResource && log.targetResource.toLowerCase().includes(search.toLowerCase())) ||
      log.rowHash.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (selectedCategory === 'all') return true
    if (selectedCategory === 'targets') return log.action.startsWith('target.')
    if (selectedCategory === 'team') return log.action.startsWith('team.') || log.action.startsWith('member.')
    if (selectedCategory === 'billing') return log.action.startsWith('billing.') || log.action.startsWith('plan.')
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ marginBottom: 6, fontSize: 24, fontWeight: 700 }}>Activity & Audit Trail</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Cryptographically verifiable SHA-256 ledger of administrative mutations, endpoint registrations, and security actions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={verifying ? 'animate-spin' : ''} />
            <span>{verifying ? 'Verifying...' : 'Verify Hash Chain'}</span>
          </button>
        </div>
      </div>

      {/* ─── Cryptographic Verification Banner ───────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: verification.valid
            ? 'linear-gradient(135deg, rgba(76, 122, 70, 0.08) 0%, var(--color-surface) 100%)'
            : 'linear-gradient(135deg, rgba(186, 26, 26, 0.12) 0%, var(--color-surface) 100%)',
          border: verification.valid
            ? '1px solid rgba(76, 122, 70, 0.25)'
            : '1px solid var(--color-error)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: verification.valid ? 'rgba(76, 122, 70, 0.15)' : 'rgba(186, 26, 26, 0.15)',
              color: verification.valid ? 'var(--color-success)' : 'var(--color-error)',
              flexShrink: 0,
            }}
          >
            {verification.valid ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                {verification.valid
                  ? 'Cryptographic Hash Chain: Intact'
                  : 'INTEGRITY ALERT: Audit Chain Broken'}
              </span>
              <span
                className={`badge ${verification.valid ? 'badge-up' : 'badge-down'}`}
                style={{ fontSize: 11, padding: '2px 8px' }}
              >
                {verification.valid ? `${logs.length} Events Verified` : 'Verification Failure'}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '3px 0 0 0' }}>
              {verification.valid
                ? 'Every row contains SHA-256(prev_hash || action || metadata || created_at). No records have been modified, omitted, or reordered.'
                : `Tampering detected at row ID ${verification.brokenRowId ?? 'unknown'} (${verification.reason ?? 'invalid link'}).`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
          <Lock size={13} />
          <span>SHA-256 Immutable Ledger</span>
        </div>
      </div>

      {/* ─── Search & Category Filters ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { id: 'all', label: 'All Events' },
            { id: 'targets', label: 'Targets' },
            { id: 'team', label: 'Team & Auth' },
            { id: 'billing', label: 'Billing' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12.5,
                fontWeight: 600,
                border: selectedCategory === cat.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: selectedCategory === cat.id ? 'var(--color-accent)' : 'var(--color-surface)',
                color: selectedCategory === cat.id ? '#FFFFFF' : 'var(--color-text)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
          <input
            type="text"
            placeholder="Search action, URL, or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              fontSize: 13,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      {/* ─── Activity Log List / Table ─────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-resting)',
          overflow: 'hidden',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: 'var(--color-accent)',
              }}
            >
              <ScrollText size={22} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 4 }}>
              {logs.length === 0 ? 'No activity events recorded yet' : 'No matching audit records'}
            </span>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto' }}>
              {logs.length === 0
                ? 'Every endpoint mutation, credential update, and team invitation will be cryptographically chained and recorded here.'
                : 'Try adjusting your search query or switching categories.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredLogs.map((log, index) => {
              const date = new Date(log.createdAt)
              const formattedDate = date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
              const isExpanded = expandedRow === log.id

              return (
                <div
                  key={log.id}
                  style={{
                    borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--color-border)' : 'none',
                    padding: '14px 20px',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 2,
                          cursor: 'pointer',
                          color: 'var(--color-text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      <span
                        className="badge"
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          padding: '3px 8px',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {log.action}
                      </span>

                      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)' }}>
                        {log.targetResource || 'Workspace'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Short hash badge with copy */}
                      <button
                        type="button"
                        onClick={() => handleCopy(log.rowHash, log.id)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontFamily: 'var(--font-mono, monospace)',
                          padding: '3px 8px',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-dim)',
                        }}
                        title={`Copy Full SHA-256: ${log.rowHash}`}
                      >
                        {copiedHash === log.id ? <Check size={11} style={{ color: 'var(--color-success)' }} /> : <Copy size={11} />}
                        <span>hash:{log.rowHash.slice(0, 8)}…</span>
                      </button>

                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Expanded cryptographic details */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        <div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', display: 'block', marginBottom: 2 }}>
                            Previous Row Hash (Chain Link)
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', wordBreak: 'break-all' }}>
                            {log.prevHash}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', display: 'block', marginBottom: 2 }}>
                            Current Row Hash (SHA-256 Checksum)
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', wordBreak: 'break-all' }}>
                            {log.rowHash}
                          </span>
                        </div>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', display: 'block', marginBottom: 4 }}>
                            Signed Payload Metadata
                          </span>
                          <pre
                            style={{
                              margin: 0,
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11.5,
                              overflowX: 'auto',
                              color: 'var(--color-text)',
                            }}
                          >
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
