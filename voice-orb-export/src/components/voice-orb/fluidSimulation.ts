import { Mesh, Program, RenderTarget, Triangle } from 'ogl';
import type { OGLRenderingContext, Renderer, Texture } from 'ogl';
import fluidFrag from './shaders/fluid.frag.glsl?raw';
import orbVert from './shaders/orb.vert.glsl?raw';
import { withNoise } from './lib/composeShader';
import type { AudioFrame, OrbParams } from './VoiceOrb.types';

export interface FluidSimulation {
  /** Advance one step and return the texture to sample this frame. */
  update(dt: number, time: number, audio: AudioFrame, params: OrbParams): Texture;
  dispose(): void;
}

function copy4(dst: number[], src: readonly number[]) {
  dst[0] = src[0];
  dst[1] = src[1];
  dst[2] = src[2];
  dst[3] = src[3];
}

/**
 * Creates a ping-pong fluid simulation on half-float render targets. Returns
 * `null` when renderable float buffers are unavailable (EXT_color_buffer_float
 * missing) so the caller can fall back to no fluid — the orb then samples a
 * black placeholder and the fluid systems contribute zero.
 */
export function createFluidSimulation(renderer: Renderer, size = 128): FluidSimulation | null {
  const gl = renderer.gl as OGLRenderingContext & WebGL2RenderingContext;

  // Half-float is renderable only with this extension; without it, bail.
  if (!gl.getExtension('EXT_color_buffer_float')) return null;

  const makeRT = () =>
    new RenderTarget(gl, {
      width: size,
      height: size,
      type: gl.HALF_FLOAT,
      internalFormat: gl.RGBA16F,
      format: gl.RGBA,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      depth: false,
      stencil: false,
    });

  let read = makeRT();
  let write = makeRT();

  const geometry = new Triangle(gl);
  const uniforms = {
    uPrev: { value: read.texture },
    uTime: { value: 0 },
    uDt: { value: 1 / 60 },
    uDissipation: { value: 0.94 },
    uForce: { value: 0.6 },
    uAudioAverage: { value: [0, 0, 0, 0] },
    uAudioAverageInput: { value: [0, 0, 0, 0] },
  };
  const program = new Program(gl, {
    vertex: orbVert,
    fragment: withNoise(fluidFrag),
    uniforms,
  });
  const mesh = new Mesh(gl, { geometry, program });

  const disposeRT = (rt: RenderTarget) => {
    gl.deleteTexture(rt.texture.texture);
    if (rt.buffer) gl.deleteFramebuffer(rt.buffer);
  };

  return {
    update(dt, time, audio, params) {
      uniforms.uPrev.value = read.texture;
      uniforms.uTime.value = time;
      uniforms.uDt.value = Math.min(dt, 1 / 30);
      uniforms.uDissipation.value = params.fluidDissipation;
      uniforms.uForce.value = params.fluidForce;
      copy4(uniforms.uAudioAverage.value, audio.average);
      copy4(uniforms.uAudioAverageInput.value, audio.input);

      renderer.render({ scene: mesh, target: write });

      // Swap: the freshly-written target becomes the one to sample.
      const tmp = read;
      read = write;
      write = tmp;
      return read.texture;
    },
    dispose() {
      geometry.remove();
      program.remove();
      disposeRT(read);
      disposeRT(write);
    },
  };
}
