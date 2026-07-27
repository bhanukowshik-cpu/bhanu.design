import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import type { OGLRenderingContext } from 'ogl';

import orbVert from './shaders/orb.vert.glsl?raw';
import orbFrag from './shaders/orb.frag.glsl?raw';
import { createGradientTexture, GRADIENT_TEXTURE_SIZE } from './lib/gradientTexture';
import { withNoise } from './lib/composeShader';
import { createFluidSimulation } from './fluidSimulation';
import {
  DEFAULT_PARAMS,
  STATE_CROSSFADE_TAU,
  STATE_PRESETS,
  paletteKey,
} from './orbConfig';
import type {
  AudioFrame,
  OrbPalette,
  OrbParams,
  OrbTelemetry,
  VoiceOrbState,
} from './VoiceOrb.types';

type UniformValue = number | number[] | Texture;
type Uniforms = Record<string, { value: UniformValue }>;

const PARAM_KEYS = Object.keys(DEFAULT_PARAMS) as (keyof OrbParams)[];

export interface UseOrbRendererOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  maxDpr: number;
  palette: OrbPalette;
  paused: boolean;
  reducedMotion: boolean;
  debug: boolean;
  state: VoiceOrbState;
  /** Base params (defaults + live debug overrides). Read every frame. */
  paramsRef: RefObject<OrbParams>;
  /** Smoothed audio, written by the audio hook, read every frame. */
  audioRef: RefObject<AudioFrame>;
  /** Optional per-frame telemetry sink for the debug panel. */
  onFrameRef: RefObject<((t: OrbTelemetry) => void) | undefined>;
  /** Called if WebGL2 / context creation fails, so the component can fall back. */
  onError?: () => void;
}

function copy4(dst: number[], src: readonly number[]) {
  dst[0] = src[0];
  dst[1] = src[1];
  dst[2] = src[2];
  dst[3] = src[3];
}

/** 1×1 texture placeholder so the fluid sampler always has a valid binding. */
function createPlaceholderTexture(gl: OGLRenderingContext): Texture {
  return new Texture(gl, {
    image: new Uint8Array([0, 0, 0, 255]),
    width: 1,
    height: 1,
    generateMipmaps: false,
    flipY: false,
  });
}

/**
 * Owns the entire WebGL lifecycle for one orb instance. Everything that changes
 * per-frame is read from refs so the render loop never triggers a React render.
 *
 * The GL context is (re)built only when the palette or DPR cap changes
 * (`rebuildKey`). Size is handled live by a ResizeObserver; pause/state/reduced-
 * motion are synced to internal refs and never tear down the context.
 */
