# 02 · Golden Gate Bridge

## 1. Reference (1672×941)
- Both towers visible. Near tower x≈22%. Far tower x≈81%. Size ratio 1.33, so the view is ~25–30° oblique. Eye is high: water horizon y≈395.
- Tower ≈3.6× deck clearance. Screen span:tower ≈3:1, towers ~1.4× true height.
- Portals: the face cheats open (3 rectangular openings above the deck, X-brace below). Sag bottoms just above the deck. ~60 single fine suspenders, thin truss, warm lamp dots.
- Colour: lit #E4643C, sun edge #F07A48, shadow #A4402E, void #7A2E28, fogged legs #D69A90→#E8C4BC.
- Fog veil at deck level and below hides the piers; towers stay saturated above it. Reflection: tower streaks only.

## 2. Ours (gg_poster_v2)
Redwoods hide both towers. Camera (0,58,6.5) at lens 30 puts them at ±29° (frame edges). The camera sits at deck height, so the deck is a line. haze_k 0.35 bleaches everything. Fog cards cut the rotated bridge diagonally. Mirror geometry adds a grey ghost bridge. Doubled suspenders cause moiré. Model (gg_tower) is good.

## 3. Gap (5 = worst)
- Composition/camera **5**: towers occluded
- Tower:span **4**: true scale reads flat
- Portals **3**: view angle hides them
- Cable sag **2**: MID already right
- Suspenders **3**: dense, doubled
- Deck/truss **2**
- Colour/light **3**: hazed out, no sun edge
- Fog wrap **4**: cards, not veil
- Reflection **4**: ghost bridge
- Lights **3**: white, not warm

## 4. Route
**(b) Blender is primary.** The bridge needs real normals because live relighting matters most here. At SF sunset the sun is behind the viewer and the towers are front-lit (the reference look). At sunrise they are backlit with rim light.
- POSTER override: TX 80→60, AX 123→92, TOP 28.9→32, MID 10.2→9.8, DECK kept. Tiers ×1.2 wide.
- PANEL 1.6→2.0, one suspender per band, no fluting.
- Bridge rotation −14°→−28°. Turn each tower +12° on its own z so the portals read.
- Camera z≈11–12, pulled back until world_to_camera_view gives near/far towers at x 0.22/0.81, near top y 0.72, deck 0.47. Redwoods stay outside x 0.12–0.88.
- haze_k 0.12.

**(c) Code:** height fog veils in front of and behind the bridge layer, streaked reflections, suspender tint by sun elevation (1px wide, so no usable normals), all lights.

**(a) ChatGPT:** fog veils plus a paint-over target only. Generated bridges drift in shape and can't be relit.

## 5. Motion and life
- Traffic: head/tail-light dots along an exported deck polyline.
- Red tower-top beacons: synced pulse every 1.5 s.
- Night: floodlit legs fading upward (#FFB070), sodium deck lamps with bloom. No cable necklace (that's the Bay Bridge).
- Fog: 2–3 parallax veils drifting at 8–20 px/s through the legs.

## 6. ChatGPT prompts (transparent PNG)
**Base:** "Golden Gate Bridge alone on a transparent background, modern layered travel-poster style, flat gradients, grain. Oblique view from the Marin Headlands, both towers visible, near tower left and larger. Slender International Orange towers with rectangular portals, deep cable sag, fine suspenders, thin truss deck. Lower legs fade into pink-white fog at deck level. No text, sky, water or land."

**Variants (append to base):**
- Golden hour: "sun behind viewer, #E4643C towers, #F07A48 edges"
- Sunrise: "backlit, #A4402E towers, gold rim"
- Midday: "flatter #D8603E, cool shadows"
- Night: "floodlit towers fading upward, red beacons, sodium deck lights, car streaks"
