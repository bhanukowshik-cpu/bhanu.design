import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * The studio. Not lights — softboxes.
 *
 * Large area Lightformers inside an Environment cubemap are what a glass
 * material actually "photographs": long soft reflections that wrap the
 * curvature instead of a small white specular dot.
 *
 * - Key: big vertical softbox, upper left front — the main wrap.
 * - Strip: long horizontal box, right — the traveling secondary line.
 * - Rim: cool panel behind — separates the dark sphere from the dark set.
 * - Accent: small warm card, low right — the "tiny warm peach" reflection.
 *
 * frames={Infinity} re-renders the cubemap so the key softbox can drift
 * almost imperceptibly — reflections shift like a slow studio dolly.
 */
export function OrbLights() {
  const key = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  const ctl = useControls('Studio', {
    keyIntensity:  { value: 1.7,  min: 0, max: 5, step: 0.05 },
    rimIntensity:  { value: 0.55, min: 0, max: 4, step: 0.05 },
    warmIntensity: { value: 0.5,  min: 0, max: 2, step: 0.05 },
    fillIntensity: { value: 0.32, min: 0, max: 1, step: 0.01 },
  });

  useFrame(({ clock }) => {
    if (reduced || !key.current) return;
    const t = clock.elapsedTime;
    // slow studio drift — reflections travel, the object never "animates"
    key.current.position.x = -2.6 + Math.sin(t * 0.05) * 0.5;
    key.current.position.y = 2.4 + Math.sin(t * 0.033) * 0.3;
  });

  return (
    <Environment resolution={256} frames={reduced ? 1 : Infinity}>
      {/* black set walls — reflections come only from the softboxes */}
      <color attach="background" args={['#020208']} />

      {/* KEY — large vertical softbox, upper left front */}
      <group ref={key} position={[-2.6, 2.4, 3.2]} rotation={[0, 0.55, 0]}>
        <Lightformer
          form="rect"
          scale={[3.2, 6.5, 1]}
          intensity={ctl.keyIntensity}
          color="#dfe6ff"
        />
      </group>

      {/* STRIP — long horizontal line, camera right, grazes the equator */}
      <Lightformer
        form="rect"
        position={[4.2, 0.4, 1.8]}
        rotation={[0, -0.9, 0]}
        scale={[7, 1.1, 1]}
        intensity={ctl.keyIntensity * 0.32}
        color="#cdd6ff"
      />

      {/* RIM — cool indigo panel behind the object */}
      <Lightformer
        form="rect"
        position={[0.6, 1.2, -4.5]}
        rotation={[0, Math.PI, 0]}
        scale={[6, 3.4, 1]}
        intensity={ctl.rimIntensity}
        color="#5f68c8"
      />

      {/* ACCENT — small warm peach card, low right */}
      <Lightformer
        form="rect"
        position={[2.6, -1.9, 2.2]}
        rotation={[0.5, -0.6, 0]}
        scale={[1.6, 1.0, 1]}
        intensity={ctl.warmIntensity}
        color="#ffc9a8"
      />

      {/* FILL — vast dim ceiling, keeps shadows from going dead */}
      <Lightformer
        form="rect"
        position={[0, 5.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[12, 12, 1]}
        intensity={ctl.fillIntensity}
        color="#9aa3d8"
      />
    </Environment>
  );
}
