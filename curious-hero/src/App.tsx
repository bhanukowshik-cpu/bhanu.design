import { useRef } from 'react'
import { Globe, ArrowRight, Instagram, Twitter } from 'lucide-react'

/* Generated on Higgsfield — Bhanu's Soul at the desk, azure light trails
   (Soul V2 still → Seedance 2.0, 10s 1080p silent, static camera). */
const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_3GAGwBkL0VtA0WiPkezsEO5C71B/hf_20260727_032559_15b100ee-f3c3-49fc-80aa-4e9977092b78.mp4'

/* How close to the end (seconds) the fade-out begins. */
const FADE_LEAD = 0.55
const FADE_MS = 500

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const fadingOutRef = useRef(false)

  /* rAF opacity animation — no CSS transitions. Each new fade cancels the
     running frame and resumes from the CURRENT opacity, so competing
     animations can never fight and fades never snap. */
  const fadeTo = (target: number) => {
    const video = videoRef.current
    if (!video) return
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const from = parseFloat(video.style.opacity || '0')
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / FADE_MS, 1)
      video.style.opacity = String(from + (target - from) * p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const handleLoadedData = () => {
    fadingOutRef.current = false
    fadeTo(1)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || fadingOutRef.current || !video.duration) return
    /* timeupdate fires ~4×/s — the ref stops repeats from re-arming the fade */
    if (video.duration - video.currentTime <= FADE_LEAD) {
      fadingOutRef.current = true
      fadeTo(0)
    }
  }

  const handleEnded = () => {
    const video = videoRef.current
    if (!video) return
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    video.style.opacity = '0'
    window.setTimeout(() => {
      video.currentTime = 0
      void video.play()
      fadingOutRef.current = false
      fadeTo(1)
    }, 100)
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex flex-col">
      {/* full-bleed video, shifted down so the lower portion of the frame —
          where the subject sits — carries the composition */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover translate-y-[6%]"
        style={{ opacity: 0 }}
        src={VIDEO_SRC}
        muted
        autoPlay
        playsInline
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* navigation */}
      <nav className="relative z-20 pl-6 pr-6 py-6">
        <div className="rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-white">
              <Globe size={24} />
              <span className="font-semibold text-lg">Asme</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Pricing
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                About
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white text-sm font-medium">Sign Up</button>
            <button className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium">
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[20%]">
        <h1
          className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Built for the curious
        </h1>

        <div className="max-w-xl w-full space-y-4">
          <form
            className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent text-white placeholder:text-white/40 text-base outline-none"
            />
            <button type="submit" className="bg-white rounded-full p-3 text-black" aria-label="Subscribe">
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="text-white text-sm leading-relaxed px-4">
            Stay updated with the latest news and insights. Subscribe to our newsletter today and
            never miss out on exciting updates.
          </p>

          <div className="flex justify-center">
            <button className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors">
              Manifesto
            </button>
          </div>
        </div>
      </main>

      {/* socials */}
      <footer className="relative z-10 flex justify-center gap-4 pb-12">
        <button
          aria-label="Instagram"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
        >
          <Instagram size={20} />
        </button>
        <button
          aria-label="Twitter"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
        >
          <Twitter size={20} />
        </button>
        <button
          aria-label="Website"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
        >
          <Globe size={20} />
        </button>
      </footer>
    </div>
  )
}

export default App
