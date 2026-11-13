# Interview prep pack: Product Designer, Growth (Anthropic) and similar AI product / design-engineering roles

Private. Written 13 Nov 2026 from these sources only: `proposals/prep/anthropic-growth-jd.md`, `ai.md`, the four case
studies (`verified-call.html`, `stressie-v4.html`, `evertutor-live.html`, `evertutor-studio.html`) plus the V1→V2
Stressie page they link to (`stressie-studio.html`), `proposals/evidence-inventory.md`, `proposals/critique-response.md`,
the Verified Call repo (`~/Desktop/Human Verify`: `docs/HANDOFF-2026-09-27.md`, `README.md`, `docs/decisions.md`,
`Session Handoff/GOALS.md`, `Session Handoff/WAYS-OF-WORKING.md`) and the eval kit (`proposals/eval-kit`).

How to use it:
- Every scaffold is bullets, not a script. Say it in your own words. The live interviews are without AI.
- `[NEED FROM BHANU Nx: …]` means the sources do not answer it. Answer it to yourself, out loud, before the interview.
  If the honest answer is "I don't know" or "we didn't measure that", that is an answer; practise saying it cleanly.
  All of them are collected and ranked in section 8.
- Nothing here may be said as fact unless it is in the sources. Where a scaffold offers an *inference*, it is marked
  as one. Do not upgrade it into a claim in the room.
- Verified Call no-claims rules apply in speech too: say what it checks and how it was measured; never "catches
  cheating", "deepfake-proof", "verified human", "stops face swaps". Say "in our testing", "camera-software route",
  "own testing, n = …, date".

---

## 0. Your answers so far (13 Nov 2026) and how to say them

These override the matching `[NEED FROM BHANU]` items below (N1, N2 partly, N3, N33 partly).

**What you told me**
- **Daily engagement (N1):** a user counted as engaged on a day when they opened the app and engaged more than once
  that day. The share of users who did that went from 12% to 56%.
- **Pilot size (N2):** about 130 users. The ~2% retention base rate comes from published research on wellness apps.
- **What moved it (N3):** in your judgment, notifications, and how the app felt and resonated with people.
- **Metric up, didn't ship (N33):** early prototype testers loved the gamification, but you didn't ship it. The bar
  you were aiming for was Duolingo-level, and you didn't have the time to understand properly why it works and how,
  so you held it back rather than ship a shallow version.

**Still open (ask yourself these before the interview)**
- Was 12% the V1 pilot (Austin PD) and 56% the V2 pilot (Amazon hardware, InKind), or both inside V2? This decides
  how you answer "how did you isolate it".
- 17.4% retention: over what window (week 1, day 30, whole pilot)?
- Which research gives the ~2% base rate? Know the name or the source, in case they ask.
- The gamification story: which product (Stressie or EverTutor)? What exactly did testers love, and how did you
  know (what they said, how often they used it)?

**Say it like this: "What caused 12% to 56%?"** (about 45 seconds)
> "We defined engaged as opening the app and coming back more than once that day, so a real habit signal, not a
> single tap. Across about 130 people in the pilots, that went from 12% to 56% of users.
> I want to be straight about attribution: this was pilot-to-pilot, not an A/B test, and several things changed
> together: notifications, crash fixes, and the redesign. My read is that notifications plus how the app felt did
> most of the work, because [what you saw: e.g. when people opened it, what they said]. If I had to prove it, I'd
> hold notifications constant and test the redesign alone, then the reverse, and watch day-7 return rather than
> opens."

Why this works for a Growth interviewer: you define the metric precisely, size the sample, name the confound
before they do, give a point of view, and show how you'd isolate it. Note that 130 users is small; never say
"statistically significant" about it.

**Say it like this: "A metric went up and you didn't ship."** (about 40 seconds)
> "Early prototype testers loved the gamification, so on the surface it was a win. We didn't ship it. Gamification
> that builds a habit, Duolingo-level, comes from understanding why each mechanic works, and we didn't have the time
> to learn that properly. A shallow version risked teaching people to chase points instead of [the real behaviour,
> e.g. checking in when stressed]. So we held it and put the effort into [what you prioritised instead]."

Fill the brackets with what really happened. If the product was EverTutor, connect it to the gamified progress layer
the case study says was cut because it didn't move engagement. That's a strong pair: liked in testing, didn't move
the behaviour, cut.

---

## 1. The one-minute story

### One minute (~150 words, to be spoken)

> I'm a design engineer. I design AI products and I build them, and the part I care about most is finding why people
> don't come back, then changing the product until they do.
>
> At Stressie, a workplace wellness app, our first pilot with 50 Austin police officers told us the app felt immature,
> the home screen was confusing, and it crashed. I led a full redesign, owned the crash testing myself, and added
> notifications to bring people back. In the next pilots, with Amazon's hardware team and a restaurant group, daily
> engagement went from 12% to 56% and retention reached 17.4%.
>
> At EverTutor I was the sole product designer on a voice AI tutor used by about 2,000 learners, and I designed the
> authoring tool that took a lesson from 104 hours to about four and a half.
>
> Now I'm building Verified Call, where I publish exactly how each check was tested, including where it fails.

Check before you say it: you must be able to define "daily engagement" and "retention" in that sentence (N1, N2) and
say the two pilots were different groups from V1 (see 2.1). If you can't, say "in the V2 pilots" and stop there.

### Two minutes (bullets to expand)

1. **Who:** design engineer; design + interface + code. Homepage line: "I design and build AI products that scale,
   convert, and connect." Tools: Figma, React/TypeScript, SwiftUI, Electron, Chrome extensions, the Claude API,
   agentic workflows.
2. **Diagnosis → intervention → behaviour (Stressie):** V1 pilot findings (feedback form): confusing home, crashes,
   "immature" UI, broken notifications, unclear graphs. Interventions: full redesign rather than patches, calmer
   hierarchy and palette, you owned stress/load testing, notifications shipped as a new retention lever, focus group
   before re-pilot. Result in V2 pilots: daily engagement 12% → 56%, retention 17.4% (against a ~2% industry baseline
   for health and wellness apps). Helped secure ~$600K.
