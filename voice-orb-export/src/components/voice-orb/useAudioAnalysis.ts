import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { createEmptyAudioFrame, DEFAULT_AUDIO_PARAMS } from './orbConfig';
import type { AudioFrame, AudioParams } from './VoiceOrb.types';

/**
 * Web Audio analysis → the three audio vec4s the shader consumes.
 *
 *   average    = (rms, low, mid, high)          smoothed band energy
 *   input      = (rawAmp, transient, flux, confidence)
 *   cumulative = (fbmDrift, -, noiseDrift, ringDrift) monotonic phase accumulators
 *
 * Design notes:
 *  - Everything is written into refs and mutated in place — zero React renders.
 *  - Attack/release smoothing is frame-rate independent (1 - e^(-dt/τ)).
 *  - A noise floor with a dead-zone stops ambient hiss from exciting the orb.
 *  - Cumulative channels only advance (never reverse) so drift is monotonic;
 *    they hold when silent, giving the field memory across phrases.
 *  - `simulate` synthesises a deterministic speech-like envelope so the orb can
 *    be driven without a microphone.
 */

// A single shared AudioContext for element/stream sources. Media-element source
// nodes can be created only once per element, so the mapping must be stable
// across mounts (incl. StrictMode's double-invoke).
let sharedCtx: AudioContext | null = null;
const elementSourceCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

