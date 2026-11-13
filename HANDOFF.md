# bhanu.build: handoff (13 Nov 2026)

For whoever picks this up next (a new Claude account or session). Read `CLAUDE.md` first; it still applies. This file is the state of play after the 12–13 Nov work, plus the next task: real sound from Epidemic Sound.

---

## 0. LATEST: 13 Nov 2026, afternoon session (read this first; §1–§6 below are the morning's state)

### 0.1 Live vs local

- **Live:** https://bhanu.build serves `main` at **`e0de123`** (pushed 13 Nov ~10:45 PT, owner said "push it live"):
  the soundscape (Epidemic Sound recordings, audible levels), the Epidemic Sound footer credit, "Stressie" (V4 dropped
  from all visible titles), and **Ask AI** ("✦ Copy for ChatGPT ▾") in the nav of every page.
- **Local only, NOT pushed:** `portfolio-v6` at **`caa2198`**, one commit on top of `main`. Ship it only when the owner
  says "push it live" (method in §3). It contains:
  1. **Chapter films fill their screens.** The films were recorded with the UI inset on a dark canvas (Verified Call: a
     framed Meet window; EverTutor: 5% letterbox bars). Each `video.chp-film` now carries an inline style that
     oversizes it to crop to its UI; `.chp-screen` clips to the painted glass. If a film is re-recorded, re-measure.
  2. **No more blurry halo round the devices.** The subject/room plane split (feathered cut-out over an in-painted
     room) is switched off: `var SPLIT = false` in the script after `CHAPTER ART LOADER`. The planes had not moved
     since `amp = 0` ("why is the laptop hovering?"), so the split only added the halo.
  3. **Sound ON by default** (owner's call; it was opt-in). Browsers allow no audio before a gesture, so it starts on
     the first real click, tap or key (`e.isTrusted`; keeps trying until the context runs, for iOS). Muting is
     remembered (`localStorage.siteSound = '0'`).
  4. **Sound toggle floats bottom right** (glass button, `#sndToggle`, now at the end of `<body>`, outside the nav,
     because the nav slides away on scroll). It steps left of the chat orb once the orb shows, and hides while the chat
     is open or the entrance plays. The `SOUNDSCAPE` script waits for DOMContentLoaded for that reason.
  5. **Homepage Ask AI sits right after the nav links** (the group is centred; compact icon on phones). The owner did
     NOT want it floating; only the sound toggle floats. Hover now brightens the whole pill (a per-half highlight
     "poked out").
  6. **`ai.md` carries the evidence:** a section "Evidence, and how each claim was measured", labelling every claim
     Published method / Customer pilot / Production / Self-reported (Verified Call research samples, false alarms,
     95% bounds and dates; Stressie pilots with Amazon, InKind and Austin PD; EverTutor production data).
  7. EverTutor Studio's counters now hold 104 / 4 in the HTML (text readers saw "0 hrs").

### 0.2 How Ask AI works (shared by all five pages)

`ask-ai.js` + `ask-ai.css`, mounted with `<div data-ask-ai data-phone-compact data-focus="…">`. One prompt points the
assistant at the public brief **`/ai.md`**; Copy pastes the prompt plus the whole brief; ▾ picks ChatGPT, Claude,
Gemini, Perplexity or Grok (remembered), "Copy text", or "Open in" (prompt pre-filled; Gemini copies first). Safari:
copies via a pending `ClipboardItem` inside the click. **Keep `ai.md` in step with the case studies, facts only, no
ranking claims** (the owner wants "top 1%"; the agreed approach is stronger, checkable evidence, not claims).

### 0.3 Open requests (not started)

1. **Footer is always night.** `#ftCity` loads `poster-lab.html?embed&footer&alt=-14`; `alt=-14` pins the sun below
   the horizon (by design: "bridge at night"). The owner asked why it's evening when the header is morning. Removing
   `&alt=-14` makes it follow SF's real sun, but check the footer's white copy stays legible in daylight first. Ask.
2. **"More sounds" on the homepage, like https://www.danielyesung.com** (owner's reference). His site loads 30 files in
   5 layers: UI (`ui-tap`, `ui-open`, `ui-close`), interactions (stamps, pins, footsteps on stone/wood), world
   one-shots (gull, magpie, dog, pigeon, wings, cab horn, wind bell), one ambience per place, and an acoustic music
   bed; sound on by default. Ours has the ambience + hero one-shots only. Plan offered: UI taps/opens on nav, buttons,
   chat and Ask AI; a sound as each chapter painting arrives; more SF one-shots (cable-car bell, distant traffic,
   birds); optional quiet music bed. Source via the Epidemic Sound connector, add slots to `audio/build.py`.
3. **`robots.txt` + `llms.txt`.** bhanu.build has no robots.txt (404). Add one welcoming AI crawlers and an
   `llms.txt` pointing to `/ai.md`, like verifiedcall.app. All pages already return 200 to AI user agents.
4. **From the owner's pasted AI critique** (verdict: "advance to interview"; top-1% "unproven rather than disproven"):
   positioning is still split (see §6); some copy oversells ("defensible moat", "classroom-comparable outcomes");
   Verified Call should be defended from the candidate's side (false positives, disputes, accessibility tools). Facts
   for that exist in https://verifiedcall.app/ai-context.md ("Fair to the candidate"): results are advice not a
   verdict, a person can decline and still join, note-takers are listed not flagged, data deleted after ~7 days.
   **Ask the owner before changing any case-study copy.**
5. Nobody has listened to the soundscape by ear in real Safari or on an iPhone yet; the owner should.

### 0.4 Gotchas from this session

- **Testing:** Claude in Chrome was not connected. Playwright 1.64.1 is cached at
  `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`; drive the real Chrome with `channel: 'chrome', headless: false`
  (add `ignoreDefaultArgs: ['--mute-audio']` to measure audio), and its WebKit build for Safari's engine.
- **Measure sound, don't guess.** Tap an `AnalyserNode` onto every `AudioDestinationNode` (patch
  `AudioNode.prototype.connect` in an init script) and read RMS. The first live version measured -38 dB (inaudible);
  now ~-21 dB with a -6 dB limiter on both players. Gains: `MASTER_GAIN = 4` (poster-lab), `CH_GAIN = 1.6` (index).
