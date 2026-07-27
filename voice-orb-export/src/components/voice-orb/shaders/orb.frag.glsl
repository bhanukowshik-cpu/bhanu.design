#version 300 es
precision highp float;

// =============================================================================
// VOICE ORB — fragment shader
//
// Original implementation of the rendering *sequence* documented in
// reference/orb-handoff/SHADER_ANALYSIS.md (not a copy of the reference source):
//
//   sphere projection → FBM domain warp → simplex displacement →
//   fluid displacement → gradient sample → ring/highlight →
//   fluid-colour blend → grade → soft alpha mask → premultiply
//
// Implemented: sphere projection, FBM warp, simplex displacement, fluid
// displacement + colour blend, gradient sampling, colour grade, soft mask
// (M2–M4). Ring/highlight (M5) extends the compositing section.
// =============================================================================

in vec2 vUv;
out vec4 outColor;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uTextureResolution;
uniform float uAlpha;
uniform float uFadeInDuration;

uniform sampler2D uTexture;
uniform sampler2D uFluidSimTexture;

// Audio (populated by the audio pipeline in M6; zero until then)
uniform vec4 uAudioAverage; // (rms, low, mid, high)
uniform vec4 uAudioAverageInput; // (rawAmp, transient, flux, confidence)
uniform vec4 uCumulativeAudio; // integrated drift

// Spherical projection
uniform float uSphereScale;
uniform float uSpherePower;

// FBM domain warp
uniform float uFbmScale;
uniform float uFbmPower;
uniform float uFbmAmplitude;
uniform float uFbmSpeed;

// Secondary simplex displacement
uniform float uNoiseScale;
uniform float uNoiseAmplitude;
uniform float uNoiseSpeed;

// Fluid / displacement pass
uniform float uFluidDisplacement;
uniform float uFluidColorOpacity;
uniform vec3 uFluidColor;

// Ring / highlight
uniform float uRingColorOpacity;

// State-driven behaviours (0..1, crossfaded on state change)
uniform float uInnerLightShift; // listening: inner light slowly cycles hue
uniform float uIdleRingSpin;    // idle: slow, guaranteed ring rotation

// Slow autonomous drift
uniform float uDriftSpeed;

// Silhouette mask
uniform float uMaskRadius;
uniform float uMaskSoftness;

// Colour grade
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uGrainOpacity;

/* NOISE_LIB */

// ---------------------------------------------------------------------------
// Cover-UV, blend modes, colour correction
// ---------------------------------------------------------------------------
vec2 getCoverUv(vec2 uv, vec2 containerRes, vec2 textureRes) {
  float containerAspect = containerRes.x / containerRes.y;
  float textureAspect = textureRes.x / textureRes.y;
  vec2 scale = vec2(1.0);
  if (containerAspect > textureAspect) scale.y = textureAspect / containerAspect;
  else scale.x = containerAspect / textureAspect;
  return (uv - 0.5) * scale + 0.5;
}

float blendOverlay(float b, float s) {
  return b < 0.5 ? (2.0 * b * s) : (1.0 - 2.0 * (1.0 - b) * (1.0 - s));
}
vec3 blendHardLight(vec3 b, vec3 s) {
  return vec3(blendOverlay(s.r, b.r), blendOverlay(s.g, b.g), blendOverlay(s.b, b.b));
}
vec3 blendHardLight(vec3 b, vec3 s, float o) {
  return mix(b, blendHardLight(b, s), clamp(o, 0.0, 1.0));
}

