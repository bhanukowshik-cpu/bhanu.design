import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { useControls, folder } from 'leva';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Phase 1A — the luxury liquid-glass shell.
 *
 * Foundation: drei's MeshTransmissionMaterial (physically-based
 * transmission, refraction, absorption). The material is shaped almost
 * entirely by the studio Lightformers in OrbLights — photography, not
 * shader tricks. One tiny extension: an additive Fresnel rim overlay so
 * the edge response is tunable beyond what IOR alone provides.
 *
 * Why each property (brief asks):
 * - transmission 1.0 — it IS glass; anything lower reads as tinted plastic.
 * - thickness 1.5 + backside — light bends through the full volume twice;
 *   this is what makes the sphere feel dense rather than hollow.
 * - roughness 0.07 — polished but not mirror; reflections stay long & soft.
 * - ior 1.5 — real optical glass. Physical Fresnel falls out of this.
 * - attenuationColor deep navy + attenuationDistance 1.3 — internal
 *   absorption: the core darkens with depth, giving "optical depth".
 * - clearcoat 0.55 — a precision-polished outer skin over the dense body.
 * - chromaticAberration 0.02 — microscopic dispersion at edges; below the
 *   threshold of "effect", just enough to read as optical material.
 * - anisotropicBlur 0.3 — softens what's seen *through* the glass, like
 *   thick optical material, without fogging reflections.
 * - distortion 0.06 + temporalDistortion 0.02 — the "tiny camera-
 *   independent refraction drift" from the brief; zeroed under
 *   reduced motion.
 */
export function GlassShell() {
  const rimMat = useRef<THREE.ShaderMaterial>(null);
  const reduced = useReducedMotion();

  const ctl = useControls('Glass', {
    material: folder({
      transmission:  { value: 1.0,  min: 0,    max: 1,    step: 0.01 },
      thickness:     { value: 1.35, min: 0,    max: 3,    step: 0.01 },
      roughness:     { value: 0.09, min: 0,    max: 0.6,  step: 0.005 },
      ior:           { value: 1.5,  min: 1,    max: 2.33, step: 0.01 },
      reflectionIntensity: { value: 1.0, min: 0, max: 3, step: 0.01 },
      attenuationColor:    '#232c5c',
      attenuationDistance: { value: 3.0, min: 0.2, max: 5, step: 0.05 },
      clearcoat:     { value: 0.55, min: 0, max: 1, step: 0.01 },
    }),
    edge: folder({
      fresnelStrength: { value: 0.22, min: 0, max: 1.5, step: 0.01 },
      fresnelColor:    '#8189ff',
    }),
  });

  /* subtle additive Fresnel rim — the only custom shading in Phase 1A */
  const rimUniforms = useMemo(
    () => ({
      uIntensity: { value: 0.22 },
      uColor:     { value: new THREE.Color('#8189ff') },
    }),
    [],
  );

  useFrame(() => {
    const u = rimMat.current?.uniforms;
    if (!u) return;
    u.uIntensity.value = ctl.fresnelStrength;
    (u.uColor.value as THREE.Color).set(ctl.fresnelColor);
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshTransmissionMaterial
          transmission={ctl.transmission}
          thickness={ctl.thickness}
          backside
          backsideThickness={0.35}
          roughness={ctl.roughness}
          ior={ctl.ior}
          chromaticAberration={0.02}
          anisotropicBlur={0.55}
          distortion={reduced ? 0 : 0.06}
          distortionScale={0.35}
          temporalDistortion={reduced ? 0 : 0.02}
          attenuationColor={ctl.attenuationColor}
          attenuationDistance={ctl.attenuationDistance}
          clearcoat={ctl.clearcoat}
          clearcoatRoughness={0.16}
          envMapIntensity={ctl.reflectionIntensity}
          color="#e8ebf7"
          samples={8}
          resolution={512}
        />
      </mesh>

      {/* Fresnel edge response — additive, faint, never a painted color */}
      <mesh scale={1.002}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          ref={rimMat}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={rimUniforms}
          vertexShader={/* glsl */ `
            varying vec3 vN;
            varying vec3 vV;
            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vN = normalize(normalMatrix * normal);
              vV = normalize(-mv.xyz);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={/* glsl */ `
            precision highp float;
            uniform float uIntensity;
            uniform vec3 uColor;
            varying vec3 vN;
            varying vec3 vV;
            void main() {
              float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 3.6);
              gl_FragColor = vec4(uColor * f * uIntensity, f * uIntensity);
            }
          `}
        />
      </mesh>
    </group>
  );
}
