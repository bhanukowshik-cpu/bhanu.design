# 06 — Redwoods: trunks, branches, foliage pads

## 1. Reference inventory
- **Silhouette:** the left trunk takes about 20% of frame width, the right about 12% and cropped by the edge. Both lean slightly outward. Taper is about 15%, the base has a root flare, edges bulge every 80–120 px.
- **Bark:** vertical furrows drawn as 4–8 px dark strokes, with lighter fibrous ridge dashes between them.
- **Light:** the side facing the sun is lit, about 35% of the width, with a hard terminator about 10 px wide. Lit `#C4622F` (peak `#E07A3C`), mid `#8A3E24`, shadow `#3A2A45` / `#241B33`, warm rim `#F2A15E`.
- **Branches:** 3–4 thin limbs (6–12 px), near-horizontal with a slight upward S-curve, stepped in tiers and forking into twigs.
- **Foliage:** flat stone-pine pads about 3:1, scalloped needle-tuft edges, 4–6 overlapping tiers per tree. Tonal bands: underside `#1F3B3A`, body `#3F6A3E`, crest `#9DB55A`, peach rim `#E9A27A`.
- **Framing:** a proscenium; pads frame the top 25% and title, trunks are the darkest values.

## 2. Ours
- The trunks read as **columns**: straight, constant-radius 20-sided tubes with no flare, lean, wobble or bark. The ramp is smooth, not split, and the right trunk is lit on the wrong side.
- **Band artefact:** each trunk is 8 separate tubes and the radius drops 6% per segment (`r*(1-k*0.06)`), so every joint has a hard step. (shoulder at y≈360).
- **No canopy:** the needle ellipsoids at z 21–27 sit above the frustum, so no branches or pads are visible.

## 3. Gap (5 = worst)
Silhouette 4 · Bark 5 · Light split/rim 4 · Branches 5 · Pads 5 · Framing 3

## 4. Route
- **Trunks and branches: ChatGPT, flat-lit albedo, plus an estimated normal map.** Normals from Marigold-normals or DSINE (cylinders are easy), or an analytic `n=(cosθ,0,sinθ)` across the mask plus a luminance high-pass for the furrows. Relight in code with `smoothstep` on `dot(n,sun)` to get the lit/shadow ramp, and add a rim term `pow(1-n.z,4)`. The lit side then follows the live sun.
- **Pads: ChatGPT, one sprite per pad**, so each can animate. Crest-tint relight, no normals.
- **Blender:** keep it only for a trunk occlusion/depth mask for the mist. Drop the `redwood_*` and `needles` geometry.

## 5. Motion
- **Pad sway:** rotate each pad about its twig pivot ±0.6–1.2° (outer pads more), plus ±2 px of drift. Frequency is 0.12–0.22 Hz with a per-pad phase `hash(i)·2π`, 0.03 Hz gust envelope ×0.6–1.4. Trunks stay rigid.
- **Needles:** max 2, every 4–8 s, sine fall, 3 s fade.
- **Dapple:** a soft cookie on the lit side of each trunk (±8% luminance), driven by the pad sway. Off at night.

## 6. ChatGPT prompts
**Left tree:** "Isolated coastal redwood trunk, travel-poster gouache, transparent background, 1024×2048. Thick trunk, gentle taper, slight lean left, root flare, deep vertical fibrous bark furrows, rust-red. Three thin near-horizontal branches stepping down from the top-right, forked bare twigs, no foliage. Flat neutral light, no shadows/sky/ground. Fine grain."

**Right tree:** same as the left, but "lean right, branches extend left, trunk about 60% as wide."

**Pads:** "8 separate flat conifer foliage pads (stone-pine/redwood canopy) on transparent background, well spaced, varied, ~3:1. Scalloped needle-tuft edges; bands: teal underside #1F3B3A, body #3F6A3E, sunlit crest #9DB55A, faint peach rim. Travel-poster gouache, fine grain, no branches, no shadow."
