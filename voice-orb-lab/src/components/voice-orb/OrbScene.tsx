import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import { GlassShell } from './GlassShell';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * The set. Near-black navy backdrop (in-scene, so the glass actually
 * refracts it — believability comes from having something behind the
 * sphere), a whisper of contact glow, and the product on its plinth of
 * nothing. Motion budget per brief: ≤1% breathing, nothing else.
 */

/** in-scene backdrop — subtle navy radial falloff, no texture, unlit */
function Backdrop({ brightness }: { brightness: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(256, 210, 20, 256, 230, 400);
    g.addColorStop(0, '#0b0d22');
    g.addColorStop(0.5, '#05060f');
    g.addColorStop(1, '#020206');
    x.fillStyle = g;
    x.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame(() => {
    // no allocations — scale the material color in place
    mat.current?.color.setScalar(brightness);
  });

  return (
    <mesh position={[0, 0, -9]} scale={[30, 14, 1]}>
      <planeGeometry />
      <meshBasicMaterial ref={mat} map={texture} toneMapped={false} />
    </mesh>
  );
}

/** soft elliptical contact glow — barely there, grounds the float */
function GroundGlow({ opacity }: { opacity: number }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(128, 128, 2, 128, 128, 122);
    g.addColorStop(0, 'rgba(80, 76, 190, 0.18)');
    g.addColorStop(0.35, 'rgba(60, 54, 150, 0.07)');
    g.addColorStop(0.7, 'rgba(45, 38, 120, 0.02)');
    g.addColorStop(1, 'rgba(45, 38, 120, 0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  return (
    <sprite position={[0, -1.6, 0]} scale={[3.6, 0.7, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}

export function OrbScene() {
  const group = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const { viewport } = useThree();

  const ctl = useControls('Set', {
    orbScale:             { value: 1.0,   min: 0.5, max: 1.4,  step: 0.01 },
    breathingStrength:    { value: 0.008, min: 0,   max: 0.01, step: 0.001 },
    breathingPeriod:      { value: 8.0,   min: 5,   max: 12,   step: 0.5 },
    backgroundBrightness: { value: 1.0,   min: 0,   max: 2,    step: 0.01 },
    groundGlow:           { value: 0.16,  min: 0,   max: 1,    step: 0.01 },
  });

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    // fit: never clip the sphere on narrow viewports
    const fit = Math.min(1, (viewport.width * 0.72) / 2.3);
    const breath = reduced
      ? 0
      : Math.sin((clock.elapsedTime * Math.PI * 2) / ctl.breathingPeriod) * ctl.breathingStrength;
    g.scale.setScalar(ctl.orbScale * fit * (1 + breath));
  });

  return (
    <>
      <Backdrop brightness={ctl.backgroundBrightness} />
      <group ref={group} position={[0, 0.12, 0]}>
        <GlassShell />
      </group>
      <GroundGlow opacity={ctl.groundGlow} />
    </>
  );
}
