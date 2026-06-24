import { useEffect, useRef } from 'react'

// Exact same rules as the ws-waveform SVG animation in index.html
const NUM_BARS = 80
const CX       = 170
const CY       = 170
const RADIUS   = 120   // bars straddle this radius (extend h/2 inward, h/2 outward)
const SIZE     = 340   // matches the original SVG viewBox

export default function RadialWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const angles = Array.from({ length: NUM_BARS }, (_, i) =>
      (i / NUM_BARS) * 2 * Math.PI - Math.PI / 2
    )
    const phases = Array.from({ length: NUM_BARS }, () => Math.random() * Math.PI * 2)
    const speeds = Array.from({ length: NUM_BARS }, () => 0.6 + Math.random() * 1.0)

    function getHeight(i: number, t: number) {
      const h =
        9 * Math.sin(t * speeds[i]       + phases[i]) +
        4 * Math.sin(t * speeds[i] * 1.8 + phases[i] + 1.3) +
        2 * Math.sin(t * speeds[i] * 2.7 + phases[i] + 0.7)
      return Math.max(3, Math.min(26, 12 + h))
    }

    let startTime: number | null = null

    function animate(ts: number) {
      if (!startTime) startTime = ts
      const t = (ts - startTime) / 1000

      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.lineWidth  = 2.5
      ctx.lineCap    = 'round'
      ctx.globalAlpha = 0.75

      for (let i = 0; i < NUM_BARS; i++) {
        const angle = angles[i]
        const h    = getHeight(i, t)
        const half = h / 2
        const cos  = Math.cos(angle)
        const sin  = Math.sin(angle)

        ctx.strokeStyle = i % 2 === 0 ? '#E5F28D' : '#4ADE80'
        ctx.beginPath()
        ctx.moveTo(CX + (RADIUS - half) * cos, CY + (RADIUS - half) * sin)
        ctx.lineTo(CX + (RADIUS + half) * cos, CY + (RADIUS + half) * sin)
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  )
}
