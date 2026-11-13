# bhanu.build: handoff (13 Nov 2026)

For whoever picks this up next (a new Claude account or session). Read `CLAUDE.md` first; it still applies. This file is the state of play after the 12–13 Nov work, plus the next task: real sound from Epidemic Sound.

---

## 1. Where things stand

- **Live:** https://bhanu.build serves `main` at `576020c`. Everything below is live; nothing is half-done.
- **Branch you work on:** `portfolio-v6` (local, same content as `main`). Shipping = merge `portfolio-v6` into `main` and push (method in §3).
- **Pages:** `index.html` (homepage) · `verified-call.html` · `stressie-v4.html` · `evertutor-live.html` · `evertutor-studio.html`.
- **Last full QA (13 Nov, on live):** 212 site URLs, 0 broken. 3 engines (Chrome, WebKit, Firefox) × desktop/tablet/phone × 5 pages, no JS errors, no sideways scroll. Interactions (nav, chat, menus, CTAs, keyboard) pass. axe: 0 serious/critical. Real-GPU full-scroll flicker scan: 0–2 blink frames, no frames over 100 ms.

## 2. Owner rules (non-negotiable)

1. **Never push to `main` without the owner saying so for that specific change.** Commit locally freely; ask before every push.
2. Surgical edits only (`CLAUDE.md`): never rewrite a page, never delete a section without asking.
3. Edit the main repo files directly (no worktrees). The local server is `python3 -m http.server 8080` from the repo root.
4. The owner tests in Chrome. Headless checks are fine for logic; **verify anything visual or performance-related on real-GPU (headful) Chrome**, and run flicker scans twice (single runs are noisy).
5. Disk is tight (the Mac has hit 0 bytes twice). Delete your own captures as soon as they're measured. Leave the owner's files alone.

## 3. How to ship (after the owner approves)

```bash
cd /Users/bhanu/Desktop/Portfolio
git fetch -q origin
T=$(git merge-tree --write-tree origin/main portfolio-v6) && git diff --quiet portfolio-v6 "$T" && \
C=$(git commit-tree "$T" -p origin/main -p portfolio-v6 -m "Merge portfolio-v6: <what>") && \
git push origin "${C}:refs/heads/main" && git fetch -q origin && git branch -f main origin/main
```

Netlify deploys `main` in about 30–40 s. Confirm by fetching a changed file from https://bhanu.build.

## 4. How the homepage works now (the parts that bite)

