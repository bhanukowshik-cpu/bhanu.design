# 04 · Sea lions + ripples

## 1. Reference
- **Count:** 3, bottom-left cove. The ref_x0800 edge one is the third animal. 35–60 px tall at 1672w.
- **Poses:** periscope pose with the snout tipped 10–20° up. Left: 3/4 right. Centre: frontal. Right: profile right.
- **Silhouette:** a bottle-shaped neck widening into the water, rounded crown, short blunt snout, tiny high dark eye, no ear flap, pale whiskers. Neck ≈ 50% of visible height.
- **Colour:** rim `#E2AE78`, mid `#B9814F`, shadow `#6E4B38`, eye `#2A1E1A`. The wet look is a thin sun-side rim light.
- **Waterline:** a flat cut, a dark contact band `#2E4A58`, and a faint broken vertical reflection.
- **Ripples:** 4–6 rings per animal, ellipse ≈ 4.5:1. Spacing widens outward. The **inner ring is strongest** (thick, α≈0.9) and the outer rings thin out to α≈0.15. Each ring is a light front arc `#D6E6EA` over a faint dark trough `#3C6577`. Rings are **broken**: they fade at the sides and back. Water is `#5A8499`.

## 2. Ours, and why it fails
- **gg_poster_v2:** dark `#2A2228` stacked spheres with no neck, snout or rim light, so they read as rocks. Rings are 2–3 uniform, opaque white and continuous, too round, with no falloff or trough.
- **sealions_v2:** metaball worms with googly bead eyes and tube snouts, sitting in 3D torus "inner tubes" with white dashes.

## 3. Gap: **5/5** (full replace)

## 4. Route
**Sprites (AI, not 3D):** transparent PNG, 512 px tall, flat waterline at the bottom edge, upper-right warm key light on every frame. Poses: A 3/4-right, B frontal, C profile-right (flip for left), E looking up. Dive: F1 snout dips, F2 half-submerged, F3 crown only, plus a splash-crown sprite.

**Ripples (Canvas2D):**
```
N=5; r_i = R0 + k*pow(age, 0.6)         // fast then slows
aspect = 0.22                            // ≈ sin(camera pitch)
width = 0.6 + 2.2*(1-age/life)^0.8 px
alpha = 0.9*exp(-2.2*age/life); centre ring pinned α .85 at r=0.9*bodyW
r(θ) += 0.6px*noise(θ*3+i, t*.4)         // wobble
light arc: front, α*sin(θ)^1.5 (fades at sides), back α*.25, 'screen'
trough: r-1.5px, #3C6577, α*.5, 'multiply'
life 3.2s; spawn when bob velocity crosses 0 going down (~1.6–2.4s)
```
Add a contact shadow ellipse (0.55·bodyW, α .6) and a reflection: the sprite flipped, scaleY .6, α .3, with a 1–2 px sine wobble.

## 5. Motion
- **Bob:** y = 2·fbm(t·.35) + .8·sin(t·1.9+φ) px. Add a ±2° tilt that lags the bob by .3 s.
- **Head turns:** every 6–14 s, crossfade to a neighbouring pose (A↔B↔C) over 180 ms.
- **Dive:** each animal every 25–45 s, never two at once. F1→F3 over .5 s, then a 3-ring burst 80 ms apart at α 1. It stays under 3–6 s and resurfaces 40–120 px away: crown first, 2 rings, rising over .6 s.
- **Sound:** "plip" at the start of the dive, short bark 150 ms after surfacing. Muted by default; reduced-motion = bob only.

## 6. ChatGPT prompts
Prefix: *"Modern layered travel-poster illustration, soft gouache grain, golden-hour rim light from upper right. A California sea lion's head and neck rising out of water, cut flat at the waterline. No water, ripples or reflection. Transparent background PNG, 512px tall. Rim #E2AE78, body #B9814F, shadow #6E4B38, tiny dark eye, blunt snout, pale whiskers, no ear flap, realistic proportions, not cartoon."*
- A: "3/4 view facing right, snout tipped up."
- B: "frontal, looking at viewer."
- C: "strict side profile facing right, whiskers visible."
- E: "head tilted back, looking at the sky."
- F1/F2/F3: "same animal diving: snout dipping 30° / half the head submerged / only the crown visible."
- Splash: "small white droplet splash crown, no animal."
One chat; attach A as the style reference for the rest.
