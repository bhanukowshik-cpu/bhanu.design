import { Texture } from 'ogl';
import type { OGLRenderingContext } from 'ogl';
import type { OrbPalette, RGB } from '../VoiceOrb.types';

/**
 * The gradient carries the orb's colour identity. The reference sampled an
 * external designed texture; we generate ours on the CPU from palette stops so
 * the component stays zero-asset and the palette is a config value.
 *
 * Layout is radial (centre → rim) because the sphere projection maps the
 * texture centre across the orb's face and the texture rim toward its
 * silhouette — so a radial gradient reads as spherical shading.
 */

const GRADIENT_SIZE = 512;

function mix3(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// Cheap, stable hash for dithering — deterministic across renders.
function hash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function buildGradientData(palette: OrbPalette, size = GRADIENT_SIZE): Uint8Array {
  const { core, mid, outer, edge, iridescence } = palette;
  const data = new Uint8Array(size * size * 4);

  // Directional light for a lit-sphere read (baked luminance, not a flat disc).
  // +y is toward the top of the orb after the shader's UV convention.
  const L = [0.32, 0.42, 0.86];
  const ll = Math.hypot(L[0], L[1], L[2]);
  const lx = L[0] / ll;
  const ly = L[1] / ll;
  const lz = L[2] / ll;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = ((x + 0.5) / size) * 2 - 1;
      const py = ((y + 0.5) / size) * 2 - 1;
      const r = Math.min(Math.hypot(px, py), 1.0);
      const z = Math.sqrt(Math.max(0, 1 - r * r));

      // Half-Lambert shading off a virtual sphere normal → soft, moody volume.
      // Deeper ambient floor + higher power = more dimensional contrast (the
      // shadow side reads dark, which is a big part of a premium look).
      const nDotL = px * lx + py * ly + z * lz;
      const half = Math.max(0, nDotL * 0.5 + 0.5);
      const lum = 0.12 + 0.96 * Math.pow(half, 1.65);

      // Smooth low-frequency colour field gives the interior structure the
      // domain warp animates into flowing folds (a pure radial ramp shows no
      // folds). Kept narrow so colour variation stays subtle, not blotchy.
      const f1 = Math.sin(px * 2.1 + py * 1.4 + 0.6);
      const f2 = Math.sin(py * 2.6 - px * 1.1 - 0.5);
      const field = Math.min(1, Math.max(0, 0.5 + 0.2 * f1 + 0.16 * f2));
      let c = mix3(core, mid, smoothstep(0.25, 0.66, field));
      c = mix3(c, outer, smoothstep(0.66, 0.98, field));

      // Apply shading.
      c = [c[0] * lum, c[1] * lum, c[2] * lum];

      // Fall to near-black at the rim (reads volumetric + blends into the mask).
      const rim = smoothstep(0.62, 1.02, r);
      c = mix3(c, edge, rim);

      // Fresnel-style iridescent rim sheen just inside the terminator.
      const fres = Math.pow(Math.min(1, r), 3) * (1 - rim);
      c = mix3(c, outer, fres * iridescence);

      // Dither to break 8-bit banding on the smooth ramp.
      const dth = (hash(x, y) - 0.5) / 255;

      const i = (y * size + x) * 4;
      data[i + 0] = clamp255((c[0] + dth) * 255);
      data[i + 1] = clamp255((c[1] + dth) * 255);
      data[i + 2] = clamp255((c[2] + dth) * 255);
      data[i + 3] = 255;
    }
  }
  return data;
}

export function createGradientTexture(gl: OGLRenderingContext, palette: OrbPalette): Texture {
  const size = GRADIENT_SIZE;
  return new Texture(gl, {
    image: buildGradientData(palette, size),
    width: size,
    height: size,
    generateMipmaps: false,
    flipY: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });
}

export const GRADIENT_TEXTURE_SIZE = GRADIENT_SIZE;
