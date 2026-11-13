# Golden Gate hero: fix plan (merged from 8 component reviews, 12 Nov 2026)

Reviews: `storyboard/component-reviews/01…08`. Reference tiles: `storyboard/reference/`.
Rule: **AI art for anything organic or painterly · Blender for the relightable bridge · code for light, motion, water and sound.**

| Component | Gap | Route | Key spec (from the review) |
|---|---|---|---|
| Sky + sun | 5 | **Code** (shader) | Diagonal sunset: lavender #7E7FB8 (top-left) → mauve #B08AAE → coral #E59A8E → peach #F2B184 → gold #F5C77A (right); keyframes blended by SF sun; **no hard sun disc**: warm bloom, sun hidden behind the right redwood; a calm band kept clear for the title |
| Clouds | 5 | **AI** (greyscale) → tinted in code | 2–3 thin bands above the hills, gold top #F7C9A0 / pink-lavender underside #D49AA6, <15% of the sky |
| Gulls | 4 | **Code** | 3 small "M" gulls #3D3550, flap 2.2 Hz then glide 2–4 s |
| Golden Gate | 3–5 | **Blender** (relit live) | Poster proportions TX 60, AX 92, TOP 32; towers 1.2× wider; rotate −28° and each tower +12° so the portals face us; camera z≈11–12 so the towers land at 22% / 81% of the width; one suspender per 2.0 panel; haze_k 0.12. Lit #E4643C / edge #F07A48 / shadow #A4402E. Lights in code: traffic dots, beacons pulsing every 1.5 s, towers floodlit from the base at night (no lights along the cables) |
| Fog | 5 | **Code** (fBm shader, 3 strips) + optional AI plate | Lumpy banks hugging the water and tower bases; top #DAB2B7 / underside #939AB4; drift 0.004–0.015 uv/s; density from SF humidity, speed from wind; amber city glow at night |
| Water + reflections | 4–5 | **Code** (shader) | Bands #C3C9D6 → #3E6B82, warm bleed #D9B49A; reflections = vertical streaks cut by 6–10 px ripple lines (gaps widening toward the viewer, 1–4 px sideways offsets), fading at 1.2–1.5× the object's height; glitter; layered-noise motion, no pure sines |
| Ferry + wake | 4–5 | **AI** sprite + **code** wake | ~5.7% of the frame width, under the right tower, drifts ~6 px/s; V ≈ 8°, foam breaking into dashes, fading 200–260 px behind |
| Sea lions | 5 | **AI** sprites + **code** ripples | 3 animals, heads up, snouts 10–20° up; body #B9814F, rim #E2AE78, shadow #6E4B38; 4 poses + 3 dive frames + splash. Ripples: 4–6 flat rings (4.5:1), strongest inner ring, widening gaps, fading to 0.15, light front arc + dark trough, spawned on each dip |
| Rocks + lookout | 5 | **AI** layer | Angular sandstone slabs, lit #E0925E → #C4704A, violet shadows #4D4559 → #352F42 (never black), rim #F5B783, olive/gold scrub #6E8A3E / #C9A044, a 1–2 px pale shore lip |
| Bench + Bhanu | 2–4 | **AI** sprite (3 poses) + **code** glow | About 1/9 of the tower's height; typing / looking up / leaning back; laptop glow flicker; looks up at the bridge every 20–40 s |
| Redwoods | 4–5 | **AI** trunks + 8 foliage pads | Lean, taper, flare, bark furrows; lit #C4622F / #E07A3C, shadow #3A2A45 / #241B33, rim #F2A15E; flat cloud-like pads #1F3B3A / #3F6A3E / #9DB55A; pads sway ±0.6–1.2° at 0.12–0.22 Hz under gusts; estimated normal map so the lit side follows the sun |
| Flowers + ferns | 5 | **AI** corner clusters → 3 parallax layers + sprites | Sword ferns, poppies #F7B24A → #E0621C, lupine #B49AE8 → #4E3A8E, yarrow #F4EEDC, pink #E58AB2, scrub #D9A23A; gusts every 8–14 s synced to the wind sound; a monarch every ~45 s |
| Skyline + hills | 4–5 | **AI** band (evoke the landmarks, don't copy them) + **code** ridges | 5 depth bands: #FAA48C → #9993AD → #7993AE → #6F95B9 → #335F75; ~35 slim towers above a hillside of pale houses, ~9% of the frame; ~400 window lights come on at dusk |
| Alcatraz | 5 | **AI** sprite | ~6% of the frame width; peach-lit cellhouse #E7B498, lighthouse, water tower; lighthouse beam at night |
| Title | 3 | **HTML** | Outlined geometric sans: **HI, I'M BHANU**; below it, in solid text: "Design engineer in San Francisco, building products that convert and connect." (owner, 12 Nov). Fits on one line within ~80% of the width, in the clear sky band |
| Sound | — | **Code** | **PAUSED (owner, 12 Nov): no audio work until further notice.** When resumed: ON by default with a toggle; barks timed to surfacing, wind synced to gusts, foghorn only when foggy |

> **Scope (owner, 12 Nov):** work ONLY on what is visible in the hero right now: sky, title,
> bridge, fog, city/hills, Alcatraz, water + reflections, ferry + wake, sea lions + ripples, gulls,
> redwoods, rocks/lookout + bench, foreground flowers/ferns. The ambient-life table below is
> **deferred** (backlog), and sound is paused.

## Ambient life: "looking into nature" (owner, 12 Nov) [DEFERRED]
The scene should feel like watching a real place, not a loop. Rules: **rare, randomised events**
(never on a fixed beat), never two big moments at once, every creature small and in scale, all
motion eased with layered noise, everything off under reduced motion. Animals that actually live
at the Golden Gate:

| Creature | Behaviour | Frequency | Route |
|---|---|---|---|
| Sea lions (×3) | Natural bob, head turns, dives and resurfaces elsewhere, bark on surfacing | constant, dives every 25–45 s | AI sprites + code |
| **Jumping fish** | A small silver fish arcs out of the water: glint at the top of the arc, splash ring and droplets on re-entry, a soft "plip" | every 15–40 s, random spot in the cove | AI sprite (2–3 frames) + code arc/splash |
| **Brown pelicans** | A line of 3–5 gliding low over the water in formation; occasionally one folds and **plunge-dives** with a splash | glide every 40–90 s; a dive ~1 in 3 passes | AI sprites (glide, fold) + code |
| **Harbor porpoises** | Two small dark fins roll through the surface near the bridge (a classic Golden Gate sighting) | every 60–120 s | AI sprite + code roll + ripples |
| Gulls | Flap and glide across the sky; one lands on the rocks now and then | constant, 1–3 visible | code |
| Cormorant | Perched on a shore rock, wings spread to dry; occasionally flaps | slow loop | AI sprite (2 frames) |
| Monarch butterfly | Lands on a poppy | ~45 s | AI sprite + code |
| Sailboat | A small sail crossing far out in the bay (daytime only) | one at a time, slow | AI sprite |
| Rare treat: **humpback whale** | A far-off spout and a tail fluke near the bridge (they really enter the bay) | rare: about once every 5 min, or once per visit | AI sprite + code |
| At night | Fewer creatures; the lighthouse beam, the foghorn, sea lion barks in the dark | | |

Sound follows the creatures (plip for fish, splash for pelicans, a blow for the whale, barks),
mixed low under the waves and wind.

## Order of work
1. **Engine fixes** (agent, in progress): title, reflections, support for light-only AI layers.
2. **Generate the AI assets in ChatGPT**, in one chat with the first asset attached as the style anchor: redwoods L/R + foliage pads → flower clusters L/R + sprite sheet → rocks + lookout → bench + Bhanu (3 poses) → sea lions (poses + dives + splash) → ferry → skyline band → Alcatraz → clouds → fog plate. Saved to `city/assets/gg/` as transparent PNGs.
3. **Blender bridge v3**: poster proportions + camera, exported as relightable layers.
4. **Assemble in the engine**, review side by side with the reference, iterate.
