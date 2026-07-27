/**
 * Public + internal types for the voice orb.
 *
 * The orb is a fullscreen-quad WebGL2 shader (no 3D mesh). Its behaviour is
 * driven by three groups of values:
 *   1. `OrbParams`  — tunable shader parameters (sphere, FBM, noise, fluid, grade…)
 *   2. `OrbPalette` — the colour identity, baked into a gradient texture
 *   3. `AudioFrame` — smoothed, per-frame audio energy fed to the shader
 *
 * Everything that changes per-frame flows through refs, never React state, so
 * the render loop never triggers a re-render.
 */

export type VoiceOrbState =
  | 'idle'
  | 'listening'
  | 'user-speaking'
  | 'assistant-speaking'
  | 'connecting'
  | 'error';

export type RGB = [number, number, number];
export type Vec4 = [number, number, number, number];

/** Colour stops for the procedurally generated gradient texture. */
export interface OrbPalette {
  /** Centre of the sphere (the pole facing the viewer). */
  core: RGB;
  /** Mid radius. */
  mid: RGB;
  /** Outer radius, before it falls to the edge colour. */
  outer: RGB;
  /** Rim colour (usually near-black so the sphere reads volumetric). */
  edge: RGB;
  /** Page-facing background reference (used by the demo, not the shader). */
  background: RGB;
  /** Colour of the luminous fluid streaks (hard-light blended). */
  fluid: RGB;
  /** Strength of angular iridescence in the gradient [0..1]. */
  iridescence: number;
}

/**
 * Tunable shader parameters. Values are seeded from the reverse-engineering
 * package's observed baseline (`reference/orb-handoff/extracted/observed-values.json`)
 * and are all live-editable through the debug panel.
 */
export interface OrbParams {
  // Spherical projection
  sphereScale: number;
  spherePower: number;

  // FBM domain warp
  fbmScale: number;
  fbmPower: number;
  fbmAmplitude: number;
  fbmSpeed: number;

  // Secondary simplex displacement
  noiseScale: number;
  noiseAmplitude: number;
  noiseSpeed: number;

  // Fluid / displacement pass
  fluidForce: number; // audio force injected into the sim
  fluidDissipation: number; // 0..1 per-frame velocity retention
  fluidDisplacement: number; // how much the fluid field warps the gradient UV
  fluidColorOpacity: number; // hard-light streak strength

  // Ring / highlight
  ringColorOpacity: number;

  // Colour grade
  exposure: number;
  contrast: number;
  saturation: number;
  grainOpacity: number;

  // Silhouette mask (our addition — genuine transparency on any background)
  maskRadius: number;
  maskSoftness: number;

  // Slow autonomous drift (independent of audio)
  driftSpeed: number;

  // State-driven behaviours (0..1 blends moved by STATE_PRESETS, not audio)
  innerLightShift: number; // listening: inner light slowly cycles hue
  idleRingSpin: number; // idle: guaranteed slow-rotating ring highlight

  // Global
  alpha: number;
}

/** Audio-analysis tuning. */
export interface AudioParams {
  attack: number; // seconds — rise time constant
  release: number; // seconds — fall time constant
  noiseFloor: number; // normalized energy below which we treat as silence
  gain: number; // input gain applied before smoothing
  fftSize: number; // AnalyserNode fftSize (power of two)
  low: [number, number]; // Hz band edges
  mid: [number, number];
  high: [number, number];
}

/**
 * One frame of smoothed audio, laid out to match how the reference shader
 * consumes its three audio vec4 uniforms.
 *
 *  average    = (rms, low, mid, high)          — smoothed band energy
 *  input      = (rawAmp, transient, flux, confidence)
 *  cumulative = integrated energy for slow drift (x: fbm, z: noise, w: ring)
 */
export interface AudioFrame {
  average: Vec4;
  input: Vec4;
  cumulative: Vec4;
}

export interface VoiceOrbProps {
  /** Visual/behavioural state. */
  state?: VoiceOrbState;
  /** Audio source to react to. */
  audioSource?: MediaStream | HTMLAudioElement | AudioNode | null;
  /** Square size in CSS pixels. */
  size?: number;
  className?: string;
  /** Pause the render loop entirely. */
  paused?: boolean;
  /** Show the development tuning panel. */
  debug?: boolean;
  /** Palette override (merged over the default iridescent-dark palette). */
  palette?: Partial<OrbPalette>;
  /**
   * Seed for the tunable shader params (merged over DEFAULT_PARAMS). Read once
   * at mount — pass a fresh `key` to re-seed. The debug panel keeps mutating
   * the same object afterwards.
   */
  params?: Partial<OrbParams>;
  /** devicePixelRatio cap (default 2). */
  maxDpr?: number;
  /**
   * Deterministic synthetic audio for demos/testing — drives the orb without a
   * microphone or media source. Overrides `audioSource` when set.
   */
  simulate?: 'user' | 'assistant' | null;
  /** Audio-analysis tuning overrides. */
  audioParams?: Partial<AudioParams>;
  /**
   * External frequency-bytes provider (e.g. a conversational SDK such as
   * ElevenLabs). Called every frame; when it returns a non-empty Uint8Array of
   * byte magnitudes (0–255, roughly 0–8 kHz), those drive the orb's reaction,
   * overriding `audioSource`. Return `null` for silence/disconnected.
   */
  getFrequencyData?: () => Uint8Array | null;
  /** Called once per rendered frame with live telemetry (for the debug panel). */
  onFrame?: (telemetry: OrbTelemetry) => void;
}

/** Live per-frame telemetry surfaced for the debug panel. */
export interface OrbTelemetry {
  fps: number;
  audio: AudioFrame;
  state: VoiceOrbState;
}
