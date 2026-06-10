import { useRef, useCallback } from 'react'

// ── Math helpers ────────────────────────────────────────────────────────────

function smoothStep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

function squircleSDF(x, y, hw, hh, r) {
  const qx = Math.max(Math.abs(x) - hw + r, 0) / r
  const qy = Math.max(Math.abs(y) - hh + r, 0) / r
  const dist = Math.pow(Math.pow(qx, 4) + Math.pow(qy, 4), 0.25)
  return (dist * r - r) + Math.min(Math.max(Math.abs(x) - hw + r, Math.abs(y) - hh + r), 0)
}

// ── Displacement map ────────────────────────────────────────────────────────
// Returns Float32Array of [dx, dy] pairs in pixel space, cached per dimension.

function buildDispMap(w, h) {
  const map = new Float32Array(w * h * 2)
  const aspect = w / h

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const ix = px / w - 0.5   // –0.5 … 0.5
      const iy = py / h - 0.5

      const sdf = squircleSDF(ix * aspect, iy, 0.29 * aspect, 0.21, 0.56)
      const d   = smoothStep(0.9, 0, sdf - 0.07)
      const s   = smoothStep(0, 1, d)

      const i = (py * w + px) * 2
      map[i]     = ix * s * w * 0.95   // dx
      map[i + 1] = iy * s * h * 0.95   // dy
    }
  }

  return map
}

// ── Box blur ─────────────────────────────────────────────────────────────────

