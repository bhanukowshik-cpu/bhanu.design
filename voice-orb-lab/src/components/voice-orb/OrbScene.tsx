import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import { GlassShell } from './GlassShell';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/** Soft elliptical glow under the orb — canvas radial gradient sprite. */
function GroundGlow({ opacity }: { opacity: number }) {
  const texture = useMemo(() => {
    // circular gradient, fading out well inside the canvas edge — the
    // sprite's wide aspect turns it into the ellipse (no canvas squash,
    // which double-compressed the falloff into a hard-edged slab)
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(128, 128, 2, 128, 128, 122);
    g.addColorStop(0, 'rgba(96, 84, 220, 0.20)');
    g.addColorStop(0.35, 'rgba(70, 58, 180, 0.08)');
    g.addColorStop(0.7, 'rgba(50, 40, 140, 0.02)');
    g.addColorStop(1, 'rgba(50, 40, 140, 0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  return (
    <sprite position={[0, -1.55, 0]} scale={[3.8, 0.75, 1]}>
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

/**
 * Composition + idle life: orb slightly above vertical center, 6–8s
 * breathing at ≤1.5% scale, imperceptible drift. Scales down on narrow
 * viewports so the sphere is never clipped.
 */
export function OrbScene() {
  const group = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const { viewport } = useThree();

  const ctl = useControls('Composition', {
    orbScale:          { value: 1.0,   min: 0.5, max: 1.4, step: 0.01 },
    breathingStrength: { value: 0.012, min: 0,   max: 0.03, step: 0.001 },
    breathingPeriod:   { value: 7.0,   min: 4,   max: 10,  step: 0.5 },
    groundGlow:        { value: 0.45,  min: 0,   max: 1,   step: 0.01 },
  });

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;

    // fit: keep the 2-unit sphere within ~78% of the viewport's short side
    const fit = Math.min(1, (viewport.width * 0.78) / 2.3);
    const breath = reduced ? 0 : Math.sin((t * Math.PI * 2) / ctl.breathingPeriod) * ctl.breathingStrength;
    const s = ctl.orbScale * fit * (1 + breath);
    g.scale.setScalar(s);

    if (!reduced) {
      g.rotation.y = t * 0.02;                    // barely-there drift
      g.position.y = 0.16 + Math.sin(t * 0.23) * 0.012;
    } else {
      g.rotation.y = 0;
      g.position.y = 0.16;
    }
  });

  return (
    <>
      <group ref={group} position={[0, 0.16, 0]}>
        <GlassShell />
      </group>
      <GroundGlow opacity={ctl.groundGlow} />
    </>
  );
}
