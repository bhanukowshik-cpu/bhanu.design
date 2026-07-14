/* ═══════════════════════════════════════════════════════════════════════
   VOICE ORB — VARIANT LAB
   Four experimental takes on the Phase-1 orb (voice-orb/orb.js), plus the
   original, for side-by-side comparison on voice-orb/variations.html.

   Shared scaffolding (renderer / states / amplitude smoothing) with a
   per-variant "spec": shell + core shader fragments, particle layout,
   halo tint, and motion character.

     aurora      — iridescent nebula: purple→cyan→pink drift, dreamy slow
     solar       — plasma reactor: ember/gold crackle, fast hot core
     volt        — brand liquid metal: dark chrome + lime rim (#E6F28D)
     singularity — void: near-black body, razor rim, accretion-disk particles

   API mirrors orb.js: createVariant(mount, id) →
     { setState, pulse, attachStream, destroy }
   ═══════════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* shared vertex shader — per-variant motion character via injected consts */
function shellVert(v) {
  return /* glsl */`
uniform float uTime;
uniform float uNoiseAmp;
uniform float uAmp;
varying vec3 vN;
varying vec3 vPos;
varying float vDisp;
${SNOISE}
void main() {
  vec3 p = normalize(position);
  float breath = ${v.breath} * sin(uTime * 0.85);
  float slow = snoise(p * ${v.f1} + vec3(uTime * ${v.s1}, uTime * 0.05, 0.0));
  float mid  = snoise(p * ${v.f2} + vec3(0.0, uTime * ${v.s2}, uTime * 0.12));
  float fast = snoise(p * ${v.f3} - vec3(uTime * ${v.s3}, 0.0, uTime * 0.3));
  float disp = breath + slow * ${v.slowAmp} + mid * uNoiseAmp + fast * uAmp * ${v.fastGain};
  vec3 np = position + normal * disp;
  vDisp = disp;
  vN = normalMatrix * normal;
  vec4 mv = modelViewMatrix * vec4(np, 1.0);
  vPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
}

const CORE_VERT = /* glsl */`
uniform float uTime;
uniform float uAmp;
varying vec3 vN;
varying vec3 vPos;
${SNOISE}
void main() {
  vec3 p = normalize(position);
  float disp = snoise(p * 2.2 + vec3(uTime * 0.45)) * 0.07
             + snoise(p * 4.5 - vec3(uTime * 1.1)) * uAmp * 0.14;
  vec3 np = position + normal * disp;
  vN = normalMatrix * normal;
  vec4 mv = modelViewMatrix * vec4(np, 1.0);
  vPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

function coreFrag(a, b, boost) {
  return /* glsl */`
precision highp float;
uniform float uTime;
uniform float uCore;
uniform float uAmp;
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float facing = pow(abs(dot(N, V)), 1.4);
  float pulse = 0.85 + 0.18 * sin(uTime * 2.3) + 0.08 * sin(uTime * 5.7);
  vec3 hot  = vec3(${a});
  vec3 base = vec3(${b});
  vec3 col = mix(base, hot, facing * 0.8) * (uCore * pulse * ${boost} + uAmp * 1.5);
  gl_FragColor = vec4(col, facing * 0.9);
}`;
}

const FRAG_HEAD = /* glsl */`
precision highp float;
uniform float uTime;
uniform float uCore;
varying vec3 vN;
varying vec3 vPos;
varying float vDisp;
${SNOISE}`;

/* ── variant specs ─────────────────────────────────────────────────── */
const SPECS = {

  /* ORIGINAL — the shipped Phase-1 orb, for reference */
  original: {
    name: 'Original',
    blurb: 'Shipped Phase 1 — glass navy, electric-blue rim',
    vert: { breath: '0.014', f1: '1.6', f2: '3.3', f3: '5.2', s1: '0.07', s2: '0.21', s3: '0.42', slowAmp: '0.045', fastGain: '0.17' },
    shellFrag: FRAG_HEAD + /* glsl */`
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float fres = pow(1.0 - abs(dot(N, V)), 2.3);
  float sweep = 0.5 + 0.5 * sin(uTime * 0.19 + vPos.y * 2.2 + vPos.x);
  vec3 deep = vec3(0.012, 0.045, 0.14);
  vec3 rim  = vec3(0.30, 0.62, 1.00);
  vec3 col = deep + rim * fres * (0.8 + 0.35 * sweep) + rim * max(vDisp, 0.0) * 2.0 * uCore;
  gl_FragColor = vec4(col, 0.30 + fres * 0.58);
}`,
    core: { colors: ['0.75, 0.92, 1.00', '0.18, 0.45, 1.00'], boost: '1.0', size: 0.52 },
    particles: { color: 0x7db9ff, count: 200, size: 0.022, opacity: 0.55, layout: 'sphere', spin: 1.0 },
    halo: [90, 160, 255], haloOpacity: 0.32,
    states: { idle: { noiseAmp: 0.035, core: 0.55, spin: 0.22 }, listening: { noiseAmp: 0.085, core: 0.85, spin: 0.45 }, thinking: { noiseAmp: 0.05, core: 0.78, spin: 1.7 }, speaking: { noiseAmp: 0.06, core: 1.0, spin: 0.6 } },
  },

  /* AURORA — iridescent nebula, dreamy and slow */
  aurora: {
    name: 'Aurora',
    blurb: 'Iridescent nebula — purple / cyan / rose hue drift',
    vert: { breath: '0.018', f1: '1.2', f2: '2.6', f3: '4.4', s1: '0.05', s2: '0.14', s3: '0.30', slowAmp: '0.075', fastGain: '0.20' },
    shellFrag: FRAG_HEAD + /* glsl */`
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float fres = pow(1.0 - abs(dot(N, V)), 2.0);
  float hueN = snoise(vec3(vPos.xy * 1.4, uTime * 0.10));
  vec3 c1 = vec3(0.64, 0.53, 0.98);   /* violet */
  vec3 c2 = vec3(0.15, 0.83, 0.94);   /* cyan   */
  vec3 c3 = vec3(0.98, 0.45, 0.58);   /* rose   */
  vec3 rim = mix(mix(c1, c2, 0.5 + 0.5 * sin(uTime * 0.26 + vPos.y * 2.6)), c3, 0.5 + 0.5 * hueN);
  vec3 deep = vec3(0.028, 0.014, 0.075);
  vec3 col = deep + rim * fres * 1.15 + rim * max(vDisp, 0.0) * 2.4 * uCore;
  gl_FragColor = vec4(col, 0.28 + fres * 0.62);
}`,
    core: { colors: ['0.95, 0.90, 1.00', '0.55, 0.35, 0.95'], boost: '1.05', size: 0.5 },
    particles: { color: 0xc4b5fd, count: 260, size: 0.02, opacity: 0.5, layout: 'sphere', spin: 0.7 },
    halo: [150, 110, 255], haloOpacity: 0.34,
    states: { idle: { noiseAmp: 0.05, core: 0.5, spin: 0.18 }, listening: { noiseAmp: 0.11, core: 0.82, spin: 0.4 }, thinking: { noiseAmp: 0.07, core: 0.72, spin: 1.4 }, speaking: { noiseAmp: 0.08, core: 1.0, spin: 0.55 } },
  },

  /* SOLAR — plasma reactor, hot and crackling */
  solar: {
    name: 'Solar',
    blurb: 'Plasma reactor — ember & gold, crackling surface',
    vert: { breath: '0.012', f1: '2.0', f2: '4.6', f3: '7.5', s1: '0.10', s2: '0.34', s3: '0.75', slowAmp: '0.04', fastGain: '0.22' },
    shellFrag: FRAG_HEAD + /* glsl */`
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float fres = pow(1.0 - abs(dot(N, V)), 2.1);
  float n = snoise(vec3(vPos.xy * 2.4, uTime * 0.35)) * 0.6
          + snoise(vec3(vPos.yx * 5.0, uTime * 0.8)) * 0.4;
  vec3 ember = vec3(1.00, 0.42, 0.18);
  vec3 gold  = vec3(1.00, 0.84, 0.20);
  vec3 deep  = vec3(0.10, 0.015, 0.0);
  vec3 lava  = mix(ember, gold, 0.5 + 0.5 * n);
  vec3 col = deep + lava * (fres * 1.1 + 0.10) + lava * max(vDisp, 0.0) * 3.2 * uCore;
  gl_FragColor = vec4(col, 0.42 + fres * 0.52);
}`,
    core: { colors: ['1.00, 0.96, 0.82', '1.00, 0.55, 0.10'], boost: '1.2', size: 0.56 },
    particles: { color: 0xffc35a, count: 240, size: 0.024, opacity: 0.65, layout: 'sphere', spin: 1.6 },
    halo: [255, 140, 40], haloOpacity: 0.36,
    states: { idle: { noiseAmp: 0.045, core: 0.6, spin: 0.35 }, listening: { noiseAmp: 0.10, core: 0.9, spin: 0.6 }, thinking: { noiseAmp: 0.065, core: 0.82, spin: 2.2 }, speaking: { noiseAmp: 0.075, core: 1.05, spin: 0.8 } },
  },

  /* VOLT — brand liquid metal: dark chrome + portfolio lime */
  volt: {
    name: 'Volt',
    blurb: 'Liquid metal — dark chrome, brand-lime rim (#E6F28D)',
    vert: { breath: '0.010', f1: '1.4', f2: '2.4', f3: '4.0', s1: '0.06', s2: '0.16', s3: '0.34', slowAmp: '0.055', fastGain: '0.15' },
    shellFrag: FRAG_HEAD + /* glsl */`
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float fres = pow(1.0 - abs(dot(N, V)), 2.4);
  float sweep = 0.5 + 0.5 * sin(uTime * 0.22 + vPos.y * 2.0);
  float band = pow(0.5 + 0.5 * sin(vPos.y * 6.5 + uTime * 0.5
             + snoise(vec3(vPos.xz * 2.0, uTime * 0.14)) * 2.4), 3.0);
  vec3 chrome = vec3(0.045, 0.05, 0.042) + vec3(0.82, 0.88, 0.78) * band * 0.20;
  vec3 lime = vec3(0.90, 0.95, 0.55);
  vec3 col = chrome + lime * fres * (0.85 + 0.35 * sweep) + lime * max(vDisp, 0.0) * 2.2 * uCore;
  gl_FragColor = vec4(col, 0.55 + fres * 0.40);
}`,
    core: { colors: ['0.97, 1.00, 0.80', '0.47, 0.62, 0.02'], boost: '0.9', size: 0.48 },
    particles: { color: 0xe6f28d, count: 150, size: 0.02, opacity: 0.45, layout: 'sphere', spin: 0.9 },
    halo: [210, 235, 120], haloOpacity: 0.26,
    states: { idle: { noiseAmp: 0.03, core: 0.5, spin: 0.2 }, listening: { noiseAmp: 0.08, core: 0.85, spin: 0.4 }, thinking: { noiseAmp: 0.045, core: 0.75, spin: 1.6 }, speaking: { noiseAmp: 0.055, core: 1.0, spin: 0.55 } },
  },

  /* SINGULARITY — near-black body, razor rim, accretion disk */
  singularity: {
    name: 'Singularity',
    blurb: 'The void — black body, razor rim, accretion-disk particles',
    vert: { breath: '0.008', f1: '1.5', f2: '3.0', f3: '5.5', s1: '0.05', s2: '0.18', s3: '0.40', slowAmp: '0.035', fastGain: '0.14' },
    shellFrag: FRAG_HEAD + /* glsl */`
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float edge = pow(1.0 - abs(dot(N, V)), 4.0);
  float ring = smoothstep(0.45, 0.95, edge);
  vec3 violet = vec3(0.56, 0.36, 1.00);
  vec3 cyan   = vec3(0.30, 0.72, 1.00);
  vec3 rim = mix(violet, cyan, 0.5 + 0.5 * sin(uTime * 0.35 + vPos.x * 2.2));
  vec3 col = vec3(0.004, 0.003, 0.016)
           + rim * (edge * 1.7 + ring * 0.9)
           + rim * max(vDisp, 0.0) * 1.6 * uCore;
  gl_FragColor = vec4(col, 0.82 + edge * 0.18);
}`,
    core: { colors: ['0.45, 0.30, 0.95', '0.10, 0.05, 0.30'], boost: '0.6', size: 0.42 },
    particles: { color: 0x9f7bff, count: 420, size: 0.018, opacity: 0.75, layout: 'disk', spin: 2.2 },
    halo: [120, 80, 255], haloOpacity: 0.30,
    states: { idle: { noiseAmp: 0.025, core: 0.45, spin: 0.35 }, listening: { noiseAmp: 0.07, core: 0.8, spin: 0.7 }, thinking: { noiseAmp: 0.04, core: 0.7, spin: 2.6 }, speaking: { noiseAmp: 0.05, core: 1.0, spin: 1.0 } },
  },
};

export const VARIANTS = Object.keys(SPECS).map(id => ({ id, name: SPECS[id].name, blurb: SPECS[id].blurb }));

export function createVariant(mount, id) {
  const spec = SPECS[id] || SPECS.original;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = mount.clientWidth || 230;
  const H = mount.clientHeight || 230;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 10);
  camera.position.z = 2.9;

  const uniforms = {
    uTime:     { value: 0 },
    uAmp:      { value: 0 },
    uNoiseAmp: { value: spec.states.idle.noiseAmp },
    uCore:     { value: spec.states.idle.core },
  };

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 128),
    new THREE.ShaderMaterial({
      vertexShader: shellVert(spec.vert),
      fragmentShader: spec.shellFrag,
      uniforms, transparent: true, depthWrite: false,
    })
  );
  scene.add(shell);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(spec.core.size, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: CORE_VERT,
      fragmentShader: coreFrag(spec.core.colors[0], spec.core.colors[1], spec.core.boost),
      uniforms, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(core);

  /* particles — 'sphere' fills the interior, 'disk' is an accretion ring */
  const P = spec.particles;
  const pPos = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    if (P.layout === 'disk') {
      const r = 1.12 + Math.random() * 0.5;
      const th = Math.random() * Math.PI * 2;
      pPos[i * 3]     = r * Math.cos(th);
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.10;
      pPos[i * 3 + 2] = r * Math.sin(th);
    } else {
      const r = 0.35 + 0.5 * Math.cbrt(Math.random());
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pPos[i * 3 + 2] = r * Math.cos(ph);
    }
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: P.color, size: P.size, transparent: true, opacity: P.opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  if (P.layout === 'disk') particles.rotation.x = 0.42;   /* tilt the disk */
  scene.add(particles);

  /* halo sprite */
  const hc = document.createElement('canvas');
  hc.width = hc.height = 256;
  const hx = hc.getContext('2d');
  const [hr, hg, hb] = spec.halo;
  const grad = hx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, `rgba(${hr},${hg},${hb},0.55)`);
  grad.addColorStop(0.4, `rgba(${hr},${hg},${hb},0.16)`);
  grad.addColorStop(1, `rgba(${hr},${hg},${hb},0)`);
  hx.fillStyle = grad;
  hx.fillRect(0, 0, 256, 256);
  const haloMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(hc),
    transparent: true, opacity: spec.haloOpacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(3.6, 3.6, 1);
  scene.add(halo);

  let target = { ...spec.states.idle };
  const cur = { ...spec.states.idle };
  let audioAmp = 0, pulseLevel = 0, smoothedAmp = 0;

  let audioCtx = null, analyser = null, audioData = null;
  function attachStream(stream) {
    detachAudio();
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioData = new Uint8Array(analyser.fftSize);
    } catch (e) {}
  }
  function detachAudio() {
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} }
    audioCtx = null; analyser = null; audioData = null;
  }

  function setState(name) {
    target = { ...(spec.states[name] || spec.states.idle) };
    if (name !== 'listening') detachAudio();
  }
  function pulse() { pulseLevel = Math.min(1, pulseLevel + 0.55); }

  const clock = new THREE.Clock();
  let rafId = 0, disposed = false;

  function frame() {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const k = 1 - Math.exp(-dt * 4.5);
    cur.noiseAmp += (target.noiseAmp - cur.noiseAmp) * k;
    cur.core     += (target.core     - cur.core)     * k;
    cur.spin     += (target.spin     - cur.spin)     * k;

    if (analyser && audioData) {
      analyser.getByteTimeDomainData(audioData);
      let hi = 0;
      for (let i = 0; i < audioData.length; i++) {
        const v = Math.abs(audioData[i] - 128);
        if (v > hi) hi = v;
      }
      audioAmp = Math.min(1, hi / 42);
    } else {
      audioAmp *= 0.92;
    }
    pulseLevel *= Math.pow(0.06, dt);
    const rawAmp = Math.max(audioAmp, pulseLevel);
    smoothedAmp += (rawAmp - smoothedAmp) * (1 - Math.exp(-dt * 9));

    uniforms.uTime.value = t;
    uniforms.uAmp.value = reduce ? 0 : smoothedAmp;
    uniforms.uNoiseAmp.value = reduce ? 0.015 : cur.noiseAmp;
    uniforms.uCore.value = cur.core;

    if (!reduce) {
      shell.rotation.y = t * 0.06;
      core.rotation.y = -t * 0.10;
      particles.rotation.y += dt * 0.22 * cur.spin;
      if (P.layout !== 'disk') particles.rotation.x = Math.sin(t * 0.16) * 0.25;
    }
    haloMat.opacity = spec.haloOpacity * 0.7 + cur.core * 0.14 + smoothedAmp * 0.18;

    renderer.render(scene, camera);
  }
  frame();

  const ro = new ResizeObserver(() => {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(mount);

  function destroy() {
    disposed = true;
    cancelAnimationFrame(rafId);
    ro.disconnect();
    detachAudio();
    shell.geometry.dispose(); shell.material.dispose();
    core.geometry.dispose(); core.material.dispose();
    pGeo.dispose(); particles.material.dispose();
    haloMat.map.dispose(); haloMat.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }

  return { setState, attachStream, pulse, destroy };
}
