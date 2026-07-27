/* ═══════════════════════════════════════════════════════════════════════
   VOICE ORB — Phase 1
   A liquid-glass sphere with a luminous electric-blue energy core.
   Adapted from the "Premium AI Voice Orb" brief for this static site:
   vanilla Three.js + custom GLSL instead of React Three Fiber — same
   visual spec (procedural vertex displacement, Fresnel glass, emissive
   core, layered non-looping motion), zero framework dependencies.

   States: idle · listening · thinking · speaking — all transitions are
   continuously interpolated (no hard cuts).

   API (from createOrb(mountEl)):
     setState('idle'|'listening'|'thinking'|'speaking')
     attachStream(mediaStream)   — mic amplitude drives the deformation
     pulse()                     — one speech-syllable energy kick (TTS)
     destroy()
   ═══════════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/* Ashima/IQ 3D simplex noise — shared by the shell + core vertex shaders */
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

const SHELL_VERT = /* glsl */`
uniform float uTime;
uniform float uNoiseAmp;
uniform float uAmp;
varying vec3 vN;
varying vec3 vPos;
varying float vDisp;
${'' /* snoise injected below */}
__SNOISE__
void main() {
  vec3 p = normalize(position);
  /* layered, independently-timed motion — periods chosen so nothing
     visibly loops (5-8s breath, slow drift, fast audio ripple) */
  float breath = 0.014 * sin(uTime * 0.85);
  float slow   = snoise(p * 1.6 + vec3(uTime * 0.07, uTime * 0.05, 0.0));
  float mid    = snoise(p * 3.3 + vec3(0.0, uTime * 0.21, uTime * 0.12));
  float fast   = snoise(p * 5.2 - vec3(uTime * 0.42, 0.0, uTime * 0.3));
  float disp = breath + slow * 0.045 + mid * uNoiseAmp + fast * uAmp * 0.17;
  vec3 np = position + normal * disp;
  vDisp = disp;
  vN = normalMatrix * normal;
  vec4 mv = modelViewMatrix * vec4(np, 1.0);
  vPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const SHELL_FRAG = /* glsl */`
precision highp float;
uniform float uTime;
uniform float uCore;
varying vec3 vN;
varying vec3 vPos;
varying float vDisp;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float fres = pow(1.0 - abs(dot(N, V)), 2.3);
  /* slowly travelling highlight band — 5-6s Fresnel drift from the brief */
  float sweep = 0.5 + 0.5 * sin(uTime * 0.19 + vPos.y * 2.2 + vPos.x);
  vec3 deep = vec3(0.012, 0.045, 0.14);   /* deep glass navy */
  vec3 rim  = vec3(0.30, 0.62, 1.00);     /* electric blue   */
  vec3 col = deep
           + rim * fres * (0.8 + 0.35 * sweep)
           + rim * max(vDisp, 0.0) * 2.0 * uCore;
  float alpha = 0.30 + fres * 0.58;
  gl_FragColor = vec4(col, alpha);
}`;

const CORE_VERT = /* glsl */`
uniform float uTime;
uniform float uAmp;
varying vec3 vN;
varying vec3 vPos;
__SNOISE__
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

const CORE_FRAG = /* glsl */`
precision highp float;
uniform float uTime;
uniform float uCore;
uniform float uAmp;
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vPos);
  float facing = pow(abs(dot(N, V)), 1.4);              /* brightest at the centre */
  float pulse = 0.85 + 0.18 * sin(uTime * 2.3) + 0.08 * sin(uTime * 5.7);  /* 2-3s glow pulse, layered */
  vec3 hot  = vec3(0.75, 0.92, 1.00);
  vec3 blue = vec3(0.18, 0.45, 1.00);
  vec3 col = mix(blue, hot, facing * 0.8) * (uCore * pulse + uAmp * 1.5);
  gl_FragColor = vec4(col, facing * 0.9);
}`;

/* state → motion targets. Values follow the brief: listening deforms
   organically (not scale), thinking circulates energy, speaking pulses. */
const STATES = {
  idle:      { noiseAmp: 0.035, core: 0.55, spin: 0.22, ambient: 0.00 },
  listening: { noiseAmp: 0.085, core: 0.85, spin: 0.45, ambient: 0.00 },
  thinking:  { noiseAmp: 0.050, core: 0.78, spin: 1.70, ambient: 0.06 },
  speaking:  { noiseAmp: 0.060, core: 1.00, spin: 0.60, ambient: 0.03 },
};

