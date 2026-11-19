---
name: By default, Graphon forgets what changed
description: A short research paper addressed to one company, whose one figure sets the company's product beside the fix, in the product's own skin.
colors:
  ink: "#121212"
  paper: "#ffffff"
  ink-secondary: "#4a4d55"
  ink-tertiary: "#6b6f78"
  rule: "#d9dbe0"
  hyperref-blue: "#2b45ff"
  highlighter: "#fff06a"
  before-gray: "#e8e9ed"
  plate-gray: "#f1f2f5"
  listing-tint: "#f7f8fa"
  string-green: "#1f6b45"
  listing-comment: "#7a7f8a"
  playground-screen: "#0a0a0a"
  playground-card: "#171717"
  playground-card-prev: "#242424"
  playground-ink: "#ededed"
  playground-mute: "#a0a0a0"
  playground-blue: "#7ca4ec"
  playground-track: "#2e2e2e"
typography:
  display:
    fontFamily: "'STIX Two Text', 'STIX Two', Georgia, serif"
    fontSize: "clamp(1.9rem, 4.4vw, 2.9rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'STIX Two Text', 'STIX Two', Georgia, serif"
    fontSize: "1.55rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'STIX Two Text', 'STIX Two', Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'onum' 1, 'pnum' 1"
  caption:
    fontFamily: "'STIX Two Text', 'STIX Two', Georgia, serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
  table-head:
    fontFamily: "'STIX Two Text', 'STIX Two', Georgia, serif"
    fontSize: "0.95rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.04em"
    fontFeature: "'smcp' 1"
  label:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.3
  state-tag:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.01em"
  data:
    fontFamily: "'Spline Sans Mono', ui-monospace, Menlo, monospace"
    fontSize: "0.9rem"
    fontWeight: 500
    lineHeight: 1.45
    fontFeature: "'tnum' 1, 'lnum' 1"
  code:
    fontFamily: "'Spline Sans Mono', ui-monospace, Menlo, monospace"
    fontSize: "0.82rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  tag: "3px"
  state-tag: "4px"
  control: "6px"
  screenshot: "10px"
  screen: "12px"
  pill: "999px"
spacing:
  gutter: "clamp(1rem, 4vw, 2.5rem)"
  measure: "38rem"
  abstract: "34rem"
  wide: "58rem"
  pair-gap: "clamp(1rem, 3vw, 1.75rem)"
  figure-gap: "2.5rem"
  section-gap: "clamp(3rem, 7vw, 4.5rem)"
  paragraph: "1rem"
components:
  running-head:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.label}"
    padding: "0.7rem clamp(1rem, 4vw, 2.5rem)"
  state-tag-before:
    backgroundColor: "{colors.before-gray}"
    textColor: "{colors.ink}"
    typography: "{typography.state-tag}"
    rounded: "{rounded.state-tag}"
    padding: "0.38rem 0.6rem"
  state-tag-after:
    backgroundColor: "{colors.hyperref-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.state-tag}"
    rounded: "{rounded.state-tag}"
    padding: "0.38rem 0.6rem"
  file-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 0.95rem"
  file-pill-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  copy-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.control}"
    padding: "0.45rem 0.65rem"
  copy-button-done:
    textColor: "{colors.string-green}"
  evidence-key:
    backgroundColor: "{colors.highlighter}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.12rem 0.38rem"
  code-listing:
    backgroundColor: "{colors.listing-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    padding: "2.6rem 1rem 1rem"
  playground-screen:
    backgroundColor: "{colors.playground-screen}"
    textColor: "{colors.playground-ink}"
    rounded: "{rounded.screen}"
    padding: "clamp(1rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2.5rem)"
  changed-answer-card:
    backgroundColor: "{colors.playground-card}"
    textColor: "{colors.playground-ink}"
    rounded: "{rounded.screen}"
    padding: "22px 24px 18px"
---

# Design System: By default, Graphon forgets what changed

Scope: this record governs `graphon.html` and the `ChangedAnswer` component in this folder only. The rest of the portfolio runs a different, incumbent system; nothing here applies to it.

