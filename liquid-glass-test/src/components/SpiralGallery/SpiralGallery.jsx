import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import Lenis from '@studio-freight/lenis';

// ── Layout constants ──────────────────────────────────────────────────────────
const TOTAL_SLOTS  = 10;
const TURNS        = 1;
const RADIUS       = 4.5;   // sphere radius — must match shader below
const HELIX_HEIGHT = 16.0;  // step (16/10=1.6) > card height threshold so adjacent cards clear front border
const ROW_GAP      = 0.3;   // small extra drop between front wrap and back wrap
const CARD_W       = 2.9;
const CARD_H       = 1.63;  // 16:9

// ── Shaders ───────────────────────────────────────────────────────────────────
// RADIUS is injected via template literal so shader always matches the JS constant.
const vertexShader = `
uniform vec3  uCenter;
uniform vec3  uRight;
uniform vec3  uUp;
uniform float uFlatness;
varying vec2  vUv;
varying float vFacing;
varying float vFlat;

void main() {
  vec3 worldPos  = uCenter + uRight * position.x + uUp * position.y;
  vec3 onSphere  = ${RADIUS} * normalize(worldPos);
  vec3 finalPos  = mix(onSphere, worldPos, uFlatness);
  vFacing = normalize(onSphere).z;
  vFlat   = uFlatness;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uBrightness;
uniform float uBlur;
varying vec2  vUv;
varying float vFacing;
varying float vFlat;
void main() {
  float b = uBlur * 0.018;
  vec4 tex  = texture2D(uTexture, vUv)                    * 0.40;
  tex += texture2D(uTexture, vUv + vec2(-b, -b))          * 0.15;
  tex += texture2D(uTexture, vUv + vec2( b, -b))          * 0.15;
  tex += texture2D(uTexture, vUv + vec2(-b,  b))          * 0.15;
  tex += texture2D(uTexture, vUv + vec2( b,  b))          * 0.15;
  float sphereShade = 0.45 + 0.55 * max(0.0, vFacing);
  float shade = mix(sphereShade, 1.0, vFlat);
  gl_FragColor = vec4(tex.rgb * uBrightness * shade, tex.a * uOpacity);
}
`;

