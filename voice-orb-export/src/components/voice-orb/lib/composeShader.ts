import noiseLib from '../shaders/noise.glsl?raw';

/**
 * Composes a fragment shader source by inlining the shared noise library in
 * place of the `/* NOISE_LIB *\/` token. Keeps one copy of the simplex/FBM
 * implementation shared between the orb and fluid shaders.
 */
export function withNoise(src: string): string {
  return src.replace('/* NOISE_LIB */', noiseLib);
}
