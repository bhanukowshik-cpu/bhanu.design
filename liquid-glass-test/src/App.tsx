import { useRef, useEffect } from 'react'
import LiquidGlass from './components/LiquidGlass/LiquidGlass'
import poppyUrl from './assets/dejan-zakic-68AnV6eU2aw-unsplash.jpg'

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale
  ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh)
}

export default function App() {
  const containerRef   = useRef<HTMLDivElement>(null)
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef         = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = poppyUrl
    imgRef.current = img
  }, [])

  useEffect(() => {
    const canvas    = sceneCanvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const render = () => {
      canvas.width  = container.offsetWidth
      canvas.height = container.offsetHeight
      const ctx = canvas.getContext('2d')!
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        drawCover(ctx, imgRef.current, canvas.width, canvas.height)
      } else if (imgRef.current) {
        imgRef.current.onload = () => {
          canvas.width  = container.offsetWidth
          canvas.height = container.offsetHeight
          drawCover(ctx, imgRef.current!, canvas.width, canvas.height)
        }
      }
    }

    render()
    window.addEventListener('resize', render)
    return () => window.removeEventListener('resize', render)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width:    '100vw',
        height:   '100vh',
        position: 'relative',
        overflow: 'hidden',
        cursor:   'none',
      }}
    >
      <canvas
        ref={sceneCanvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      />

      <LiquidGlass
        label="View my work →"
        refraction={11.5}
        blur={1}
        aberration={8}
        width={210}
        height={62}
        containerRef={containerRef}
        sceneCanvasRef={sceneCanvasRef}
      />
    </div>
  )
}
