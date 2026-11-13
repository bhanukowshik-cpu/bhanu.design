# Final direction: "The City" homepage (locked 12 Nov 2026)

Details live in `city-story.md`; this page is the one-glance contract.

## The concept
A living San Francisco at the real current SF time and weather. Bhanu appears once:
a tiny figure on a far-off bench in the hero, on a laptop, saying "Hi, I'm Bhanu."
Scrolling is the only input. The hero centres on the Golden Gate Bridge; the first scroll swings the camera to the Verified Call tower, then on through the city; each product
is a place it arrives at, then looks inside.

| Place | Outside | Inside | Product |
|---|---|---|---|
| The tower | A regular glass tower in the skyline with its flush shield logo + VERIFIED CALL wordmark; the camera just orbits it as every floor lights. **Nothing inside: no cutaway, no checkpoint.** | — | Verified Call (Founder & CEO) |
| The school | Three buildings, glass skybridges, students streaming in. No brand sign. | Students on computers, a voice tutor screen, a creators' lab, a data wall | EverTutor Live · Studio · Analytics |
| The wellness studio | Warm wood, garden, koi pond, people with yoga mats | Breathing room, check-in on a phone, then evening plans on the terrace | Stressie · Stressie V4 |
| The letter | A lit window: someone looking at a friend's photo: "Damn… I wish I could send them a letter right now." | The florist and letter shop on the corner lights up | Dearly |
| Bookend | Pull back over the whole lit city: About + testimonials as lit windows | — | — |
| The empty lot | A crane with a blinking red light: "Let's build the next one." | — | Contact |

No "Act" labels anywhere in the UI.

## How it's built
- **Blender, by script:** one Python script per building, same as Daniel's world. A style kit
  (scale, palette, materials, window glow, export) is set first with the school.
- **Live in the browser:** Three.js for the scene, GSAP ScrollTrigger + Lenis for the scroll camera,
  HTML cards on top.
- **Live SF:** sun position from SF time (America/Los_Angeles) blends baked day and night lighting;
  Open-Meteo (free, no key) drives fog and rain.
- **Look:** smooth stylized 3D or pixel-rendered 3D. It's one render setting, decided after the
  school proof is seen both ways.
- **Parallel:** after the school proof is approved, 5 sessions on separate branches (city base,
  wellness studio, Dearly, tower, browser engine), merged here.
- **Safety nets:** "Just show me the work" link to the plain card grid; reduced-motion stills;
  the current site stays live until the city is approved.

## Type
**Bricolage Grotesque** for headlines, UI and the big numbers (its condensed widths make the
giant numerals). **Fraunces Italic** for the emotional words. Instrument Sans/Serif is retired
for this site. Both are free Google Fonts.

## Metrics: make them land
The rule: **one giant number per place**, written as a *transformation* (before → after, or a
multiplier), counting up as the building lights. A plain-English line says what it means. Every
figure below comes from the existing case-study copy; the derived ones are simple maths on it.

| Place | Giant number | What it means | Supporting |
|---|---|---|---|
| School · ET Live | **50× cheaper** | 1:1 tutoring went from $250 an hour to $5. One old session now buys fifty. | 2,000+ students a day |
| School · ET Studio | **104 hrs → 4** | A lesson that took 2½ work-weeks now gets built before lunch. **26× faster.** | 3,000+ lessons made |
| School · ET Analytics | **[needs a number]** | — | — |
| Wellness · Stressie | **12% → 56%** | Engagement up **4.7×**: from 1 in 8 people to more than half. | Helped unlock **$600K** |
| Letter · Dearly | **48 hours** | From idea to shipped. | 140+ letters · 35 five-star |
| Tower · Verified Call | **0 of 3,990** | Not one deepfake face swap got through. | **30/30** hidden AI tools caught · **20 companies** in beta · built solo in **3 weeks** |

**To confirm with Bhanu before publishing:**
- The ET Analytics headline number.
- Whether to add a monthly reach line for ET Live. "60,000+ students a month" only holds if 2,000+ is
  true *every* day; otherwise keep it to "a day."
- That "50×" ($250 → $5) and "26×" (104 → 4) are fine to state as multipliers.
