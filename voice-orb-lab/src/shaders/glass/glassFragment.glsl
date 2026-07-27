// Liquid-glass shell — fragment.
// Soft Fresnel rim, gentle internal light falloff, drifting specular
// highlight, one faint warm accent region. Front + back faces shaded in
// one pass (gl_FrontFacing) so the shell reads as a thick glass volume.
//
// Visual hierarchy target (brief): shell 40% · edge light 25% ·
// internal ambient 25% · bloom 10%.

precision highp float;

uniform float uTime;
uniform vec3  uDeepColor;      // deep navy body
uniform vec3  uRimColor;       // violet-blue rim
uniform vec3  uInnerColor;     // indigo internal ambient
uniform vec3  uAccentColor;    // faint warm peach
uniform float uFresnel;        // rim intensity
uniform float uTransmission;   // 0 solid → 1 fully translucent
uniform float uThickness;      // back-face density (perceived glass depth)
uniform float uRoughness;      // spreads the specular highlight
uniform float uHighlight;      // specular intensity
uniform float uLight;          // master light multiplier

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObjNormal;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  if (!gl_FrontFacing) N = -N;

  float ndv  = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);

  // slowly orbiting key light — the highlight drifts across the glass
  vec3 L = normalize(vec3(
    0.45 + 0.35 * sin(uTime * 0.055),
    0.72,
    0.55 + 0.30 * cos(uTime * 0.070)
  ));
  vec3 H = normalize(L + V);

  // tight primary highlight + broad soft sheen (roughness widens both)
  float specPow = mix(240.0, 36.0, clamp(uRoughness, 0.0, 1.0));
  float spec  = pow(max(dot(N, H), 0.0), specPow) * uHighlight;
  float sheen = pow(max(dot(N, H), 0.0), 7.0) * 0.09;

  // gentle internal ambient — soft indigo, brightest toward the core,
  // with a slow large-scale drift so the interior never feels frozen
  float innerDrift = 0.85 + 0.15 * sin(uTime * 0.11 + vObjNormal.y * 2.0);
  float inner = pow(ndv, 1.9) * innerDrift;

  // one faint warm region (lower-right), never the whole orb
  vec3 A = normalize(vec3(0.55, -0.30, 0.42));
  float accent = pow(max(dot(normalize(vObjNormal), A), 0.0), 3.5);

  vec3 col;
  float alpha;

  if (gl_FrontFacing) {
    col = uDeepColor;
    col += uRimColor  * fres  * uFresnel;
    col += uInnerColor * inner * 0.34;
    col += uAccentColor * accent * 0.16;
    col += (spec + sheen) * vec3(1.0, 0.98, 0.96);
    col *= uLight;
    // translucent body, denser rim — reads as curved glass
    alpha = mix(0.62, 0.28, uTransmission) + fres * 0.34;
  } else {
    // interior of the far wall — dark, slightly rim-lit: perceived thickness
    col = uDeepColor * 0.55 + uRimColor * fres * uFresnel * 0.35;
    col *= uLight;
    alpha = 0.22 * uThickness;
  }

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
