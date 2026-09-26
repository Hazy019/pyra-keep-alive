'use client'

import { useEffect, useRef } from 'react'

/**
 * Heartbeat Hero — Continuous ECG Telemetry Wave
 *
 * Implements an authentic, continuously scrolling vitals monitor:
 * 1. Motion never stops: ECG waveform scrolls continuously via direct DOM transforms in requestAnimationFrame (0 React re-renders).
 * 2. Rare flatline-and-recovery accent: Every 24–42 seconds (randomized), a transient flatline occurs for ~2.5s,
 *    an ember beacon sparks and re-ignites the pulse signal, returning to steady-state ECG monitoring.
 * 3. Accessibility: Respects prefers-reduced-motion by rendering a crisp, static beat.
 */

const UNIT_WIDTH = 180
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 80
const MID_Y = CANVAS_HEIGHT / 2
const SCROLL_SPEED = 75 // pixels per second

// Normalized ECG profile within a single 180px unit
// x offset (0-180), y displacement from baseline (positive = up, negative = down)
const ECG_UNIT_POINTS: [number, number][] = [
  [0, 0],
  [25, 0],
  // P-wave
  [33, 3],
  [40, 5],
  [47, 0],
  [60, 0],
  // Q-dip
  [65, -5],
  // R-peak (high amplitude heartbeat spike)
  [73, 30],
  // S-dip (deep deflection)
  [81, -16],
  [88, 0],
  // ST-segment
  [100, 0],
  // T-wave
  [110, 6],
  [120, 8],
  [130, 0],
  [180, 0],
]

function generateContinuousEcgPath(numUnits: number): string {
  const points: [number, number][] = []

  for (let u = 0; u < numUnits; u++) {
    const xBase = u * UNIT_WIDTH
    for (const [x, y] of ECG_UNIT_POINTS) {
      points.push([xBase + x, MID_Y - y])
    }
  }

  return points
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`)
    .join(' ')
}

// 5 units = 900px, guarantees seamless coverage for 600px canvas across 180px wrapping
const ECG_CONTINUOUS_PATH = generateContinuousEcgPath(5)

// Static reduced-motion single beat path
const STATIC_ECG_PATH = pointsToPathCentered([
  [0, 0],
  [40, 0],
  [46, 3],
  [50, 0],
  [53, -5],
  [58, 30],
  [63, -16],
  [68, 0],
  [76, 7],
  [84, 0],
  [100, 0],
], CANVAS_WIDTH, CANVAS_HEIGHT)

function pointsToPathCentered(points: [number, number][], width: number, height: number): string {
  const midY = height / 2
  const scaleX = width / 100
  return points
    .map(([x, y], i) => {
      const px = x * scaleX
      const py = midY - y
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`
    })
    .join(' ')
}

