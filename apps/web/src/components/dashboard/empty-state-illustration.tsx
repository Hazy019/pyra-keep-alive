import React from 'react'

interface EmptyStateIllustrationProps {
  variant?: 'targets' | 'history' | 'team' | 'general'
  size?: number
}

export default function EmptyStateIllustration({
  variant = 'targets',
  size = 120,
}: EmptyStateIllustrationProps) {
  const width = size * 1.5
  const height = size

  if (variant === 'history') {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 180 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ margin: '0 auto 16px', display: 'block' }}
      >
        {/* Ambient subtle glow */}
        <circle cx="90" cy="60" r="45" fill="var(--color-accent-glow)" />

        {/* Timeline track */}
        <line x1="20" y1="60" x2="160" y2="60" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 4" />

        {/* History timeline nodes */}
        <circle cx="45" cy="60" r="6" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="2" />
        <circle cx="90" cy="60" r="10" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.5" />
        <circle cx="90" cy="60" r="3" fill="var(--color-accent)" />
        <circle cx="135" cy="60" r="6" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="2" />

        {/* Clock ticker arms inside main node */}
        <line x1="90" y1="60" x2="90" y2="54" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="60" x2="94" y2="60" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />

        {/* Signal wave bracket */}
        <path
          d="M70 36 C80 32, 100 32, 110 36"
          stroke="var(--color-text-dim)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        <path
          d="M60 84 C75 88, 105 88, 120 84"
          stroke="var(--color-text-dim)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
      </svg>
    )
  }

  // Default: 'targets' (Server endpoint + approaching pulse wave)
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ margin: '0 auto 16px', display: 'block' }}
    >
      {/* Ambient background glow behind server target */}
      <circle cx="120" cy="60" r="42" fill="var(--color-accent-glow)" />

      {/* Approaching heartbeat pulse line */}
      <path
        d="M 15 60 L 45 60 L 52 42 L 58 78 L 64 52 L 70 60 L 92 60"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Unconnected gap with dashed signal trajectory */}
      <line
        x1="92"
        y1="60"
        x2="108"
        y2="60"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeDasharray="3 3"
        opacity="0.6"
      />

      {/* Target server/endpoint module */}
      <rect
        x="108"
        y="34"
        width="56"
        height="52"
        rx="8"
        fill="var(--color-surface)"
        stroke="var(--color-text-dim)"
        strokeWidth="2"
        strokeDasharray="5 4"
      />

      {/* Server slot 1 */}
      <rect
        x="116"
        y="42"
        width="40"
        height="14"
        rx="4"
        fill="var(--color-surface-2)"
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      {/* Port indicator dots */}
      <circle cx="123" cy="49" r="2.5" fill="var(--color-success)" opacity="0.8" />
      <circle cx="131" cy="49" r="2.5" fill="var(--color-text-dim)" opacity="0.6" />
      <line x1="140" y1="49" x2="150" y2="49" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />

      {/* Server slot 2 */}
      <rect
        x="116"
        y="62"
        width="40"
        height="14"
        rx="4"
        fill="var(--color-surface-2)"
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      {/* Inactive receiver port */}
      <circle cx="123" cy="69" r="2.5" fill="var(--color-accent)" opacity="0.9" />
      <line x1="131" y1="69" x2="148" y2="69" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />

      {/* Subtle pulse antenna / connector ping ring */}
      <circle cx="108" cy="60" r="5" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2" />
      <circle cx="108" cy="60" r="2" fill="var(--color-accent)" />
    </svg>
  )
}
