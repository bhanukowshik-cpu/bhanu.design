import { useRef, useEffect } from 'react'
import useLiquidGlass from './useLiquidGlass'

export default function LiquidGlass({
  label         = 'View my work →',
  refraction    = 10,
  blur          = 4,
  aberration    = 8,
  width         = 210,
  height        = 62,
  containerRef,
  sceneCanvasRef,
}) {
  const glassCanvasRef = useRef(null)
  const smoothedLumRef = useRef(128)
  const glassCtxRef    = useRef(null)

  const { renderGlass } = useLiquidGlass({ width, height, refraction, blur, aberration })

  useEffect(() => {
    const container   = containerRef?.current
    const glassCvs    = glassCanvasRef.current
    if (!container || !glassCvs) return

    glassCtxRef.current = glassCvs.getContext('2d')

    const onMove = (e) => {
      const { left, top } = container.getBoundingClientRect()
      const mx = e.clientX - left
      const my = e.clientY - top

      // Position glass centered on cursor — no lag, no spring
      glassCvs.style.left    = `${mx - width / 2}px`
      glassCvs.style.top     = `${my - height / 2}px`
      glassCvs.style.opacity = '1'

      const scene = sceneCanvasRef?.current
      if (!scene || !glassCtxRef.current) return

      renderGlass(scene, glassCtxRef.current, mx, my, smoothedLumRef, label)
    }

    const onLeave = () => { glassCvs.style.opacity = '0' }
    const onEnter = () => { glassCvs.style.opacity = '1' }

    container.addEventListener('mousemove',  onMove)
    container.addEventListener('mouseleave', onLeave)
    container.addEventListener('mouseenter', onEnter)

    return () => {
      container.removeEventListener('mousemove',  onMove)
      container.removeEventListener('mouseleave', onLeave)
      container.removeEventListener('mouseenter', onEnter)
    }
  }, [containerRef, sceneCanvasRef, width, height, label, renderGlass])

  return (
    <canvas
      ref={glassCanvasRef}
      width={width}
      height={height}
      style={{
        position:      'absolute',
        pointerEvents: 'none',
        opacity:       0,
        top:           0,
        left:          0,
        zIndex:        100,
      }}
    />
  )
}
