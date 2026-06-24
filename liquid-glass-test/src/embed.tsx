import { createRoot } from 'react-dom/client'
import SpiralGallery from './components/SpiralGallery/SpiralGallery'

const CARDS = [
  { title: '',             sub: '',                     desc: '', color: 'transparent', image: '/images/blob.png' },
  { title: 'ET Studio',    sub: 'AI Content System',    desc: 'Redesigned the end-to-end content creation workflow — reducing production time from 104 hours to 4 hours per lesson.', color: '#7F77DD', image: '/images/et-studio.png' },
  { title: 'ET Live',      sub: 'Adaptive Tutoring',    desc: '85% session completion rate and 2x faster mastery. Real-time AI tutor with adaptive feedback built from scratch.',        color: '#1D9E75', image: '/images/et-live.png' },
  { title: 'ET Analytics', sub: 'Learning Intelligence', desc: 'Platform-wide analytics for 2,000+ DAU — surfacing mastery signals and content performance in real time.',                color: '#D85A30', image: '/images/et-analytics.png' },
  { title: 'Dearly',       sub: 'Digital Letters',      desc: 'A handwritten-style letter app for heartfelt notes. Launched on Product Hunt with custom SVG glyph rendering.',           color: '#D4537E', image: '/images/dearly.png' },
]

function init() {
  const el = document.getElementById('spiral-root')
  if (el) createRoot(el).render(<SpiralGallery cards={CARDS} />)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
