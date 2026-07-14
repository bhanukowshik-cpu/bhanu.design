import { useControls } from 'leva';

/**
 * Restrained three-point setup: soft cool key, subtle rim, faint warm
 * accent. The Phase-1 shell computes its own shading, so these mostly
 * ground the scene — and become load-bearing when Phase 2 adds physical
 * materials inside the orb.
 */
export function OrbLights() {
  const ctl = useControls('Lights', {
    keyIntensity:  { value: 0.9,  min: 0, max: 3, step: 0.05 },
    rimIntensity:  { value: 0.55, min: 0, max: 3, step: 0.05 },
    warmIntensity: { value: 0.30, min: 0, max: 2, step: 0.05 },
  });

  return (
    <>
      <ambientLight intensity={0.18} color="#8a93ff" />
      <directionalLight position={[2.4, 3.2, 2.6]} intensity={ctl.keyIntensity} color="#cdd4ff" />
      <directionalLight position={[-3.0, 1.2, -2.4]} intensity={ctl.rimIntensity} color="#6f7bff" />
      <pointLight position={[1.8, -1.0, 1.4]} intensity={ctl.warmIntensity} color="#ffb28f" />
    </>
  );
}
