# 07 — Foreground vegetation: flowers, ferns, scrub

## 1. Reference inventory
- **Sword fern**: arching pinnate fronds, ~25 leaflet pairs, curled tips. Rim `#9DBF5A`, lit `#6E9A45`, mid `#3F6B3A`, core `#1E3A2C`. 3 fronds left, 4–5 right.
- **California poppy**: 4-petal cups `#F7B24A→#F08A2A→#E0621C`. 4–6 per corner.
- **Lupine** (left only): pea-flower spikes `#B49AE8→#7A5BC4→#4E3A8E`, 4–5.
- **Yarrow**: cream umbels `#F4EEDC`/`#CFC3A6`, on the outer side of each cluster.
- **Pink wildflowers**: buds and cups `#E58AB2`/`#C24E86`, scattered mid band.
- **Scrub/grass**: dark blades `#2E4A2E`, ochre-lit bluff scrub `#D9A23A`.
- **Layering (back → front)**: scrub, then pink/yarrow, then poppies and lupine, then fern fronds, then grass blades.
- **Depth of field**: none, all crisp. Depth comes from value (darker toward the edge) and scale.
- **Light**: warm backlight from the right, a thin rim on leaflets and petals, cool interiors.
- **Framing**: two triangular vignettes (left ≈30%W, right ≈35%W) anchored to the redwood bases. Bottom centre stays low.

## 2. Ours
70 orange ellipsoid discs that float on the water, plus 40 five-stick fans that read as green stakes. The slope sits off-frame. No species, corner masses, layering or rim light.

## 3. Gap (5=worst)
Ferns 5 · Poppies 5 · Lupine 5 (missing) · Yarrow 5 (missing) · Pink 5 (missing) · Scrub/slope 5 · Corner framing 5 · Rim light 5.

## 4. Route
Use **ChatGPT layers, not Blender.** Generate each corner whole, then mask-split into 3 PNGs: **L1** scrub and pink/yarrow (parallax 0.6×), **L2** poppies and lupine (0.8×), **L3** ferns and grass (1.0×, overlapping the trunk). Cut 3–5 sway sprites from L2/L3, pivot at stem base. Export as 2× WebP with alpha.

## 5. Motion
- **Sway**: rotate around the base pivot plus a slight skew. Ferns ±1.5° at 0.2 Hz, poppies ±3° at 0.4 Hz, yarrow ±2°. Random phase, ×2.3 harmonic at 30%.
- **Gusts**: every 8–14 s, a 1.2 s eased impulse that sweeps left → right with a 60 ms stagger. The same event drives the wind-audio gain swell.
- **Petal drift**: one poppy petal per 20–30 s, on a gust, wobbling down-right, 3 s fade.
- **Butterfly**: one monarch (`#F08A2A`) every ~45 s that lands on a right-side poppy. No bee. Off under reduced-motion.

## 6. ChatGPT prompts
**Style**: *"Modern layered travel-poster illustration, crisp vector-like shapes, subtle gradients, fine film grain, warm low sunset backlight with thin yellow-green rim light, no blur, isolated on fully transparent background, no ground, no text. Palette: poppy #F7B24A/#F08A2A/#E0621C, lupine #B49AE8/#7A5BC4/#4E3A8E, yarrow #F4EEDC, pink #E58AB2/#C24E86, fern #9DBF5A/#6E9A45/#3F6B3A/#1E3A2C, scrub #D9A23A."*

**(a) Left**: "[Style] Bottom-left corner cluster rising as a triangle from the lower-left: three arching sword-fern fronds leaning right; five California poppies (4-petal cups, varied angles) in front; four purple lupine spikes behind; three cream yarrow umbels; small pink wildflowers and dark grass blades along the bottom. 3600×1800 transparent PNG."

**(b) Right**: "[Style] Bottom-right corner cluster: five large fern fronds sweeping up-left from the right edge as the dominant mass; four poppies centre-left; pink clarkia buds and yarrow behind; low ochre scrub tufts at the back; grass blades at the bottom. 3600×1800 transparent PNG."

**(c) Sprites**: "[Style] Sprite sheet, items separated, upright, stem base at bottom centre: one fern frond, one open poppy on a stem, one poppy bud, one lupine spike, one yarrow stem, one pink clarkia stem, one grass tuft, three loose poppy petals, one monarch butterfly with wings open and closed."
