import React from 'react'

export interface SparklinePing {
  success: boolean
  latencyMs: number | null
}

interface SparklineProps {
  pings?: SparklinePing[]
  maxBars?: number
  className?: string
}

export default function Sparkline({
  pings = [],
  maxBars = 20,
  className = '',
}: SparklineProps) {
  // If no pings recorded yet, render placeholder dashed tick marks
  if (pings.length === 0) {
    return (
      <div
        className={`sparkline-container ${className}`}
        title="No pings recorded yet — waiting for next scheduled run"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          height: 20,
          padding: '2px 6px',
          background: 'var(--color-surface-2)',
          borderRadius: 4,
          border: '1px solid var(--color-border)',
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: 6,
              borderRadius: 1.5,
              background: 'var(--color-border)',
              display: 'inline-block',
            }}
          />
        ))}
      </div>
    )
  }

  // Take the most recent `maxBars` (left-to-right chronological)
  const displayPings = pings.slice(-maxBars)
  // Fill remaining slots with muted placeholders if less than maxBars
  const placeholders = Math.max(0, maxBars - displayPings.length)

  // Determine min/max latency for scaling heights
  const latencies = displayPings
    .map((p) => p.latencyMs)
    .filter((ms): ms is number => ms !== null && ms > 0)
  const maxLatency = Math.max(...latencies, 150)
  const minLatency = Math.min(...latencies, 20)

  return (
    <div
      className={`sparkline-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 2,
        height: 22,
        padding: '2px 6px',
        background: 'var(--color-surface-2)',
        borderRadius: 4,
        border: '1px solid var(--color-border)',
        verticalAlign: 'middle',
      }}
    >
      {/* Placeholder bars for earlier unrecorded slots */}
      {Array.from({ length: placeholders }).map((_, i) => (
        <span
          key={`ph-${i}`}
          title="Pending / No data"
          style={{
            width: 3,
            height: 4,
            borderRadius: 1,
            background: 'var(--color-border)',
            display: 'inline-block',
            opacity: 0.5,
          }}
        />
      ))}

      {/* Actual ping bars */}
      {displayPings.map((ping, idx) => {
        const isSuccess = ping.success
        const latency = ping.latencyMs ?? 0

        // Scale height between 6px and 16px
        let barHeight = 8
        if (isSuccess && maxLatency > minLatency) {
          const ratio = Math.min(1, Math.max(0, (latency - minLatency) / (maxLatency - minLatency)))
          barHeight = Math.round(6 + ratio * 10)
        } else if (!isSuccess) {
          barHeight = 16
        }

        const color = isSuccess ? 'var(--color-success)' : 'var(--color-error)'
        const tooltip = isSuccess
          ? `${latency > 0 ? `${latency}ms` : '<20ms'} — Operational`
          : 'Failed / Unreachable'

        return (
          <span
            key={idx}
            title={tooltip}
            style={{
              width: 3,
              height: barHeight,
              borderRadius: 1.5,
              background: color,
              display: 'inline-block',
              transition: 'height 150ms ease',
            }}
          />
        )
      })}
    </div>
  )
}
