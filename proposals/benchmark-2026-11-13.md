# bhanu.build benchmark: where it stands (13 Nov 2026)

Private. Read-only research: nothing was edited, posted or sent. This is a qualitative judgement from public evidence, not a statistical ranking. Visual and interaction judgements come from the review pack screenshots (`review/*.webp`), not from using the live WebGL site, so treat them as lower confidence.

## One-line placement

Within a deliberately elite reference set (the best-known design engineers and AI-interface designers on the web), bhanu.build sits **below the median overall but at the top for evidence and rigour**. Against the general pool of senior product-designer portfolios a hiring manager actually screens, it is likely **top ~10–15%**. The things holding it back are scale, outside proof that others use the work, and a missing growth-experiment story. The craft and the thinking are not the problem.

---

## 1. What the portfolio is (as read)

Sources read: `ai.md`, `llms.txt`, the Verified Call case study (live), verifiedcall.app/research (live), the eval-kit repo (live), `review/README.md`, and these screenshots: home hero, VC chapter, VC evidence, Stressie check-in, ETL growth chart.

- **Positioning:** "Design engineer building AI products from problem → code." Painted, day/night San Francisco world on the homepage. There is a "Copy for ChatGPT" button, an AI orb prompt ("Ask how tutoring went from $250 to $5 an hour"), and an `ai.md`/`llms.txt` brief in which every claim is labelled by evidence type.
- **Verified Call (founder, solo plus AI agents):** a Mac/Windows app plus a Google Meet panel. The evidence system is unusually rigorous for a portfolio:
  - pass/fail rules pinned with sha256 before results
  - sealed and held-out data
  - a separate verifier agent
  - exact Clopper-Pearson bounds
  - failures kept on record
  - a build check that blocks overclaiming copy
  - a red team: 17 attacks, 6 still get through, listed publicly

  Weak spots: the data is self-run, there are no live interviews yet, the beta is open to 20 companies and he has talked to 5 hiring teams. The case study runs to roughly 3,500 words.
- **Stressie (founding PD, built the SwiftUI app):** V2 pilots with Amazon hardware, InKind and Austin PD. Retention went from about 2% to 17.4% and daily engagement from 12% to 56%, and the pilots helped secure about $600K. The V4 build has 171 Swift files, 13/13 Figma frames matched, and a token lint. V4 usage is not yet validated.
- **EverTutor Live / Studio (sole PD; engineers built it):** about 2,000 learners in 8+ schools, $9.5M seed. Lesson creation went from 104 h to about 4 h (about 700 logged lessons). Completion was about 25% higher in controlled sessions. A cut gamification layer is recorded. The growth chart is honestly captioned "self-reported; not audited".
- **Public code:** `verified-call-eval-kit` is MIT, zero-dependency Node, with 10 tests. It has 2 commits and 0 stars.

**Visual read (from screenshots):** the painted homepage is genuinely striking and memorable. The case-study pages use a competent dark editorial system: big Montserrat headlines, mono eyebrows, cards with "Decision / Cut" callouts. That system is clean but close to the common 2024–26 "design engineer dark mode" look. The painted scenes are not credited, so a reader can't tell whether they are AI-generated. If they are, some reviewers will discount them as non-craft.

---

## 2. Reference set (13)

Primary sources were fetched unless marked *(known, not re-fetched)*.

