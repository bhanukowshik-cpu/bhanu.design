# Voice Orb

An original, production-quality audio-reactive voice orb built with **React + TypeScript + OGL + WebGL2 + GLSL**. Inspired by the rendering *principles* documented in the reverse-engineering package under [`reference/orb-handoff/`](../../../reference/orb-handoff) — not a copy of any third-party shader.

The orb is a single fullscreen-triangle fragment shader (no 3D mesh). All volume, motion, and color are assembled per-pixel from UV coordinates.

## Quick start

```tsx
import { VoiceOrb } from '@/components/voice-orb';

<VoiceOrb state="idle" size={280} />

// react to a microphone
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
<VoiceOrb state="user-speaking" audioSource={stream} />

// deterministic, mic-free demo
<VoiceOrb state="assistant-speaking" simulate="assistant" />

// tune live
<VoiceOrb state="idle" debug />
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `state` | `VoiceOrbState` | `'idle'` | `idle · listening · user-speaking · assistant-speaking · connecting · error` |
| `audioSource` | `MediaStream · HTMLAudioElement · AudioNode · null` | `null` | Analyzed via Web Audio |
| `simulate` | `'user' · 'assistant' · null` | `null` | Deterministic synthetic audio; overrides `audioSource` |
| `size` | `number` | `256` | Square, CSS px |
| `paused` | `boolean` | `false` | Stops the render loop |
| `debug` | `boolean` | `false` | Shows the live tuning panel (dev aid) |
| `palette` | `Partial<OrbPalette>` | `obsidian` | One of 4 premium `PALETTES` (obsidian/sapphire/champagne/emerald); regenerates the gradient |
| `maxDpr` | `number` | `2` | devicePixelRatio cap |
| `audioParams` | `Partial<AudioParams>` | — | Analyzer tuning (bands, attack/release, floor) |
| `onFrame` | `(t: OrbTelemetry) => void` | — | Per-frame telemetry (fps, audio, state) |

## Architecture

```
VoiceOrb.tsx          orchestration; owns refs; renders container + debug panel
├─ useOrbRenderer.ts  OGL renderer, program, fullscreen triangle, RAF loop,
│                     DPR/resize, visibility+intersection pause, disposal
│  └─ fluidSimulation.ts   ping-pong half-float curl-noise fluid pass
├─ useAudioAnalysis.ts     Web Audio → 3 audio vec4s (or synthetic)
├─ DebugPanel.tsx          dev-only live tuning (portalled)
├─ orbConfig.ts            defaults, palette, per-state presets
├─ lib/
│  ├─ gradientTexture.ts   CPU-generated iridescent gradient (zero-asset)
│  └─ composeShader.ts     inlines the shared noise lib into a shader
└─ shaders/
   ├─ orb.vert.glsl        passthrough
   ├─ orb.frag.glsl        the orb material
   ├─ fluid.frag.glsl      the fluid step
   └─ noise.glsl           shared simplex + value-noise FBM
```

### Render pipeline (per frame)

1. `fluidSimulation` steps the ping-pong field (curl-noise flow, advection, dissipation, audio force) into a half-float RT.
2. `orb.frag` composites, in order: **sphere projection → FBM domain warp → simplex displacement → fluid displacement → gradient sample → ring/highlight → fluid-color hard-light → grade (saturation/contrast/exposure + grain) → soft radial alpha mask → premultiply.**

The perceived volume comes from two coupled tricks: the spherical UV remap (magnifies the texture center, compresses toward the rim) and weighting the fold displacement by `normals.xy` (→ 0 at center, growing outward) so folds wrap over a curved surface. Displacement is damped near the silhouette so the outline stays stable and never samples the gradient's dark edge.

### Audio mapping

The analyzer produces three vec4s the shader consumes (layout mirrors the reference's usage):

- `average = (rms, low, mid, high)` — smoothed band energy; **mids** drive fold/jitter, **lows** drive fluid force, **highs** drive highlight detail.
- `input = (rawAmp, transient, flux, confidence)` — gates the ring highlight.
- `cumulative` — monotonic phase accumulators for slow drift (fbm/noise/ring), giving the field memory across phrases.

Smoothing is frame-rate independent (`1 - e^(-dt/τ)`) with separate attack/release; a noise floor + dead-zone stops ambient hiss from exciting the orb.

### States

States move interpolated parameter *targets* (crossfade τ ≈ 0.22 s) — the renderer is never rebuilt. Presets live in `orbConfig.ts`. When `debug` is on, presets are bypassed so panel sliders give direct control.

## Performance & lifecycle

- No React re-render per frame — everything per-frame flows through refs.
- DPR capped (default 2); fluid runs at 128².
- Pauses on hidden tab (`visibilitychange`) and off-screen (`IntersectionObserver`).
- `prefers-reduced-motion` lowers time scale and displacement amplitude.
- Full teardown: RAF, observers, listeners, program, geometry, textures, both fluid FBOs, canvas removal, and `WEBGL_lose_context`.
- Graceful fallbacks: CSS orb if WebGL2 is unavailable; no fluid pass if float render targets are unavailable.

## Relationship to the reference package

This is an original implementation of the *sequence and principles* in `reference/orb-handoff/`. Deliberate improvements over the reference shader:

- A real **soft alpha mask** (the reference hard-codes `s = 1.0` and relies on a dark page for its silhouette) → genuine transparency on any background.
- The gradient is **generated procedurally** (the original texture asset was not supplied) and is a config value.
- The fluid pass is an original lightweight **curl-noise-forced** sim (the original fluid code was not supplied).
- Frame-rate-independent smoothing and ordered dither for banding.

Simplex noise is the standard public-domain Gustavson/Ashima construction.