## Overview

**Creative North Star: "The Short Paper"**

The surface is a preprint addressed to one reader. White paper, near-black ink, a serif carrying nearly every word, and the furniture of a paper doing the structural work: a running head, a centred title block with author and affiliation lines, a run-in abstract, numbered sections, a booktabs table, a numbered figure with a bold "Fig. n." caption, and numbered references. Hierarchy comes from typographic convention and hairline rules, not from cards, fills or shadows.

Colour is semantic, the way a typeset paper uses it. Hyperref blue means "link" and "after, with the fix". Highlighter yellow means "evidence, look here". A pale gray plate means "before". Ink is everything else.

The one deliberate exception is the product. Fig. 1 sets the company's own screen (Before) beside the fix (After), and the After panel is drawn in that product's skin (a near-black screen, rounded cards, a cool blue accent) so the reader compares like with like. That dark panel lives inside the figure, never as a page style.

**Key Characteristics:**
- Serif-first: STIX Two Text for title, body, captions, table heads, signature and footer.
- Grotesk only for interface-like labels (running head, Before/After tags); mono only for data (times, dates, file names, code).
- Hairline rules in place of containers; flat everywhere.
- Semantic colour on white: blue (link / after), yellow (evidence), pale gray (before).
- Proof is a before/after pair: their real screen at native size beside the working fix.
- Motion is explanatory and plays once; nothing ambient moves.

## Colors

A white page set in ink, with semantic accents and one borrowed dark skin reserved for the After panel.

### Primary
- **Hyperref Blue** (hyperref-blue): every link, the running head's "Get the code", focus rings, syntax keywords in the listing, and the After tag. It means "follow this" or "this is the fix".

### Secondary
- **Highlighter Yellow** (highlighter): evidence only. The marker stroke under a key table phrase, the outline and 12% wash on screenshot regions, the lettered keys that tie the caption to those regions, and text selection. Always paired with ink text.

### Tertiary
- **String Green** (string-green): string literals in the code listing and the copy button's confirmed state. Code-only.

### Neutral
- **Ink** (ink): body text, headings, the heavy booktabs rules, Before tag text.
- **Paper** (paper): the page; After tag text.
- **Ink Secondary** (ink-secondary): captions, figure sub-lines, table heads, running-head links, references.
- **Ink Tertiary** (ink-tertiary): affiliation line, section numbers, list numerals, footer.
- **Rule** (rule): hairlines: running-head border, sign-off and footer rules, control borders.
- **Before Gray** (before-gray): the Before tag plate.
- **Plate Gray** (plate-gray) and **Listing Tint** (listing-tint): inline code and the code listing ground. **Listing Comment** (listing-comment) for code comments.

### Product skin (After panel only)
- **Playground Screen**, **Playground Card**, **Playground Card Prev**, **Playground Ink**, **Playground Mute**, **Playground Blue**, **Playground Track**: sampled from the company's own interface (the Before screenshot) and applied through the component's `--ca-*` variables and the scrubber. They exist only inside the After panel.

### Named Rules
**The Semantic Ink Rule.** Blue means link or after, yellow means evidence, pale gray means before. No colour appears for decoration, and no colour changes meaning across the page.

**The One Dark Panel Rule.** The only dark surface is the panel that reproduces the subject company's product, in that product's own colours. The paper itself never goes dark.

## Typography

**Display Font:** STIX Two Text (with STIX Two, Georgia)
**Body Font:** STIX Two Text (with STIX Two, Georgia)
**Label Font:** Schibsted Grotesk (with system-ui)
**Mono Font:** Spline Sans Mono (with ui-monospace, Menlo)

**Character:** A scientific serif with old-style proportional figures carries the argument; a quiet grotesk labels things the way an interface or a figure annotation would; a mono marks anything that is measured or machine-read.