export function useOrbRenderer(opts: UseOrbRendererOptions): void {
  const {
    containerRef,
    maxDpr,
    palette,
    paused,
    reducedMotion,
    debug,
    state,
    paramsRef,
    audioRef,
    onFrameRef,
    onError,
  } = opts;

  // Internal refs synced from props so the loop reads them without rebuilding.
  const pausedRef = useRef(paused);
  const reducedMotionRef = useRef(reducedMotion);
  const debugRef = useRef(debug);
  const stateRef = useRef(state);
  const syncRunRef = useRef<(() => void) | undefined>(undefined);

  const rebuildKey = `${paletteKey(palette)}|${maxDpr}`;
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const maxDprRef = useRef(maxDpr);
  maxDprRef.current = maxDpr;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // --- Build / teardown GL (rebuild only on palette or DPR change) ----------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        dpr: Math.min(maxDprRef.current, window.devicePixelRatio || 1),
        powerPreference: 'high-performance',
      });
    } catch {
      onErrorRef.current?.();
      return;
    }

    const gl = renderer.gl;
    if (!renderer.isWebgl2) {
      onErrorRef.current?.();
      return;
    }

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    gl.clearColor(0, 0, 0, 0);

    const gradientTexture = createGradientTexture(gl, paletteRef.current);
    const fluidPlaceholder = createPlaceholderTexture(gl);
    // Lightweight ping-pong fluid sim; null if float RTs are unavailable, in
    // which case the orb samples the black placeholder (fluid contributes 0).
    const fluid = createFluidSimulation(renderer, 128);

    // Full uniform superset. Systems declared here become active in the shader
    // as later milestones extend main(); OGL ignores values for inactive names.
    const p = paramsRef.current ?? DEFAULT_PARAMS;
    const uniforms: Uniforms = {
      uTime: { value: 0 },
      uResolution: { value: [1, 1] },
      uTextureResolution: { value: [GRADIENT_TEXTURE_SIZE, GRADIENT_TEXTURE_SIZE] },
      uAlpha: { value: p.alpha },
      uFadeInDuration: { value: 0.8 },
      uTexture: { value: gradientTexture },
      uFluidSimTexture: { value: fluidPlaceholder },

      uSphereScale: { value: p.sphereScale },
      uSpherePower: { value: p.spherePower },
      uMaskRadius: { value: p.maskRadius },
      uMaskSoftness: { value: p.maskSoftness },

      uExposure: { value: p.exposure },
      uContrast: { value: p.contrast },
      uSaturation: { value: p.saturation },
      uGrainOpacity: { value: p.grainOpacity },

      uFbmScale: { value: p.fbmScale },
      uFbmPower: { value: p.fbmPower },
      uFbmAmplitude: { value: p.fbmAmplitude },
      uFbmSpeed: { value: p.fbmSpeed },

      uNoiseScale: { value: p.noiseScale },
      uNoiseAmplitude: { value: p.noiseAmplitude },
      uNoiseSpeed: { value: p.noiseSpeed },
      uDriftSpeed: { value: p.driftSpeed },

      uFluidColor: { value: [...paletteRef.current.fluid] },
      uFluidDisplacement: { value: p.fluidDisplacement },
      uFluidColorOpacity: { value: p.fluidColorOpacity },

      uRingColorOpacity: { value: p.ringColorOpacity },

      uInnerLightShift: { value: p.innerLightShift },
      uIdleRingSpin: { value: p.idleRingSpin },

      uAudioAverage: { value: [0, 0, 0, 0] },
      uAudioAverageInput: { value: [0, 0, 0, 0] },
      uCumulativeAudio: { value: [0, 0, 0, 0] },
    };

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: orbVert,
      fragment: withNoise(orbFrag),
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    program.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const mesh = new Mesh(gl, { geometry, program });

    // Working copy of params, interpolated toward the state target each frame.
    const current: OrbParams = { ...paramsRef.current };

    // --- sizing -------------------------------------------------------------
    const applySize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      renderer.dpr = Math.min(maxDprRef.current, window.devicePixelRatio || 1);
      renderer.setSize(w, h);
      (uniforms.uResolution.value as number[])[0] = renderer.width * renderer.dpr;
      (uniforms.uResolution.value as number[])[1] = renderer.height * renderer.dpr;
    };
    applySize();

    const resizeObserver = new ResizeObserver(applySize);
    resizeObserver.observe(container);

    // --- visibility / off-screen pause -------------------------------------
    let intersecting = true;
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        intersecting = entries.some((e) => e.isIntersecting);
        syncRun();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    // --- render loop --------------------------------------------------------
    let rafId = 0;
    let running = false;
    let last = 0;
    let elapsed = 0;
    let telemetryTimer = 0;
    let telemetryFrames = 0;

    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const rm = reducedMotionRef.current;
      const timeScale = rm ? 0.3 : 1;
      const intensity = rm ? 0.4 : 1;
      elapsed += dt * timeScale;

      // Interpolate params toward the active target (frame-rate independent).
      const base = paramsRef.current;
      const preset = debugRef.current ? undefined : STATE_PRESETS[stateRef.current];
      const a = 1 - Math.exp(-dt / STATE_CROSSFADE_TAU);
      for (const k of PARAM_KEYS) {
        const target =
          preset && k in preset ? ((preset[k] as number | undefined) ?? base[k]) : base[k];
        current[k] += (target - current[k]) * a;
      }

      const audio = audioRef.current;

      uniforms.uTime.value = elapsed;
      uniforms.uAlpha.value = current.alpha;
      uniforms.uSphereScale.value = current.sphereScale;
      uniforms.uSpherePower.value = current.spherePower;
      uniforms.uMaskRadius.value = current.maskRadius;
      uniforms.uMaskSoftness.value = current.maskSoftness;
      uniforms.uExposure.value = current.exposure;
      uniforms.uContrast.value = current.contrast;
      uniforms.uSaturation.value = current.saturation;
      uniforms.uGrainOpacity.value = current.grainOpacity;
      uniforms.uFbmScale.value = current.fbmScale;
      uniforms.uFbmPower.value = current.fbmPower;
      uniforms.uFbmAmplitude.value = current.fbmAmplitude * intensity;
      uniforms.uFbmSpeed.value = current.fbmSpeed;
      uniforms.uNoiseScale.value = current.noiseScale;
      uniforms.uNoiseAmplitude.value = current.noiseAmplitude * intensity;
      uniforms.uNoiseSpeed.value = current.noiseSpeed;
      uniforms.uDriftSpeed.value = current.driftSpeed;
      uniforms.uFluidDisplacement.value = current.fluidDisplacement * intensity;
      uniforms.uFluidColorOpacity.value = current.fluidColorOpacity;
      uniforms.uRingColorOpacity.value = current.ringColorOpacity * intensity;
      uniforms.uInnerLightShift.value = current.innerLightShift;
      uniforms.uIdleRingSpin.value = current.idleRingSpin;

      copy4(uniforms.uAudioAverage.value as number[], audio.average);
      copy4(uniforms.uAudioAverageInput.value as number[], audio.input);
      copy4(uniforms.uCumulativeAudio.value as number[], audio.cumulative);

      // Step the fluid sim first (renders into its own target), then sample it.
      if (fluid) {
        uniforms.uFluidSimTexture.value = fluid.update(dt, elapsed, audio, current);
      }

      renderer.render({ scene: mesh });

      telemetryFrames++;
      telemetryTimer += dt;
      if (telemetryTimer >= 0.1) {
        onFrameRef.current?.({
          fps: telemetryFrames / telemetryTimer,
          audio,
          state: stateRef.current,
        });
        telemetryFrames = 0;
        telemetryTimer = 0;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
    const syncRun = () => {
      const shouldRun = !pausedRef.current && !document.hidden && intersecting;
      if (shouldRun) start();
      else stop();
    };
    syncRunRef.current = syncRun;

    const onVisibility = () => syncRun();
    document.addEventListener('visibilitychange', onVisibility);
    syncRun();

    // --- teardown -----------------------------------------------------------
    return () => {
      stop();
      syncRunRef.current = undefined;
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      fluid?.dispose();
      geometry.remove();
      program.remove();
      gl.deleteTexture(gradientTexture.texture);
      gl.deleteTexture(fluidPlaceholder.texture);

      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      // Aggressively free the GPU context so remounts don't leak.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuildKey]);

  // --- sync prop -> ref, and wake/sleep the loop ----------------------------
  useEffect(() => {
    pausedRef.current = paused;
    reducedMotionRef.current = reducedMotion;
    debugRef.current = debug;
    syncRunRef.current?.();
  }, [paused, reducedMotion, debug]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
}
