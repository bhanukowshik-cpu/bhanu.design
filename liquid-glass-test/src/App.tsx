import { useRef, useEffect } from 'react'
import LiquidGlass from './components/LiquidGlass/LiquidGlass'
import poppyUrl from './assets/dejan-zakic-68AnV6eU2aw-unsplash.jpg'

// Cover-fit the photo onto the scene canvas (same as CSS background-size: cover).
// Served same-origin by Vite, so canvas.getImageData() is never tainted.
function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const iw = img.naturalWidth, ih = img.naturalHeight
  const scale = Math.max(w / iw, h / ih)
  const sw = iw * scale, sh = ih * scale
  ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh)
}

export default function App() {
  const containerRef   = useRef<HTMLDivElement>(null)
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas    = sceneCanvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const img = new Image()

    const render = () => {
      canvas.width  = container.offsetWidth
      canvas.height = container.offsetHeight
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
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
      {/* Scene canvas — photo drawn with 2D API, safe for getImageData */}
      <canvas
        ref={sceneCanvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      />

      {/* Hint */}
      <div style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        pointerEvents:  'none',
      }}>
        <p style={{
          color:         'rgba(255,255,255,0.35)',
          fontSize:      12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontFamily:    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          userSelect:    'none',
        }}>
          Move cursor to see refraction
        </p>
      </div>

      {/* Canvas-based refractive glass — no backdrop-filter, no SVG filters */}
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