### Hierarchy
- **Display** (500, clamp(1.9rem, 4.4vw, 2.9rem), 1.1, -0.025em, balanced wrap): the paper title, centred, sentence-length. One per page.
- **Headline** (600, 1.55rem, 1.2): numbered section heads; the number sits in ink tertiary at weight 500 with lining figures in a 1.6em slot.
- **Body** (400, 1.125rem, 1.6, old-style proportional numerals): paragraphs at a 38rem measure; the abstract at 1.05rem in a 34rem column.
- **Caption** (400, 0.95rem, 1.5): figure caption in ink secondary, opening with a bold ink "Fig. n." run-in. Figure sub-lines beside the state tags use the same size in italic.
- **Table head** (500, 0.95rem, small caps, 0.04em): booktabs column heads, lowercased then small-capped.
- **Label** (Schibsted 500, 0.85rem): the running head. **State tag** (Schibsted 600, 0.8rem, 0.01em): Before and After.
- **Data** (Spline Mono 500, 0.9rem, tabular lining figures): measured times, right-aligned. Controls and keys use the same face at 0.72 to 0.82rem.
- **Signature** (STIX italic 400, 1.6rem): the author's name at sign-off. Italic STIX also sets the affiliation line, list numerals and footer.

### Named Rules
**The Three Voices Rule.** Serif argues, grotesk labels, mono measures. A sentence is never set in mono; a timestamp is never set in serif.

**The Paper Run-in Rule.** Structural labels are run-ins inside the text they introduce ("Abstract." in small caps, "Fig. n." in bold), never separate lines above it.

## Layout

A single centred column with two widths: a 38rem reading measure for prose, tables and references, and a 58rem wide measure for the title block and the figure, so the figure breaks out past the text the way a paper's full-width figures do. The page gutter is clamp(1rem, 4vw, 2.5rem) and is shared by the running head.

Fig. 1 is a before/after pair. At 861px and wider it is two columns: the Before column is capped at the screenshot's native 472px, the After column takes the rest, gap clamp(1rem, 3vw, 1.75rem), tops aligned. At 860px and below the columns stack, Before above After, and the screenshot stays capped at 472px. Each column opens with a sub-line: a state tag followed by an italic serif phrase. One caption spans both columns.

Rhythm: sections are separated by clamp(3rem, 7vw, 4.5rem); the figure pair sits 2.25rem below the abstract; captions sit 0.75rem under the figure; paragraphs close with 1rem. The title block opens at clamp(2rem, 5vw, 3.5rem) below the running head. The After panel reserves its tallest state's height (14.25rem) so dragging the date never shifts the page.

The running head is sticky, translucent white (94%) over a hairline. Below 640px its centre note hides. Raster figures are shown at native size, never upscaled.

## Elevation & Depth

Flat. There are no shadows anywhere on the page or in the component. Depth is conveyed by rules (1.5px ink booktabs rules top and bottom, 1px ink or hairline rules elsewhere), by the single dark panel, and, inside the component, by stacking: the previous answer card sits behind the current one, offset downward 38px and scaled to 0.93.

### Named Rules
**The Rules-Not-Boxes Rule.** Group with horizontal rules, the way a typeset paper does. Tables and listings take top and bottom rules only; no side borders, no card frames on paper surfaces.

**The Stack-Not-Shadow Rule.** When one thing replaces another, the older one stays visible beneath it, offset and scaled back. Never fake lift with a shadow.

## Shapes

