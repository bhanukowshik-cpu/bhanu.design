# City scroll — research-backed ChatGPT prompts (v2)

Supersedes `city-scroll-brief.md`. Same idea, rebuilt around what the research showed.

## What the research changed

1. **The camera path is proven.** Aldervale (an open-source Three.js night-city scroll site)
   runs *aerial arrival → glide down the avenue → spiral around the tallest tower →
   pull back to the skyline*. That's our story almost beat for beat, so the frames follow it.
2. **"Lights on" is cheap to build.** Zippy Town (a scroll-driven toy city) bakes a day set
   and a night set of lightmaps in Blender and blends between them in a shader. We do the
   same per building: each building gets a 0→1 "lit" value tied to scroll.
3. **The look that works:** stylized, not photoreal. Cool blue night against warm interior
   window light, with a soft tilt-shift depth of field so it reads as a miniature. Zippy
   Town uses exactly that (BokehPass tilt-shift).
4. **How ChatGPT stays consistent (OpenAI's own prompting guide):**
   - Use a fixed order every time: **scene → subject → details → constraints**.
   - **Restate the things that must not change in every prompt.** "Same style as before" drifts.
   - Make one **anchor image**, then *edit from it*: "change only X, keep everything else the same."
   - Change **one thing per follow-up**.
   - Put exact text in quotes and spell brand names out. Add "no watermark, no extra text."
   - Landscape size: **1536×1024**.

## How to run it

1. **Step A:** one storyboard grid (fast gut check of the whole flow).
2. **Step B:** the anchor frame. Regenerate until it's right. *Everything else edits from it.*
3. **Step C:** frames 2–5. **Attach the anchor image** each time and paste the prompt.
4. **Step D (optional):** sign test, phone frame, mood board.

Save into this folder as `grid.png`, `frame-1.png` … `frame-5.png`, `frame-2-phone.png`, `moodboard.png`.

---

## STYLE LOCK (it's already inside every prompt below; edit it here if you change the look)

> Stylized 3D miniature city, like a high-end Blender diorama: clean, soft, slightly
> rounded low-poly architecture, matte materials, not photorealistic. Deep dusk:
> navy and blue-black sky, cool moonlit blue on surfaces, warm amber interior window
> light (#FFC98A), one pale-green accent (#9FE8B0) only on the tallest tower. Light fog
> in low streets. Soft tilt-shift depth of field so it reads as a miniature. Subtle
> bloom on lit windows. Invented city inspired by San Francisco: steep hills, the bay
> on the left, a suspension bridge silhouette far in the distance. No people visible,
> no cars in close-up, no watermark, no extra text, no logos.

---

## Step A — storyboard grid (one image)

```
Use: a storyboard for a scroll-driven portfolio homepage, to judge the flow.

Scene: one invented city at dusk, inspired by San Francisco.

Subject: a 5-panel storyboard in one image, panels left to right in a single row
with thin dark gutters, each panel 16:9. The same city and the same buildings in
every panel. As the panels progress, the city gets more lit.

Panel 1: wide aerial view, the whole city dark, empty sky in the top half.
Panel 2: camera lower and closer on a mid-size two-block campus with a courtyard;
its windows switching on floor by floor (bottom floors lit, top still dark).
Panel 3: camera gliding along a hillside street; a small studio with planted
terraces and a tiny corner shop with a striped awning are now lit; the campus
behind stays lit.
Panel 4: low angle looking up at the tallest glass tower, every floor glowing,
a pale-green glow at the crown.
Panel 5: pulled back to the wide view of panel 1, the whole city lit, construction
cranes with small red lights on two empty lots.

Style: stylized 3D miniature city, like a high-end Blender diorama, clean soft
low-poly, matte, not photorealistic. Navy dusk sky, cool blue surfaces, warm amber
window light, pale-green accent only on the tallest tower. Light fog, soft
tilt-shift depth of field, subtle bloom.

Constraints: no people, no text, no panel numbers, no watermark, no logos.
Size 1536x1024.
```

---

## Step B — the anchor (Frame 1: arrival)

```
Use: the hero image of a portfolio homepage; a big headline will sit in the empty sky.

Scene: an invented city at deep dusk, inspired by San Francisco: steep hills, the
bay on the left edge, a suspension bridge silhouette far in the distance, fog
settling into the low streets.

Subject: wide three-quarter aerial view of the whole city, camera about 35 degrees
above the horizon. Almost every window is dark; only a few streetlights glow.

Key buildings (they must be clearly distinct, because later images reuse this city):
1. The tallest building, slightly right of centre: a slim glass-and-steel tower
   with a stepped crown. Dark for now.
2. Lower left of centre: a mid-size modern campus, two linked rectangular blocks
   around a courtyard with a few trees.
3. On a hillside street in the middle distance: a small three-storey studio
   building with plants on its terraces.
4. Next to the studio, on a corner: a tiny two-storey corner shop with a striped
   awning.
5. Two empty lots with construction cranes, one near the tower and one at the edge.

Composition: the sky fills the top 45% of the frame and stays completely empty
(no moon, no birds) for headline text. The city sits in the lower 55%. Calm and
quiet, the moment before something switches on.

Style: stylized 3D miniature city, like a high-end Blender diorama, clean soft
slightly rounded low-poly architecture, matte materials, not photorealistic. Navy
and blue-black sky, cool moonlit blue on surfaces, warm amber (#FFC98A) only on the
few lit streetlights. Soft tilt-shift depth of field, subtle bloom.

Constraints: no people, no cars in close-up, no text, no signs with words, no
watermark, no logos. Size 1536x1024.
```

**Before moving on, check:** can you point at all five buildings? Does the sky stay empty? If not, reply with only the fix, e.g. *"Keep everything the same. Only make the campus larger and more clearly two linked blocks."*

---

## Step C — frames 2–5 (attach `frame-1.png` every time)

### Frame 2 — first light: the campus

```
Image 1 is the city. Make a new frame of exactly this city.

Keep the same: every building's shape, position and materials, the hills, bay,
bridge, fog, palette and stylized miniature look.

Change only:
- Camera: lower and closer, about 20 degrees above the horizon, framing the
  two-block campus in the left-centre of the frame. The tower is visible, small
  and dark, in the far right background.
- Light: the campus windows are switching on floor by floor. The bottom two floors
  glow warm amber (#FFC98A), the middle floor is half lit, the top floor is still
  dark. Warm light spills onto the courtyard trees.
- Everything else in the city stays dark.
- The right third of the frame is calm, dark sky and soft fog (a card will sit there).

Style: stylized 3D miniature, clean soft low-poly, matte, not photorealistic. Cool
blue night against warm amber windows. Soft tilt-shift depth of field focused on
the campus, subtle bloom.

Constraints: no people, no text, no watermark, no logos. Size 1536x1024.
```

### Frame 3 — the skyline fills: studio and corner shop

```
Image 1 is the city. Make a new frame of exactly this city.

Keep the same: every building's shape, position and materials, the hills, bay,
bridge, fog, palette and stylized miniature look.

Change only:
- Camera: gliding along the hillside street at roof height, looking along the
  street toward the small studio with planted terraces and the tiny corner shop
  with the striped awning.
- Light: the studio's windows are fully lit warm amber, and its terrace plants are
  rim-lit. The corner shop's window glows and its awning is lit from below. Behind,
  the campus is fully lit. Ahead and around, the other buildings are still dark,
  so there's a clear trail: lit behind, dark ahead.
- The left third of the frame is calm and darker (a card will sit there).

Style: stylized 3D miniature, clean soft low-poly, matte, not photorealistic. Cool
blue night against warm amber windows. Soft tilt-shift depth of field, subtle bloom.

Constraints: no people, no text, no watermark, no logos. Size 1536x1024.
```

### Frame 4 — the tower

```
Image 1 is the city. Make a new frame of exactly this city.

Keep the same: the tallest tower's shape (slim glass and steel, stepped crown) and
materials, the palette and stylized miniature look.

Change only:
- Camera: low angle from street level near the tower's base, looking up so the
  tower fills most of the frame height. Fog swirls around its base.
- Light: every floor of the tower glows, brighter and whiter-warm than any other
  building. A soft pale-green (#9FE8B0) glow crowns the top, as if a rooftop sign is
  lit. In the background, small, the campus, the studio and the corner shop are lit.
- The upper part of the frame is mostly night sky beside the tower.

Style: stylized 3D miniature, clean soft low-poly, matte, not photorealistic. Cool
blue night, warm windows, pale-green crown. Subtle bloom; this is the climax, so
confident and slightly heroic, not neon.

Constraints: no people, no text, no watermark, no logos. Size 1536x1024.
```

### Frame 5 — the whole city

```
Image 1 is the city. Make a new frame of exactly this city.

Keep the same: the exact camera, composition and framing of Image 1, every
building, the hills, bay, bridge, fog, and the empty sky in the top 45%.

Change only:
- Light: the whole city is now lit with warm amber windows. The tallest tower is
  the brightest, with its pale-green crown. Both construction cranes have small
  blinking red lights. Streets glow softly through the fog. The bay reflects the
  city lights.
- Mood: an ending and an invitation, warm and alive.

Style: stylized 3D miniature, clean soft low-poly, matte, not photorealistic. Navy
sky, warm amber city, pale-green accent only on the tower. Soft tilt-shift depth of
field, subtle bloom.

Constraints: no people, no text, no watermark, no logos. Size 1536x1024.
```

---

## Step D — optional

### Sign test (attach `frame-4.png`)

We'll put real signs on in code, but this shows how the sign should feel.

```
Image 1 is the tower. Keep everything exactly the same.
Change only: add one slim rooftop sign on the tower's crown, glowing pale green
(#9FE8B0), clean geometric sans-serif, the text EXACTLY "VERIFIED CALL", written once
(spelled V-E-R-I-F-I-E-D  C-A-L-L). No other text anywhere. Size 1536x1024.
```

### Phone frame (attach `frame-2.png`)

```
Image 1 is the frame. Recompose it as a 9:16 portrait phone screen.
Keep the same: city, campus, lighting, palette and style.
Change only: the lit campus fills the lower half; the upper half is calm dark sky
and fog for a text card. No text, no watermark. Size 1024x1536.
```

### Case study heroes (attach `frame-1.png`)

Each case study opens on its own building, fully lit, so the city carries into
every page. Run once per building and save as `cs-verified-call.png`, `cs-evertutor.png`,
`cs-stressie.png`, `cs-dearly.png`.

```
Image 1 is the city. Make a new frame of exactly this city.

Keep the same: [BUILDING]'s shape, position and materials, the palette and
stylized miniature look.

Change only:
- Camera: a calm portrait of [BUILDING] alone, three-quarter view at eye level
  with its top floors, building centred-right, filling about 60% of the frame
  height. The rest of the city is soft and out of focus behind it.
- Light: [BUILDING] fully lit warm amber, the rest of the city dimly lit.
- The left 40% of the frame is calm, dark sky for the case study title.

Style: stylized 3D miniature, clean soft low-poly, matte, not photorealistic.
Cool blue night, warm amber windows. Strong tilt-shift depth of field, subtle bloom.

Constraints: no people, no text, no watermark, no logos. Size 1536x1024.
```

Replace `[BUILDING]` with one of:
- `the tallest tower (slim glass and steel, stepped crown, pale-green glow at the crown)`
- `the two-block campus with the courtyard`
- `the small studio with planted terraces`
- `the tiny corner shop with the striped awning`

### Mood board

```
Use: a mood board for a portfolio website's art direction.
A 3x3 grid of nine distinct images with thin gutters, all in one consistent palette
(navy, cool blue, warm amber, one pale-green accent):
1 a stylized miniature city at dusk, tilt-shift; 2 warm window light glowing in a
cool blue night street; 3 fog rolling over steep city hills; 4 a slim glass tower at
night with a glowing crown; 5 a tiny corner shop with a striped awning at night;
6 a modern campus courtyard lit from inside; 7 a suspension bridge silhouette in
fog; 8 construction cranes with red lights at night; 9 a typography sample: a
large clean sans-serif word "Build" next to an italic serif word "light".
No other text, no watermark, no logos. Size 1536x1024.
```

---

## Sources
- Aldervale, scroll-driven Three.js night city: https://github.com/ojja/aldervale
- Zippy Town, scroll camera + Blender-baked day/night lightmaps: https://discourse.threejs.org/t/title-zippy-town-a-toy-city-with-live-traffic-day-night-lighting-and-a-scroll-driven-camera/94955
- OpenAI image-gen prompting guide: https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- Night city in Blender (cool night vs warm windows): https://80.lv/articles/how-to-build-a-melancholic-environment-of-a-city-at-night-with-blender