- **Bump `poster-lab.html?…&v=` in index.html (both iframes) whenever poster-lab changes** (now `v=34`).
- **Epidemic Sound downloads:** the connector's signed URLs expire within minutes; fetch 3 URLs, download them at
  once, repeat. Masters are 96 kHz/24-bit (~938 MB in `audio/raw/`, gitignored, deletable; IDs in `audio/CREDITS.md`).
  Encode with `afconvert` (ffmpeg's `aac_at` wrapper padded every loop, an audible gap). Loops are exactly 45 s and the
  players pin `loopEnd = 45`.
- **Licence:** the owner holds Epidemic Pro + Creator and chose to ship. The open questions (the licence wording covers
  "video and podcast productions") are recorded in `audio/CREDITS.md`, which, like this file, is blocked from public
  serving in `netlify.toml`.
- **localhost only:** the Agentation dev toolbar sits bottom right and intercepts clicks there; remove
  `[data-agentation-portal]` in tests. It also makes failing `localhost:4747` requests (harmless).
- **Chrome shows a video's poster until it has played;** seeking a never-played video still shows the poster. To
  screenshot a chapter film, let it play to the moment you want.
- Disk: ~20 GB free; keep captures in the scratchpad and delete them.

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

> **Status 13 Nov 2026: DONE and shipped (owner's decision).** Recordings encoded (`audio/build.py`, `7a75e21`), wired
> (nav toggle, hero engine, chapter loops, whoosh; `92bfb1a`), footer credit to Epidemic Sound, tested in headful Chrome
> and WebKit. The owner holds Epidemic Pro + Creator and chose to ship; the open licence questions (the plans' wording
> covers "video and podcast productions") are recorded in `audio/CREDITS.md`. HANDOFF.md, audio/*.md and
> audio/build.py are blocked from public serving in `netlify.toml`.

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
