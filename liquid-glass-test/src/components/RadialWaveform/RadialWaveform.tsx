import { useEffect, useRef } from 'react'

interface Props {
  isListening?: boolean
  audioLevel?: number
}

const NUM_BARS = 72     // one bar every 5°
const INNER_R  = 178    // inner radius: just outside the orb boundary
const MIN_L    = 4      // minimum bar length (px)
const MAX_L    = 22     // maximum bar length (px)
const BAR_W    = 2.5    // stroke width (px)
const SIZE     = 460    // canvas width & height (px) — square

export default function RadialWaveform({ isListening = false, audioLevel = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef  = useRef({ isListening, audioLevel })
  const timeRef   = useRef(0)
  const rafRef    = useRef(0)

  useEffect(() => { stateRef.current = { isListening, audioLevel } }, [isListening, audioLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const cx = SIZE / 2
    const cy = SIZE / 2

    function tick() {
      const { isListening, audioLevel } = stateRef.current
      timeRef.current += 0.016  // ~1 rad/s rotation
      const t = timeRef.current

      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.lineCap = 'round'
      ctx.lineWidth = BAR_W

      for (let i = 0; i < NUM_BARS; i++) {
        const angle = (i / NUM_BARS) * Math.PI * 2 - Math.PI / 2  // start at 12 o'clock

        // Two-harmonic rotating wave for organic feel
        const wave = 0.6 * Math.sin(angle * 2 + t) + 0.4 * Math.sin(angle * 3 - t * 0.7)
        const norm = (wave + 1) / 2  // 0…1

        const barLen = isListening
          ? MIN_L + (MAX_L - MIN_L) * Math.min(1, audioLevel * 0.8 + norm * 0.4)
          : MIN_L + (MAX_L - MIN_L) * norm * 0.7

        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        // Taller bars are more opaque
        const opacity = 0.35 + 0.65 * norm
        ctx.strokeStyle = `rgba(163, 230, 53, ${opacity.toFixed(2)})`

        ctx.beginPath()
        ctx.moveTo(cx + cos * INNER_R, cy + sin * INNER_R)
        ctx.lineTo(cx + cos * (INNER_R + barLen), cy + sin * (INNER_R + barLen))
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
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
