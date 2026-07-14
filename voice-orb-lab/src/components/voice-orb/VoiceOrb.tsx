import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbScene } from './OrbScene';
import { OrbLights } from './OrbLights';
import { OrbPostProcessing } from './OrbPostProcessing';
import { OrbFallback } from './OrbFallback';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Entry point. Camera at z=5 / fov 40 puts the unit sphere at ~55% of
 * viewport height on desktop (brief: 45–60%); OrbScene handles narrow-
 * viewport fitting.
 */
export function VoiceOrb() {
  const hasWebGL = useMemo(webglAvailable, []);
  if (!hasWebGL) return <OrbFallback />;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <OrbLights />
        <OrbScene />
        <OrbPostProcessing />
      </Suspense>
    </Canvas>
  );
}