| # | Who / URL | Role context | What it does exceptionally |
|---|---|---|---|
| 1 | Rauno Freiberg — https://rauno.me (craft: https://rauno.me/craft) | Vercel; Devouring Details | About 90 dated interaction experiments: prototypes, shaders, sliders, menus. Essays such as "Invisible Details of Interaction Design". The site itself is the proof of craft. Almost no metrics. |
| 2 | Emil Kowalski — https://emilkowal.ski | ex-Linear, ex-Vercel | Ships primitives other people use (Sonner, Vaul). Build-retrospective essays ("Building a Toast Component"). A paid course (animations.dev). Writing on taste and AI ("Agents with Taste"). |
| 3 | Paco Coursey — https://paco.me | Linear (webmaster); built the Vercel design system | One-screen, text-only page. Widely used OSS (cmdk, next-themes). Restraint as a signal. |
| 4 | Brian Lovin — https://brianlovin.com | Notion AI | Open-source site (briOS), podcasts, App Dissection, small shipped apps, an llms.txt. Shows a body of public thinking over many years. |
| 5 | Jakub Krehel — https://jakub.kr | Founding DE, Interfere | Craft-explainer writing (gestures, shared layout, OKLCH, "Using AI as a design engineer"), a magazine (interfaces.dev), skills for DEs. |
| 6 | Amelia Wattenberger — https://wattenberger.com | Principal Research Engineer, GitHub Next | AI-interface prototypes shipped at GitHub scale (Copilot for Docs, Code Atlas). Interactive essays with a point of view on chat interfaces. |
| 7 | Maggie Appleton — https://maggieappleton.com | GitHub Next | Argumentative visual essays on AI and trust. An interface-patterns library. Talks. |
| 8 | Linus Lee — https://thesephist.com | ex-Notion AI research engineer | 100+ prototypes, about 500k words of writing, talks. A clear research agenda for AI interfaces. |
| 9 | Josh Puckett — https://joshpuckett.me | ex-Dropbox / Wealthfront design lead | Interface Craft library, small polished tools (DialKit, Bloom). Senior-leadership credibility. |
| 10 | JP Holdsworth — https://jpholdsworth-design.pages.dev/calendly-growth-2021.html | Senior PD, Growth, Calendly | The growth case-study model: an operating loop, six hypothesis→result experiments, and roll-ups (+27% activation, +32% free→paid). It is weak on sample sizes and significance. |
| 11 | Henry Heffernan — https://henryheffernan.com *(known)* | Developer/designer | Immersive 3D WebGL portfolio. The closest analogue to bhanu.build's immersive homepage, and award-recognised. |
| 12 | Bruno Simon — https://bruno-simon.com *(known)* | Creative developer | The canonical WebGL portfolio (a drivable car). Shows how an immersive shell earns its place when the shell *is* the skill. |
| 13 | Ryo Lu — https://ryo.lu *(known; page didn't render for fetch)* | Head of Design, Cursor | ryOS, a playful built OS shell. Designer-who-codes at an AI-native company. |

