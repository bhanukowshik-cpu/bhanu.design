# The City — homepage story (v3, reimagined)

**One line:** *"I'm Bhanu. These are the things I've built. Take a look around."*

Bhanu appears once, in the hero only: a tiny figure on a far-off bench in the wide
city shot, working on a laptop, with a small "Hi, I'm Bhanu" bubble. He stays there;
he is never in any act. The camera tours a living San Francisco on its own. Every product is a
place: a district the camera arrives at, then moves **inside**. Scrolling is the only input.
The sky follows real SF time and weather.

## The system (the same for every project, so it reads instantly)

Each place has three beats:

1. **Arrive (exterior).** The camera glides in and frames the place from outside. The
   district wakes up: by night windows switch on, by day people flow in and signs light.
2. **Step inside (cutaway).** The facade slides away like a dollhouse, and the camera moves
   floor by floor through the product's world. One beat per product or feature, each with
   one glass card (what it is, one big number, a link).
3. **Step out.** Pull back. The place stays lit and alive as the camera moves on.

The look stays consistent throughout: stylized 3D miniature (Blender), warm interior
light, cool outdoor light, little animated people, and one accent colour per place.

---

## Prologue: Hello (hero)

- **Exterior, wide.** SF at the real current time, the whole city and bay, no people in focus.
- UI: nav, the headline "I design and build AI products that *scale, convert, and connect.*",
  the chat bar, and "Scroll to take a look around".
- **Scroll:** the camera rises over the rooftops and glides off into the city.

## The school (EverTutor)

**Arrive.** A bright, modern school campus of **three buildings linked by glass
skybridges**, with students streaming in through the gates (the 2,000+ a day as
little walkers). No brand sign on the building: it simply reads as a school; inside, students work on computers and screens. EverTutor is named only in the card. Card: "The EverTutor ecosystem: three products,
one school."

**Inside, 1a: ET Live (the classroom).** Cutaway into a classroom full of fancy
electronics: a student at a desk talking to a voice AI tutor that glows on a big
screen, with waveforms in the air. Card: *EverTutor Live · $250 → $5 an hour ·
2,000+ students a day* → case study.

**Inside, 1b: ET Studio (the creators' lab).** Across the skybridge into a maker lab:
teachers at large touch tables assembling lessons, a wall of lesson cards building
itself. Card: *EverTutor Studio · 104 hours → 4 · 3,000+ lessons* → case study.

**Inside, 1c: ET Analytics (the observatory).** Up to the rooftop dome: a data wall
showing learning progress, glowing graphs, and staff looking up at it. Card: *EverTutor
Analytics* · [metric TBD — send me the headline number] → case study.

**Step out.** The whole campus glows; the skybridges pulse as students cross.

## The wellness studio (Stressie)

**Arrive.** The camera climbs a quieter street; the city noise fades, colours soften, and
there are plants everywhere. A real **wellness studio**: warm wood, big windows, a
garden courtyard with a koi pond, and a sign *Stressie*. People with yoga mats walk in.

**Inside, 2a: the daily check-in.** Cutaway into the studio: a yoga and breathing room with
soft light, plants and mats, a sound bowl, and a tea corner. One person on a cushion
checks in on their phone while a slow breathing light fills the room.
Card: *Stressie · engagement 12% → 56% · helped unlock $600K* → case study.

**Inside, 2b: plans after work (V4).** The doors open onto a terrace where the same
person meets friends: the check-in turned into an evening plan. A phone shows the SwiftUI
app in 3 languages. Card: *Stressie V4 · designed in Figma, built in SwiftUI* → case study.

## The letter (Dearly)

A short, human beat told through one person, not a building.

- **Zoom in.** Across the street, through a lit apartment window: someone on a couch
  at night, looking at a photo of a friend on their phone (a beach trip, both laughing).
- **The thought.** A speech bubble: **"Damn… I wish I could send them a letter right now."**
- **The answer.** Down on the corner, a little florist and letter shop with a red post box
  glows on. Card: *Dearly · voice letters you can hear and keep · built in 48 hours ·
  140+ letters · 35 five-star* → **Open Dearly ↗**.
- **The payoff (optional).** A glowing envelope with a tiny sound wave flies from their
  window to the friend's window across the city.

## The tower (Verified Call) — comes FIRST, right after the hero

A regular glass tower in the skyline. Its identity is only the flush backlit shield emblem
and the VERIFIED CALL wordmark below the crown. **Nothing inside: no cutaway, no startup
floor, no call screen, no checkpoint.** The camera swings over from the Golden Gate,
orbits the tower as every floor lights up, and the logo comes on last.
Card: *Now building · Founder & CEO* · giant **0 of 3,990** ("deepfake face swaps got
through. Not one.") · 30/30 hidden AI tools caught · 20 companies in the beta · built solo
in 3 weeks → case study.

## Epilogue: About and contact

**About (pull back).** The camera pulls back to the opening wide view, now with the whole city lit (a bookend).
Short bio and portrait in a glass panel, and testimonials appearing as lit windows across the skyline, each one a quote.

**Contact (the empty lot).** The camera settles on an empty lot with a construction
crane and its blinking red light. Headline: **"Let's build the next one."** Email, LinkedIn, résumé.

---

## Living-city rules
- **Time:** the sky, sun and moon follow SF's real time (America/Los_Angeles). Blender bakes day and
  night lighting; the browser blends them by sun angle.
- **Weather:** Open-Meteo (free, no key). Fog rolls in when SF is foggy; rain makes reflections.
- **People:** small instanced walkers on streets, bridges and inside buildings. Quiet, never in the way.
- **No "Act" labels in the UI.** Cards name the product, never a chapter number.
- **Skimmers:** the right-edge dots jump to any place; a "Just show me the work" link opens the
  plain card grid.
- **Reduced motion:** stills for each beat, with no camera moves.

## Mockups to generate (one per beat)
P · 1-arrive · 1a · 1b · 1c · 2-arrive · 2a · 2b · Dearly · 3-arrive · 3a · 3b · About · Contact
