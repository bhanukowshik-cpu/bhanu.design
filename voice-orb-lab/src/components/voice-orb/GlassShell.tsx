import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useControls, folder } from 'leva';
import * as THREE from 'three';
import glassVertex from '../../shaders/glass/glassVertex.glsl?raw';
import glassFragment from '../../shaders/glass/glassFragment.glsl?raw';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * The liquid-glass shell. One high-resolution sphere, DoubleSide custom
 * shader: back faces shade the far interior wall (perceived thickness),
 * front faces carry Fresnel rim + internal falloff + drifting highlight.
 */
export function GlassShell() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const reduced = useReducedMotion();

  const ctl = useControls('Glass Shell', {
    material: folder({
      transmission: { value: 0.64, min: 0, max: 1, step: 0.01 },
      roughness:    { value: 0.18, min: 0, max: 1, step: 0.01 },
      thickness:    { value: 0.85, min: 0, max: 2, step: 0.01 },
      fresnel:      { value: 1.05, min: 0, max: 3, step: 0.01 },
      rimColor:     '#7d86ff',
      deepColor:    '#0a0e2a',
      innerColor:   '#4b46c8',
      accentColor:  '#ffb28f',
    }),
    light: folder({
      highlightIntensity: { value: 0.85, min: 0, max: 3, step: 0.01 },
      lightIntensity:     { value: 1.0,  min: 0, max: 2, step: 0.01 },
    }),
    motion: folder({
      displacementStrength: { value: 0.006, min: 0, max: 0.05, step: 0.001 },
    }),
  });

  const uniforms = useMemo(
    () => ({
      uTime:         { value: 0 },
      uDisplacement: { value: 0.006 },
      uDeepColor:    { value: new THREE.Color('#0a0e2a') },
      uRimColor:     { value: new THREE.Color('#7d86ff') },
      uInnerColor:   { value: new THREE.Color('#4b46c8') },
      uAccentColor:  { value: new THREE.Color('#ffb28f') },
      uFresnel:      { value: 1.05 },
      uTransmission: { value: 0.55 },
      uThickness:    { value: 0.85 },
      uRoughness:    { value: 0.18 },
      uHighlight:    { value: 0.85 },
      uLight:        { value: 1.0 },
    }),
    [],
  );

  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    // freeze surface motion (not rendering) under reduced motion
    if (!reduced) u.uTime.value += dt;
    u.uDisplacement.value = reduced ? 0 : ctl.displacementStrength;
    u.uFresnel.value = ctl.fresnel;
    u.uTransmission.value = ctl.transmission;
    u.uThickness.value = ctl.thickness;
    u.uRoughness.value = ctl.roughness;
    u.uHighlight.value = ctl.highlightIntensity;
    u.uLight.value = ctl.lightIntensity;
    (u.uRimColor.value as THREE.Color).set(ctl.rimColor);
    (u.uDeepColor.value as THREE.Color).set(ctl.deepColor);
    (u.uInnerColor.value as THREE.Color).set(ctl.innerColor);
    (u.uAccentColor.value as THREE.Color).set(ctl.accentColor);
  });

  return (
    <mesh>
      {/* 192 segments — the silhouette must never read as polygonal */}
      <sphereGeometry args={[1, 192, 192]} />
      <shaderMaterial
        ref={mat}
        vertexShader={glassVertex}
        fragmentShader={glassFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
