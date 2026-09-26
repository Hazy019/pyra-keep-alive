'use client'

import { useEffect, useRef, useState, useId } from 'react'

/**
 * Heartbeat Hero — Precision Oscilloscope Telemetry Monitor
 *
 * Motion & Physics Architecture:
 * 1. Constant Horizontal Timebase: In cardiac monitors and oscilloscopes, the timebase
 *    sweeps horizontally at a steady speed (x = progress * width). The beam never lags
 *    or stalls on peaks.
 * 2. Instantaneous Vertical Tracking: y(t) is calculated via continuous piecewise
 *    interpolation at exact coordinate x, dynamically riding the QRS peaks and dips.
 * 3. Zero-Desync Optical Mask: An SVG alpha mask is pinned to [headX - TRAIL_WIDTH, headX].
 *    The illuminated wave terminates precisely at headX. It is physically impossible
 *    for the line to outrun the beacon.
 * 4. Phosphor Decay: The trailing stroke softly dissolves toward the tail (0% to 100% opacity)
 *    mirroring real oscilloscope phosphor persistence.
 */

const BEAT_POINTS = [
  [0, 0], [10, 0], [13, -2], [15, 0],
  [20, 0], [22, -15], [24, 35], [26, -10], [28, 0],
  [35, 0], [38, -2], [40, 0],
  [50, 0], [52, -15], [54, 35], [56, -10], [58, 0],
  [65, 0], [68, -2], [70, 0],
  [100, 0],
] as const

function pointsToPath(width: number, height: number): string {
  const midY = height / 2
  const scaleX = width / 100
  const scaleY = height / 80

  return BEAT_POINTS
    .map(([x, y], i) => {
      const px = x * scaleX
      const py = midY - y * scaleY
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`
    })
    .join(' ')
}

function getYAtX(currX: number, width: number, height: number): number {
  const midY = height / 2
  const scaleY = height / 80
  const pctX = Math.max(0, Math.min(100, (currX / width) * 100))

  for (let i = 0; i < BEAT_POINTS.length - 1; i++) {
    const p1 = BEAT_POINTS[i]
    const p2 = BEAT_POINTS[i + 1]
    if (!p1 || !p2) continue

    if (pctX >= p1[0] && pctX <= p2[0]) {
      const span = p2[0] - p1[0]
      const t = span === 0 ? 0 : (pctX - p1[0]) / span
      const yVal = p1[1] + t * (p2[1] - p1[1])
      return midY - yVal * scaleY
    }
  }

  return midY
}

export default function HeartbeatHero() {
  const svgRef = useRef<SVGSVGElement>(null)
  const emberDotRef = useRef<SVGCircleElement>(null)
  const emberGlowRef = useRef<SVGCircleElement>(null)
  const maskRectRef = useRef<SVGRectElement>(null)
  const pulseGroupRef = useRef<SVGGElement>(null)

  const rawId = useId()
  const cleanId = rawId.replace(/:/g, '_')
  const maskId = `pulse_mask_${cleanId}`
  const gradId = `pulse_grad_${cleanId}`

  const canvasW = 600
  const canvasH = 80
  const midY = canvasH / 2

  const [pathD, setPathD] = useState('')

  useEffect(() => {
    setPathD(pointsToPath(canvasW, canvasH))
  }, [canvasW, canvasH])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const dot = emberDotRef.current
    const glow = emberGlowRef.current
    const maskRect = maskRectRef.current
    const group = pulseGroupRef.current

    if (!dot || !glow || !maskRect || !group) return

    const TRAIL_WIDTH = 130 // Optical trail width in pixels
    const SWEEP_DURATION = 2300 // 2.3s steady horizontal sweep
    const CYCLE_DURATION = 3500 // 3.5s total (2.3s sweep + 1.2s rest)

    let animId: number
    const startTime = performance.now()

    function loop(now: number) {
      if (!dot || !glow || !maskRect || !group) return

      const elapsed = (now - startTime) % CYCLE_DURATION
      const sweepProgress = Math.min(1, elapsed / SWEEP_DURATION)

      if (sweepProgress < 1) {
        // Active pulse sweep: steady horizontal velocity
        group.style.opacity = '1'

        const headX = sweepProgress * canvasW
        const headY = getYAtX(headX, canvasW, canvasH)

        // Lock beacon precisely to (headX, headY)
        dot.setAttribute('cx', headX.toFixed(1))
        dot.setAttribute('cy', headY.toFixed(1))

        glow.setAttribute('cx', headX.toFixed(1))
        glow.setAttribute('cy', headY.toFixed(1))

        // Dynamic peak flare: halo expands as the beacon crests the QRS spikes
        const peakDeflection = Math.abs(headY - midY)
        const glowRadius = 7 + (peakDeflection / 35) * 5
        const glowOpacity = 0.35 + (peakDeflection / 35) * 0.45
        glow.setAttribute('r', glowRadius.toFixed(1))
        glow.setAttribute('opacity', glowOpacity.toFixed(2))

        // Position optical trail mask strictly ending at headX
        const clipX = Math.max(0, headX - TRAIL_WIDTH)
        const clipW = headX - clipX
        maskRect.setAttribute('x', clipX.toFixed(1))
        maskRect.setAttribute('width', clipW.toFixed(1))
      } else {
        // Diastole resting breath: gentle decay before next pulse
        const restProgress = (elapsed - SWEEP_DURATION) / (CYCLE_DURATION - SWEEP_DURATION)
        const fadeOut = Math.max(0, 1 - restProgress * 3.5)
        group.style.opacity = `${fadeOut.toFixed(2)}`
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [pathD, canvasW, canvasH, midY])

  return (
    <div className="heartbeat-container" style={{ position: 'relative' }}>
      <span className="sr-only">
        Real-time telemetry pulse monitor tracing active endpoint heartbeat signals with zero latency.
      </span>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="heartbeat-svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Luminous decay gradient for trail */}
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>

          {/* Optical tracking mask: guarantees stroke ends exactly at beacon head */}
          <mask id={maskId}>
            <rect x="0" y="0" width={canvasW} height={canvasH} fill="#000000" />
            <rect
              ref={maskRectRef}
              x="0"
              y="0"
              width="0"
              height={canvasH}
              fill={`url(#${gradId})`}
            />
          </mask>
        </defs>

        {/* Subtle architectural datum baseline */}
        <line
          x1="0"
          y1={midY}
          x2={canvasW}
          y2={midY}
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        {/* 1. Underlying Resting Waveform — subtle spatial depth */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.22"
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />

        {/* 2. Active Luminous Pulse Layer — revealed by precision tracking mask */}
        <g ref={pulseGroupRef} style={{ opacity: 0 }}>
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            mask={`url(#${maskId})`}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(232, 98, 44, 0.75))',
              vectorEffect: 'non-scaling-stroke',
            }}
          />

          {/* 3. Traveling Ember Beacon (rides x, y along the actual peaks) */}
          <circle
            ref={emberGlowRef}
            cx="0"
            cy={midY}
            r="8"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <circle
            ref={emberDotRef}
            cx="0"
            cy={midY}
            r="3.5"
            className="ember-dot"
          />
        </g>
      </svg>
    </div>
  )
}
