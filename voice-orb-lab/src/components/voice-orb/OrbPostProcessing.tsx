import { EffectComposer, Bloom, BrightnessContrast } from '@react-three/postprocessing';
import { useControls } from 'leva';

/**
 * Phase 1A post: subtle bloom + a touch of contrast. Tone mapping is
 * ACES Filmic via the default renderer config. Nothing else — no CA,
 * no grain, no flares, no vignette. The material must carry the frame.
 */
export function OrbPostProcessing() {
  const ctl = useControls('Post', {
    bloomEnabled:   true,
    bloomStrength:  { value: 0.35, min: 0, max: 2, step: 0.01 },
    bloomThreshold: { value: 0.8,  min: 0, max: 1, step: 0.01 },
    contrast:       { value: 0.04, min: -0.2, max: 0.2, step: 0.005 },
  });

  return (
    <EffectComposer>
      {ctl.bloomEnabled ? (
        <Bloom
          intensity={ctl.bloomStrength}
          luminanceThreshold={ctl.bloomThreshold}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      ) : (
        <></>
      )}
      <BrightnessContrast brightness={0} contrast={ctl.contrast} />
    </EffectComposer>
  );
}