export default function SpiralGallery({ cards }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const W  = el.clientWidth  || window.innerWidth;
    const H  = el.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x1e1e1e, 1);
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 100);
    camera.position.set(0, 0, 10.5);
    camera.lookAt(0, 0, 0);

    // Solid-color fallback when image 404s
    function makeFallback(hex) {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 36;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, 64, 36);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    const loader = new THREE.TextureLoader();
    const meshes = [];

    for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
      const cardIndex = slot % cards.length;
      const card      = cards[cardIndex];

      const geo      = new THREE.PlaneGeometry(CARD_W, CARD_H, 48, 32);
      const fallback = makeFallback(card.color);
      const tex      = loader.load(card.image, undefined, undefined,
        () => { mat.uniforms.uTexture.value = fallback; }
      );
      tex.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture:    { value: tex },
          uCenter:     { value: new THREE.Vector3() },
          uRight:      { value: new THREE.Vector3() },
          uUp:         { value: new THREE.Vector3(0, 1, 0) },
          uFlatness:   { value: 0 },
          uOpacity:    { value: 1 },
          uBrightness: { value: 1 },
          uBlur:       { value: 0 },
        },
        transparent: true,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false; // vertices placed by shader, not mesh.position
      scene.add(mesh);
      meshes.push({ mesh, mat, cardIndex });
    }

    // ── Progress ──────────────────────────────────────────────────────────────
    // progress=2.5 puts slot 0 (blob placeholder) exactly at front (t=0.25).
    // Slot 0 is always invisible in Three.js — the blob HTML element covers it.
    // Clamped to [−6.5, 2.5]: covers 10 positions (blob + 9 project cards), no looping.
    let targetProgress  = 2.5;
    let currentProgress = 2.5;
    let globalYOffset   = -20;  // all cards below viewport until entry
    let entryTriggered  = false;

    const blobEl = document.getElementById('s2BlobIntro');

    function updateCards(progress) {
      let minProjectDist = Infinity;

      meshes.forEach(({ mesh, mat, cardIndex }, slot) => {
        const t     = (slot + progress) / TOTAL_SLOTS;
        const angle = t * TURNS * Math.PI * 2; // raw — angle cycles naturally

        // Offset 0.5 centers the whole staircase: avg tFrac=0.5 → avg posY=0
        const tFrac = ((t % 1) + 1) % 1;
        const posX  = RADIUS * Math.cos(angle);
        const posZ  = RADIUS * Math.sin(angle);

        // angMod needed before posY so we can compute the inter-row gap
        const angModEarly = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const gapT    = Math.max(0, Math.min(1, (angModEarly - Math.PI * 0.85) / (Math.PI * 0.3)));
        // Fold tFrac so the staircase spreads symmetrically: 5 slots above front, 4 below
        const devFrac = ((tFrac + 0.25) % 1) - 0.5;
        const posY    = -devFrac * HELIX_HEIGHT - gapT * ROW_GAP;

        // Angular distance from front (π/2 = camera-facing on +Z axis)
        const angMod = angModEarly;
        let angDiff  = angMod - Math.PI / 2;
        if (angDiff >  Math.PI) angDiff -= Math.PI * 2;
        if (angDiff < -Math.PI) angDiff += Math.PI * 2;
        const dist = Math.abs(angDiff) / Math.PI; // 0 = front, 1 = back

        // Slot 0 is the blob placeholder — always invisible in Three.js
        if (slot === 0) {
          mat.uniforms.uCenter.value.set(posX, posY + globalYOffset, posZ);
          mat.uniforms.uRight.value.set(Math.sin(angle) * 1, 0, -Math.cos(angle) * 1);
          mat.uniforms.uUp.value.set(0, 1, 0);
          mat.uniforms.uFlatness.value   = 0;
          mat.uniforms.uBlur.value       = 0;
          mat.uniforms.uOpacity.value    = 0;
          mat.uniforms.uBrightness.value = 0;
          mesh.renderOrder = 0;
          return;
        }

        // Track closest project card for blob fade
        if (dist < minProjectDist) minProjectDist = dist;

        // Sharp edge fade to hide Y teleport at helix wrap point
        const yEdge    = Math.min(tFrac, 1 - tFrac) * 2;
        const edgeMult = Math.min(1, yEdge * 30);

        // Scale: front card is dominant, background cards smaller
        const scale = Math.max(0.45, 1 - dist * 0.4);

        // Feed world-space card orientation into shader — ONE shared sphere at origin
        mat.uniforms.uCenter.value.set(posX, posY + globalYOffset, posZ);
        mat.uniforms.uRight.value.set( Math.sin(angle) * scale, 0, -Math.cos(angle) * scale);
        mat.uniforms.uUp.value.set(0, scale, 0);

        // Front card is flat; all others sphere-curved — smooth ramp over dist 0→0.1
        mat.uniforms.uFlatness.value   = Math.max(0, 1 - dist / 0.1);

        mat.uniforms.uBlur.value       = Math.min(1, dist * 2.5);
        mat.uniforms.uOpacity.value    = Math.max(0.2, 1 - dist * 0.7) * edgeMult;
        mat.uniforms.uBrightness.value = Math.max(0.2, 1 - dist * 0.7) * edgeMult;
        mesh.renderOrder = 1 - dist;
      });

      // Fade blob out as a project card approaches front.
      // At rest (progress=2.5), nearest project cards are ~0.2 away → blob fully visible.
      // Threshold 0.05..0.2: smooth fade as any card closes in.
      if (blobEl) {
        const blobOpacity = Math.max(0, Math.min(1, (minProjectDist - 0.05) / 0.15));
        blobEl.style.opacity = blobOpacity.toFixed(3);
      }
    }

    // ── Auto-advance ─────────────────────────────────────────────────────────
    let autoTimer = null;
    function resetAutoAdvance() {
      if (autoTimer) clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        const newP = targetProgress - 1;
        if (newP >= -6.5) {
          targetProgress = newP;
          resetAutoAdvance(); // keep advancing until last card
        }
        // at -6.5 (slot 9 at front) → stop; not infinite
      }, 8000);
    }
    // auto-advance starts after entry animation settles (see IntersectionObserver)

    // ── Entry animation — triggered when section scrolls into view ────────────
    // Cards rise from below after the blob HTML element lands (CSS transition ~1.1s).
    // No spin: progress stays at 2.5 (blob slot at front, invisible), blob HTML shows.
    const entryObj = { y: -20 };
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !entryTriggered) {
        entryTriggered = true;
        observer.disconnect();
        // Rise from below with a delay so blob lands first
        gsap.to(entryObj, {
          y: 0,
          duration: 2.8,
          delay: 1.2,
          ease: 'power3.out',
          onUpdate: () => { globalYOffset = entryObj.y; },
        });
        // Begin auto-advance once cards have settled
        setTimeout(resetAutoAdvance, 4500);
      }
    }, { threshold: 0.1 });
    observer.observe(el);

    // ── Scroll ────────────────────────────────────────────────────────────────
    const lenis = new Lenis({ smoothWheel: true, wheelMultiplier: 0 });

    function onWheel(e) {
      e.preventDefault();
      targetProgress -= e.deltaY * 0.015;
      // Clamp: progress=2.5 → blob at front; progress=-6.5 → slot 9 at front
      targetProgress = Math.max(-6.5, Math.min(2.5, targetProgress));
      resetAutoAdvance();
    }
    el.addEventListener('wheel', onWheel, { passive: false });

    // ── GSAP ticker ───────────────────────────────────────────────────────────
    const tickerFn = (time) => {
      lenis.raf(time * 1000);
      currentProgress += (targetProgress - currentProgress) * 0.07;
      updateCards(currentProgress);
      renderer.render(scene, camera);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    updateCards(currentProgress);

    function onResize() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      el.removeEventListener('wheel', onWheel);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: '#1E1E1E',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* WebGL canvas */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
    </div>
  );
}