function boxBlur(src, w, h, radius) {
  if (radius <= 0) return src.slice()
  const out = new Uint8ClampedArray(src.length)
  const r   = Math.floor(radius)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rr = 0, g = 0, b = 0, count = 0
      for (let ky = -r; ky <= r; ky++) {
        const sy = Math.min(Math.max(y + ky, 0), h - 1)
        for (let kx = -r; kx <= r; kx++) {
          const sx = Math.min(Math.max(x + kx, 0), w - 1)
          const si = (sy * w + sx) * 4
          rr += src[si]; g += src[si + 1]; b += src[si + 2]
          count++
        }
      }
      const oi = (y * w + x) * 4
      out[oi] = rr / count; out[oi + 1] = g / count; out[oi + 2] = b / count; out[oi + 3] = 255
    }
  }
  return out
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export default function useLiquidGlass({ width, height, refraction, blur, aberration }) {
  const dispCacheRef = useRef(null)
  const dispDimsRef  = useRef({ w: 0, h: 0 })
  const sampleCvsRef = useRef(null)
  const sampleCtxRef = useRef(null)

  const getDispMap = useCallback(() => {
    if (dispDimsRef.current.w !== width || dispDimsRef.current.h !== height) {
      dispCacheRef.current = buildDispMap(width, height)
      dispDimsRef.current  = { w: width, h: height }
    }
    return dispCacheRef.current
  }, [width, height])

  const getSampleCtx = useCallback(() => {
    if (!sampleCvsRef.current) {
      sampleCvsRef.current = document.createElement('canvas')
      sampleCtxRef.current = sampleCvsRef.current.getContext('2d', { willReadFrequently: true })
    }
    const c = sampleCvsRef.current
    if (c.width !== width || c.height !== height) { c.width = width; c.height = height }
    return sampleCtxRef.current
  }, [width, height])

  const renderGlass = useCallback((sceneCanvas, glassCtx, mx, my, smoothedLumRef, label) => {
    const gw = width, gh = height

    // ── Sample scene pixels behind the glass ────────────────────────────────
    const sc = getSampleCtx()
    sc.clearRect(0, 0, gw, gh)
    sc.drawImage(sceneCanvas,
      Math.round(mx - gw / 2), Math.round(my - gh / 2), gw, gh,
      0, 0, gw, gh
    )
    const { data: src } = sc.getImageData(0, 0, gw, gh)

    // ── Box blur ─────────────────────────────────────────────────────────────
    const blurred = boxBlur(src, gw, gh, blur)

    // ── Displacement + chromatic aberration ─────────────────────────────────
    const dispMap  = getDispMap()
    const out      = new Uint8ClampedArray(gw * gh * 4)
    let   totalLum = 0

    const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v

    for (let py = 0; py < gh; py++) {
      for (let px = 0; px < gw; px++) {
        const idx = py * gw + px
        const dx  = dispMap[idx * 2]
        const dy  = dispMap[idx * 2 + 1]
        const ix  = px / gw - 0.5    // –0.5 … 0.5, for aberration scaling

        // Convex lens: subtract displacement so edges pull inward (magnify center)
        const strength = refraction * 0.012
        const sx = px - dx * strength
        const sy = py - dy * strength

        // Chromatic aberration: R shifted left, B shifted right
        const aOff = ix * aberration

        const at = (x, y) => {
          const cx = clamp(Math.round(x), 0, gw - 1)
          const cy = clamp(Math.round(y), 0, gh - 1)
          return (cy * gw + cx) * 4
        }

        const iR = at(sx - aOff, sy)
        const iG = at(sx,        sy)
        const iB = at(sx + aOff, sy)

        const oi = idx * 4
        out[oi]     = blurred[iR]
        out[oi + 1] = blurred[iG + 1]
        out[oi + 2] = blurred[iB + 2]
        out[oi + 3] = 255

        totalLum += 0.299 * out[oi] + 0.587 * out[oi + 1] + 0.114 * out[oi + 2]
      }
    }

    // ── Luminance smoothing ──────────────────────────────────────────────────
    const avgLum = totalLum / (gw * gh)
    smoothedLumRef.current += (avgLum - smoothedLumRef.current) / 12
    const dark = smoothedLumRef.current < 128

    // ── Paint glass canvas ───────────────────────────────────────────────────
    glassCtx.clearRect(0, 0, gw, gh)

    // Layer 1 — displaced + aberrated pixels (fills entire canvas)
    glassCtx.putImageData(new ImageData(out, gw, gh), 0, 0)

    // Layer 2 — clip to pill shape
    glassCtx.globalCompositeOperation = 'destination-in'
    glassCtx.beginPath()
    glassCtx.roundRect(0, 0, gw, gh, 999)
    glassCtx.fillStyle = '#000'
    glassCtx.fill()
    glassCtx.globalCompositeOperation = 'source-over'

    // Layers 3–8 — all clipped to pill
    glassCtx.save()
    glassCtx.beginPath()
    glassCtx.roundRect(0, 0, gw, gh, 999)
    glassCtx.clip()

    // Layer 3 — directional rim gradient (-45°: bright top-left, dim bottom-right)
    const rimGrad = glassCtx.createLinearGradient(0, 0, gw, gh)
    rimGrad.addColorStop(0,    'rgba(255,255,255,0.48)')
    rimGrad.addColorStop(0.38, 'rgba(255,255,255,0.12)')
    rimGrad.addColorStop(0.46, 'rgba(255,255,255,0.0)')
    rimGrad.addColorStop(0.54, 'rgba(255,255,255,0.0)')
    rimGrad.addColorStop(1,    'rgba(255,255,255,0.28)')
    glassCtx.strokeStyle = rimGrad
    glassCtx.lineWidth   = 1.4
    glassCtx.beginPath()
    glassCtx.roundRect(0.7, 0.7, gw - 1.4, gh - 1.4, gh / 2)
    glassCtx.stroke()

    // Layer 4 — tight corner specular (top-left only, doesn't reach center)
    const spec = glassCtx.createRadialGradient(0, 0, 0, 0, 0, gw * 0.28)
    spec.addColorStop(0,    'rgba(255,255,255,0.18)')
    spec.addColorStop(0.25, 'rgba(255,255,255,0.04)')
    spec.addColorStop(1,    'rgba(255,255,255,0)')
    glassCtx.fillStyle = spec
    glassCtx.fillRect(0, 0, gw, gh)

    // Layer 8 — content-aware label
    glassCtx.fillStyle    = dark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.72)'
    glassCtx.font         = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    glassCtx.textAlign    = 'center'
    glassCtx.textBaseline = 'middle'
    glassCtx.fillText(label, gw / 2, gh / 2)

    glassCtx.restore()
  }, [width, height, refraction, blur, aberration, getDispMap, getSampleCtx])

  return { renderGlass }
}
