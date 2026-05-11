# Claude Instructions — Bhanu's Portfolio

## ⚠️ CRITICAL — Read This First, Every Session

**All edits MUST go to the worktree, not the main Portfolio folder.**

The live server at `http://localhost:8080` serves files from this exact path:
```
/Users/bhanu/Desktop/Portfolio/.claude/worktrees/reverent-faraday-a80749/
```

**Always edit these worktree files:**
- `/Users/bhanu/Desktop/Portfolio/.claude/worktrees/reverent-faraday-a80749/index.html`
- `/Users/bhanu/Desktop/Portfolio/.claude/worktrees/reverent-faraday-a80749/evertutor-live.html`
- `/Users/bhanu/Desktop/Portfolio/.claude/worktrees/reverent-faraday-a80749/stressie-studio.html`

**Never edit** `/Users/bhanu/Desktop/Portfolio/index.html` (the main file) — changes there will NOT appear on localhost:8080.

Before touching any file, confirm you are reading/writing the worktree path above.

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

A single-file static portfolio. All HTML + CSS + JS lives in one file. Changes are live at `http://localhost:8080` (served from the worktree above).

Key files (all under the worktree path):
- `index.html` — the homepage (primary file)
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

## When in Doubt

Ask. Never assume a deletion or rewrite is safe. The user would rather be asked an extra question than lose hours of work.
