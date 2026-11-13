# 08 · Distance: skyline, Alcatraz, hills, fog

## 1. Reference
- **5 depth bands**, each a flat colour with a vertical gradient that is paler at the base. Bands get cooler and darker as they come nearer:
  1. Peach-lit ridge `#FAA48C`→`#C79AA6`
  2. Lilac `#9993AD`
  3. Blue-grey `#7993AE`
  4. City `#6F95B9`
  5. Headland `#5380A5`→`#335F75`
- **Skyline:** about 35 slab towers over a carpet of about 150 tiny houses `#A0A9BD` on a hill. Only two silhouettes are recognisable: a rounded bullet-top tower and a pyramid spire. No window dots by day. It takes up about 9% of the width.
- **Alcatraz:** about 6% of the width. Rock `#50728C`, a peach-lit cellhouse `#E7B498`, a lighthouse spike and a lattice water tower.
- **Fog:** lumpy banks hugging the water and headland bases, about 12% of frame height. Tops are lit pink `#DAB2B7`, undersides are lilac `#939AB4`. They swallow the tower bases and leave wisps above the deck. Grain is visible in the fog.

## 2. Ours (v2)
- Eight oversized boxy white slabs. No taper, landmarks, houses or hill.
- One uniform mint haze `#D9E8DF` flattens every band.
- Alcatraz is invisible.
- The fog is rectangular alpha cards: straight edges, no top-lit/underside split.

## 3. Gap (5 = missing)
| Sub-element | Gap |
|---|---|
| Hill bands | 4 |
| Skyline | 5 |
| Alcatraz | 5 |
| Fog | 5 |
| Haze model | 4 |

## 4. Route
- **Hills → code.** Use 1D fBm ridgelines (3 octaves) with the gradients above, plus a per-band haze tint driven by sun altitude.
- **Skyline → ChatGPT layer.** **Legal:** evoke, don't copy. Use a generic slim pyramid and a generic rounded tower with changed proportions and no crown detail.
- **Alcatraz → ChatGPT sprite**, 600px wide.
- **Fog → shader, plus an optional AI plate** used as a top-edge mask. Three strips (far/mid/under-deck):
  - Density: `d = smoothstep(.35,.65, fbm(uv*vec2(1.5,6)+vec2(t*v,0)) - y*k)`, using simplex fBm with 5 octaves.
  - `v` = 0.004 / 0.008 / 0.015 uv/s, plus a vertical warp (amplitude 0.02, period 40s).
  - Colour: `mix(under, top, clamp(dot(grad(d), sunDir)))`. Day: `#F2C9C0`/`#939AB4`. Night: `#5A5F86`/`#2B3050`, plus amber city glow `#F0A868` at 0.15.
  - Weather: `bias = .25 + .4*clamp((humidity-60)/35,0,1)`; wind adds to `v`.
  - Grain: hash noise at 0.06.

## 5. Motion
- **Fog:** continuous drift; scroll parallax of 1.2×, 1.0× and 0.8× by depth.
- **Dusk lights:** as the sun goes from +2° to −6°, about 400 seeded 2px window dots `#FFD28A` switch on with staggered onsets over 90s (houses first, then towers), with 3% flicker.
- **Alcatraz:** a 5s rotating lighthouse cone (additive `#FFF1C4`, 20% at peak) and a red light on the water tower.

## 6. ChatGPT prompts (transparent background, 16:9, no text)
- **A, skyline and hills:** "Isolated distant hillside city, modern travel-poster illustration, flat layered gradients, fine grain. About 35 simple slab towers in hazy blue #6F95B9 with lighter sunlit faces, one generic rounded-top tower, one generic slim pyramid spire, hundreds of tiny pale houses #A0A9BD down the hill. Behind: two soft ridgelines, lilac #9993AD and peach-lit #E9A99A. No sky, water or fog."
- **B, island:** "Small rocky island prison, side view, travel-poster style, flat gradients, grain. Long low peach-lit cellhouse #E7B498, thin lighthouse, lattice water tower on legs, dark rock #50728C, light haze. Isolated."
- **C, fog plate:** "Wide low sea-fog bank, lumpy cumulus top, top lit pink-peach #F2C9C0, cool lilac underside #939AB4, edges feathering to full transparency, fine grain, travel-poster style. Isolated."
- **Night variants:** "Same composition and framing, blue-hour night: indigo #2B3050 silhouettes." Then add:
  - A: "warm windows #FFD28A, about 10% lit"
  - B: "lighthouse lit"
  - C: "lit amber from below by city lights"
