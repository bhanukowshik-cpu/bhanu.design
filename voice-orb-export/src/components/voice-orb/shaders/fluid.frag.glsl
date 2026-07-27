#version 300 es
precision highp float;

// =============================================================================
// FLUID / DISPLACEMENT PASS (ping-pong, half-float render target)
//
// A lightweight but genuinely dynamic flow field — NOT a static texture. Each
// step:
//   1. derive a divergence-free velocity from the curl of a simplex potential
//      (organic swirling flow, autonomous even in silence),
//   2. advect the previous field semi-Lagrangian along that velocity,
//   3. inject force (curl flow + a gentle radial audio push),
//   4. dissipate.
//
// This is not a full pressure-projection Navier–Stokes solver; the curl-noise
// forcing gives incompressible-looking motion with momentum at a fraction of
// the cost. Output: rg = flow displacement, b = magnitude.
// =============================================================================

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uPrev;
uniform float uTime;
uniform float uDt;
uniform float uDissipation;
uniform float uForce;
uniform vec4 uAudioAverage; // (rms, low, mid, high)
uniform vec4 uAudioAverageInput; // (rawAmp, transient, flux, confidence)

/* NOISE_LIB */

// Curl of a scalar simplex potential → divergence-free 2D velocity.
vec2 curl(vec2 p, float t) {
  const float e = 0.02;
  float n1 = snoise(vec3((p + vec2(0.0, e)) * 1.6, t));
  float n2 = snoise(vec3((p - vec2(0.0, e)) * 1.6, t));
  float n3 = snoise(vec3((p + vec2(e, 0.0)) * 1.6, t));
  float n4 = snoise(vec3((p - vec2(e, 0.0)) * 1.6, t));
  float dNdy = (n1 - n2) / (2.0 * e);
  float dNdx = (n3 - n4) / (2.0 * e);
  return vec2(dNdy, -dNdx);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.15;

  vec2 vel = curl(uv * 2.0, t);

  float low = uAudioAverage.y;
  float energy = uForce * (0.35 + low * 1.6 + uAudioAverageInput.x * 1.0);

  // Semi-Lagrangian advection of the previous field.
  vec2 prevUv = uv - vel * uDt * (0.6 + energy);
  vec3 prev = texture(uPrev, prevUv).rgb;

  // Force injection: swirling curl flow + a gentle radial push on loud lows.
  vec2 inject = vel * energy;
  vec2 fromCenter = uv - 0.5;
  inject += normalize(fromCenter + vec2(1e-5)) * (low * uForce * 0.4);

  vec2 field = prev.rg * uDissipation + inject * uDt * 5.0;
  field = clamp(field, -6.0, 6.0);

  outColor = vec4(field, length(field), 1.0);
}
