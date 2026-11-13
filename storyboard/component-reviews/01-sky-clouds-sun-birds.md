# 01 — Sky, clouds, sun, birds (+ title)

Hex values are estimated by eye from the tiles.

## 1. Reference inventory
- **Gradient**: diagonal. Cool at the top left, warm at the bottom right. Stops: `#7E7FB8` lavender → `#B08AAE` mauve → `#E59A8E` coral → `#F2B184` peach → `#F5C77A` gold. The hottest area is behind the right redwood (about x 1450–1600, y 120–260).
- **Sun**: no disc. The source is hidden by the tree and shows only as a warm bloom. Everything has a rim light from the upper right.
- **Clouds**: 2–3 thin horizontal stratus bands at y ≈ 190–270, just above the hills. Lit tops `#F7C9A0`, bodies `#D49AA6`, edges 10–20 px soft. Faint wisps `#A88FB8` sit at the top left. Clouds cover less than 15% of the sky.
- **Grain**: fine stipple everywhere, denser where the sky is darker.
- **Birds**: 3 "M" gulls about 25–30 px wide, plum `#3D3550`, in a loose triangle at x ≈ 1270–1420, y ≈ 225–265.
- **Title**: thin white outline sans with no fill, at y ≈ 85–195. It sits in the calmest band of sky, and no cloud crosses it.

## 2. Ours
- A vertical ramp `#4E8FBF` → `#9FD0CF` → `#F7E3B0` that reads as hazy midday.
- A hard white 12-sided sun disc at (1340, 270) with no glow.
- No clouds, birds or title.
- No grain on the sky, because the emission card bypasses the stipple in `npr()`.

## 3. Gap scores
| Element | Score | Why |
|---|---|---|
| Gradient | 5 | Wrong hues, wrong time of day and wrong direction. |
| Sun | 5 | A faceted visible disc instead of a hidden bloom. |
| Clouds | 5 | Missing. |
| Birds | 4 | Missing, but cheap to add. |
| Sky grain | 4 | Missing, and the poster feel depends on it. |
| Title | 3 | Absent (fine as a DOM layer), but the sky needs a calm zone kept clear for it. |

## 4. Route
- **Gradient → (c) shader.** It must follow the live SF sun.
  - `base = mix(zenith(t), horizon(t), smoothstep(0, .75, 1-uv.y))`.
  - Add bloom `hot(t)*exp(-d²/0.08)`, where d = aspect-corrected distance to the sun's screen position.
  - Use 4 keyframes (day, golden, dusk, night), lerped in OKLab.
- **Sun → (c) shader.** Draw a soft disc with `smoothstep(r+.004, r, d)` in `#FFF1C9`, plus the bloom. Let the tree alpha hide it. Remove the Blender sun mesh.
- **Clouds → (a) AI layers in greyscale, coloured in the shader.** Map luminance to a `shadow(t) → lit(t)` ramp. Brighten the edges that face the sun direction.
- **Birds → (c) Canvas/SVG.** Each bird is 2 quadratic curves. Flap with `A·sin(2π·2.2t+φ)`, then glide 2–4 s with A = 0. Each crosses about 40% of the frame in 25–35 s along a Bezier path, with Perlin offsets for the flock.
- **Grain → (c).** Use a pixel-locked hash and `col *= 1 - .06*step(n, .35+.25*(1-luma))`.
- **Title → (c) DOM/SVG.** Use `stroke: #FFF; fill: none`.

## 5. Motion
- Clouds drift 4–8 px/min, with per-band parallax.
- The bloom breathes ±3% over 12 s.
- A gull trio passes every 40–90 s.
- The sky eases across real SF time in 30-minute blends.
- At night, sparse stars appear and the clouds turn lavender-grey.
- On scroll, the sky moves at 0.1×.

## 6. ChatGPT prompts
**Clouds (×3):**
> Isolated thin horizontal stratus cloud band, transparent background, modern layered travel-poster illustration, smooth soft edges, fine stipple grain. Greyscale only (lit top #E8E8E8, body #9A9A9A). Lit from upper right. 4:1, calm, not billowy. No text.

**Sky colour targets (not shipped):**
> Full-frame 16:9 sky, modern layered travel-poster illustration, smooth gradients, fine stipple grain, diagonal gradient [PALETTE], warm bloom from a sun hidden off-frame right, no disc, no land, no text.

Palettes by time of day:
- Golden: #7E7FB8 / #E59A8E / #F5C77A
- Day: #6FA3D6 / #BFD9E6 / #F3E6C8
- Dusk: #3B3F7A / #A86A9A / #F08A6A
- Night: #0F1633 / #2A2F5C / #4A4870, with a few stars

Use these images only as colour targets for the shader keyframes.
