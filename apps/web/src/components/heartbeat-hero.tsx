'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Heartbeat Hero — animated status line:
 * 1. On load, animates the heartbeat line drawing in via `stroke-dashoffset`.
 * 2. Settles into an idle pulse loop:
 *    - Normal heartbeat wave
 *    - Fades toward flatline
 *    - Ember spark re-ignites signal
 *    - Repeat
 * 3. Includes `<span className="sr-only">` accessible description alongside `aria-hidden="true"` SVG.
 * 4. Respects `prefers-reduced-motion`.
 */

const BEAT_POINTS = [
  [0, 0], [10, 0], [13, -2], [15, 0],
  [20, 0], [22, -15], [24, 35], [26, -10], [28, 0],
  [35, 0], [38, -2], [40, 0],
  [50, 0], [52, -15], [54, 35], [56, -10], [58, 0],
  [65, 0], [68, -2], [70, 0],
  [100, 0],
] as [number, number][]

function pointsToPath(points: [number, number][], width: number, height: number): string {
  const midY = height / 2
  const scaleX = width / 100
  const scaleY = height / 80

  return points
    .map(([x, y], i) => {
      const px = x * scaleX
      const py = midY - y * scaleY
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`
    })
    .join(' ')
}

export default function HeartbeatHero() {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const canvasW = 600
  const canvasH = 80
  const midY = canvasH / 2

  // Animation states
  const [isDrawn, setIsDrawn] = useState(false)
  const [drawOffset, setDrawOffset] = useState<number | null>(null)
  const [pathLength, setPathLength] = useState<number>(800)

  // Idle cycle states
  const [phase, setPhase] = useState<'beating' | 'fading' | 'sparking'>('beating')
  const [opacity, setOpacity] = useState(1)
  const [emberX, setEmberX] = useState<number | null>(null)

  // 1. Initial draw-in animation via stroke-dashoffset
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsDrawn(true)
      return
    }

    if (pathRef.current) {
      const len = pathRef.current.getTotalLength() || 800
      setPathLength(len)
      setDrawOffset(len)

      const startDrawTime = performance.now()
      const drawDuration = 1100

      const drawStep = (time: number) => {
        const elapsed = time - startDrawTime
        const progress = Math.min(1, elapsed / drawDuration)
        // Ease out quad
        const ease = 1 - (1 - progress) * (1 - progress)
        const currentOffset = len * (1 - ease)
        setDrawOffset(currentOffset)

        if (progress < 1) {
          requestAnimationFrame(drawStep)
        } else {
          setIsDrawn(true)
          setDrawOffset(0)
        }
      }

      requestAnimationFrame(drawStep)
    } else {
      setIsDrawn(true)
    }
  }, [])

  // 2. Continuous pulse loop after draw-in
  useEffect(() => {
    if (!isDrawn) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let animFrame: number
    let startTime = performance.now()
    const CYCLE_MS = 9000

    function animate(now: number) {
      const elapsed = (now - startTime) % CYCLE_MS
      const progress = elapsed / CYCLE_MS

      if (progress < 0.55) {
        setPhase('beating')
        setOpacity(1)
        setEmberX(null)
      } else if (progress < 0.85) {
        const fadeProgress = (progress - 0.55) / 0.30
        setPhase('fading')
        setOpacity(1 - fadeProgress * 0.85)
        setEmberX(null)
      } else {
        setPhase('sparking')
        setOpacity(0.15)
        const sparkProgress = (progress - 0.85) / 0.15
        setEmberX(sparkProgress * canvasW)
        if (sparkProgress > 0.95) {
          startTime = now - (CYCLE_MS * 0.02)
        }
      }

      animFrame = requestAnimationFrame(animate)
    }

    animFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrame)
  }, [isDrawn, canvasW])

  const beatPath = pointsToPath(BEAT_POINTS, canvasW, canvasH)

  return (
    <div className="heartbeat-container" style={{ position: 'relative' }}>
      {/* Screen reader accessible description */}
      <span className="sr-only">
        Real-time system pulse monitor showing active endpoint heartbeat signal and uptime telemetry.
      </span>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="heartbeat-svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Subtle grid line */}
        <line
          x1="0"
          y1={midY}
          x2={canvasW}
          y2={midY}
          stroke="var(--color-border)"
          strokeWidth="1"
        />

        {/* Flatline: appears as heartbeat fades or before spark */}
        <line
          x1="0"
          y1={midY}
          x2={canvasW}
          y2={midY}
          stroke="var(--color-border)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isDrawn && phase === 'sparking' ? 0.8 : isDrawn && phase === 'fading' ? 1 - opacity : 0}
        />

        {/* Primary heartbeat path */}
        <path
          ref={pathRef}
          d={beatPath}
          className="heartbeat-line"
          style={
            !isDrawn && drawOffset !== null
              ? {
                  strokeDasharray: pathLength,
                  strokeDashoffset: drawOffset,
                }
              : {
                  opacity,
                }
          }
        />

        {/* Ember spark re-igniting the signal */}
        {isDrawn && phase === 'sparking' && emberX !== null && (
          <>
            {/* Trail */}
            <path
              d={`M ${Math.max(0, emberX - 60)} ${midY} L ${emberX} ${midY}`}
              stroke="var(--color-accent)"
              strokeWidth="2.5"
              opacity="0.4"
              strokeLinecap="round"
            />
            {/* Spark point */}
            <circle cx={emberX} cy={midY} r="4" className="ember-dot" />
            {/* Glow ring */}
            <circle
              cx={emberX}
              cy={midY}
              r="8"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              opacity="0.35"
            />
          </>
        )}
      </svg>
    </div>
  )
}
