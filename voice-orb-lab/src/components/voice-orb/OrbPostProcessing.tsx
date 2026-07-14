import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useControls } from 'leva';

/**
 * Restrained post: bloom clips to highlights only (high threshold) and the
 * vignette stays whisper-soft. The orb must hold up with bloom disabled.
 */
export function OrbPostProcessing() {
  const ctl = useControls('Post', {
    bloomEnabled:   true,
    bloomStrength:  { value: 0.55, min: 0, max: 2,   step: 0.01 },
    bloomThreshold: { value: 0.72, min: 0, max: 1,   step: 0.01 },
    vignette:       { value: 0.16, min: 0, max: 0.5, step: 0.01 },
  });

  return (
    <EffectComposer>
      {ctl.bloomEnabled ? (
        <Bloom
          intensity={ctl.bloomStrength}
          luminanceThreshold={ctl.bloomThreshold}
          luminanceSmoothing={0.25}
          mipmapBlur
        />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.28} darkness={ctl.vignette} />
    </EffectComposer>
  );
}
