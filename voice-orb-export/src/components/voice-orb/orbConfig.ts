import type {
  AudioFrame,
  AudioParams,
  OrbPalette,
  OrbParams,
  VoiceOrbState,
} from './VoiceOrb.types';

/**
 * Premium palettes. Deliberately low-saturation, deep-based, with a light
 * "sheen" colour rather than a saturated accent — that restraint is what reads
 * as premium vs. glowing candy. Swap via the `palette` prop; the gradient
 * texture is regenerated from these stops.
 *
 * Stop roles: `core` = base body tone, `mid` = mid transition, `outer` = the
 * light/sheen colour (rim light + highlights), `edge` = near-black falloff,
 * `fluid` = luminous streak colour, `iridescence` = subtle pearlescent sheen.
 */
export type PaletteName = 'aurora' | 'ember' | 'nebula' | 'arctic';

export const PALETTES: Record<PaletteName, OrbPalette> = {
  // Deep teal → emerald → mint. Cool, oceanic, alive.
  aurora: {
    core: [0.02, 0.1, 0.1],
    mid: [0.05, 0.33, 0.28],
    outer: [0.36, 0.8, 0.62],
    edge: [0.008, 0.028, 0.026],
    background: [0.012, 0.03, 0.028],
    fluid: [0.62, 1.0, 0.85],
    iridescence: 0.08,
  },
  // Crimson → orange → gold. Warm molten glow.
  ember: {
    core: [0.13, 0.035, 0.02],
    mid: [0.45, 0.16, 0.05],
    outer: [0.93, 0.56, 0.22],
    edge: [0.03, 0.012, 0.007],
    background: [0.03, 0.015, 0.01],
    fluid: [1.0, 0.78, 0.42],
    iridescence: 0.07,
  },
  // Indigo → violet → orchid. Electric, jewel-toned.
  nebula: {
    core: [0.06, 0.03, 0.14],
    mid: [0.29, 0.12, 0.49],
    outer: [0.74, 0.44, 0.93],
    edge: [0.02, 0.012, 0.04],
    background: [0.02, 0.014, 0.04],
    fluid: [0.86, 0.62, 1.0],
    iridescence: 0.1,
  },
  // Deep blue → cyan → ice white. Crisp and premium.
  arctic: {
    core: [0.02, 0.08, 0.16],
    mid: [0.05, 0.3, 0.52],
    outer: [0.56, 0.83, 0.96],
    edge: [0.008, 0.02, 0.04],
    background: [0.01, 0.022, 0.042],
    fluid: [0.72, 0.95, 1.0],
    iridescence: 0.09,
  },
};

/** Default palette — the crisp, cool "arctic" read. */
export const DEFAULT_PALETTE: OrbPalette = PALETTES.arctic;

/**
 * Baseline shader parameters. The reverse-engineering package captured these as
 * "starting points only" (observed-values.json). Treated as tunable defaults,
 * not targets.
 */
export const DEFAULT_PARAMS: OrbParams = {
  // Bhanu's tuned baseline v3 (panel "copy config", 2026-07-26) — small core
  // under heavy FBM churn, mask pulled in to 0.925 to crop the dark rim that
  // showed on white surfaces.
  sphereScale: 0.4,
  spherePower: 0.58,

  fbmScale: 2.6,
  fbmPower: 1.9,
  fbmAmplitude: 0.66,
  fbmSpeed: 4.05,

  noiseScale: 0.1,
  noiseAmplitude: 0.0,
  noiseSpeed: 1.75,

  fluidForce: 0.44,
  fluidDissipation: 0.8,
  fluidDisplacement: 0.94,
  fluidColorOpacity: 0.0,

  ringColorOpacity: 0.65,

  exposure: 0.55,
  contrast: 0.07,
  saturation: 1.18,
  grainOpacity: 0.0,

  maskRadius: 0.925,
  maskSoftness: 0.05,

  driftSpeed: 0.0,

  // State-driven behaviours. The calm rotating ring is the resting look, so
  // idleRingSpin lives at 1 in the baseline (visible in the tuner too, where
  // state presets are bypassed); active states explicitly dial it back down.
  innerLightShift: 0.0,
  idleRingSpin: 1.0,

  alpha: 1.0,
};

export const DEFAULT_AUDIO_PARAMS: AudioParams = {
  attack: 0.06, // ~60 ms rise
  release: 0.32, // ~320 ms fall
  noiseFloor: 0.04,
  gain: 1.4,
  fftSize: 1024,
  low: [80, 250],
  mid: [250, 2000],
  high: [2000, 8000],
};

/**
 * Per-state parameter overrides. States never rebuild the renderer — they only
 * move these targets, which the render loop interpolates toward. Keep ranges
 * narrow: restraint beats amplitude.
 */
export const STATE_PRESETS: Record<VoiceOrbState, Partial<OrbParams>> = {
  // Calm rest — the self-animating ring is the only motion. `idleRingSpin`
  // slows its rotation and guarantees it stays visible without any audio.
  idle: {
    ringColorOpacity: 0.55,
    exposure: 0.62,
    driftSpeed: 0.08,
    idleRingSpin: 1.0,
  },
  // Listening — the inner light slowly cycles hue to signal "I'm hearing you".
  listening: {
    ringColorOpacity: 0.5,
    exposure: 0.72,
    driftSpeed: 0.11,
    innerLightShift: 1.0,
    idleRingSpin: 0.0,
  },
  // A little FBM + fluid reintroduced so speech visibly moves the surface.
  'user-speaking': {
    fbmAmplitude: 0.16,
    noiseAmplitude: 0.2,
    fluidDisplacement: 0.45,
    ringColorOpacity: 0.72,
    exposure: 0.8,
    driftSpeed: 0.16,
    idleRingSpin: 0.0,
  },
  'assistant-speaking': {
    fbmAmplitude: 0.12,
    noiseAmplitude: 0.16, // less noisy than user speech — smoother, deliberate
    fluidDisplacement: 0.35,
    ringColorOpacity: 0.85, // more luminous highlights
    exposure: 0.82,
    driftSpeed: 0.13,
    idleRingSpin: 0.0,
  },
  // Waiting — a faster autonomous drift plus a slow ring keep it feeling alive.
  connecting: {
    ringColorOpacity: 0.5,
    exposure: 0.6,
    driftSpeed: 0.22,
    idleRingSpin: 0.7,
  },
  error: {
    ringColorOpacity: 0.16,
    exposure: 0.38,
    saturation: 0.7, // desaturated, subdued
    driftSpeed: 0.04,
    idleRingSpin: 0.0,
  },
};

/** Crossfade time constant (seconds) for state parameter interpolation. */
export const STATE_CROSSFADE_TAU = 0.22; // ~0.5s to settle

export function createEmptyAudioFrame(): AudioFrame {
  return {
    average: [0, 0, 0, 0],
    input: [0, 0, 0, 0],
    cumulative: [0, 0, 0, 0],
  };
}

export function resolvePalette(override?: Partial<OrbPalette>): OrbPalette {
  return { ...DEFAULT_PALETTE, ...override };
}

/** A stable string key for a palette, used to trigger gradient regeneration. */
export function paletteKey(p: OrbPalette): string {
  return [p.core, p.mid, p.outer, p.edge, p.fluid, p.iridescence].flat().join(',');
}
