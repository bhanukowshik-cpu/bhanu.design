# City scroll — homepage section map + mockup prompts

The homepage is one city. Every section is one stop of the camera, and one building
lights up per stop. The UI (nav, headline, project cards) sits on top as HTML.
Chat: ChatGPT "Create City Storyboard". The anchor = the dark city with the flush
VERIFIED CALL facade logo.

| # | Section | Camera / city | On screen |
|---|---|---|---|
| 1 | Hero | Wide aerial, city dark, empty sky | Nav, "DESIGN ENGINEER \| Currently building Verified Call ↗", headline, 2 stats, chat bar, "Scroll to light up the city" |
| 2 | EverTutor | Low, close on the two-block campus; it lights floor by floor | Card: EverTutor Live (2,000+ students/day, $250 → $5/hr) + EverTutor Studio (104 hrs → 4) |
| 3 | Stressie | Glide up the hillside street; the terraced studio lights | Card: Stressie (12% → 56% engagement, $600K) + Stressie V4 (SwiftUI, 3 languages) |
| 4 | Dearly | Street level at the corner shop; awning + window glow | Small card: Dearly (48 hours, 140+ letters, 35 five-star) |
| 5 | Verified Call | Low angle up the tower; every floor + the facade logo light | Flagship card: Founder & CEO, 0 of 3,990 swaps, 30/30, 20 companies, live panel demo |
| 6 | About | Pull back over the whole lit city | Portrait, short bio, testimonials |
| 7 | Contact | Settle on the empty lots with cranes | "Let's build the next one", email, LinkedIn, résumé |

## Decisions — 12 Nov 2026 (after S1 + S2 mockups)

1. **A guide character.** A small stylized Bhanu sits on a bench / walks the street in
   the hero with a speech bubble "Hi, I'm Bhanu." As you scroll he walks ahead to each
   building, and the camera follows him through the city.
2. **Each building's architecture tells its product's story** (not generic blocks):
   - **EverTutor:** three buildings linked by glass skybridges (Live, Studio, and the
     students), with little students streaming in (2,000+ a day).
   - **Stressie:** a calm garden studio with terraces; people stepping out into evening plans.
   - **Dearly:** a corner letter shop with a post box; envelopes in the window.
   - **Verified Call:** the HQ tower with the flush shield logo; at its entrance a
     checkpoint arch people walk through, each one getting a green check.
   - Small animated people (instanced walkers) on streets and bridges.
3. **Live San Francisco time and weather.** The city shows SF's real time of day
   (America/Los_Angeles) and current weather (Open-Meteo, free, no API key): sun
   position, dusk, night, fog, rain. Build: Blender bakes a day set and a night set of
   lighting; the browser blends them by SF's sun angle (Zippy Town's technique), and
   fog/rain are overlays driven by the weather code.
   - **"Lighting up" still works in daytime:** by day, a building "activates" with
     people flowing in, signage on and motion; by night, its windows switch on.
4. **New font.** Instrument Sans/Serif is out; choice pending.

Shared UI style (in every prompt): dark, premium, minimal; Instrument Sans + Instrument
Serif italic for emphasis; text #EAF1FF; labels #8CC5FF; glass panels, thin light
borders, rounded corners. Right edge: section-progress dots.

---

## Prompts (each in the same chat, after the anchor)

Every prompt starts with:
> Website section mockup, full desktop viewport 16:9, 1536x1024, same city and same
> UI style as the previous sections. Keep all text exactly as written. No other text,
> no watermark.

**S1 Hero.** Already sent (see the chat). Anchor city full-bleed, dark.

**S2 EverTutor.** Background: the city frame with the camera low and close on the
two-block campus (left-centre), its windows lighting floor by floor, the rest dark.
On the right third, a glass card: label "01 · EVERTUTOR"; title "EverTutor Live";
line "A voice AI tutor that took 1:1 tutoring from $250 to $5 an hour."; big stat
"2,000+" with "students a day"; a divider; title "EverTutor Studio"; stat "104 hours → 4"
with "to build a lesson"; small role line "Sole product designer"; two links
"Read Live case study →" and "Read Studio case study →". Right-edge dots, dot 2 active.

**S3 Stressie.** Background: the camera has glided up the hillside street; the small
studio with planted terraces is lit warm; the campus behind is still lit; everything
ahead dark. On the left third, a glass card: label "02 · STRESSIE"; title "Stressie";
line "Rebuilt a workplace wellness app around daily use."; stat "12% → 56%" with
"engagement"; small "Helped unlock $600K in funding"; a divider; title "Stressie V4";
line "Designed in Figma, built in SwiftUI, in 3 languages."; role line "Founding
designer · Harvard-incubated"; link "Read case study →". Dot 3 active.

**S4 Dearly.** Background: street level at the tiny corner shop with the red-and-white
striped awning, window glowing, the lit studio and campus behind. Bottom-right, a
small glass card: label "03 · DEARLY"; title "Dearly"; line "Voice letters you can hear
and keep."; stats "48 hours" "140+ letters" "35 five-star"; link "Open Dearly ↗". Dot 4 active.

**S5 Verified Call.** Background: low angle looking up the tower; every floor glowing,
the flush shield logo and VERIFIED CALL wordmark lit emerald and white. A larger
glass card on the left: label "NOW BUILDING · FOUNDER & CEO"; title "Verified Call";
line "Confirms the person on a hiring call is real, is who they say they are, and is
not reading answers from a hidden AI tool."; three stats "0 of 3,990" "face swaps got
through", "30 / 30" "hidden AI tools caught", "20" "companies in beta"; a small
product screenshot of a verification panel with green checks ("Real camera",
"Face match", "Same voice", "No hidden apps"); link "Read case study →". Dot 5 active.

**S6 About.** Background: pulled back to the wide view, the whole city lit, the tower
brightest. Centred glass panel: a round portrait photo of a young South Asian man
with dark hair; heading "Hi, I'm Bhanu."; two short lines "Design engineer and founder
in the San Francisco Bay Area. I design products, then I build them."; below, a row
of three small testimonial cards with short quotes and names (placeholder text is
fine, keep it readable).

**S7 Contact.** Background: settled on the empty lots with construction cranes and
their small red lights, the lit city around. Big centred headline "Let's build the
next one." with "next one" in the italic serif; a line "Open to the right team.";
a pill button "Email me"; small links "LinkedIn", "Résumé"; tiny footer "© 2026
Bhanu Kowshik".
