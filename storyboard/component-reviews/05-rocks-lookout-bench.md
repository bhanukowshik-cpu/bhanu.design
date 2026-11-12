# 05 — Rocks, lookout, bench, figure

## 1. Reference inventory
- **Rock shape language:** big angular slabs, split into 3–5 planes, with **rounded, eroded tops** and steep faces. The headland reads as tilted strata: long diagonal fractures run down-left, with a few vertical cracks. The shore rocks (bottom-centre) are low, lumpy boulder strings that step down into the water.
- **Colour stops (est.):** sunlit face `#E0925E` → `#C4704A`, mid `#8C5A50`, shadow `#4D4559` → core `#352F42` (violet, never black). **Rim light** `#F5B783` is a thin warm edge on sun-facing tops. Fine grain sits over everything.
- **Scrub on top:** mounded olive `#6E8A3E` with gold highlights `#C9A044`, built from small clumps that spill over the edges into the cracks.
- **Shoreline:** no surf. A thin pale lip `#E6ECEC` (1–2 px), dark wet bands at the waterline and short reflections.
- **Bench:** a classic park bench with a slatted seat and back, warm wood `#9A6038` and dark legs. It sits flat on the grassy crown, side-on to the viewer and facing the bridge.
- **Figure:** seated and leaning toward the screen, with the laptop on the lap. Dark top bun/short hair, dark jacket, small **cool-white laptop glow** `#EAF2FF` on the face and hands. Very small: the figure is about 1/9 of the tower height and reads as a story beat, not a portrait. They sit at the lit rim against the misty bay.

## 2. Ours (gg_poster_v2.png)
- **None of this component is in frame.** The lookout (two ellipsoids at y≈28–34), the bench and Bhanu sit outside the camera view, or are hidden by the redwood trunks.
- Even if it were framed, the lookout is two smooth blobs with a 2-stop ramp (`#B7AA92`/`#4A4C55`), which is beige/grey and the wrong family. It has no facets, strata, rim light or scrub, and no shore rocks.
- Bench (props.py) is good: wood slats on dark iron, so the design matches.
- Bhanu in sheet_cast.png has the right identity (dark hair, beard, dark top, laptop). He is toy-proportioned and the laptop does not glow.

## 3. Gap score (5 = worst)
| Sub-element | Gap |
|---|---|
| Rock forms/facets/strata | 5 |
| Rock colour + rim light | 5 |
| Scrub on top | 5 |
| Shoreline lip | 5 |
| Lookout composition/framing | 5 |
| Bench | 2 |
| Figure (identity) | 2 |
| Figure (silhouette/glow/scale) | 4 |

## 4. Route
- **Rocks + lookout + scrub + shore lip → ChatGPT layer** (PNG, transparent). This is painterly faceting and clumped scrub. Procedural Blender blobs will not get there cheaply, and the layer is static apart from lighting.
- **Rock lighting → code.** Ship a separate lit mask / rim-mask PNG and tint it in the shader from the live sun angle.
- **Bench + figure → ChatGPT sprite, two or three pose frames.** At this scale it has to match the painted style. Our Blender figure would clash. Identity lock: South Asian man, dark short hair, light beard, dark jacket, every frame from one seed/reference.
- **Laptop glow → code** (additive radial sprite).
- **Fallback:** if the poses drift between generations, render the silhouette from characters.py and paint over it with ChatGPT image-edit.

## 5. Motion + life
- **Laptop glow:** opacity 0.85–1.0 on 1/f noise, with a brighter "scroll" pulse every 6–10 s. It is stronger at dusk and night.
- **Look-up beat:** every 20–40 s, cross-fade the typing frame to "head raised toward the bridge" for 2.5 s, then back. Also trigger it when the user hovers the bridge.
- **Scrub sway:** vertex/UV sine shear, ±1.5 px, 4–6 s period, with a phase offset per clump mask.
- **Rocks with the live sun:** rim-mask intensity = sun elevation × azimuth facing. Shadow hue slides from violet `#4D4559` (day) to indigo `#2B2A44` (night). At night the laptop glow becomes the key light on the figure.
- **Shore lip:** UV scroll ±2 px, 7 s, with a lip that brightens slightly.

## 6. ChatGPT prompts
**(a) Rocky lookout layer:**
"Isolated foreground layer, transparent background, PNG. A layered modern travel-poster illustration of a Marin Headlands rocky promontory seen from the side, rising from right to centre-left. Angular sandstone slabs with rounded, eroded tops, diagonal strata fractures and a few vertical cracks. Warm sunset light from the left: lit faces #E0925E to #C4704A, violet shadows #4D4559 to #352F42, a thin glowing rim #F5B783 on the top edges. Olive and gold scrub clumps (#6E8A3E, #C9A044) on the grassy flat crown and spilling into cracks. Low boulder string at the base meeting water, with a thin pale waterline lip. Fine paper grain, flat gradients, no outlines, no people, no bench, no sky, no water. 2400×1400."

**(b) Bench + figure sprite (generate 3 frames, same seed):**
"Transparent-background PNG sprite, travel-poster illustration style matching a sunset Golden Gate poster: flat gradients, fine grain, no outlines. A classic park bench, warm wood slats #9A6038 on dark iron legs, viewed side-on. Seated on it, a South Asian man in his late 20s with short dark hair, a light trimmed beard, a dark charcoal jacket and dark trousers, typing on a laptop resting on his lap. Cool white screen glow #EAF2FF on his face and hands, warm rim light from the left. Frame 1: head down, typing. Frame 2: head lifted, gazing right toward a distant bridge, hands still on the keys. Frame 3: leaning back slightly, one hand off the keyboard. Identical character, bench, camera and scale in every frame. 1024×768."