3. **Second loop (Stressie V4):** the same pilots said trust was asked for too early ("I haven't built trust with the
   app yet…") and coins had no value. V4 moves the first check-in before the account, asks for location only when the
   map needs it, and makes coins buy real offers. Metrics still being validated; the bar is 17.4%.
4. **Activation for creators (EverTutor Studio):** content designers took 40–50 h to get productive on three
   disconnected tools; Studio got first login → first published lesson under 2 h; lesson time 104 h → ~4.5 h average
   over ~700 logged lessons; 3,000+ lessons; ~10 school pilots.
5. **Learners (EverTutor Live):** "It doesn't feel like it's actually listening to me" drove the voice UX; ~25% higher
   completion in controlled sessions (content and model changed in the same period, so not all of it is design); cut
   a gamified progress layer that didn't move engagement.
6. **Honesty about evidence (Verified Call):** sealed test data, rules pinned before results, a separate verifier,
   exact 95% lower bounds, 6 of 17 self-attacks still open and published. No live interviews yet.
7. **Why this role:** you want to own why people make a product a habit, and you prototype with Claude Code daily
   (Verified Call was built by AI coding agents under your specs and evaluation rules).

---

## 2. Per project

Evidence labels from `ai.md`: **[Published method] [Customer pilot] [Production] [Self-reported]**.

### 2.1 Stressie (founding product designer; V1→V2 Jun–Sep 2024; V4 2026)

**Situation.** Workplace wellness app (B2B and B2C). V1 piloted with 50 Austin Police Department officers in
high-stress roles over three months (June–September 2024). Team on V1→V2: CEO and co-founder, CTO and co-founder, a
software engineer, a marketing intern, you. Timeline ~3.5 months.

**Diagnosis (what the sources show).** V1 pilot feedback form: users liked quick resets (<1 min), the AI-personalised
strategy, and felt calm after one exercise. Pain points: not intuitive, confusing home page, repeated crashes, UI felt
immature and didn't compel engagement, notifications didn't work, graphs not understood. You concluded colour,
hierarchy and signifiers were inconsistent enough that surface fixes would not fix "immature".

**Intervention.**
- Full redesign, not patches: clearer IA, calmer warm cream palette.
- Owned QA yourself: stress- and load-tested before re-pilot; V1 crashes no longer occurred.
- Notifications shipped as a *net-new* retention lever, working reliably.
- New onboarding: personalised uplifters, then a 27-question stress assessment with a short breathing break every 10
  questions.
- Focus group before shipping.

**Result.** **[Customer pilot]** V2 piloted with Amazon's hardware team and InKind (multi-location restaurant group):
retention from the ~2% industry baseline for health and wellness apps to 17.4%; daily engagement 12% → 56%; crashes
gone. "Meaningfully more users completed the full stress-check journey" (no number on the page). **[Self-reported]**
InKind said staff reported higher tips, more consistent clock-ins, lower turnover, and managers gained visibility into
team stress. The pilots helped secure ~$600K. When you left, the team was wrapping up the pilot and starting
screen-level data in Mixpanel and PostHog.

**What V2 got wrong (from the same pilots), which V4 answers.** "There's no option to pause the stress assessment";
"I didn't find the coping points compelling… I don't know their value"; "I haven't built trust with the app yet, so
sharing personal feelings this early is uncomfortable." V4 page: "V2's first screen asked for five minutes of questions
before the app had done anything for you."

**V4 (2026), designed and built solo in SwiftUI.** Check-in ends in an action (release the slider = save; opens two
short films, two resets, a way to talk; coins on finishing a reset). Cut the 0–10 score. First check-in before an
account; location asked by the map, not onboarding; permission screens on day one cut. Coins: 5 per check-in up to 3 a
day, more for a finished reset, 200 for a referred friend who checks in; price on the button ("Redeem for 80 coins").
Cut streaks and confetti. Cut free event seats. In-person events wait for human approval, against the founders' wish
for instant publishing. 171 Swift files; 13 of 13 Figma frames matched at 3 px/pt; 3 languages (~1,150 strings each);
a lint fails the build on raw colours/sizes. Not yours: backend, payments, the model behind Talk. Usage metrics being
validated; the bar is V2's 17.4%. Your own reflection: put a person behind the approval queue first; ship the sink
with the coin ("an economy with no exit is just points again"); get a second engineer in early ("the numbers should
not be trusted until someone else has read the code").

**The numbers and their caveats.**

| Number | Label | How measured (per sources) | Caveats you must volunteer |
|---|---|---|---|
| Daily engagement 12% → 56% | [Customer pilot] | Not stated anywhere. Appears only on the V4 page and `ai.md`, not on the V1→V2 page. | Definition, denominator, window and tool unknown (N1). V1 and V2 were *different organisations* (APD vs Amazon hardware + InKind), so the change mixes design with population. Notifications were new in V2. Crashes were fixed. |
| Retention ~2% → 17.4% | [Customer pilot] | Not stated. The 2% is an *industry baseline*, not Stressie V1's own number. | Retention window unknown (N2). The comparison is to an industry figure, not a controlled before/after. The V1→V2 page says "driven by cleaner IA and a calmer visual language": a causal claim with no isolating test; don't repeat "driven by" in the room. |
| ~$600K | — | "helped secure" | Attribution: the pilots helped; don't say "unlocked". |
| InKind tips, clock-ins, turnover | [Self-reported] | Pilot feedback, not analytics | Never present as measured. |
| V4: 13/13 frames, 171 files, 3 languages | Build facts | Simulator build vs Figma at 3 px/pt | Not a usage metric. V4 has no usage numbers yet. |

**Hardest follow-ups.**

1. **"What specifically caused 12% → 56%? How did you isolate the redesign from other pilot differences?"** (reviewer Q1)
   - Honest core: it was not isolated. Different organisations, different roles, new notifications, crash fixes, new
     onboarding, all at once. No holdout is described in the sources.
   - What you *can* defend: each change mapped to a named V1 finding (crashes → you owned QA; confusing home → IA;
     "immature" → visual system; broken notifications → rebuilt as a retention lever).
   - What you'd do now: keep a cohort on the old flow, or stagger features (notifications on/off) inside one employer.
   - `[NEED FROM BHANU N1: Exactly how was "daily engagement" defined (numerator, denominator, which days), what tool or log produced 12% and 56%, and which group was the 12% measured on: APD V1, or a V2 baseline week?]`
   - `[NEED FROM BHANU N3: Which change do you personally believe moved daily engagement most (notifications, crash fixes, quick resets on the home screen, or the redesign), and what did you see that makes you think so?]`
2. **"17.4% retention: day 7? day 30? week 4? Of whom?"**
   - `[NEED FROM BHANU N2: What retention window and cohort is 17.4% (D7, D30, week-N, pilot end), how many users were in the denominator, and where did the ~2% industry baseline come from?]`
3. **"How many people were in the V2 pilots, and for how long?"**
   - Sources give V1 (50 officers, 3 months) only.
   - `[NEED FROM BHANU N4: How many people were in the Amazon hardware team and InKind pilots, over what dates, and was usage voluntary or encouraged by the employer?]`
4. **"Notifications were your retention lever. How did you stop them becoming nagging?"**
   - Sources: notifications were net-new in V2, "specifically to bring users back"; a P7 quote says it "checks in at
     exactly the right moment". Nothing on frequency rules or opt-out rates.
   - `[NEED FROM BHANU N5: What were the notification rules (when, how often, what triggered them), and did you see any opt-out or disable data?]`
5. **"Your V2 onboarding was a 27-question assessment. Users said it was exhausting. Why ship it?"**
   - Sources: you added breaks every 10 questions to keep it engaging; the pilots then said trust was asked too
     early; V4 removed day-one permission screens and moved the first check-in before the account.
   - This is a good story of learning: own the mistake, show the V4 response.
   - `[NEED FROM BHANU N6: Who decided on the 27-question assessment and why (product need for stressor data, the founders' model, your call)? What was the onboarding completion rate, if known?]`
6. **"You overrode the founders on in-person event approval. What evidence did you have?"** (useful for reviewer Q5)
   - Sources: your reason was safety ("a stranger's address needs a human check before Stressie puts its name beside
     it"); you name the cost (hosts wait a day; some won't come back); "whether I was right is one of the things being
     measured now". You also admit the queue is "a state, not a reviewer" yet.
   - This was a principle call, not evidence they disagreed with. Say so.
   - `[NEED FROM BHANU N7: How did the conversation with the founders go: what did they argue, what made them accept it, and what metric will tell you whether you were right?]`
7. **"V4 cut free seats because 'a seat paid for with a week of check-ins gets used; a free one gets skipped'. Is that measured?"**
   - Not shown as measured in sources.
   - `[NEED FROM BHANU N8: Is the free-seat no-show claim from Stressie data, from event-platform research, or a belief? If a belief, say so.]`
8. **"What would make you call V4 a success?"**
   - Page names D30 retention and off-work opens as the metrics to come; the bar is V2's 17.4%.
   - `[NEED FROM BHANU N9: What is your target for V4 (D30, weekly check-ins, redemptions per active user), and what guardrail would make you roll something back?]`

---

### 2.2 EverTutor Live (sole product designer, Mar 2025 – May 2026)

**Situation.** Voice-first AI tutor; 1:1 tutoring is worth ~2 standard deviations but costs ~$50–$250 a session.
$9.5M seed-funded. Team: you (sole product and curriculum designer), 2–3 engineers, founder/PM (product direction and
pilot rollout), rotating contract content designers working in your tooling. "He designed it; EverTutor's engineers
built it."

**Diagnosis.** In early classroom testing a student said within 10 seconds: "It doesn't feel like it's actually
listening to me." That line "drove every voice UX decision that followed". Most AI tutors you studied were chat
windows; there were no established patterns for real-time conversational tutors.

**Intervention (four phases).**
1. Core idea: teach the way a tutor at a whiteboard does. Lesson builds on a board in handwriting-style visuals
   (Shantell Sans), tutor in a corner talks, listens, adapts. Prototyped by hand because Figma couldn't do a tutor that
   writes while it speaks. "Hold to speak" voice. A progress layer that advanced on correct answers.
2. Personalised tutor voices; wider voice choice for schools; content pipeline (~104 h → ~4 h; see Studio).
3. Mastery-gated progression; tighter curriculum alignment; familiar classroom patterns (pacing cues, structured
   prompts); visible progress; teacher co-developed sequences.
4. Automated class join/leave; canvas layout for multi-step STEM.

**Results and how they were measured.**

| Number | Label | How measured | Caveats |
|---|---|---|---|
| ~2,000 learners, 8+ schools | [Production] | Company figure | Learners, not daily users. ("2,000+ students a day" was removed from the site because nothing sources it.) |
| ~25% higher completion | Controlled classroom sessions | Voice-first whiteboard design vs the earlier text-heavy slides (inference from Phase 1 text) | n, definition of "completion" and "controlled" not stated (N10). Page says: "Content and model changes shipped in the same period, so I can't attribute all of it to the design." Students "reported" higher engagement = self-report. |
| Setup ~5 min → <30 s | Phase 4 outcome | Not stated | Low-bandwidth edge cases needed fallbacks; automation reduced teacher visibility. |
| ARR $0 → $20K → dip (Dec '25 cohort churn) → $500K+ (Jun '26); learners 0 → 40 → 2,000+ | **Self-reported**, "not audited" | Company figures | Company outcome, many causes. You did not own revenue. |
| Gamified progress layer cut | Phase 1 learning | "It didn't move engagement" | How engagement was measured is not stated (N12). |
| Teachers rated sequences higher; "live sessions took less managing" | [Self-reported] | Teacher feedback | Don't call them measured. |

**Hardest follow-ups.**

1. **"~25% higher completion: what hypotheses did you test and reject?"** (reviewer Q2)
   - Sourced rejected/reversed bets: (a) gamified progress layer: tried first, didn't move engagement, cut rather than
     iterated, budget moved to interaction quality; (b) free-form interaction without mastery guardrails: right for
     validating interaction early, but students skipped ahead, reversed in Phase 3; (c) "not all voices performed
     equally across subject types": needed curation.
   - Don't invent others.
   - `[NEED FROM BHANU N10: For the ~25% completion result: how many students and sessions, what was the comparison (the slide version? which schools?), how was "completion" defined, who ran the sessions, and over what dates?]`
   - `[NEED FROM BHANU N11: Besides the gamified layer, which hypotheses about why students didn't finish did you consider and drop before landing on voice-first + whiteboard (e.g. lesson length, difficulty, device issues)? Only list ones you actually considered.]`
2. **"How did you know the gamified layer didn't move engagement?"**
   - `[NEED FROM BHANU N12: What engagement measure did you watch for the gamified layer, over how long, against what comparison, and who made the cut call?]`
3. **"What did 'it doesn't feel like it's listening' change in the interface, concretely?"**
   - Sourced: "hold to speak" made talking easier and more natural. Critique notes no before/after artefact exists.
   - `[NEED FROM BHANU N13: In UI terms, what did "listening" become: an acknowledgement cue, lower latency, interruption handling, visual state while listening? What was before vs after?]`
4. **"December dip from cohort churn. What happened and what did you change?"** (very likely for a Growth role)
   - Sources: "a real dip from cohort churn in December, then sustained school-by-school compounding from January on."
     Nothing on cause or response.
   - `[NEED FROM BHANU N14: What was the December cohort churn (end of term? a school contract ending? learners dropping?), how did you find out, and did any design change respond to it?]`
5. **"Mastery gating: did it cause better outcomes?"**
   - Honest: not isolated; shipped with teacher co-design, familiar patterns and progress UI. Sourced outcome is only
     that gating "stopped students skipping ahead" (by design) and "occasionally frustrated students".
   - (The old "~97% of classroom performance… driven primarily by" card was removed for lack of a source. Don't revive it.)
6. **"Who owned metrics at EverTutor? Did you look at funnels or retention yourself?"**
   - Sources: founder/PM drove product direction and pilot rollout; you "validated improvements through live classroom
     pilots". No analytics tooling named.
   - `[NEED FROM BHANU N15: What product analytics did EverTutor have (tool, dashboards, events), who owned them, and what did you personally query or track week to week?]`
7. **"$5 an hour vs $250: where's $5 from?"**
   - Owner answer (14 Nov in critique-response): $250 is the going rate for a 1:1 human tutor for a course; "$5 basis
     still to state".
   - `[NEED FROM BHANU N16: What is the $5/hour based on (price charged per student-hour, cost to serve, school contract divided by hours)?]`
8. **"Pilots expanded school by school. What drove a school from pilot to wider use?"** (individual → team → company)
   - `[NEED FROM BHANU N17: What made a pilot school expand (teacher champion, admin decision, results shown, content coverage)? Did you design anything specifically for that step?]`

---

### 2.3 EverTutor Studio (sole product designer and lead curriculum designer, 2025 – mid 2026)

**Situation.** EverTutor lessons were built across three disconnected tools (Slides.com, Mermaid, Canva): switching
tools, rebuilding by hand, no shared source of truth, weak math support. Live's Phase 1 exposed it: "~104 hours for
30 minutes" of content. Early prototypes created school demand; ~12-hour runway from your first sketches to developer
handoff.

**Diagnosis.** Production time made scaling impossible; flexibility made the system hard for content designers;
lesson creation was disconnected from how the tutor would teach it.

**Intervention.** Designed the V0 system solo in ~6 hours. Cut your first instinct ("every branching path, every edge
case") to a structured step-by-step "appearance order" flow system: each step controls what the tutor says, how it
behaves, how content unfolds. Native math. Canva-like familiar patterns. Worked with tutors and took live lessons;
tested with tutors and content designers; dogfooded 15+ lessons end to end.

**Results.**

| Number | Label | How measured | Caveats |
|---|---|---|---|
| 104 h → ~4.5 h per lesson (headline "4") | [Production] log | ~700 logged lessons, ~3,128 h total | 104 h unit is inconsistent across pages ("per lesson", "per topic", "for 30 minutes") (N18). Baseline n and method unknown (N19). Scope held constant? (N20) |
| Onboarding 40–50 h → <2 h | [Production] | New: "first login to publishing a lesson" | Old 40–50 h method not stated (N21). |
| 3,000+ lessons | [Production] | — | The log covers ~700; what 3,000+ counts is unclear (N22). |
| ~10 school pilots | — | "Faster lesson creation made ~10 school pilots possible" | Attribution: enabling, not causing. |
| English and Physics pilots with no workflow changes | — | — | Two subjects; don't say "proves". |

**Growth framing you can use honestly.** Studio is an *activation* story for creators: time-to-first-value
(first login → first published lesson) fell from 40–50 h to under 2 h, and throughput rose, which is what let supply
(lessons) keep up with demand (schools). Don't stretch it into learner retention.

**Hardest follow-ups.**

1. **"104 hours: one lesson? average of how many? measured how?"**
   - `[NEED FROM BHANU N18: Which unit is true for 104 h: per lesson, per topic, or per 30 minutes of instruction? Is a Studio lesson the same size?]`
   - `[NEED FROM BHANU N19: Is 104 h one lesson or an average of several? Who made them, and was time tracked, taken from calendars, or estimated?]`
2. **"Did lesson scope or quality drop? Shorter lessons would also be faster."**
   - `[NEED FROM BHANU N20: Were Studio lessons comparable in length, steps and math density to the 104 h ones? Does ~4.5 h include review, QA, voice and engineer time? Was quality checked any way beyond your review?]`
3. **"40–50 h onboarding on the old tools: how do you know?"**
   - `[NEED FROM BHANU N21: How was 40–50 h onboarding on the old tools measured or estimated, and on how many content designers?]`
4. **"3,000+ lessons vs ~700 logged?"**
   - `[NEED FROM BHANU N22: What does 3,000+ count (all creators, AI-assisted drafts, variants), and why are only ~700 in the time log?]`
5. **"Show me the lesson that broke your system. What did you refuse to support?"**
   - Sourced refusal: unrestricted branching, for a step-by-step flow ("less flexible on paper, but the only version
     that could actually ship and scale"). Live Phase 4 added a canvas for multi-step STEM, which "required new content
     creation guidelines".
   - `[NEED FROM BHANU N23: Name the hardest lesson that broke the flow system, what you changed, and the list of things you deliberately refused (free branching? per-student forks? arbitrary layout?).]`
6. **"Designing a system in 6 hours overnight: what did you get wrong?"**
   - Sourced: rest of the runway went to feedback and documenting flows; "tool-assisted production still required
     curriculum expertise, limiting full self-service" (from Live).
   - `[NEED FROM BHANU N24: What changed in Studio between V0 and the version content designers used, and what feedback forced it?]`

---

### 2.4 Verified Call (founder; designed it, built it with AI coding agents; Sep–Nov 2026)

**Situation.** You recruited at SigIQ, where "the only way to be sure a candidate wasn't cheating was to fly them in"
(case-study wording; in your own speech, prefer "the only sure check was flying candidates in"). Remote interviews face
a stand-in, a hidden AI tool reading answers, or a live face swap.
`[NEED FROM BHANU N25: What exactly was your role at SigIQ, when, and how many interviews or incidents did you see that made this a problem worth building for?]`

**Diagnosis (product).**
- Browsers can't see camera origin: they get a media track *after* the OS/virtual-camera boundary (handoff, 27 Sep).
  An early browser gaze/colour challenge was passed by a real live swap: a recorded false accept, kept on record.
- Device names are attacker-controlled; "OBS is running" means nothing on its own.
- From TechCrunch and events (15 Oct, internal notes): demand looked real, but the doubt was "IF this works", because
  in many demos the check showed "Checking…" or "Can't confirm" instead of a clear result. Your Priority 1 became a
  dead-simple experience that never makes the product look at fault, plus low-power computers and low-quality cameras.
  Most feedback asked for Zoom and Teams; you chose Google Meet first and parked Zoom/Teams.

**Intervention.** Five surfaces on one design system: Mac/Windows candidate app; a panel inside Google Meet; a Chrome
extension (switch per guest in Google Calendar); server and web app; website. Six design decisions, each with what you
tried first (result changes only when the fact does; say what it saw, never blame; green only means verified; tell the
host, don't block the candidate; never join the call; black only for the main action). An evaluation system set up
before the checks (section 4).

**Results.** **[Published method]** (verifiedcall.app/research; own testing):
- Hidden AI tools: 4 tools, 30/30 each (≥90.4% at 95%); 0 false alarms in 30 clean runs and 0 in 30 with everyday
  apps open. 4 Oct 2026.
- Camera software: 9 kinds recognised and 7 direct cameras not flagged, 29/29 each (≥90.1%), 30 Sep; 20/20 live Meet
  calls (10 direct "Verified", 10 face swaps via camera software flagged), 2 Oct. One person, one Mac for the live calls.
- Face swaps: 0 of 3,990 swap sessions got through (2,855 flagged, 1,135 "Can't confirm" because the face was too
  small); real person cleared 962/970 (≥98.5%); 70 people, public research video never seen while building. 1 Oct.
- Voice (offline, not live calls): different person not confirmed 87.0% (≥86.5%); real person confirmed 95.35%
  (≥94.0%); 1,134 speakers, 8 Indian languages. 18 Oct.
- Speed: mid-call switch caught within 4.66 s (Mac) / 5.34 s (Windows) p95; 1.27% / 0.57% CPU. Signed records: 80/80
  forged or altered records rejected. 30 Sep.
- Red team 17 Oct: 17 self-attacks, 6 still get through.

**Traction (say it plainly).** Closed beta *open to* 20 companies (a cap, not a count); talked with 5 hiring teams;
**0 live interviews yet**. Reaction: "if it works as tested, they'd use it." One change a prospect asked for (see
every app open on the candidate's computer) you turned into a line: the interviewer always sees an app *used during
the call*; the full list only if the candidate agrees. Next: first live interviews, and a field false-alarm rate
published beside the lab one.

**Authorship (say it plainly).** 973 commits 25 Sep – 6 Nov; 839 carry an AI co-author trailer. AI coding agents wrote
most of the code; you wrote the specs, the evaluation rules and ~100 dated product/design decisions, reviewed changes,
tested on real machines, and caught what agents got wrong. A separate fresh agent checked each result. Avoid "built
alone" and "engineered it myself".

**Hardest follow-ups.**

1. **"Who uses it? What's your activation funnel?"**
   - Honest: no live interviews yet; beta open to 20; 5 hiring teams talked to. Lab results only.
   - `[NEED FROM BHANU N26: Since 13 Nov: how many companies signed up, installed the extension, or ran a call with a real candidate? Any Chrome Web Store install / weekly-user numbers? How many demos, replies, pilots from outreach?]`
2. **"You said demos made people doubt it worked. What did you change, and did the doubt go away?"**
   - Sourced: Priority 1 = dead-simple, never at fault; no "Can't confirm" in the badge for problems on our side; fewer
     visible steps; a guest who passed every pre-call step shows Verified to the host *before* the call.
   - `[NEED FROM BHANU N27: After the post-TechCrunch simplification, did later demos still show "Checking…"/"Can't confirm"? What did prospects say the second time?]`
3. **"An internal note mentions a pilot in India. Did it run?"** (only if they've seen something; don't raise it)
   - `[NEED FROM BHANU N28: Did any pilot run (dates, interviews, paid or free, anything flagged)? If not, be ready to say "no pilot has run yet".]`
4. **"Your internal rule says 'the customer is the host… we don't trust them'. Your page says 'Fair to the candidate'. Which is it?"**
   - Reconcile with sourced rules: integrity side = no check depends on the candidate's cooperation (a check that can
     be skipped by not clicking is not a check). Fairness side = advice not verdict; "Can't confirm" not accusations
     ("a false label is a legal risk and a lost hire for the recruiter"); consent screen; decline and still join; open
     apps shared only with consent; note-takers listed, not flagged; short retention; no recording.
   - Open problems you name yourself: no way to contest a finding; no written assistive-tech policy; the head/hand step
     fallback was deferred ("accessibility comes later"); people who can't do a step end at "Can't confirm", never a flag.
   - `[NEED FROM BHANU N29: In one sentence, what is your rule when the host's interest and the candidate's fairness conflict, and one example where fairness won?]`
5. **"Isn't 'Verified' a promise the system can't keep?"**
   - Sourced definition on the page: real camera, face and voice match the same person's check minutes earlier, no
     hidden AI tool found. It doesn't check an ID; can't see a phone or a person off camera. Critique proposed scoping
     the badge ("4 checks clear") as the cheaper fix than a rename.
   - `[NEED FROM BHANU N30: Did you consider renaming the badge ("All checks clear")? Why did you keep "Verified"?]`
6. **"What's the false-alarm rate on a real 45-minute call, not per try?"**
   - Not published. Per-try clean-run false alarms are 0/60 (95% upper bound ≈ 4.9% per try), but a call has many
     samples. Field false-alarm rate is your stated next step.
7. **"Why should I believe a solo founder's lab numbers?"**
   - Pre-registered, sealed data, separate verifier, exact bounds, failures kept (camera rule 14/17 before rewrite;
     earlier route run misread some direct cameras; the browser challenge false accept), red-team misses published,
     eval kit public with 10 tests. But: all own testing, the verifier is an AI agent not an outside party, no field
     data. Section 7 covers how to strengthen it.
8. **"Stopping research: when did you choose shipping over more evaluation?"**
   - Sourced: 6 Oct agreed to launch the beta with modest advisory claims and no percentages until supported, while
     rungs continued; 9 Oct "push a usable version, then see what happens"; 22 Oct paused one research track "until the
     first paying customer"; 20 Oct "stop patching on top of patches… one proper dev-ready rebuild" after the demo.

---

## 3. The reviewer's five questions

### Q1. Stressie: what caused 12% → 56%? How did you isolate the redesign from other pilot differences?

Scaffold:
- Lead with the honest limit: not isolated. V1 = 50 APD officers; V2 = Amazon hardware team + InKind. Different
  people, jobs and employers; plus new notifications, crash fixes, new onboarding, redesign at the same time.
- What ties changes to outcomes is *mechanism*, not experiment: each change answered a named V1 finding.
- Which part is strongest evidence: crashes were a reported V1 pain point and were gone in V2 (you tested it); the
  retention lever (notifications) was new.
- What you'd do differently: within one employer, stagger or hold out; define engagement before the pilot; get event
  analytics in from day one (the team only reached Mixpanel/PostHog at the end).
- Gaps: N1, N2, N3, N4. Plus:
  `[NEED FROM BHANU N31: Was there any period where V1 and V2 ran side by side, or any V2 week-by-week curve you saw, that supports the redesign mattering beyond the population change?]`

### Q2. EverTutor: ~25% higher completion in controlled sessions. What hypotheses did you test and reject?

Scaffold:
- Rejected: gamified progress layer (didn't move engagement; cut, not iterated). Reversed: no mastery guardrails
  (students skipped ahead → Phase 3 gating). Adjusted: voice choice (not all voices worked across subjects).
- Kept: voice-first whiteboard interaction, hold to speak; the listening insight.
- Attribution, unprompted: content and model changes shipped in the same period.
- Gaps: N10, N11, N12, N13.

### Q3. Claude has strong day-1 activation but weak week-4 retention. How do you diagnose before designing?

Scaffold: run the playbook in section 5.1 out loud. Open with clarifying questions, then cohorts, then qual, then 3–5
ranked hypotheses with how you'd size each, then one experiment and its guardrails. Ground one or two moves in your own
work (Stressie: trust asked too early → V4 asks later; EverTutor December cohort churn → N14; Verified Call: demo
doubt came from uncertain states, diagnosed from what prospects saw, not from what we intended).
`[NEED FROM BHANU N32: Which surface of Claude do you use daily (claude.ai, desktop, mobile, Claude Code), and what is your own week-4 habit story: when did it become daily for you, and what almost made you drop it?]`

### Q4. An experiment where the headline metric improved but you didn't ship. Why?

Scaffold:
- The sources do **not** contain this story. Don't force one.
- Nearest sourced analogues (label them as analogues, not as A/B tests):
  - Verified Call: a face-swap detector was put in *shadow mode* (server scores logged, nothing shown to hosts, no
    claim) until its honest false-flag rate is known. In-call voice was pulled from the verdict after the live test was
    "NOT MEASURABLE". A pre-call reading result never turns the badge amber on its own until a better model is proven.
    The research face-swap track was stopped "until the first paying customer".
  - Verified Call: recruiter-supplied reference photos were built toward, then dropped (no burden on recruiters;
    application photos are often unreliable).
  - Stressie V4: free event seats cut; streaks and confetti cut ("nothing shouts").
- The principle you can state: a headline can rise because you took attention or trust you'll have to pay back
  (warning fatigue, confetti, nagging). Guardrails decide.
- `[NEED FROM BHANU N33: Do you have a real case where a number went up and you still didn't ship (any product, any company)? What was the number, what guardrail or judgement stopped it, and who disagreed?]`

### Q5. A time you convinced a PM, engineer or founder to change direction with evidence they disagreed with.

Scaffold:
- Candidates from sources (check which fits "with evidence"):
  - Stressie V1→V2: you argued for a *full redesign, not patch fixes* from pilot evidence ("immature" came from
    inconsistent colour, hierarchy, signifiers). `[NEED FROM BHANU N34: Did anyone (CEO, CTO) want patch fixes instead of a full redesign? What evidence changed their mind?]`
  - Stressie V4: you held the line on in-person event approval against the founders. Principle, not evidence (N7).
  - Verified Call: a prospect asked to see every open app; you drew the privacy line. Prospect, not colleague.
  - EverTutor Studio: you cut your own first instinct (full branching) for a structured flow. Self, not other.
- `[NEED FROM BHANU N35: Pick one story where someone with more authority disagreed and data changed their mind. What was the data, how did you present it, and what happened after?]`

---

## 4. Technical trade-offs without AI (Verified Call)

Rule for this section: explain the concept, not the recipe. Never say log strings, file paths, thresholds or how an
open attack works.

### T1. Why classify cameras by what backs them, not by name?

- **The problem:** a face swap reaches the meeting through a virtual camera that sits between the swap tool and Meet.
  A virtual camera can call itself "FaceTime HD Camera". Names are attacker-controlled.
- **The approach:** a small native probe (Swift on Mac, Python on Windows/Linux) asks the operating system what
  actually backs each camera: a signed camera extension, a legacy plug-in, a virtual transport, or a USB/built-in
  device in the hardware registry. A pure, version-pinned TypeScript rule turns each sample into `direct_camera`,
  `software_route` or `unresolved`.
- **Whiteboard:** draw `camera hardware → OS → [virtual camera?] → Meet`. The browser sits at the end and only sees
  "a camera". The probe looks at the middle.
- **Evidence:** a 178-trial name-scramble test changed none of the results; sealed 29/29 per family on Mac and Windows.
- **Trade-off:** native code means an install (Mac and Windows only) and platform-specific probes; Linux has a known
  unfixed spoof.

### T2. Why does it matter *who reads* the camera, not just that a virtual camera is running?

- OBS is often installed and running but only being *fed*, not read. "OBS is open" would false-alarm on honest users.
- So the probe works out which processes are reading each camera from the capture stack's own records (described
  only at that level; never name them in the room).
- The "unresolved" answer is a real answer, not a guess: when the system can't tell, it says so.
- **Evidence of learning:** dev rule v1.0 got 14 of 17 on "direct camera while OBS is open" (lower bound only ~60%);
  v1.1 was written after that failure; both are kept on record.
- Also: the host side adds a signal for in-browser injection (live video arriving while no physical camera is being
  read): caught 19 of 19 in testing.

### T3. What does "30/30, at least 90.4% at 95% confidence" mean? Why 29 trials?

Whiteboard it in four lines:
1. You saw 30 successes in 30 tries. That does not mean 100%: a detector that is truly 95% would also often go 30/30.
2. Ask: what is the *lowest* true catch rate p that would still give 30/30 at least 5% of the time? The chance of 30/30
   is p³⁰. Set p³⁰ = 0.05 → p = 0.05^(1/30) = **0.905**. Reported rounded *down*: **90.4%**.
   Check: 0.905³⁰ ≈ 0.05. Any true rate below that makes 30/30 a less-than-5% fluke.
3. That's the exact one-sided Clopper-Pearson lower bound. "One-sided" because you only claim a floor ("at least"),
   not a range. "Exact" because it uses the binomial itself, not a normal approximation, which overstates on small,
   perfect samples (the normal approximation gives a zero-width interval at 30/30).
4. Planning: how many perfect tries before you may claim ≥90%? Need 0.05^(1/n) ≥ 0.90 → n ≥ ln 0.05 / ln 0.90 ≈ 28.4 →
   **29**. Check: 28/28 gives 89.8% (not enough); 29/29 gives 90.1%. For 95% you'd need 59.

Useful numbers (computed with the public kit's `bounds.mjs`): 20/20 → ≥86.0% (why 20/20 live calls is not a 90% claim);
14/17 → ≥60.4%; 962/970 → ≥98.5%; 0 false alarms in 60 runs → per-try false-alarm rate at most ~4.9%; 0 of 3,990 got
through → pass-through at most ~0.075% *if* sessions were independent (they come from 70 people, so they aren't fully).

Hard follow-up: "Your voice bounds (86.5%, 94.0%) are lower than plain Clopper-Pearson on those counts (86.8%, 94.9%).
Why?" `[NEED FROM BHANU N36: What method produced the published voice and face lower bounds (clustered by speaker/person? a different interval?), and why it differs from plain Clopper-Pearson on the raw counts?]`
Inference you may offer only as a guess: tries from the same person aren't independent, so a per-person (clustered)
bound is more honest and lower.

### T4. Why sealed / held-out data, rules pinned before results, and a separate verifier?

- "A detector graded by the person who built it will flatter itself." The first validation report on the project
  turned out not to be a classifier evaluation at all (audit, 27 Sep).
- **Pinned:** every pass/fail rule is written down and fingerprinted (sha256) before a run; grading refuses to run if
  it changed. A new idea = a new version, tested again; the failed version stays on record. Whiteboard: a hash is a
  fingerprint of the file; change one character and the fingerprint changes.
- **Sealed:** development, sealed and held-out sets split by a salted rule. Builders touch dev data only. Nobody tunes
  against the sealed set, so the sealed score estimates performance on data the system has never seen.
- **Separate verifier:** a fresh agent with no build context is the only one who opens sealed data and marks a result.
  The builder can't grade its own work.
- **Copy is tested too:** a check fails the build if product words claim more than the tests support.
- **Re-attacked:** the red team is pre-registered and re-runs with one command.
- **Trade-off:** slow and expensive; you consciously relaxed it for the launch track (modest advisory claims, no
  percentages until supported) while research continued.
- Weakness to admit: the "separate verifier" is an AI agent you set up, not an independent human or lab.

### T5. Why "Verified / Needs a look / Can't confirm" instead of a score?

- Sourced reasons:
  - Advice, not a verdict; the host decides. "Can't confirm" rather than accusations; a false label is a legal risk and
    a lost hire.
  - Decision 02: say what it saw ("ChatGPT (used 9:07 PM)"); a vague "Can't confirm" read as the product failing when
    the cause was known. "Can't confirm" is only for checks that truly couldn't run.
  - Decision 03: green means one thing.
  - Post-TechCrunch: prospects doubted the product when it showed uncertain states, so: no "Can't confirm" in the badge
    for problems on our side; "when in doubt, Needs a look, never a free Verified".
  - Launch rule (6 Oct): no percentages until real-world numbers support them.
- Inference (say as reasoning, not as a documented decision): a raw score asks a recruiter to pick a threshold they
  can't calibrate, and per-try rates don't translate into per-call meaning.
- `[NEED FROM BHANU N37: Did you ever design or test a numeric confidence score for hosts? Why did you reject it, in your own words?]`
- Related design: no latch. The badge shows "Needs a look" only while a finding is active, then returns, and the
  finding stays under "Earlier in this call" with its proof. Be ready for "so a candidate can use a tool briefly and
  get back to green?" → the finding and proof stay visible in the panel; the host sees it at once.
  `[NEED FROM BHANU N38: Why no latch? What went wrong with the "Needs a look for the rest of the call" version?]`

### T6. Why tell the host and not block the candidate?

- Evolution (Decision 04): v1 hard stop ("Please close OBS to continue") → v2 choice ("Close OBS for the best result"
  / "Continue anyway", 6 Oct) → final: one amber note, the candidate joins, the host sees "Needs a look".
- Why: the check is for the host. "A check that waits for the candidate's click can be skipped by never clicking." A
  live QA found the face check waiting on "Continue anyway" → rule (22 Oct): no check depends on the candidate's
  cooperation.
- Candidate screen only instructs and informs ("Your host has been told that OBS is using your camera").
- Hidden AI tool used: host sees "Needs a look" at once with a suggested next step; the product never tells the
  candidate to close anything (owner confirmed; the "Please close the hidden app" screen was not shipped behaviour).
- Trade-off: an honest candidate with camera software (a background effect, a document camera) shows amber to the host.
  The amber line names the fact so the host can ask.

### T7. Why an Electron app + a Chrome extension (and not browser-only, and not a bot)?

- History: the 25 Sep spec said Meet in the browser only, no desktop app, no bot; host extension + guest web page.
  Then (27 Sep) the finding: a browser cannot authenticate camera origin; it gets pixels after the OS/virtual-camera
  boundary. The checks that work (camera route, hidden windows, which process uses the mic) need native access, so the
  candidate side became a Mac/Windows app with native probes.
- Host side stays an extension because the host lives in Google Calendar and Meet: a switch per guest in Calendar ("the
  badge is the switch") and a badge on the Meet tile. Built to pass Chrome Web Store review first time (no remote code,
  minimal permissions); no Google sign-in or Calendar API, which avoids Google's OAuth verification.
- Never join the call (Decision 05): no bot in the participant list; the call looks like any other. Trade-off: the
  candidate installs a small app once; results show on the host's own screen.
- `[NEED FROM BHANU N39: Why Electron rather than a native app per platform (shared React/TypeScript design system across five surfaces? speed with AI agents?), and what did Electron cost you (size, signing, CPU)?]`
- `[NEED FROM BHANU N40: When and why did you reverse the "no desktop app" decision? What did you give up in activation by asking candidates to install something?]`

### T8. How does the Meet panel survive Meet's redesigns?

- Meet's class names are generated and change between releases; the extension never reads them.
- It finds the control bar the way a person does: the leave button by its accessible name (8 languages) or by the
  icon Meet draws the same in every language; visible, lower half, not in a dialog; then the nearest group of buttons.
- Placement is idempotent and self-healing (put back when Meet re-renders); a floating badge if the bar can't be found,
  never a silent failure. Watches the URL so switching calls tears the old call down. A hidden host tab counts as
  "unknown", never "left".
- Saved Meet page fixtures (2/4/8 tiles, pinned, presenting, camera off) turn a Meet redesign into a red test.
- Honest limit: no field uptime or breakage numbers; test counts are not robustness in the wild.
- Your catches: badge landing off the leave-button row when Meet groups buttons; minimised host Meet stopped the
  candidate's whole check (1 Nov) → the hidden-page rule.

### T9. What do the 6 open attacks mean, and what would you do next?

- Public categories only: a capture card that copies a real camera's full identity; video relayed as a built-in
  camera; a second computer beside the first; joining with the camera off; a copied Windows signing key; a renamed
  helper app that doesn't hide. Plus a Linux camera spoof; voice measured offline only.
- What they mean conceptually: software on an ordinary laptop can only see what the OS tells it. Anything that looks
  like real hardware to the OS, or happens off this computer, is outside what it can see. The 27 Sep handoff says the
  strong claim ("this media is camera-originated") needs protected capture hardware or an OEM/platform integration
  with a hardware-held key, which a browser extension or ordinary app can't provide.
- Directions sourced: hardware-held signing keys (TPM / Secure Enclave) for the copied-key case; an independent attack
  corpus; first live interviews and a published field false-alarm rate.
- Why publish them: credibility; the eval kit and research page publish results "including misses".
- `[NEED FROM BHANU N41: For each open category, what is your next step and its rough cost, and which one would you fix first for a paying customer? Practise saying it without any how-to detail.]`

### T10. Why a performance budget, and what are the numbers?

- 8 Oct rule: no fans, no slowdown; every layer needs a measured CPU/GPU/memory budget on a typical Mac and Windows
  laptop before it ships. "If it does, we have lost."
- Result: camera check 1.27% (Mac) / 0.57% (Windows) CPU; mid-call switch caught within 4.66 s / 5.34 s at p95.
- Explain p95: 95% of switches were caught within that time; the slowest 5% took longer.
- Trade-off example: continuous on-device mouth tracking rejected (~0.45 Mac cores, not feasible on Windows);
  reused face-check bursts joined on the server instead.

---

## 5. Growth craft for this role

### 5.1 Diagnosis playbook: "strong day-1 activation, weak week-4 retention" in Claude

Say up front: "Before designing anything I'd want to know whether this is a product problem, a measurement problem or
a population problem." Everything below is a method and a set of *hypotheses to test*, not facts about Claude.

**A. Clarify (2–3 minutes, ask, don't assume)**
- What counts as "activated" on day 1? A first message, a first useful result, a first return the same day?
- What is "retained" in week 4? Any visit, or a habit (several active days a week)? Is retention flat-lining at a
  lower level (healthy core) or still decaying?
- Which surface (web, desktop, mobile, Claude Code) and plan (free, Pro, Team, Enterprise)? Self-serve or seat
  assigned by an employer?
- Did anything change recently: acquisition mix, a launch, pricing, limits, model change, seasonality?
- What does "everyday work" mean for this team: which jobs do we want Claude to be the habit for?

**B. Quantitative cuts**
- Retention curves by signup cohort week; check whether the curve shape changed or the mix changed.
- By acquisition channel and intent (came from a launch moment vs searched for a job to be done).
- By first-week job: classify first sessions by task type (writing, coding, analysis, research, personal). Which jobs
  have curves that flatten?
- By depth in week 1: number of active days, multi-turn conversations, files or context added, return within 48 h.
  Find the week-1 behaviour most predictive of week-4 activity (a candidate "aha" or habit marker), then treat it as a
  hypothesis, not a cause.
- By plan and by whether usage limits were hit in week 1–2.
- By platform mix (users on 2+ surfaces vs 1).
- Team vs solo: users in a workspace with other active users vs alone.
- Resurrection: how many week-4 actives were dormant in weeks 2–3? What brought them back?
- Watch for Simpson's paradox: an overall drop can come from a mix shift toward low-intent cohorts.

**C. Qualitative signals**
- Interviews with three groups: retained daily users, week-1 heavy users who stopped, and light users. Ask about the
  last time they *almost* used Claude and didn't.
- Diary study across weeks 1–4 for new users in the target job.
- Support tickets, feedback thumbs, app-store reviews, social posts, sorted by stage.
- With strict privacy rules: aggregate patterns in what the last sessions before drop-off look like (task type,
  whether the result was used), never reading individual conversations without consent and policy.

**D. Hypotheses (rank, then size)**
1. *Novelty job*: day 1 was a demo task, not a recurring job. Signal: churners' first tasks are one-off; retained
   users' are repeated weekly.
2. *No re-entry point*: Claude isn't where the work starts; people forget to come back. Signal: retained users start
   from an integration, shortcut or a saved place; churners only from a browser tab.
3. *Context restart cost*: each session starts from zero, so habitual work feels slower than doing it alone. Signal:
   retained users reuse saved context/projects; churners re-paste.
4. *Trust break*: one wrong or unhelpful answer at a high-stakes moment ends the habit. Signal: drop-off after a
   thumbs-down or an abandoned thread.
5. *Capability blind spot*: users never discover the second job Claude could do for them.
6. *Limits or friction*: hitting limits or slow responses at peak times interrupts the forming habit.
7. *Solo in a team tool*: individuals adopt, but nobody else on their team uses it, so it never becomes "how we work".

Your own analogues to mention briefly: Stressie V2 asked for trust before giving value (pilot quote), and V4 moved the
first check-in before the account; EverTutor's gamified layer was a plausible engagement lever that didn't work, so you
cut it instead of iterating; Verified Call prospects doubted the product because the first thing they saw was an
uncertain state.

**E. Sizing**
- For each hypothesis: (share of week-1 actives who are in the affected segment) × (share you can reach with a
  change) × (plausible lift on their week-4 rate, from the gap between them and a comparable retained segment).
- Prefer hypotheses where the affected segment is large *and* the retained comparison group exists (it shows the
  behaviour is reachable).

**F. Experiment design**
- Randomise at the right unit: user for individual flows; workspace/team for anything with team effects
  (contamination).
- Primary metric: week-4 active-days or habit rate for the cohort, not day-1 clicks. Use a validated leading indicator
  (e.g. week-2 return on the target job) for speed, and keep a long-term holdout to confirm.
- Power: decide the minimum effect worth shipping before running; run long enough to see week 4 for at least one full
  cohort; watch novelty effects.
- Pre-register the decision rule (you did this for Verified Call; same discipline).

**G. Guardrails**
- Quality and trust: task success, thumbs-down rate, conversation abandonment, reported errors.
- Attention cost: notification opt-outs, uninstalls, unsubscribes, complaint rate.
- Wellbeing and safety: no dark patterns; usage that grows because people feel they *must* check is not the goal.
- Business: cost per active user, limit hits, paid conversion and downgrade.
- Segment harm: a lift concentrated in one group while another drops.

**H. When not to ship (have two ready)**
- Headline up, guardrail down (e.g. more sessions from nudges, but more opt-outs and lower task success).
- Lift only in the novelty window, gone by week 4 in the holdout.
- Metric moved by a measurement change, or by mix shift.
- It works by asking for attention the product hasn't earned. Your own practice: cut streaks and confetti (Stressie
  V4), cut the gamified layer (EverTutor), "calm is a feature" and "a result changes only when the fact does"
  (Verified Call).

### 5.2 Your point of view: when a product should ask for attention vs stay out of the way

Draft principle (all examples sourced):
1. **Ask when the fact changes and the person can act on it; otherwise stay still.** Verified Call: a result changes
   only when the fact does; each notice shows once and again only when it changes; warnings that keep firing cause
   fatigue. "Calm is a feature."
2. **Ask at the moment the request pays off, not up front.** Stressie V4: location requested by the map, not
   onboarding; the first check-in before an account; day-one permission screens cut because V2's up-front asks cost
   trust. Verified Call: one consent screen, data detail behind one link, "don't bombard or scare the user".
3. **Never make the core value depend on a click the person can skip.** Verified Call: no check waits on a click;
   the candidate is informed, the host is told.
4. **Signals keep one meaning.** Green only means verified; black only for the main action; the price is on the button
   ("Redeem for 80 coins", never "Continue").
5. **Celebrate quietly.** Stressie: the reward is two beats, coin settles then words; haptic fires when the coin lands.
6. **Attention you add, you must earn.** Stressie V2 added notifications as a retention lever, and they worked as part
   of the package (not isolated). That is the counter-example to own: attention is a tool, used when it brings people
   back to something valuable.
7. **Don't look at fault.** Verified Call: no "Can't confirm" in the badge for problems on our side.

`[NEED FROM BHANU N42: Turn this into your own one-sentence rule for Claude: when should Claude proactively reach out (a reminder, a follow-up, a finished background task) and when should it wait? Give one example you'd ship and one you wouldn't.]`

### 5.3 Single user → team → company adoption (discussion prompts, not claims)

Use these to think out loud; none are claims about Claude or about your past results.
- **Your nearest experience:** Stressie was sold to employers (Amazon's hardware team, InKind) and used by individuals,
  with a manager-visibility layer (self-reported value). EverTutor grew school by school (N17). Verified Call puts the
  switch inside the host's existing calendar so adoption rides an existing workflow; the buyer (host) and the person
  checked (candidate) are different people.
- **Prompt 1:** What is the first artefact a single user makes in Claude that someone else on their team would want to
  see or reuse? Make sharing that artefact the team entry point.
- **Prompt 2:** What does a team lead need to see to roll Claude out (who is using it, for what kinds of work, value
  signals), and how do you show that without surveillance of individuals?
- **Prompt 3:** What should a new team member's first session look like when their team already uses Claude
  (inherited context, shared projects) vs a solo signup?
- **Prompt 4:** Where does the company-level decision get made (security, admin, procurement), and which product
  surfaces reduce that friction?
- **Prompt 5 (honest framing):** Your team-to-company evidence is thin; say so, then show how you'd learn it fast
  (interview admins who rolled it out and ones who stalled; cohort retention of seats by team density).

---

## 6. Live critique practice

### 6.1 A 30-minute method for critiquing a Claude onboarding or everyday-work flow

The reviewer said diagnosis is judged before interface. Spend the first third on the problem.

| Minutes | Step | What you say / do |
|---|---|---|
| 0–3 | Frame | "Who is this for, what job, what does success look like at day 1 and week 4?" State assumptions out loud. |
| 3–8 | Walk the flow as the user | Narrate each screen: what I'm trying to do, what I expect, what I see. Note every ask for attention or data and what value the user has received before it. |
| 8–13 | Diagnose | Name 3 problems, each tied to a behaviour ("users won't return because…"), ranked by likely impact on the habit, not by visual polish. Separate *activation* problems from *retention* problems. |
| 13–16 | Evidence plan | For each: the signal that would confirm or kill it (cohort cut, funnel step, interview question). |
| 16–24 | Redesign one thing | Pick the highest-impact problem; sketch the change; explain the trade-off and what you'd cut. |
| 24–28 | Measure | Primary metric, leading indicator, guardrails, decision rule before launch. |
| 28–30 | Risks | Who could be hurt (privacy, trust, over-reliance, attention); what would make you not ship. |

Lenses to check quickly: time to first useful result; does the first task resemble a weekly job; where the next session
starts; how context carries over; one meaning per signal; what the product asks for before it has given anything;
error and uncertainty states (what happens when Claude is wrong or can't do it); accessibility; mobile.

### 6.2 Three practice prompts (do each timed, out loud, no notes)

1. **First run for a knowledge worker who signs up from a work email.** Critique the first-session experience and
   redesign it so that the first task is one they'll repeat next week.
2. **"Week 2 drop-off for people who used Claude to write one document."** Critique the everyday flow they'd hit on
   their second visit and propose how Claude becomes where that work starts.
3. **A team admin rolling Claude out to 40 people.** Critique what the admin and the 40 members each see in their
   first week, and design the moment where one person's use becomes the team's.

---

## 7. Known weak spots and honest framings

| Weak spot | Honest answer (sourced) | What would strengthen it |
|---|---|---|
| **Scale** (~2,000 learners; Stressie pilots; Verified Call has no field users) | "My largest production scale is ~2,000 learners across 8+ schools at EverTutor, as sole product designer. My growth work has been at pilot and early-production scale, so I've had to reason with small numbers carefully, which is why I report bounds and caveats." | Any larger-scale metric you owned (N15); a reference from EverTutor confirming role and scale (drafts in `proposals/prep/reference-requests.md`). |
| **Experimentation depth** (no A/B test in sources) | "I've run controlled classroom sessions and pre-registered evaluations, but not a classic randomised product A/B at scale with a data scientist. I know how I'd design one, and Verified Call is how I hold myself to a decision rule before seeing results." | N33 (a real "didn't ship" case); any A/B you ran anywhere; learn and practise power/MDE, CUPED-style variance reduction, holdouts. |
| **Analytics fluency / SQL** (JD preferred) | Sources show no SQL or product-analytics ownership; Stressie only reached Mixpanel/PostHog at the end. | `[NEED FROM BHANU N43: Have you written SQL or built funnels/retention charts yourself (tool, product, what question)? If not, say so and say how you'd close it.]` |
| **Mentoring / cross-team leadership** | Sourced: you set pedagogical guidelines for rotating contract content designers and reviewed their output through tooling you built; you designed and ran a multi-agent operating model (planners, builders, fresh verifiers, written rules, a fixed format for asks). No human design reports in sources. | `[NEED FROM BHANU N44: Have you mentored or managed any designer (who, how long, one thing they got better at because of you)? Any cross-team alignment story at EverTutor (engineering, founder, schools)?]` |
| **"AI agents wrote most of the code"** | Say it first: 839 of 973 commits carry AI co-author trailers; you wrote specs, evaluation rules, ~100 dated decisions, reviewed and tested on real machines, and caught agent mistakes (examples: minimised host tab stopping the check; a deep link opening an empty home; badge off the leave-button row; a face check waiting on a click). This is exactly the "prototype with Claude Code / define AI workflows" the JD asks for. | `[NEED FROM BHANU N45: Which code did you write or substantially change by hand (files or areas), if any? And one agent mistake you caught that a less careful operator would have shipped.]` |
| **Independent validation** | Verified Call numbers are own testing; the verifier is a fresh AI agent; no field data; Stressie numbers are single-source pilot figures; EverTutor ARR is self-reported. | An outside engineer re-running the public eval kit; named references (founders, a teacher, a content designer); Verified Call's first field false-alarm rate. |
| **Short tenures / overlap** | Stressie V1→V2 Jun–Sep 2024 (~3.5 months); EverTutor Mar 2025 – May 2026; Verified Call since Sep 2026; Stressie V4 in 2026 "now with the team". | `[NEED FROM BHANU N46: A clean one-line timeline of every role 2024–2026 (including SigIQ and Stressie V4) so dates never conflict when asked.]` |
| **Titles** | Stressie: founding product designer (and built the V4 iOS app). EverTutor Live and Studio: sole product designer (Studio also lead curriculum designer; owner confirmed "sole"). Verified Call: founder. Positioning: design engineer. | Make the résumé PDF match (still titled "AI Native Designer"). |

---

## 8. Gaps checklist, ranked by how likely each comes up for the Growth role

Answer the top 15 before any interview. Each is verbatim from the sections above.

1. **N1** Exactly how was "daily engagement" defined (numerator, denominator, which days), what tool or log produced 12% and 56%, and which group was the 12% measured on: APD V1, or a V2 baseline week?
2. **N2** What retention window and cohort is 17.4% (D7, D30, week-N, pilot end), how many users were in the denominator, and where did the ~2% industry baseline come from?
3. **N3** Which change do you personally believe moved daily engagement most (notifications, crash fixes, quick resets on the home screen, or the redesign), and what did you see that makes you think so?
4. **N33** Do you have a real case where a number went up and you still didn't ship (any product, any company)? What was the number, what guardrail or judgement stopped it, and who disagreed?
5. **N35** Pick one story where someone with more authority disagreed and data changed their mind. What was the data, how did you present it, and what happened after?
6. **N10** For the ~25% completion result: how many students and sessions, what was the comparison (the slide version? which schools?), how was "completion" defined, who ran the sessions, and over what dates?
7. **N14** What was the December cohort churn (end of term? a school contract ending? learners dropping?), how did you find out, and did any design change respond to it?
8. **N15** What product analytics did EverTutor have (tool, dashboards, events), who owned them, and what did you personally query or track week to week?
9. **N43** Have you written SQL or built funnels/retention charts yourself (tool, product, what question)? If not, say so and say how you'd close it.
10. **N32** Which surface of Claude do you use daily (claude.ai, desktop, mobile, Claude Code), and what is your own week-4 habit story: when did it become daily for you, and what almost made you drop it?
11. **N42** Turn this into your own one-sentence rule for Claude: when should Claude proactively reach out (a reminder, a follow-up, a finished background task) and when should it wait? Give one example you'd ship and one you wouldn't.
12. **N4** How many people were in the Amazon hardware team and InKind pilots, over what dates, and was usage voluntary or encouraged by the employer?
13. **N31** Was there any period where V1 and V2 ran side by side, or any V2 week-by-week curve you saw, that supports the redesign mattering beyond the population change?
14. **N11** Besides the gamified layer, which hypotheses about why students didn't finish did you consider and drop before landing on voice-first + whiteboard (e.g. lesson length, difficulty, device issues)? Only list ones you actually considered.
15. **N12** What engagement measure did you watch for the gamified layer, over how long, against what comparison, and who made the cut call?
16. **N44** Have you mentored or managed any designer (who, how long, one thing they got better at because of you)? Any cross-team alignment story at EverTutor (engineering, founder, schools)?
17. **N17** What made a pilot school expand (teacher champion, admin decision, results shown, content coverage)? Did you design anything specifically for that step?
18. **N34** Did anyone (CEO, CTO) want patch fixes instead of a full redesign? What evidence changed their mind?
19. **N7** How did the conversation with the founders go: what did they argue, what made them accept it, and what metric will tell you whether you were right?
20. **N5** What were the notification rules (when, how often, what triggered them), and did you see any opt-out or disable data?
21. **N6** Who decided on the 27-question assessment and why (product need for stressor data, the founders' model, your call)? What was the onboarding completion rate, if known?
22. **N26** Since 13 Nov: how many companies signed up, installed the extension, or ran a call with a real candidate? Any Chrome Web Store install / weekly-user numbers? How many demos, replies, pilots from outreach?
23. **N27** After the post-TechCrunch simplification, did later demos still show "Checking…"/"Can't confirm"? What did prospects say the second time?
24. **N45** Which code did you write or substantially change by hand (files or areas), if any? And one agent mistake you caught that a less careful operator would have shipped.
25. **N18** Which unit is true for 104 h: per lesson, per topic, or per 30 minutes of instruction? Is a Studio lesson the same size?
26. **N19** Is 104 h one lesson or an average of several? Who made them, and was time tracked, taken from calendars, or estimated?
27. **N20** Were Studio lessons comparable in length, steps and math density to the 104 h ones? Does ~4.5 h include review, QA, voice and engineer time? Was quality checked any way beyond your review?
28. **N21** How was 40–50 h onboarding on the old tools measured or estimated, and on how many content designers?
29. **N9** What is your target for V4 (D30, weekly check-ins, redemptions per active user), and what guardrail would make you roll something back?
30. **N13** In UI terms, what did "listening" become: an acknowledgement cue, lower latency, interruption handling, visual state while listening? What was before vs after?
31. **N29** In one sentence, what is your rule when the host's interest and the candidate's fairness conflict, and one example where fairness won?
32. **N46** A clean one-line timeline of every role 2024–2026 (including SigIQ and Stressie V4) so dates never conflict when asked.
33. **N25** What exactly was your role at SigIQ, when, and how many interviews or incidents did you see that made this a problem worth building for?
34. **N22** What does 3,000+ count (all creators, AI-assisted drafts, variants), and why are only ~700 in the time log?
35. **N16** What is the $5/hour based on (price charged per student-hour, cost to serve, school contract divided by hours)?
36. **N8** Is the free-seat no-show claim from Stressie data, from event-platform research, or a belief? If a belief, say so.
37. **N37** Did you ever design or test a numeric confidence score for hosts? Why did you reject it, in your own words?
38. **N40** When and why did you reverse the "no desktop app" decision? What did you give up in activation by asking candidates to install something?
39. **N23** Name the hardest lesson that broke the flow system, what you changed, and the list of things you deliberately refused (free branching? per-student forks? arbitrary layout?).
40. **N24** What changed in Studio between V0 and the version content designers used, and what feedback forced it?
41. **N30** Did you consider renaming the badge ("All checks clear")? Why did you keep "Verified"?
42. **N28** Did any pilot run (dates, interviews, paid or free, anything flagged)? If not, be ready to say "no pilot has run yet".
43. **N36** What method produced the published voice and face lower bounds (clustered by speaker/person? a different interval?), and why it differs from plain Clopper-Pearson on the raw counts?
44. **N38** Why no latch? What went wrong with the "Needs a look for the rest of the call" version?
45. **N39** Why Electron rather than a native app per platform (shared React/TypeScript design system across five surfaces? speed with AI agents?), and what did Electron cost you (size, signing, CPU)?
46. **N41** For each open category, what is your next step and its rough cost, and which one would you fix first for a paying customer? Practise saying it without any how-to detail.

Total: 46 items.