export function createOrb(mount) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = mount.clientWidth || 210;
  const H = mount.clientHeight || 210;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 10);
  camera.position.z = 2.7;

  const snoiseIn = s => s.replace('__SNOISE__', SNOISE);

  const uniforms = {
    uTime:     { value: 0 },
    uAmp:      { value: 0 },
    uNoiseAmp: { value: STATES.idle.noiseAmp },
    uCore:     { value: STATES.idle.core },
  };

  /* glass shell */
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 128),
    new THREE.ShaderMaterial({
      vertexShader: snoiseIn(SHELL_VERT),
      fragmentShader: SHELL_FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
    })
  );
  scene.add(shell);

  /* energy core */
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: snoiseIn(CORE_VERT),
      fragmentShader: CORE_FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(core);

  /* internal particles — circulate faster while thinking */
  const P_COUNT = 200;
  const pPos = new Float32Array(P_COUNT * 3);
  for (let i = 0; i < P_COUNT; i++) {
    // uniform-ish distribution inside r 0.85
    const r = 0.35 + 0.5 * Math.cbrt(Math.random());
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pPos[i * 3 + 2] = r * Math.cos(ph);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x7db9ff, size: 0.022, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(particles);

  /* soft halo sprite — bloom substitute without a postprocessing pass */
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 256;
  const hctx = haloCanvas.getContext('2d');
  const grad = hctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(90,160,255,0.55)');
  grad.addColorStop(0.4, 'rgba(60,120,255,0.16)');
  grad.addColorStop(1, 'rgba(40,90,255,0)');
  hctx.fillStyle = grad;
  hctx.fillRect(0, 0, 256, 256);
  const haloMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(haloCanvas),
    transparent: true, opacity: 0.32,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(3.4, 3.4, 1);
  scene.add(halo);

  /* ── live params, smoothed toward the active state's targets ── */
  let target = { ...STATES.idle };
  const cur = { ...STATES.idle };
  let audioAmp = 0, pulseLevel = 0, smoothedAmp = 0;

  /* mic → amplitude */
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
    } catch (e) { /* orb still animates procedurally without audio */ }
  }
  function detachAudio() {
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} }
    audioCtx = null; analyser = null; audioData = null;
  }

  function setState(name) {
    target = { ...(STATES[name] || STATES.idle) };
    if (name !== 'listening') detachAudio();
  }

  /* one syllable kick — used by speech-synthesis boundary events */
  function pulse() { pulseLevel = Math.min(1, pulseLevel + 0.55); }

  const clock = new THREE.Clock();
  let rafId = 0, disposed = false;

  function frame() {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    /* smooth params toward state targets — never a hard cut */
    const k = 1 - Math.exp(-dt * 4.5);
    cur.noiseAmp += (target.noiseAmp - cur.noiseAmp) * k;
    cur.core     += (target.core     - cur.core)     * k;
    cur.spin     += (target.spin     - cur.spin)     * k;
    cur.ambient  += (target.ambient  - cur.ambient)  * k;

    /* amplitude: mic when listening, syllable pulses when speaking,
       gentle ambient drift while thinking */
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
    pulseLevel *= Math.pow(0.06, dt);            // fast, natural decay between syllables
    const ambient = cur.ambient * (0.5 + 0.5 * Math.sin(t * 2.1) * Math.sin(t * 0.7));
    const rawAmp = Math.max(audioAmp, pulseLevel, ambient);
    smoothedAmp += (rawAmp - smoothedAmp) * (1 - Math.exp(-dt * 9));

    uniforms.uTime.value = t;
    uniforms.uAmp.value = reduce ? 0 : smoothedAmp;
    uniforms.uNoiseAmp.value = reduce ? 0.015 : cur.noiseAmp;
    uniforms.uCore.value = cur.core;

    if (!reduce) {
      shell.rotation.y = t * 0.06;
      core.rotation.y = -t * 0.10;
      particles.rotation.y += dt * 0.22 * cur.spin;
      particles.rotation.x = Math.sin(t * 0.16) * 0.25;
    }
    haloMat.opacity = 0.22 + cur.core * 0.14 + smoothedAmp * 0.18;

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
