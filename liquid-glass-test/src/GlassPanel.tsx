import { useRef, useState, useEffect, ReactNode, CSSProperties } from 'react'

interface GlassPanelProps {
  children: ReactNode
  cornerRadius?: number
  padding?: string
  blur?: number
  saturation?: number
  tintOpacity?: number
  onClick?: () => void
  style?: CSSProperties
  className?: string
}

export default function GlassPanel({
  children,
  cornerRadius = 24,
  padding = '24px',
  blur = 14,
  saturation = 180,
  tintOpacity = 0.12,
  onClick,
  style,
  className = '',
}: GlassPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()
  const cur = useRef({ rx: 0, ry: 0 })
  const tgt = useRef({ x: 0, y: 0 })
  const hovered = useRef(false)
  const [dynStyle, setDynStyle] = useState<CSSProperties>({})

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      const spd = hovered.current ? 0.16 : 0.07
      cur.current.rx = lerp(cur.current.rx, tgt.current.y * 9, spd)
      cur.current.ry = lerp(cur.current.ry, tgt.current.x * 9, spd)
      const { rx, ry } = cur.current
      const mag = Math.hypot(rx, ry)
      setDynStyle({
        transform: mag > 0.05
          ? `perspective(700px) rotateX(${-rx}deg) rotateY(${ry}deg) scale(${hovered.current ? 1.04 : 1.0})`
          : hovered.current ? 'scale(1.04)' : '',
        '--hx': `${50 + tgt.current.x * 40}%`,
        '--hy': `${50 + tgt.current.y * 40}%`,
      } as CSSProperties)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current!)
  }, [])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect()
    tgt.current = {
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    }
  }

  const onLeave = () => {
    hovered.current = false
    tgt.current = { x: 0, y: 0 }
  }

  return (
    // Outer shell: holds box-shadow + tilt transform (outside the SVG filter so shadows aren't clipped)
    <div
      ref={ref}
      className={`gp-shell ${onClick ? 'gp-shell--clickable' : ''} ${className}`}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseEnter={() => { hovered.current = true }}
      onMouseLeave={onLeave}
      style={{ borderRadius: cornerRadius, ...dynStyle, ...style } as CSSProperties}
    >
      {/* Inner glass: SVG displacement filter + overflow clip */}
      <div
        className="gp"
        style={{
          borderRadius: cornerRadius,
          padding,
          '--blur': `${blur}px`,
          '--sat': `${saturation}%`,
          '--tint': `rgba(255,255,255,${tintOpacity})`,
        } as CSSProperties}
      >
        <div className="gp__bg" style={{ borderRadius: cornerRadius }} />
        <div className="gp__edge" style={{ borderRadius: cornerRadius }} />
        <div className="gp__glow" style={{ borderRadius: cornerRadius }} />
        <div className="gp__content">{children}</div>
      </div>
    </div>
  )
}
