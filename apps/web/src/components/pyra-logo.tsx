import React from 'react'

interface PyraLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  showWordmark?: boolean
  wordmarkClassName?: string
}

export function PyraIcon({
  size = 28,
  className = '',
  ...props
}: Omit<PyraLogoProps, 'showWordmark'>) {
  return (
    <svg
      width={size}
      height={(size * 100) / 120}
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <filter id="pyra-glow-filter" x="35" y="-10" width="50" height="50" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Pulse line matching system/theme text color */}
      <path
        d="M10 54 H26 L33 44 L41 68 L48 54 L60 22 L72 82 L82 44 L90 62 L96 54 H110"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Apex beacon dot glowing with brand ember */}
      <circle
        cx="60"
        cy="12"
        r="5.5"
        fill="var(--color-accent, #E8622C)"
        filter="url(#pyra-glow-filter)"
      />
    </svg>
  )
}

export default function PyraLogo({
  size = 28,
  showWordmark = true,
  className = '',
  wordmarkClassName = '',
  ...props
}: PyraLogoProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--color-text, #14161B)',
      }}
      className={className}
    >
      <PyraIcon size={size} {...props} />
      {showWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            fontSize: `${size * 0.72}px`,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
          className={wordmarkClassName}
        >
          Pyr<span style={{ color: 'var(--color-accent, #E8622C)' }}>a</span>
        </span>
      )}
    </div>
  )
}
