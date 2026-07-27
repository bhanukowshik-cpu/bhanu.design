# Claude Instructions — Bhanu's Portfolio

## ⚠️ CRITICAL — Read This First, Every Session

The live server at `http://localhost:8080` serves files from the **main repo folder**.

### On Mac (`/Users/bhanu/Desktop/Portfolio`)

**Edit these files directly:**
- `/Users/bhanu/Desktop/Portfolio/index.html`
- `/Users/bhanu/Desktop/Portfolio/evertutor-live.html`
- `/Users/bhanu/Desktop/Portfolio/stressie-studio.html`

The worktree at `.claude/worktrees/reverent-faraday-a80749/` is no longer the active server root — **do not edit worktree files**.

### On Windows (or any new machine)

Clone the repo and edit the main files directly:

```
git clone https://github.com/bhanukowshik-cpu/bhanu.design.git
cd bhanu.design
python -m http.server 8080
```

**Edit these files directly:**
- `index.html`
- `evertutor-live.html`
- `stressie-studio.html`

**Before starting on any machine:** confirm which folder the server is running from (`lsof -p <PID> | grep cwd` on Mac, or check your terminal's working directory). Edit only files in that folder.

---

## The Golden Rule
**Never rewrite a file from scratch.** Always make surgical edits. If you feel the urge to use the Write tool on an existing file, stop and ask first.

---

## File Editing Rules

- **Use Edit tool only** for all existing files — especially `index.html`, `evertutor-live.html`, `stressie-studio.html`, and any case study pages
- **Never use Write tool** on a file that already exists
- **Never delete an entire section** of HTML, CSS, or JS without showing exactly what will be removed and getting explicit confirmation
- **Never remove more than 15 lines at once** without asking first
- If making a large structural change, show a before/after summary and wait for approval

---

## Before Any Session

Always confirm the current state of the file before making changes. Read the relevant section first, then edit only what's needed.

---

## Git Rules

- **Commit often** — after every meaningful set of changes, commit with a clear message
- **Never force push**
- **Never reset --hard** without explicit instruction from the user
- Never amend commits — always create new ones

---

## What This Project Is

A single-file static portfolio. All HTML + CSS + JS lives in one file. Changes are live at `http://localhost:8080` (served from the repo root).

Key files (all in the repo root):
- `index.html` — the homepage (primary file; this IS the v6 redesign — renamed from hero-lab.html on 27 Jul 2026)
- `evertutor-live.html` — EverTutor case study
- `evertutor-studio.html` — EverTutor Studio case study
- `stressie-studio.html` — Stressie case study

---

## Design Tokens (never change without being asked)

```
--primary:      #E6F28D
--secondary:    #252525
--bg:           #FFFCF8
--font-heading: 'Montserrat', sans-serif
--font-mono:    'JetBrains Mono', monospace
```

---

## Layout — Master Frame Rule

The `.card` (master frame) always floats centered over the dotted mesh background. Padding is set on `.page` using percentages so the mesh is always visible on both sides.

| Breakpoint | `.page` horizontal padding | Card width |
|---|---|---|
| Desktop ≥ 1024px | `10%` each side | 80% of viewport |
| iPad / tablet ≤ 1023px | `10%` each side | 80% of viewport |
| Mobile ≤ 767px | `5%` each side | 90% of viewport |

**Never change these to fixed pixel values on desktop/tablet.** The percentage ensures the mesh is always visible regardless of screen size (e.g. 1920px → 192px each side, 1440px → 144px each side).

---

## When in Doubt

Ask. Never assume a deletion or rewrite is safe. The user would rather be asked an extra question than lose hours of work.
