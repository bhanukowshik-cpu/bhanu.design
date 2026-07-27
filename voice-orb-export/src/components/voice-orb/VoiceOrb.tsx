import { useEffect, useMemo, useRef, useState } from 'react';
import { useOrbRenderer } from './useOrbRenderer';
import { useAudioAnalysis } from './useAudioAnalysis';
import { DebugPanel } from './DebugPanel';
import { DEFAULT_AUDIO_PARAMS, DEFAULT_PARAMS, resolvePalette } from './orbConfig';
import type {
  AudioParams,
  OrbParams,
  OrbPalette,
  OrbTelemetry,
  VoiceOrbProps,
} from './VoiceOrb.types';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function rgbString(c: readonly number[]): string {
  return `rgb(${c.map((v) => Math.round(v * 255)).join(', ')})`;
}

/** Graceful CSS fallback shown only when WebGL2 is unavailable. */
function OrbFallback({ palette }: { palette: OrbPalette }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: '6%',
        borderRadius: '50%',
        background: `radial-gradient(circle at 50% 42%, ${rgbString(palette.mid)}, ${rgbString(
          palette.core,
        )} 46%, ${rgbString(palette.edge)} 82%)`,
        filter: 'blur(1px)',
      }}
    />
  );
}

export function VoiceOrb({
  state = 'idle',
  audioSource = null,
  size = 256,
  className,
  paused = false,
  debug = false,
  palette,
  params,
  maxDpr = 2,
  simulate = null,
  audioParams,
  getFrequencyData,
  onFrame,
}: VoiceOrbProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  const paletteDep = JSON.stringify(palette ?? {});
  const resolvedPalette = useMemo(() => resolvePalette(palette), [paletteDep]);

  // Base params live in refs so the debug panel can mutate them without a React
  // re-render; a fresh copy per mount keeps instances independent. `params`
  // seeds the copy at mount only (useRef keeps the first initializer).
  const paramsRef = useRef<OrbParams>({ ...DEFAULT_PARAMS, ...params });
  const audioParamsRef = useRef<AudioParams>({ ...DEFAULT_AUDIO_PARAMS, ...audioParams });
  const audioParamsDep = JSON.stringify(audioParams ?? {});
  useEffect(() => {
    Object.assign(audioParamsRef.current, DEFAULT_AUDIO_PARAMS, audioParams);
  }, [audioParamsDep]);

  const reducedMotion = usePrefersReducedMotion();
  const { audioRef, metersRef } = useAudioAnalysis({
    source: audioSource,
    simulate,
    paused,
    paramsRef: audioParamsRef,
    getFrequencyData,
  });

  // Telemetry sink: capture the latest frame for the debug panel and forward to
  // any user-provided onFrame. Reassigned each render; the renderer reads .current.
  const telemetryRef = useRef<OrbTelemetry | null>(null);
  const onFrameRef = useRef<((t: OrbTelemetry) => void) | undefined>(undefined);
  onFrameRef.current = (t: OrbTelemetry) => {
    telemetryRef.current = t;
    onFrame?.(t);
  };

  useOrbRenderer({
    containerRef,
    maxDpr,
    palette: resolvedPalette,
    paused,
    reducedMotion,
    debug,
    state,
    paramsRef,
    audioRef,
    onFrameRef,
    onError: () => setFailed(true),
  });

  return (
    <div
      ref={containerRef}
      className={className}
      data-orb-state={state}
      style={{
        position: 'relative',
        width: size,
        height: size,
        // Hint the compositor; the canvas paints its own transparency.
        contain: 'layout paint size',
      }}
    >
      {failed && <OrbFallback palette={resolvedPalette} />}
      {debug && !failed && (
        <DebugPanel
          paramsRef={paramsRef}
          audioParamsRef={audioParamsRef}
          metersRef={metersRef}
          telemetryRef={telemetryRef}
        />
      )}
    </div>
  );
}