- **Opening:** a cloud entrance (`.hero-entry`). The site opens in clouds; when the hero painting is ready (`html.scene-on`) the clouds part and the view descends; the title drops about 1.1 s later (`hero-go`). Any wheel/key/tap skips it; it's off for reduced motion. The old `#v6Loader` stays OFF.
- **Hero painting:** `poster-lab.html` in an iframe (`#heroCity`), WebGL. An instant still (`city/layers/gg_ai/poster-{night,golden,day}.webp`, chosen by SF's real sun) shows first, then the live scene crossfades in. Head script `whenHero()` / `afterHero()` gates everything off-screen until the hero has painted.
- **Work = painted chapters** (`#chapters .chp`, one per project, sticky-pinned). A chapter loader (search `CHAPTER ART LOADER`):
  - loads only the time-of-day layers that are visible (2 per chapter, not 6),
  - decodes them and pre-builds that chapter's WebGL "living painting" at idle,
  - fades the painting in only when complete.
- **Launch films on the painted devices are MP4 loops** (`films/video/*.mp4`), not live iframes. Live iframes in a 3D transform were the root cause of the scroll flicker. If a `films/*.html` changes, re-record its MP4 (one exact loop: pause the film, post `{type:'film', play:true}`, record, encode by frame timestamps).
- **Scrolling:** native wheel and trackpad (Lenis `smoothWheel: false`; Lenis kept only for programmatic scrolls). Chapter paintings hold one scale (no per-frame zoom); per-frame rescaling made the paintings shimmer.
- **Case studies** share `case-study-v6.css` (tokens, glass buttons, nav pill) and `case-study-v6.js` (painted hero scene by SF sun). Each hero maps its product film onto the painted device with a matrix3d quad (`placeHeroPhone`, `placeLiveScreen`, `placeHeroScreen`).

## 5. NEXT TASK: real sound from Epidemic Sound

**Goal:** a calm, opt-in soundscape that makes the paintings feel alive, built from licensed Epidemic Sound recordings. It must never autoplay, never surprise, and cost nothing until someone turns it on.

### 5.1 What already exists (build on it, don't rebuild)

`poster-lab.html` (the hero painting) already has a complete sound engine. It's switched off.
- `CFG.soundEnabled: false` (about line 233) is the owner's "sound paused" switch.
- A `SOUNDS` map (about line 1192) with seven slots, each `{ src: null, gain }`:
  - `ocean` · `wind` · `bark` (sea lions) · `plip` (water) · `gull` · `foghorn` · `ferryHorn`
  - `src: null` means a synthesised placeholder plays. **Set `src` to an audio URL and the engine fetches, decodes and uses the real recording instead.**
- An `Audio_` engine: Web Audio graph, master gain, reverb, stereo panning, ocean swell tied to the scene.
- A corner toggle `#sndBtn` + `#sndHint` ("tap for sound"), remembered in `localStorage.posterSound`, unlocked on the first pointer/key/touch (browser autoplay rules).

### 5.2 Sounds to source from Epidemic Sound (Sound Effects library)

Download WAV where offered. Pick recordings without voices or music unless noted.

| Slot / place | What to search for | Use |
|---|---|---|
| `ocean` | "bay water lapping rocks night", "calm harbor waves" | loop, 45–90 s |
| `wind` | "coastal wind soft", "headland breeze" | loop, 45–90 s |
| `bark` | "sea lion bark distant" | 3–6 one-shots |
| `plip` | "water drip splash small" | 3–6 one-shots |
| `gull` | "seagull distant call" | 3–6 one-shots |
| `foghorn` | "Golden Gate foghorn" or "foghorn distant" | 1–2 one-shots |
| `ferryHorn` | "ferry horn distant" | 1 one-shot |
| Cloud entrance + section fly-through | "wind whoosh airy", "flying through clouds" | one 2–3 s swell |
| Verified Call (night office) | "office night room tone", "desk lamp room hum" | loop |
| Stressie (park café) | "outdoor café ambience evening", "park murmur distant" | loop, no clear speech |
| EverTutor Live (kitchen) | "kitchen ambience quiet home" | loop |
| EverTutor Studio (classroom) | "empty classroom room tone" | loop |
| EverTutor Analytics (office) | "quiet office ambience" | loop |
| Dearly (living room) | "living room fireplace crackle soft", "clock ticking room" | loop |
| Footer (bridge at night) | reuse `ocean` + `foghorn` | — |

### 5.3 File specs

- Store under `audio/` in the repo: `audio/hero/ocean.m4a`, `audio/chapters/stressie.m4a`, …
- **Loops:** 45–90 s, trimmed and crossfaded so the loop point is inaudible. Stereo AAC `.m4a`, 128 kbps (plays everywhere, including Safari and iOS).
- **One-shots:** mono AAC `.m4a`, 96 kbps, under 6 s, 50 ms fade-in/out.
- **Levels:** normalise every file to the same loudness before setting gains, so the existing `gain` values in `SOUNDS` stay meaningful. Aim for quiet: this is a room tone, not a soundtrack.
- **Budget:** under 1.5 MB for the hero set and under 600 KB per chapter loop. Nothing downloads until sound is turned on.

### 5.4 How to wire it

1. **Hero:** fill `SOUNDS.*.src` in `poster-lab.html` with the new files and flip `CFG.soundEnabled` to `true`. Keep the toggle, the "tap for sound" hint and the localStorage memory.
2. **Move the toggle to the homepage:** one sound button in the homepage's glass nav, off by default, which posts `{type:'sound', on}` into `#heroCity` (and `#ftCity`). The page already messages these iframes (`'run'`, `'motion'`); follow that pattern.
3. **Chapters:** one small Web Audio player in `index.html` that crossfades between chapter loops by scroll (the chapter in view at ~60% gets volume 1; neighbours fade over about 1.5 s). Reuse the IntersectionObserver that already plays and pauses each chapter's film.
4. **Entrance / fly-through whoosh:** play once on `scene-on` (entrance) and when the cloud bank peaks (`.chp-clouds`), only if sound is on.
5. **Always:**
   - pause all sound when the tab is hidden (`visibilitychange`);
   - duck to 30% while the chat panel or a video with its own audio is open;
   - never start before a user gesture.
6. Verify on real Chrome and Safari (an iPhone if possible). Then ask the owner before pushing.

### 5.5 Before shipping: licensing

Confirm that the owner's Epidemic Sound plan covers use on a personal portfolio website (bhanu.build) and what attribution, if any, it requires. Don't assume. If attribution is needed, add it to the footer credits line. Keep a list of the exact tracks used (title, ID, licence) in `audio/CREDITS.md`.

## 6. Open items the owner may raise

- Positioning consistency: the title reads "Design Engineer and Founder", the hero says "Product engineer", the résumé file is "AI Native Designer", and the chapters say "Sole product designer". The owner hasn't decided; don't change it unasked.
- Verified Call has a new section heading, "Three rules I keep.", written by the restyle agent from the page's existing items. The owner hasn't confirmed the wording.
- Microsoft Clarity (`xt8r81h0gs`) is on the homepage and three case studies but **not on `verified-call.html`** (never was), so there's no visitor data for the main case study. Ask the owner before adding it (copy the snippet from `stressie-v4.html`, about line 570). Conversion tracking events (résumé, email, case-study clicks, chat opens) were suggested, not built.
