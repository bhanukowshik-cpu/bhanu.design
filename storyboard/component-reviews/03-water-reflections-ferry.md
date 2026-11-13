# 03 · Water, reflections, ferry + wake

## 1. Reference
- **Water bands (top→bottom, est.):** fog waterline `#C3C9D6` → `#9EB0C3` → mid bay `#7E9AB2` (warm bleed `#D9B49A` on the right) → foreground `#4F7F96` → cove `#3E6B82`. Smooth, grained, no hard bands.
- **Reflections:** vertical colour streaks (peach `#E9A07A`, gold `#F0B985`) cut by thin dark horizontal ripple lines every ~6–10 px, spacing growing toward viewer. Length ≈1.2–1.5× object height; opacity ~0.75 at waterline → 0; each band shifted sideways 1–4 px. Smeared paint, not a mirror.
- **Glitter:** short bright dashes inside warm columns only. Faint long light lines across open water.
- **Ferry:** two-deck SF ferry, white hull, cream-yellow trim, navy waterline stripe, warm windows, bow mast; 3/4 view heading right; ~95 px of 1672 (5.7%).
- **Wake:** very shallow V (~8° total) trailing left 300+ px, 2–3 foam streaks breaking into dashes, bright bow crescent.

## 2. Ours
Flat sea-green plane; reflections are a hard-edged mirrored second bridge with no streaking or fade; grey blocky ferry; wake = two rigid boxes; ripple rings = perfect uniform ellipses. Static and ruler-straight, hence "stiff".

## 3. Gap (1 close – 5 far)
Water gradient 4 · Reflections 5 · Glitter/lines 4 · Ferry 4 · Wake 5

## 4. Route + algorithms
- Water, reflections, glitter, wake → **code (WebGL fragment shader)**; drop Blender water plane + mirror world.
- Ferry → **ChatGPT PNG layer**, positioned/bobbed in code.

**Water** (`y` = px below waterline `H`, `t = y/(screenH-H)`):
1. Base: piecewise mix of the five hexes at t = 0/.15/.45/.8/1; warm bleed `mix(base,#D9B49A,.35*smoothstep(.55,1,uv.x)*(1-t))`.
2. Band index `b = floor(y/(6+0.08y))`. Offset `dx = (fbm(b*.37, time*.25)-.5)*(2+.04y) + 1.2*sin(y*.9 + time*1.7 + hash(b)*6.28)` px.
3. Sample layer composite at `(x+dx, H - y*1.25)`; vertical smear = mean of 5 taps spaced `3+.05y` px downward.
4. Ripple breaks: `line = smoothstep(.82,.95, fract(y/(6+.08y) + .15*fbm(x*.004, time*.1)))`; reflection *= `1-.35*line`.
5. Fade: alpha `0.75*exp(-y/(0.9*objH)) * (1-smoothstep(.6,1,t))`.
6. Glitter: where reflection luma >.7, `step(.93, hash(floor(x/3), b, floor(time*6 + hash(b)*10)))` → add `#FFE6C2` @0.6.
7. Surface lines: `step(.97, fbm(x*.002, y*.25 + time*.03))`, +6% lightness, alpha `.4(1-t)`.

**Wake** (ferry-local: `u` px behind stern, `v` lateral):
- Arms `|v| = 2 + u*tan(4°)`; foam width `1.5 + .02u` px.
- `foam = smoothstep(w,0,abs(abs(v)-arm)) * step(.45, fbm(u*.05 - time*1.2, v*.3))`; inner trail at 0.5×arm.
- Fade `exp(-u/260)`; past 200 px raise threshold to .6 (dashes). Bow crescent `.8*smoothstep(6,0,length(vec2(u+8, 2v)))`.
- Feed wake into the same ripple-band offset so it wobbles with the water.

## 5. Motion (layered noise, never a lone sine)
- Band jitter ±2–6 px: fbm at 0.25 Hz + micro term, per-band phase hash.
- Ferry ~6 px/s rightward; bob `0.6px*fbm(t*.4)`, roll ±0.4° on a second seed.
- Wake foam scrolls at ferry speed ±15% noise; length lags 1.5 s behind speed changes.
- Glitter re-rolls ~6 Hz, staggered per cell (twinkle, not sync blink).
- Surface lines drift 0.03 u/s. Sea-lion rings (other reviewer) should reuse this fbm and band field, not perfect ellipses.

## 6. ChatGPT prompt (ferry)
> Isolated illustration of a classic San Francisco Bay passenger ferry on a fully transparent background, PNG. Three-quarter side view, bow pointing right, seen slightly from above, mid-century modern travel-poster style. Two passenger decks, white hull, cream-yellow trim band, dark navy waterline stripe, rows of small warm-lit windows, small wheelhouse on top, short mast with a thin flag near the bow. Golden-hour light from the upper right: warm peach highlights, cool lavender-blue shadow sides. Flat layered gradient shading, crisp clean silhouette, subtle fine grain, no outlines. No water, wake, reflection, shadow or text. 2000 px wide, ship fills 90% of frame.