function getSharedContext(): AudioContext {
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

interface Targets {
  rms: number;
  low: number;
  mid: number;
  high: number;
  rawAmp: number;
  transient: number;
  flux: number;
}

const ZERO_TARGETS: Targets = { rms: 0, low: 0, mid: 0, high: 0, rawAmp: 0, transient: 0, flux: 0 };

/** Deterministic pseudo-speech envelope (function of a reset-on-start clock). */
function synthTargets(t: number, mode: 'user' | 'assistant'): Targets {
  const assistant = mode === 'assistant';
  const cycle = assistant ? 3.2 : 2.4;
  const phase = (t % cycle) / cycle;
  const phrase =
    smoothstep(0.0, 0.12, phase) * (1 - smoothstep(assistant ? 0.82 : 0.68, 0.99, phase));
  const syl =
    (0.55 + 0.45 * Math.sin(t * (assistant ? 9 : 13) + 1.0)) *
    (0.6 + 0.4 * Math.sin(t * (assistant ? 6 : 19) + 0.3));
  const env = Math.max(0, phrase) * Math.max(0, syl);
  const transient = Math.min(1, Math.max(0, syl - 0.62) * (assistant ? 0.5 : 1.0));
  const high = env * (assistant ? 0.3 : 0.6) * (0.5 + 0.5 * Math.sin(t * 23));
  return {
    rms: env * (assistant ? 0.7 : 0.82),
    low: env * (0.6 + 0.4 * Math.sin(t * 1.7)) * (assistant ? 0.85 : 0.6),
    mid: env * (assistant ? 0.85 : 0.92),
    high,
    rawAmp: env * (assistant ? 0.7 : 0.82),
    transient,
    flux: Math.min(1, high * 0.5 + transient * 0.3),
  };
}

export interface UseAudioAnalysisOptions {
  source?: MediaStream | HTMLAudioElement | AudioNode | null;
  simulate?: 'user' | 'assistant' | null;
  paused?: boolean;
  /** One-shot params (merged over defaults). Ignored if `paramsRef` is given. */
  params?: Partial<AudioParams>;
  /** Live params ref (e.g. mutated by the debug panel); read every tick. */
  paramsRef?: RefObject<AudioParams>;
  /**
   * External byte-frequency provider (e.g. the ElevenLabs SDK). When present and
   * returning a non-empty Uint8Array, it supplies the raw spectrum each tick,
   * bypassing the internal analyser/`source`. `simulate` still wins if set.
   */
  getFrequencyData?: () => Uint8Array | null;
}

export interface UseAudioAnalysisResult {
  /** Smoothed audio frame the shader consumes (mutated in place each tick). */
  audioRef: RefObject<AudioFrame>;
  /** Pre-smoothing meters for the debug panel (mutated in place). */
  metersRef: RefObject<AudioFrame>;
}

interface AnalyserBundle {
  analyser: AnalyserNode;
  freq: Uint8Array<ArrayBuffer>;
  time: Uint8Array<ArrayBuffer>;
  binHz: number;
  cleanup: () => void;
}

export function useAudioAnalysis(opts: UseAudioAnalysisOptions): UseAudioAnalysisResult {
  const audioRef = useRef<AudioFrame>(createEmptyAudioFrame());
  const metersRef = useRef<AudioFrame>(createEmptyAudioFrame());

  // Prefer a caller-owned live ref (debug panel mutates it); otherwise track the
  // one-shot `params` prop.
  const localParamsRef = useRef<AudioParams>({ ...DEFAULT_AUDIO_PARAMS, ...opts.params });
  if (!opts.paramsRef) localParamsRef.current = { ...DEFAULT_AUDIO_PARAMS, ...opts.params };
  const paramsRef = opts.paramsRef ?? localParamsRef;

  const pausedRef = useRef(!!opts.paused);
  pausedRef.current = !!opts.paused;

  const simulateRef = useRef(opts.simulate ?? null);
  const analyserBundleRef = useRef<AnalyserBundle | null>(null);

  // External spectrum provider (e.g. ElevenLabs). Kept in a ref so the single
  // analysis loop (mounted once) always sees the latest closure.
  const getFrequencyDataRef = useRef(opts.getFrequencyData ?? null);
  getFrequencyDataRef.current = opts.getFrequencyData ?? null;

  // Reset the deterministic sim clock whenever the sim mode changes.
  const simTimeRef = useRef(0);
  useEffect(() => {
    if (opts.simulate !== simulateRef.current) simTimeRef.current = 0;
    simulateRef.current = opts.simulate ?? null;
  }, [opts.simulate]);

  // --- Analyser setup (rebuilds when the source changes) --------------------
  useEffect(() => {
    const source = opts.source ?? null;
    if (!source) {
      analyserBundleRef.current = null;
      return;
    }

    let ctx: AudioContext;
    let sourceNode: AudioNode;
    let connectToDestination = false;

    if (source instanceof AudioNode) {
      ctx = source.context as AudioContext;
      sourceNode = source;
    } else {
      ctx = getSharedContext();
      if (source instanceof MediaStream) {
        sourceNode = ctx.createMediaStreamSource(source);
      } else {
        let node = elementSourceCache.get(source);
        if (!node) {
          node = ctx.createMediaElementSource(source);
          elementSourceCache.set(source, node);
        }
        sourceNode = node;
        connectToDestination = true; // keep the element audible
      }
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = paramsRef.current.fftSize;
    analyser.smoothingTimeConstant = 0.5;
    sourceNode.connect(analyser);
    if (connectToDestination) analyser.connect(ctx.destination);
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

    analyserBundleRef.current = {
      analyser,
      freq: new Uint8Array(analyser.frequencyBinCount),
      time: new Uint8Array(analyser.fftSize),
      binHz: ctx.sampleRate / analyser.fftSize,
      cleanup: () => {
        try {
          sourceNode.disconnect(analyser);
        } catch {
          /* already gone */
        }
        try {
          analyser.disconnect();
        } catch {
          /* already gone */
        }
      },
    };

    return () => {
      analyserBundleRef.current?.cleanup();
      analyserBundleRef.current = null;
    };
  }, [opts.source]);

  // --- Single analysis loop (mounted once) ----------------------------------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const prevFreq = new Float32Array(4096);
    let prevRms = 0;
    let sRms = 0;
    let sLow = 0;
    let sMid = 0;
    let sHigh = 0;
    let sConf = 0;
    let cumFbm = 0;
    let cumNoise = 0;
    let cumRing = 0;

    const bandAvg = (freq: Uint8Array, binHz: number, a: number, b: number): number => {
      const i0 = Math.max(0, Math.floor(a / binHz));
      const i1 = Math.min(freq.length - 1, Math.ceil(b / binHz));
      if (i1 < i0) return 0;
      let sum = 0;
      for (let i = i0; i <= i1; i++) sum += freq[i];
      return sum / (i1 - i0 + 1) / 255;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (pausedRef.current) return;

      const P = paramsRef.current;
      const sim = simulateRef.current;
      const bundle = analyserBundleRef.current;

      // 1) Raw targets from sim, external spectrum, analyser, or silence.
      let raw: Targets;
      const extFreq = simulateRef.current ? null : getFrequencyDataRef.current?.() ?? null;
      if (sim) {
        simTimeRef.current += dt;
        raw = synthTargets(simTimeRef.current, sim);
      } else if (extFreq && extFreq.length) {
        // Byte spectrum from an external SDK (no time-domain data available).
        // The SDK focuses its bins on the ~0–8 kHz voice range, so approximate
        // a per-bin Hz width from the array length and reuse the band splitter.
        const N = extFreq.length;
        const binHz = 8000 / N;
        let sum = 0;
        let flux = 0;
        for (let i = 0; i < N; i++) {
          const f = extFreq[i] / 255;
          sum += f;
          const d = f - prevFreq[i];
          if (d > 0) flux += d;
          prevFreq[i] = f;
        }
        const amp = sum / N;
        const transient = Math.min(1, Math.max(0, amp - prevRms) * 6);
        prevRms = amp;
        raw = {
          rms: amp,
          low: bandAvg(extFreq, binHz, P.low[0], P.low[1]),
          mid: bandAvg(extFreq, binHz, P.mid[0], P.mid[1]),
          high: bandAvg(extFreq, binHz, P.high[0], P.high[1]),
          rawAmp: amp,
          transient,
          flux: Math.min(1, flux / (N * 0.1)),
        };
      } else if (bundle) {
        const { analyser, freq, time, binHz } = bundle;
        analyser.getByteFrequencyData(freq);
        analyser.getByteTimeDomainData(time);

        let sumSq = 0;
        for (let i = 0; i < time.length; i++) {
          const v = (time[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / time.length);

        let flux = 0;
        for (let i = 0; i < freq.length; i++) {
          const f = freq[i] / 255;
          const d = f - prevFreq[i];
          if (d > 0) flux += d;
          prevFreq[i] = f;
        }
        const transient = Math.min(1, Math.max(0, rms - prevRms) * 6);
        prevRms = rms;

        raw = {
          rms,
          low: bandAvg(freq, binHz, P.low[0], P.low[1]),
          mid: bandAvg(freq, binHz, P.mid[0], P.mid[1]),
          high: bandAvg(freq, binHz, P.high[0], P.high[1]),
          rawAmp: rms,
          transient,
          flux: Math.min(1, flux / (freq.length * 0.1)),
        };
      } else {
        raw = ZERO_TARGETS;
      }

      // 2) Noise floor dead-zone + gain (skip for sim, already normalized).
      const floor = P.noiseFloor;
      const g = P.gain;
      const dz = (x: number) => (sim ? x : Math.min(1, (Math.max(0, x - floor) / (1 - floor)) * g));
      const tRms = dz(raw.rms);
      const tLow = dz(raw.low);
      const tMid = dz(raw.mid);
      const tHigh = dz(raw.high);

      // 3) Frame-rate independent attack/release smoothing.
      const smooth = (cur: number, tgt: number) => {
        const tau = tgt > cur ? P.attack : P.release;
        return cur + (tgt - cur) * (1 - Math.exp(-dt / tau));
      };
      sRms = smooth(sRms, tRms);
      sLow = smooth(sLow, tLow);
      sMid = smooth(sMid, tMid);
      sHigh = smooth(sHigh, tHigh);
      sConf = smooth(sConf, tRms > 0.02 ? 1 : 0);

      // 4) Monotonic cumulative drift — advances with energy, holds in silence.
      const energy = (sLow + sMid + sHigh) / 3;
      if (energy > 0.01) {
        cumFbm += energy * dt * 0.7;
        cumNoise += energy * dt * 0.9;
        cumRing += energy * dt * 0.5;
      }

      // 5) Publish.
      const f = audioRef.current;
      f.average[0] = sRms;
      f.average[1] = sLow;
      f.average[2] = sMid;
      f.average[3] = sHigh;
      f.input[0] = raw.rawAmp;
      f.input[1] = raw.transient;
      f.input[2] = raw.flux;
      f.input[3] = sConf;
      f.cumulative[0] = cumFbm;
      f.cumulative[1] = 0;
      f.cumulative[2] = cumNoise;
      f.cumulative[3] = cumRing;

      const m = metersRef.current;
      m.average[0] = raw.rms;
      m.average[1] = raw.low;
      m.average[2] = raw.mid;
      m.average[3] = raw.high;
      m.input[0] = raw.rawAmp;
      m.input[1] = raw.transient;
      m.input[2] = raw.flux;
      m.input[3] = sConf;
      m.cumulative[0] = cumFbm;
      m.cumulative[2] = cumNoise;
      m.cumulative[3] = cumRing;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { audioRef, metersRef };
}