vec3 applyContrast(vec3 c, float v) { return clamp(0.5 + (1.0 + v) * (c - 0.5), vec3(0.0), vec3(1.0)); }
vec3 applyExposure(vec3 c, float v) { return (1.0 + v) * c; }
vec3 applySaturation(vec3 c, float v) {
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  return mix(vec3(dot(c, W)), c, v);
}
float grainHash(vec2 p) {
  return fract(sin(dot(p, vec2(41.31, 289.7))) * 43758.5453);
}
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vec2(1.0 - vUv.x, vUv.y);

  // Distance from centre in screen UV (0 centre → 1 at the edge midpoints).
  float rimDist = length(vUv - 0.5) * 2.0;

  // Fluid field: rg = flow displacement, sampled in raw screen UV.
  vec3 fluid = texture(uFluidSimTexture, vUv).rgb;

  // --- Spherical projection -------------------------------------------------
  vec2 uvDot = (uv - 0.5) * 2.0;
  float d = sqrt(1.0 - clamp(dot(uvDot, uvDot), 0.0, 1.0));
  d = pow(d, uSpherePower);
  vec3 normals = vec3(uvDot, d); // pre-division; weights fold displacement
  vec2 uvScale = vec2(1.0 / uSphereScale);
  uvDot /= (vec2(d) + 1.0) * uvScale;
  uv = uvDot * 0.5 + 0.5;

  // --- FBM domain warp ------------------------------------------------------
  float drift = uTime * uDriftSpeed;
  float fbmTime1 = uTime * uFbmSpeed;
  float fbmTime2 = uTime * uFbmSpeed * 0.5 + uCumulativeAudio.x * 0.25 + drift;

  vec2 fbmUv = uv * uFbmScale;
  vec2 q = vec2(
    fbm(fbmUv + 0.06 * fbmTime1),
    fbm(fbmUv + vec2(1.0) + 0.05 * fbmTime1)
  );
  vec2 r = vec2(
    fbm(fbmUv + q + vec2(91.3, 55.0) + 0.15 * fbmTime2),
    fbm(fbmUv + q + vec2(45.33, 12.0) + 0.126 * fbmTime2)
  );
  float f = fbm(fbmUv + r);
  float ffbm = mix(0.8, 0.66, clamp(f * f * uFbmPower, 0.0, 1.0));
  ffbm = mix(ffbm, 0.0, clamp(length(q), 0.0, 1.0));
  ffbm = mix(ffbm, 1.0, clamp(abs(r.x), 0.0, 1.0));

  // --- Secondary simplex displacement --------------------------------------
  float noiseTime1 = uTime * uNoiseSpeed * 0.5 + uCumulativeAudio.z * 0.1;
  float noiseTime2 = uTime * uNoiseSpeed;
  vec2 noiseDisp = vec2(
    snoise(vec3(vUv * uNoiseScale, noiseTime1)),
    snoise(vec3(vUv * uNoiseScale + 54.0, noiseTime2))
  );
  noiseDisp *= 1.0 + uAudioAverage.z * 0.25; // mids strengthen the jitter

  // --- Composite UV displacement -------------------------------------------
  // Fold displacement is weighted by normals.xy (→ 0 at centre, grows outward),
  // then damped near the silhouette so it never samples past the gradient's
  // dark edge and the outline stays stable. Motion concentrates in a stable
  // mid-body annulus.
  float foldDamp = 1.0 - 0.7 * smoothstep(0.45, 1.0, rimDist);
  uv += fluid.rg * (uFluidDisplacement * 0.05) * foldDamp;
  uv += normals.xy * (ffbm - 0.5) * uFbmAmplitude * foldDamp;
  uv += noiseDisp * uNoiseAmplitude * foldDamp;

  // --- Gradient sample ------------------------------------------------------
  vec2 coverUv = getCoverUv(uv, uResolution, uTextureResolution);
  vec3 color = texture(uTexture, coverUv).rgb;

  // --- Inner light (listening) ---------------------------------------------
  // When listening, a soft light at the core slowly cycles hue — the orb
  // "changes colour inside" to signal it's hearing you. Modulated by the
  // underlying luminance so the animated folds still read through the tint.
  if (uInnerLightShift > 0.001) {
    float innerMask = 1.0 - smoothstep(0.0, 0.62, rimDist);
    float hue = fract(uTime * 0.055);
    vec3 lightCol = hsv2rgb(vec3(hue, 0.6, 1.0));
    float lum = dot(color, vec3(0.2125, 0.7154, 0.0721));
    vec3 tinted = lightCol * (0.35 + 0.9 * lum);
    color = mix(color, tinted, innerMask * uInnerLightShift);
  }

  // --- Ring / highlight -----------------------------------------------------
  // A restrained, rotating localized glint built in polar coords, its radius
  // distorted by simplex noise. Heavily exponentiated (pow 3) so it stays a
  // localized highlight, never a full ring. Audio gates its intensity; a small
  // baseline keeps a faint sheen alive at idle.
  {
    vec2 ringUv = (vUv - 0.5) * 2.0 * 0.75;
    float ang = atan(ringUv.y, ringUv.x);
    // Idle slows the rotation to a gentle, hypnotic drift.
    float ringSpeed = mix(0.5, 0.16, uIdleRingSpin);
    float ringTime = -uTime * ringSpeed - uCumulativeAudio.a * 0.2;
    // Position shift uses only the SMOOTHED low band — no raw/transient terms,
    // which would jitter the highlight frame-to-frame (flicker).
    ringUv.x += 1.0 + uAudioAverage.y * 1.5;
    float rNoiseScale = 0.65 + uAudioAverage.x * 0.4;
    float n0 = snoise(vec3(ringUv * rNoiseScale, ringTime * 0.5)) * 0.5 + 0.5;
    float len = length((vUv - 0.5) * 2.0 * 0.75);
    const float innerRadius = 0.25;
    float cl = cos(ang + ringTime * 2.0) * 0.5 + 0.5;
    float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
    float v3 = pow(smoothstep(innerRadius, mix(innerRadius, 1.0, n0 * 0.75), len), 2.0);
    cl = cl * v2 * v3;
    // Intensity gated by SMOOTHED channels only (smoothed high + smoothed rms);
    // the raw amplitude channel that used to drive this caused the flicker.
    float ringGate = clamp(0.3 + uAudioAverage.a * 4.0 + uAudioAverage.x * 2.5, 0.0, 1.0);
    // Idle has no audio, so guarantee the ring stays clearly visible…
    ringGate = max(ringGate, uIdleRingSpin * 0.9);
    // …and broaden the glint into more of a ring (softer exponent).
    float ringExp = mix(3.0, 2.0, uIdleRingSpin);
    cl = clamp(pow(cl * ringGate, ringExp), 0.0, 1.0);
    color += vec3(cl) * uRingColorOpacity;
  }

  // --- Fluid colour blend ---------------------------------------------------
  // Luminous streaks: hard-light the fluid colour in by flow magnitude.
  float fluidMag = length(fluid.rg);
  color = blendHardLight(color, uFluidColor, clamp(fluidMag * uFluidColorOpacity * 2.5, 0.0, 0.5));

  // --- Colour grade ---------------------------------------------------------
  color = applySaturation(color, uSaturation);
  color = applyContrast(color, uContrast);
  color = applyExposure(color, uExposure);

  // Subtle STATIC grain to break up residual banding. Static (no time term) so
  // it dithers without adding a per-frame shimmer.
  float grain = grainHash(vUv);
  color *= 1.0 - uGrainOpacity * (0.5 - grain);

  // --- Soft radial silhouette mask -----------------------------------------
  float mask = 1.0 - smoothstep(uMaskRadius - uMaskSoftness, uMaskRadius, rimDist);
  float fadeIn = uFadeInDuration > 0.0 ? clamp(uTime / uFadeInDuration, 0.0, 1.0) : 1.0;
  float alpha = mask * uAlpha * fadeIn;

  color = clamp(color, 0.0, 1.0);
  outColor = vec4(color * alpha, alpha); // premultiplied alpha
}
