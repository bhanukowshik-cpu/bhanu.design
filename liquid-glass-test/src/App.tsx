import { useRef, useEffect } from 'react'
import LiquidGlass from './components/LiquidGlass/LiquidGlass'
import GlassButton from './components/GlassButton/GlassButton'
import poppyUrl from './assets/dejan-zakic-68AnV6eU2aw-unsplash.jpg'
import SpiralGallery from './components/SpiralGallery/SpiralGallery'

const SPIRAL_CARDS = [
  { title: 'ET Studio', sub: 'AI Content System', desc: 'Redesigned the end-to-end content creation workflow — reducing production time from 104 hours to 4 hours per lesson.', color: '#7F77DD', image: '/images/et-studio.jpg' },
  { title: 'ET Live', sub: 'Adaptive Tutoring', desc: '85% session completion rate and 2x faster mastery. Real-time AI tutor with adaptive feedback built from scratch.', color: '#1D9E75', image: '/images/et-live.jpg' },
  { title: 'ET Analytics', sub: 'Learning Intelligence', desc: 'Platform-wide analytics for 2,000+ DAU — surfacing mastery signals and content performance in real time.', color: '#D85A30', image: '/images/et-analytics.jpg' },
  { title: 'Dearly', sub: 'Digital Letters', desc: 'A handwritten-style letter app for heartfelt notes. Launched on Product Hunt with custom SVG glyph rendering.', color: '#D4537E', image: '/images/dearly.jpg' },
]

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
    <>
    <SpiralGallery cards={SPIRAL_CARDS} />
    <div
      ref={containerRef}
      style={{ display: 'none', width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', cursor: 'none' }}
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

      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <GlassButton label="Get started" />
      </div>
    </div>
    </>
  )
}