Paper surfaces are square-cornered: tables and the code listing have no radius. Radius belongs to two things only: small interactive or annotation pieces (3px inline code, 4px state tags and evidence outlines, 6px copy button, full pills for file links and evidence keys) and reproductions of the product (10px screenshot frame, 12px product panel and answer cards, matching the product's own rounding).

## Components

### Running head
A preprint header, not a nav bar. Left: the page address. Centre (desktop only): date and the unsolicited note. Right: "Reply" (mail) and "Get the code" in hyperref blue with a 16px stroked download glyph. Links are undecorated ink secondary, darkening to ink on hover.

### Before / After pair (signature figure)
- **State tags:** grotesk 600 0.8rem, 4px radius, 0.38rem by 0.6rem. Before: before gray with ink text. After: hyperref blue with white text. Each is followed by an italic serif sub-line in ink secondary.
- **Before:** the company's real screenshot at native size (472px) in a 10px frame on a near-black ground; regions marked with a 2px highlighter outline over a 12% highlighter wash, each keyed by a lettered yellow disc that the caption repeats inline.
- **After:** the Changed Answer component on the Playground screen with the timeline scrubber beneath.
- **Caption:** one caption under both, describing Before then After.

### Booktabs table
- **Rules:** 1.5px ink top and bottom, 1px ink under the head; no vertical rules, no zebra.
- **Cells:** 0.55rem by 0.5rem padding, serif 1rem body; measured values right-aligned in data mono.
- **Evidence:** a highlighter stroke drawn from 55% to 92% of the line height under the key phrase, text colour unchanged.

### Buttons and links
- **File pill:** mono 0.82rem, 1px ink border, full pill, 0.65rem by 0.95rem; hover inverts to ink ground with white text (0.2s).
- **Copy button:** mono 0.72rem, white with hairline border, 6px radius, pinned top-right in the listing; confirmed state turns string green.
- **Text links:** hyperref blue, 1px underline at 0.18em offset, thickening to 2px on hover.
- **Focus:** 2px hyperref-blue outline, 3px offset (Playground Blue, 4px offset, inside the dark panel).

### Code listing
Listing tint ground between 1.5px ink rules, mono 0.82rem / 1.65, 2-space tabs, scrolls horizontally. Keywords and tags blue, strings green, comments listing comment gray.

### Changed Answer
A question line, then a stack: the current answer card on top with a date chip (pill, chip colours) and the new fact marked by a soft highlight wash; the superseded fact struck through in the chip; the previous card peeking 38px beneath, scaled 0.93, showing only its dated source line. A hairline separates the answer from its source row (file name left, version and date right, mono 12px). On change the new card lands from 28px above (700ms), the old one recedes (700ms), the mark wipes in from the left (600ms, 450ms delay) and the chip fades up (400ms, 550ms delay), all on cubic-bezier(0.2, 0.8, 0.2, 1); reduced motion removes all of it. Themed entirely through `--ca-*` variables; its shipped defaults are a light theme, and the After panel overrides them to the Product skin.

### Timeline scrubber
Mono 0.78rem in Playground Mute with the live date in Playground Ink. A 3px track filled in Playground Ink up to the thumb, Playground Track beyond; an 18px ink thumb ringed by the screen colour; the change date marked above the track by a Playground Blue label and 1px tick; start and end dates beneath. It autoplays once (2.6s, ease-out cubic) when the panel is 55% in view; any drag takes over; under reduced motion it starts at the end date.

## Do's and Don'ts

### Do:
- **Do** set every structural label as a paper run-in: small-caps "Abstract.", bold "Fig. n.", numbered section heads, bracketed reference numbers.
- **Do** keep prose at the 38rem measure and let the figure break out to 58rem.
- **Do** group with booktabs rules (1.5px ink top and bottom, 1px under heads) instead of boxes.
- **Do** prove a fix as a pair: the real screen tagged Before, the working fix tagged After, side by side at 861px and up, stacked below.
- **Do** keep a superseded answer on screen beneath the new one, with its end date.
- **Do** mark evidence with the highlighter and key it to the caption with lettered discs.
- **Do** set the product panel in the product's own colours, and keep it the only dark surface.
- **Do** play explanatory motion once on view, hand control to the reader, and show the end state immediately under reduced motion.

### Don't:
- **Don't** use shadows of any kind; depth is rules and stacking.
- **Don't** put a sentence in mono or a measured value in serif.
- **Don't** use blue, yellow or the before gray decoratively; each has one meaning.
- **Don't** use red anywhere, including the "broken" state; evidence is yellow.
- **Don't** round paper surfaces (tables, listings); radius is for controls, tags and product reproductions.
- **Don't** upscale rasters past their native size.
- **Don't** add ambient or looping motion.