export default function HeartbeatHero() {
  const waveGroupRef = useRef<SVGGElement>(null)
  const flatlineRef = useRef<SVGLineElement>(null)
  const sparkGroupRef = useRef<SVGGElement>(null)
  const sparkDotRef = useRef<SVGCircleElement>(null)
  const sparkTrailRef = useRef<SVGPathElement>(null)
  const sparkRingRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    // 1. Accessibility guard: prefers-reduced-motion displays static wave without loop
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let animFrame: number
    let lastTime = performance.now()
    let scrollPos = 0

    // Schedule the first rare incident (between 24s and 42s)
    const getRandomInterval = () => (24 + Math.random() * 18) * 1000
    let nextIncidentTime = lastTime + getRandomInterval()
    let incidentState: 'idle' | 'flatlining' | 'recovering' = 'idle'
    let incidentStartTime = 0
    const INCIDENT_DURATION = 2800 // Total transient duration (flatline + ember reignition)

    function loop(now: number) {
      const dt = Math.min(100, now - lastTime) // Clamp delta to avoid large jump on tab focus
      lastTime = now

      // Check if time to trigger rare incident
      if (incidentState === 'idle' && now >= nextIncidentTime) {
        incidentState = 'flatlining'
        incidentStartTime = now
      }

      if (incidentState === 'idle') {
        // Normal continuous ECG telemetry scroll
        scrollPos = (scrollPos + (SCROLL_SPEED * dt) / 1000) % UNIT_WIDTH
        if (waveGroupRef.current) {
          waveGroupRef.current.style.transform = `translate3d(-${scrollPos.toFixed(2)}px, 0, 0)`
          waveGroupRef.current.style.opacity = '1'
        }
        if (flatlineRef.current) {
          flatlineRef.current.style.opacity = '0'
        }
        if (sparkGroupRef.current) {
          sparkGroupRef.current.style.display = 'none'
        }
      } else {
        // Rare flatline accent & recovery sequence
        const progress = Math.min(1, (now - incidentStartTime) / INCIDENT_DURATION)

        if (progress < 0.45) {
          // Transition into flatline
          const fade = progress / 0.45
          if (waveGroupRef.current) {
            waveGroupRef.current.style.opacity = `${(1 - fade).toFixed(3)}`
          }
          if (flatlineRef.current) {
            flatlineRef.current.style.opacity = `${(fade * 0.9).toFixed(3)}`
          }
          if (sparkGroupRef.current) {
            sparkGroupRef.current.style.display = 'none'
          }
        } else if (progress < 0.85) {
          // Ember beacon sweeps across to reignite signal
          const sparkProgress = (progress - 0.45) / 0.40
          const emberX = sparkProgress * (CANVAS_WIDTH + 80) - 20

          if (waveGroupRef.current) {
            waveGroupRef.current.style.opacity = '0'
          }
          if (flatlineRef.current) {
            flatlineRef.current.style.opacity = '0.9'
          }
          if (sparkGroupRef.current) {
            sparkGroupRef.current.style.display = 'block'
          }
          if (sparkDotRef.current) {
            sparkDotRef.current.setAttribute('cx', emberX.toFixed(1))
          }
          if (sparkRingRef.current) {
            sparkRingRef.current.setAttribute('cx', emberX.toFixed(1))
          }
          if (sparkTrailRef.current) {
            const startX = Math.max(0, emberX - 70)
            sparkTrailRef.current.setAttribute('d', `M ${startX} ${MID_Y} L ${emberX} ${MID_Y}`)
          }
        } else {
          // Signal re-ignited: ECG returns to full amplitude
          const recoverProgress = (progress - 0.85) / 0.15
          if (sparkGroupRef.current) {
            sparkGroupRef.current.style.display = 'none'
          }
          if (flatlineRef.current) {
            flatlineRef.current.style.opacity = `${(1 - recoverProgress) * 0.9}`
          }
          if (waveGroupRef.current) {
            waveGroupRef.current.style.opacity = `${recoverProgress.toFixed(3)}`
          }

          if (progress >= 1) {
            incidentState = 'idle'
            nextIncidentTime = now + getRandomInterval()
          }
        }
      }

      animFrame = requestAnimationFrame(loop)
    }

    animFrame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  return (
    <div className="heartbeat-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Screen reader accessible description */}
      <span className="sr-only">
        Real-time system pulse monitor showing active continuous endpoint heartbeat signal and uptime telemetry.
      </span>

      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className="heartbeat-svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Isoelectric background grid datum line */}
        <line
          x1="0"
          y1={MID_Y}
          x2={CANVAS_WIDTH}
          y2={MID_Y}
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* Transient flatline during rare recovery accent */}
        <line
          ref={flatlineRef}
          x1="0"
          y1={MID_Y}
          x2={CANVAS_WIDTH}
          y2={MID_Y}
          stroke="var(--color-border)"
          strokeWidth="1.5"
          opacity="0"
          style={{ transition: 'opacity 0.2s ease' }}
        />

        {/* Continuously scrolling ECG wave group */}
        <g ref={waveGroupRef} style={{ willChange: 'transform' }}>
          <path
            d={ECG_CONTINUOUS_PATH}
            className="heartbeat-line"
            style={{
              vectorEffect: 'non-scaling-stroke',
            }}
          />
        </g>

        {/* Static fallback for reduced motion users */}
        <path
          d={STATIC_ECG_PATH}
          className="heartbeat-line"
          style={{
            display: 'none',
          }}
          data-reduced-motion-fallback
        />

        {/* Ember spark & beacon group for rare reignition moments */}
        <g ref={sparkGroupRef} style={{ display: 'none' }}>
          <path
            ref={sparkTrailRef}
            d={`M 0 ${MID_Y} L 0 ${MID_Y}`}
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            opacity="0.4"
            strokeLinecap="round"
          />
          <circle ref={sparkDotRef} cx="0" cy={MID_Y} r="4" className="ember-dot" />
          <circle
            ref={sparkRingRef}
            cx="0"
            cy={MID_Y}
            r="8"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            opacity="0.35"
          />
        </g>
      </svg>
    </div>
  )
}
