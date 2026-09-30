'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  Zap,
  Filter,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'
import EmptyStateIllustration from '@/components/dashboard/empty-state-illustration'

export interface PingLogItem {
  id: string
  targetUrl: string | null
  success: boolean
  statusCode: number | null
  latencyMs: number | null
  ranAt: string | Date
}

interface HistoryTableProps {
  logs: PingLogItem[]
}

type StatusFilter = 'all' | 'success' | 'failed' | 'slow'

export default function HistoryTable({ logs: initialLogs }: HistoryTableProps) {
  const [logs, setLogs] = useState<PingLogItem[]>(initialLogs)
  const [isLive, setIsLive] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [, setLastUpdated] = useState<Date>(new Date())
  const [, setTick] = useState(0)

  // Sync prop changes if parent component re-renders
  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  // Live timer tick every 1s so relative times like '10s ago' update dynamically
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(tickInterval)
  }, [])

  // Auto-polling for real-time updates
  const fetchLatestLogs = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true)
    try {
      const res = await fetch('/api/history?limit=100', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (res.ok) {
        const data = (await res.json()) as { logs?: PingLogItem[] }
        if (Array.isArray(data.logs)) {
          setLogs(data.logs)
          setLastUpdated(new Date())
        }
      }
    } catch (err) {
      console.error('[HistoryTable] Polling error:', err)
    } finally {
      if (isManual) setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchLatestLogs(false)
      }
    }, 5000) // Poll every 5s for real-time updates
    return () => clearInterval(interval)
  }, [isLive, fetchLatestLogs])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [pageSize, setPageSize] = useState<number>(8)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Compute status counts for filter tabs
  const counts = useMemo(() => {
    let success = 0
    let failed = 0
    let slow = 0
    for (const log of logs) {
      if (log.success) success++
      else failed++
      if (log.latencyMs !== null && log.latencyMs > 250) slow++
    }
    return { all: logs.length, success, failed, slow }
  }, [logs])

  // Filter logs by search and status tab
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Status filter
      if (filter === 'success' && !log.success) return false
      if (filter === 'failed' && log.success) return false
      if (filter === 'slow' && (log.latencyMs === null || log.latencyMs <= 250)) return false

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase()
        const urlMatch = log.targetUrl?.toLowerCase().includes(query) ?? false
        const codeMatch = log.statusCode?.toString().includes(query) ?? false
        if (!urlMatch && !codeMatch) return false
      }

      return true
    })
  }, [logs, filter, search])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredLogs.length)
  const currentLogs = filteredLogs.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleCopyUrl = (id: string, url: string | null) => {
    if (!url) return
    void navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const formatRelativeTime = (dateInput: string | Date) => {
    const date = new Date(dateInput)
    const now = new Date()
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)

    if (diffSeconds < 60) return `${Math.max(1, diffSeconds)}s ago`
    const diffMinutes = Math.round(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (logs.length === 0) {
    return (
      <div className="history-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            title={isLive ? 'Live polling active (every 5s) — click to pause' : 'Live polling paused — click to resume'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: isLive ? 'rgba(34, 197, 94, 0.1)' : 'var(--color-surface-2)',
              border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.3)' : 'var(--color-border)'}`,
              fontSize: 11.5,
              fontWeight: 600,
              color: isLive ? 'var(--color-success)' : 'var(--color-text-dim)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isLive ? 'var(--color-success)' : 'var(--color-text-dim)',
                boxShadow: isLive ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none',
              }}
            />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </button>
          <button
            type="button"
            onClick={() => void fetchLatestLogs(true)}
            disabled={isRefreshing}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', height: 28, fontSize: 12, gap: 5, color: 'var(--color-text-muted)' }}
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: 'var(--color-text-muted)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <EmptyStateIllustration variant="history" size={120} />
          <h5 style={{ marginBottom: 6, color: 'var(--color-text)' }}>No ping logs captured yet</h5>
          <p style={{ fontSize: 14, maxWidth: 380, margin: '0 auto 24px' }}>
            When scheduled background pings run against your registered endpoints, their response codes and latencies will stream into this container.
          </p>
          <a href="/dashboard/targets" className="btn btn-primary btn-sm">
            View targets
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      {/* ─── Toolbar: Mobile-Fluid Search + Non-Wrapping Filter Track ─────── */}
      <div className="history-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Filter by endpoint or status code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="input"
            style={{
              paddingLeft: 34,
              paddingRight: 12,
              height: 38,
              fontSize: 13,
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter Pills Track + Rows Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'nowrap' }}>
          {/* Swipeable Pill Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              paddingBottom: 2,
              flex: 1,
              minWidth: 0,
            }}
          >
            <button
              type="button"
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => {
                setFilter('all')
                setCurrentPage(1)
              }}
            >
              All <span style={{ opacity: 0.7, fontSize: 11.5 }}>({counts.all})</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'success' ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => {
                setFilter('success')
                setCurrentPage(1)
              }}
            >
              <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
              Success <span style={{ opacity: 0.7, fontSize: 11.5 }}>({counts.success})</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'failed' ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => {
                setFilter('failed')
                setCurrentPage(1)
              }}
            >
              <XCircle size={12} style={{ color: 'var(--color-error)' }} />
              Failed <span style={{ opacity: 0.7, fontSize: 11.5 }}>({counts.failed})</span>
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'slow' ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => {
                setFilter('slow')
                setCurrentPage(1)
              }}
            >
              <Zap size={12} style={{ color: 'var(--color-accent)' }} />
              Slow <span style={{ opacity: 0.7, fontSize: 11.5 }}>({counts.slow})</span>
            </button>
          </div>

          {/* Live Controls & Rows Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Live Toggle Pill */}
            <button
              type="button"
              onClick={() => setIsLive(!isLive)}
              title={isLive ? 'Live polling active (every 5s) — click to pause' : 'Live polling paused — click to resume'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: isLive ? 'rgba(34, 197, 94, 0.1)' : 'var(--color-surface-2)',
                border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.3)' : 'var(--color-border)'}`,
                fontSize: 11.5,
                fontWeight: 600,
                color: isLive ? 'var(--color-success)' : 'var(--color-text-dim)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isLive ? 'var(--color-success)' : 'var(--color-text-dim)',
                  boxShadow: isLive ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none',
                  display: 'inline-block',
                }}
              />
              <span>{isLive ? 'Live' : 'Paused'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => void fetchLatestLogs(true)}
              disabled={isRefreshing}
              className="btn btn-ghost btn-sm"
              title="Poll latest logs now"
              style={{
                padding: '4px 8px',
                height: 28,
                fontSize: 12,
                gap: 5,
                color: 'var(--color-text-muted)',
              }}
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Rows Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                style={{
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP VIEW: High-Density Data Grid (>= 768px) ──────────────── */}
      <div className="history-desktop-table" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 320 }}>
        <table style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>Target Endpoint</th>
              <th>Status</th>
              <th>HTTP Code</th>
              <th>Round-Trip Latency</th>
              <th>Execution Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Filter size={24} style={{ opacity: 0.5, color: 'var(--color-accent)' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No execution logs match the selected filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentLogs.map((p) => {
                const isCopied = copiedId === p.id
                const isFast = p.latencyMs !== null && p.latencyMs < 100
                const isModerate = p.latencyMs !== null && p.latencyMs >= 100 && p.latencyMs <= 300

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          <Globe size={13} />
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'var(--color-text)',
                            }}
                            className="truncate"
                          >
                            {p.targetUrl ?? 'Unknown Target'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(p.id, p.targetUrl)}
                            title="Copy URL"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: 4,
                              cursor: 'pointer',
                              color: isCopied ? 'var(--color-success)' : 'var(--color-text-dim)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.success ? (
                        <span className="badge badge-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={12} /> Success
                        </span>
                      ) : (
                        <span className="badge badge-down" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <XCircle size={12} /> Failed
                        </span>
                      )}
                    </td>
                    <td>
                      {p.statusCode ? (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background:
                              p.statusCode >= 200 && p.statusCode < 300
                                ? 'var(--tint-success-bg)'
                                : p.statusCode >= 500
                                  ? 'var(--tint-danger-bg)'
                                  : 'var(--color-surface-2)',
                            color:
                              p.statusCode >= 200 && p.statusCode < 300
                                ? 'var(--color-success)'
                                : p.statusCode >= 500
                                  ? 'var(--color-error)'
                                  : 'var(--color-text-muted)',
                            border: `1px solid ${
                              p.statusCode >= 200 && p.statusCode < 300
                                ? 'var(--tint-success-border)'
                                : p.statusCode >= 500
                                  ? 'var(--tint-danger-border)'
                                  : 'var(--color-border)'
                            }`,
                          }}
                        >
                          {p.statusCode}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-dim)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td>
                      {p.latencyMs !== null ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: isFast
                                ? 'var(--color-success)'
                                : isModerate
                                  ? 'var(--color-accent)'
                                  : 'var(--color-error)',
                            }}
                          />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>
                            {p.latencyMs}ms
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-dim)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                          {new Date(p.ranAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                          })}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 18 }}>
                          {formatRelativeTime(p.ranAt)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── MOBILE VIEW: Adaptive Responsive Cards Stream (< 768px) ──────── */}
      <div className="history-mobile-cards">
        {currentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--color-text-muted)' }}>
            <Filter size={24} style={{ opacity: 0.5, color: 'var(--color-accent)', margin: '0 auto 8px', display: 'block' }} />
            <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>No execution logs match your filter.</p>
          </div>
        ) : (
          currentLogs.map((p) => {
            const isCopied = copiedId === p.id
            const isFast = p.latencyMs !== null && p.latencyMs < 100
            const isModerate = p.latencyMs !== null && p.latencyMs >= 100 && p.latencyMs <= 300

            return (
              <div key={p.id} className="history-log-card">
                {/* Top Row: URL + Status Code Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <Globe size={12} />
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        minWidth: 0,
                      }}
                      className="truncate"
                    >
                      {p.targetUrl ?? 'Unknown Target'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(p.id, p.targetUrl)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 2,
                        cursor: 'pointer',
                        color: isCopied ? 'var(--color-success)' : 'var(--color-text-dim)',
                        flexShrink: 0,
                      }}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* HTTP Status Code Pill */}
                  {p.statusCode && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background:
                          p.statusCode >= 200 && p.statusCode < 300
                            ? 'var(--tint-success-bg)'
                            : p.statusCode >= 500
                              ? 'var(--tint-danger-bg)'
                              : 'var(--color-surface-2)',
                        color:
                          p.statusCode >= 200 && p.statusCode < 300
                            ? 'var(--color-success)'
                            : p.statusCode >= 500
                              ? 'var(--color-error)'
                              : 'var(--color-text-muted)',
                        border: `1px solid ${
                          p.statusCode >= 200 && p.statusCode < 300
                            ? 'var(--tint-success-border)'
                            : p.statusCode >= 500
                              ? 'var(--tint-danger-border)'
                              : 'var(--color-border)'
                        }`,
                        flexShrink: 0,
                      }}
                    >
                      {p.statusCode}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Status + Latency + Timestamp */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 10,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.success ? (
                      <span className="badge badge-up" style={{ fontSize: 11, padding: '2px 6px' }}>
                        <CheckCircle2 size={10} /> Success
                      </span>
                    ) : (
                      <span className="badge badge-down" style={{ fontSize: 11, padding: '2px 6px' }}>
                        <XCircle size={10} /> Failed
                      </span>
                    )}

                    {p.latencyMs !== null && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isFast
                              ? 'var(--color-success)'
                              : isModerate
                                ? 'var(--color-accent)'
                                : 'var(--color-error)',
                          }}
                        />
                        {p.latencyMs}ms
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      color: 'var(--color-text-dim)',
                      fontSize: 11.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Clock size={11} />
                    {formatRelativeTime(p.ranAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ─── Pagination Footer ────────────────────────────────────────────── */}
      <div className="pagination-footer">
        <div>
          {filteredLogs.length > 0 ? (
            <span style={{ fontSize: 12.5 }}>
              Showing <strong style={{ color: 'var(--color-text)' }}>{startIndex + 1}–{endIndex}</strong> of{' '}
              <strong style={{ color: 'var(--color-text)' }}>{filteredLogs.length}</strong> logs
            </span>
          ) : (
            <span style={{ fontSize: 12.5 }}>No logs found</span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              aria-label="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= safeCurrentPage - 1 && page <= safeCurrentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    type="button"
                    className={`pagination-btn ${safeCurrentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              }
              if (page === safeCurrentPage - 2 || page === safeCurrentPage + 2) {
                return (
                  <span key={page} style={{ padding: '0 4px', color: 'var(--color-text-dim)', fontSize: 12 }}>
                    …
                  </span>
                )
              }
              return null
            })}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              aria-label="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
