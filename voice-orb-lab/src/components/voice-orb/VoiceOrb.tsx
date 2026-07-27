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
 * Entry point. Medium focal length (fov 35 ≈ 65mm), object centered,
 * pulled back for negative space — the sphere sits at ~49% of viewport
 * height. OrbScene handles narrow-viewport fitting.
 */
export function VoiceOrb() {
  const hasWebGL = useMemo(webglAvailable, []);
  if (!hasWebGL) return <OrbFallback />;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.4], fov: 35 }}
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
