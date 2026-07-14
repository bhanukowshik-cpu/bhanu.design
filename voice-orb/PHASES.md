# Voice Orb — Phase Plan

Adaptation of the "Premium AI Voice Orb" implementation brief for this
portfolio. The brief specifies React + React Three Fiber; this site is a
single-file static page, so the orb is built with **vanilla Three.js +
custom GLSL** (`voice-orb/orb.js`, lazy-loaded ES module) — the same visual
spec: procedural vertex displacement, Fresnel glass shell, emissive energy
core, layered non-looping motion, four smoothly-interpolated states.

## Phase 1 — Orb + voice loop foundation ✅ (this commit)

- WebGL orb: liquid-glass shell (simplex-noise displacement, Fresnel rim,
  travelling highlight), additive energy core, internal particles, halo
  glow (bloom substitute — no postprocessing dependency).
- Four states — idle / listening / thinking / speaking — exponentially
  smoothed, never hard-cut. Mic amplitude drives listening deformation via
  Web Audio AnalyserNode.
- "Speak with me" entry points: rotating mini-sphere button in the landing
  ask bar and in the chat panel dock. Opens the chat panel in voice mode
  (orb view replaces the message list; keyboard button returns to text).
- Conversation loop: tap orb → record → Whisper STT (existing proxy) →
  Claude reply (existing streaming engine) → **browser speechSynthesis**
  reads the answer while the orb speaks (syllable pulses from utterance
  boundary events). Tap to interrupt.
- The full transcript still accrues in the text chat — switching back to
  keyboard shows everything said by voice.

Known Phase-1 placeholders:
- speechSynthesis voice quality is OS-dependent (placeholder until Phase 2).
- Speaking amplitude is event-driven (word boundaries), not true audio FFT.

## Phase 2 — Premium TTS pipeline

- Add `/api/tts` to `proxy.py` (local) and `api/tts.js` (Vercel) backed by
  a premium voice API (OpenAI `gpt-4o-mini-tts` or ElevenLabs; ideally a
  cloned voice so it *is* Bhanu speaking).
- Stream sentence-chunked audio; play through Web Audio so the orb's
  speaking state is driven by real FFT amplitude (uBass/uTreble split).
- Barge-in: tapping the orb (or speaking, via lightweight VAD) ducks and
  cancels playback.

## Phase 3 — Realtime + polish

- Evaluate a realtime speech-to-speech API for sub-second turnaround.
- Auto-stop recording on silence (VAD) instead of tap-to-stop.
- Mini-orb replaces the rainbow FAB on middle sections; entrance morph
  from FAB → panel orb.
- Mobile voice mode layout + battery-aware quality scaling; postprocessing
  bloom pass if perf budget allows (60fps target).