Also used for format and hiring context: growth.design case studies (https://growth.design/case-studies).

**Pattern across the set:** the elite design-engineer portfolios almost never publish case studies or metrics. They win on:
- shipped artifacts that other people use, at the scale of Vercel, Linear, Notion or GitHub, or as popular OSS
- an inspectable craft archive
- years of public writing

The growth-design reference is the reverse: metrics-heavy, with thin artifacts. No one in the set combines rigorous evidence with deep craft. That gap is the opening for bhanu.build.

## 3. What hiring managers say they look for

- **Anthropic Growth JD** (`proposals/prep/anthropic-growth-jd.md`). The minimums include:
  - "owned growth for a major area end to end"
  - "deep growth design … at meaningful scale"
  - "designed/launched/interpreted experiments"
  - product analytics (funnels, retention)
  - Claude Code prototyping

  Preferred: B2B/PLG, single user → team → company adoption, SQL, a point of view on when a product should ask for attention.
- **Anthropic careers page:** "We care about what you can do, not where you learned to do it." It says to put independent research, "a thoughtful blog post," or open-source work at the top.
- **Anthropic product designer postings** (aggregators): end-to-end shipped case studies, detailed UI craft, and a portfolio deep-dive on process and attention to detail. They note "interactions that don't have established conventions yet."
- **OpenAI PD postings** (aggregators): product strategy plus interaction plus visual execution, and prototyping used to validate concepts. The Growth role stresses onboarding work.
- **Leslie Yang** (design manager), https://leslieyang.substack.com/p/what-a-hiring-manager-looks-for-in:
  - 3–4 focused case studies
  - role, team and duration up front
  - "I" statements
  - short text paired with visuals
  - Red flags: dense text, vague ownership, unreadable visuals.
- **Micka Touillaud** (screened 800+ portfolios for a Senior PD at Feedly), https://micka.substack.com/p/what-really-matters-when-hiring-product:
  - a 30-second polish check, then a 3-minute structure dive
  - realistic stories of company dynamics
  - clearly defined success metrics
- **Fountain Institute** (2026), https://www.thefountaininstitute.com/blog/senior-product-designers-hired:
  - real, traceable, ideally live work
  - one decision traced in 500–800 words
  - trade-offs and failures
  - how you direct AI and where you overrode it
  - 3–5 case studies
  - specialists over generalists

  Several of its statistics are secondhand.

**Net:** reviewers skim fast, then look for decisions, ownership, outcomes and craft close-ups. AI-native companies add live, traceable work and visible judgement in how you direct AI.

---

## 4. Rubric

Placement is relative to the 13-portfolio reference set, with a second read against the general senior-PD applicant pool where it helps.

| Dimension | Bhanu's evidence | How the set compares | Placement | Confidence |
|---|---|---|---|---|
| **Product thinking** | Six VC decisions, each with the rejected option. A "fair to the candidate" policy. A line drawn against the first customer's ask (privacy). The "Can't confirm" state. Stressie's owned call (human approval for events). The cut gamification layer. | The DE set rarely shows product reasoning. Wattenberger, Appleton and Lee show it through essays. Holdsworth shows it through experiments. | **Upper third of set; top ~10% of general pool** | Medium-high |
| **Evidence & rigour** | Pre-registered rules, sealed data, exact bounds, a public red team, failures kept, evidence-type labels on every claim, a claim-guard build check, public code. | No one in the set comes close. Holdsworth reports lifts without samples or significance (one exception). The DE set publishes almost no metrics. | **#1 in set; top ~1–2% of portfolios generally** | High |
| **Scale of impact** | About 2,000 learners and 8+ schools. Pilots with named organisations. VC has 0 live interviews. About $600K raised and $9.5M seed (company-level). | The set's work runs at Vercel, Linear, Notion, GitHub or Cursor scale, or as OSS used widely. Calendly cites $50M→$135M ARR. | **Bottom of set** | High |
| **Visual craft** | Memorable painted SF world. Clean, consistent dark case-study system. Real device mockups. Readable charts with honest captions. | Rauno, Emil and Paco set the bar for restraint and detail. Heffernan and Simon set it for immersive. Bhanu's case-study system is good but familiar. The painted imagery's authorship is unstated. | **Around median of set; top ~15% of general pool** | Medium-low (screenshots only) |
| **Interaction craft** | Release-to-commit check-in slider (SwiftUI). Meet panel state system. Cloud entrance and chapter films. "Hold to speak" voice UX. Most of it is shown as screenshots or clips inside long pages, not as isolated, explained, touchable pieces. | Rauno's archive, Emil's components and Jakub's gesture writing each make a single interaction inspectable, with tuning notes. That is what DE reviewers probe. | **Below median of set** | Medium |
| **Technical depth / shipped code** | A cross-platform desktop app plus a Meet panel (agents wrote most of the code, under his specs and review). 171 Swift files and a lint in Stressie. The public eval kit has 10 tests, 2 commits and 0 stars. | The DE set ships code other engineers depend on (Sonner, Vaul, cmdk, next-themes) or ships inside major products. | **Below median of DE set; well above typical PD** | Medium-high |
| **Writing clarity** | Plain, numbers-first, candid ("How I know it works, and where it doesn't"). But the VC page runs to about 3,500 words, and there are no essays or point-of-view pieces. | Appleton, Wattenberger, Lee, Rauno and Emil are known *for* their writing and stated beliefs. | **Clarity: upper half. Writing as public thinking: bottom third** | Medium |
| **Distinctiveness** | The painted living SF world, the evidence-labelled `ai.md`, and a public eval kit for a portfolio project. Nothing else in the set looks or reads like it. | Brian Lovin also ships an llms.txt. The immersive genre has strong precedents (Simon, Heffernan). | **Upper third** | Medium |
| **Role fit: AI design engineering** | End-to-end AI products: voice tutor, detection and trust UX. He directs agents with an eval discipline, which is exactly the 2026 "how you direct AI" signal. | Fit is strong for early-stage AI startups. For frontier-lab and top-tool DE roles, reviewers will look for code they can read and craft pieces they can touch. | **Strong for seed–Series B AI; borderline-competitive for frontier-lab DE** | Medium |
| **Role fit: Growth (Anthropic)** | He has activation and retention outcomes (Stressie 12→56% daily engagement; Studio onboarding 40–50 h→<2 h). He has no designed or interpreted experiment with a baseline, cohort and confounds, no funnel or retention artifact, no B2B team-adoption path, and small scale. Stressie's lift compares different pilot organisations, which is an attribution gap. | Holdsworth's page is the minimum bar the JD implies: six experiments with hypotheses and results, plus roll-ups. The JD's own minimums require "meaningful scale". | **Below the JD's bar on 2 of the minimums (scale, experiments); credible on craft, AI and prototyping** | High |

**Overall:** the portfolio's best asset, rigour, is the asset the reference set lacks, and that is a real differentiator. Its weakest areas map exactly onto what elite DE and Growth reviewers check first:
- touchable craft
- code other people use
- scale
- an experiment story

---

## 5. Top 5 changes, ranked by impact per effort

**1. Write one growth-experiment case: activation and retention, done like the VC evidence section.** *Impact: very high for Growth; Effort: low–medium (the data mostly exists).*
- Rework Stressie V2, or EverTutor's completion and gamification work, as the hypothesis→result loop.
- Cover: the baseline and how it was measured, the cohort and window, what changed, confounds (different pilot organisations, novelty, crash fix), what was rejected, and the metric you didn't ship on.
- Add one funnel or retention-curve artifact.
- It answers four of the five likely interview questions in `anthropic-growth-jd.md` before they are asked.
- Apply VC's rigour, which is the advantage: state sample sizes, which Holdsworth doesn't.
- Reference: JP Holdsworth's Calendly growth case, https://jpholdsworth-design.pages.dev/calendly-growth-2021.html

**2. Add a 60-second skim path and trim the long pages.** *Impact: high; Effort: low.*
- Homepage first viewport: name, role, the three proof numbers, and a plain text list of the case studies that works without WebGL or video.
- Each case study: role, team, duration, the one decision and the one outcome above the fold, with the deep dive below.
- Cut VC's main read toward roughly 1,500 words and keep the method behind "full method".
- Reviewers give it seconds, and the painting currently spends them.
- References: https://paco.me and https://emilkowal.ski (one screen, all signal); Leslie Yang's structure, https://leslieyang.substack.com/p/what-a-hiring-manager-looks-for-in

**3. Publish a small craft log of 4–6 touchable interactions with tuning notes.** *Impact: high for DE roles; Effort: medium.*
- Candidates: the Stressie release-to-commit slider (spring values, why there is no Continue button), the Meet panel's Verified → Needs a look → Can't confirm transitions, the hold-to-speak timing, and the cloud entrance.
- Each one is isolated, runnable in the browser or as a video with the parameters shown, with three sentences on what was tried and rejected.
- This is the thing DE reviewers probe ("reconstruct the thinking").
- References: Rauno Freiberg's craft archive, https://rauno.me/craft; Emil Kowalski's "Building a Toast Component", https://emilkowal.ski

**4. Write 2–3 point-of-view essays on AI product design and pin them at the top.** *Impact: medium-high; Effort: medium.*
- Suggested titles:
  - "Pre-register your product claims: how I evaluate an AI feature before I write its copy"
  - "Designing 'Can't confirm': honest uncertainty in AI interfaces"
  - "When an AI product should ask for attention and when it should stay out of the way" (taken straight from the Anthropic JD's preferred list)
- Anthropic's careers page explicitly says to put "a thoughtful blog post" at the top.
- References: Maggie Appleton, https://maggieappleton.com; Amelia Wattenberger, https://wattenberger.com

**5. Turn the eval kit into something others adopt.** *Impact: medium (external validation is the scarcest signal he lacks); Effort: medium.*
- Publish it to npm and ship the claim guard as a GitHub Action.
- Add a docs page with one worked example ("30/30 → ≥90.4%: why not 100%").
- Write a launch post, and let real commits accumulate.
- Even modest outside usage turns "public code" into "code people depend on."
- References: Emil Kowalski's Sonner and Vaul, and Paco Coursey's cmdk: small, focused primitives with excellent docs (https://emilkowal.ski, https://paco.me)

**Honourable mention (high impact, not a portfolio edit):** get Verified Call's first live interviews and a field false-alarm rate, plus one named customer quote. "0 live interviews" is the biggest credibility gap on the strongest case study. Also state how the homepage paintings were made, since unstated AI imagery is a reviewer risk.

---

## 6. Caveats

- The elite set is chosen to be elite: most hiring pipelines will never see a candidate pool like it. "Below median of this set" is not a weak result.
- Several reference portfolios succeed on employer brand and years of public output. That is a time-and-access gap, not a quality gap.
- The visual and interaction scores rely on static screenshots of a motion-heavy site.
- Henry Heffernan, Bruno Simon and Ryo Lu are described from prior knowledge; their pages did not render for fetch.
- Hiring-advice sources are mostly individual managers' newsletters and aggregator copies of job descriptions, not official company criteria. The exception is Anthropic's careers page and the pasted JD.
