import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import Lenis from '@studio-freight/lenis';

// ── Shaders ───────────────────────────────────────────────────────────────────
const vertexShader = `
uniform float uBend;
varying vec2 vUv;
void main() {
  vec3 pos = position;
  pos.z += sin(pos.x * 3.14159 * 0.5) * uBend;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uBrightness;
varying vec2 vUv;
void main() {
  vec4 tex = texture2D(uTexture, vUv);
  gl_FragColor = vec4(tex.rgb * uBrightness, tex.a * uOpacity);
}
`;

// ── Layout constants ──────────────────────────────────────────────────────────
const TOTAL_SLOTS  = 4;
const TURNS        = 1;
const RADIUS       = 2.2;
const HELIX_HEIGHT = 3.8;
const CARD_W       = 2.4;
const CARD_H       = 1.35;  // 16:9

export default function SpiralGallery({ cards }) {
  const mountRef    = useRef(null);
  // Initial front card at progress=0.1: slot 1 (dist≈0.05, angle≈99°), cardIndex=1
  const [activeCard, setActiveCard] = useState(cards[1]);
  const [panelVisible, setPanelVisible] = useState(true);
  const activeIndexRef = useRef(1);

  useEffect(() => {
    const el = mountRef.current;
    const W  = el.clientWidth  || window.innerWidth;
    const H  = el.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x080808, 1);
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.5);
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

      const geo      = new THREE.PlaneGeometry(CARD_W, CARD_H, 24, 14);
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
          uBend:       { value: 0 },
          uOpacity:    { value: 1 },
          uBrightness: { value: 1 },
        },
        transparent: true,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      meshes.push({ mesh, mat, cardIndex });
    }

    // ── Progress ──────────────────────────────────────────────────────────────
    // Start at 0.1 so no slot has tFrac=0 (which would make it invisible via edgeMult)
    let targetProgress  = 0.1;
    let currentProgress = 0.1;

    function updateCards(progress) {
      let bestDist  = Infinity;
      let bestIndex = activeIndexRef.current;

      meshes.forEach(({ mesh, mat, cardIndex }, slot) => {
        const t     = (slot + progress) / TOTAL_SLOTS;
        const angle = t * TURNS * Math.PI * 2; // raw — angle cycles naturally

        // Y: negated so diagonal runs lower-left → upper-right (matching reference)
        // Offset 0.25 so front card (tFrac≈0.25) lands at posY=0 (screen center)
        const tFrac = ((t % 1) + 1) % 1;
        const posX  = RADIUS * Math.cos(angle);
        const posY  = -(tFrac - 0.25) * HELIX_HEIGHT;
        const posZ  = RADIUS * Math.sin(angle);

        mesh.position.set(posX, posY, posZ);
        mesh.lookAt(camera.position);

        // Angular distance from front (angle mod 2π = π/2 faces camera at +Z)
        const angMod = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        let angDiff  = angMod - Math.PI / 2;
        if (angDiff >  Math.PI) angDiff -= Math.PI * 2;
        if (angDiff < -Math.PI) angDiff += Math.PI * 2;
        const dist = Math.abs(angDiff) / Math.PI; // 0 = front, 1 = back

        // Sharp edge fade: hides the Y teleport; only fades first/last 3% of range
        const yEdge    = Math.min(tFrac, 1 - tFrac) * 2; // 0 at edges, 1 at center
        const edgeMult = Math.min(1, yEdge * 30);

        // Heavy bend, strong scale fall-off — creates dominant center + curled sides
        mat.uniforms.uBend.value       = dist * 2.5;
        mat.uniforms.uOpacity.value    = Math.max(0.4, 1 - dist * 0.3) * edgeMult;
        mat.uniforms.uBrightness.value = Math.max(0.18, 1 - dist * 0.72) * edgeMult;
        mesh.scale.setScalar(Math.max(0.3, 1 - dist * 0.5));
        mesh.renderOrder = 1 - dist;

        if (dist < bestDist) {
          bestDist  = dist;
          bestIndex = cardIndex;
        }
      });

      if (bestIndex !== activeIndexRef.current) {
        activeIndexRef.current = bestIndex;
        setPanelVisible(false);
        setTimeout(() => {
          setActiveCard(cards[bestIndex]);
          setPanelVisible(true);
        }, 200);
      }
    }

    // ── Auto-advance ─────────────────────────────────────────────────────────
    let autoTimer = null;
    function resetAutoAdvance() {
      if (autoTimer) clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        targetProgress -= 1;
        resetAutoAdvance();
      }, 8000);
    }
    resetAutoAdvance();

    // ── Scroll ────────────────────────────────────────────────────────────────
    const lenis = new Lenis({ smoothWheel: true, wheelMultiplier: 0 });

    function onWheel(e) {
      e.preventDefault();
      targetProgress -= e.deltaY * 0.015;
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

    updateCards(0);

    function onResize() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return () => {
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
      width: '100vw', height: '100vh',
      background: '#080808',
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

      {/* Info panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '48px 48px 44px',
        background: 'linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.55) 65%, transparent 100%)',
        opacity: panelVisible ? 1 : 0,
        transition: 'opacity 200ms ease',
        pointerEvents: panelVisible ? 'auto' : 'none',
      }}>
        <p style={{
          margin: 0, fontSize: 11, letterSpacing: '0.18em',
          color: activeCard.color, textTransform: 'uppercase', fontFamily: 'monospace',
        }}>
          {activeCard.sub}
        </p>
        <h2 style={{
          margin: '6px 0 10px', fontSize: 30, fontWeight: 700,
          color: '#fff', fontFamily: 'sans-serif', letterSpacing: '-0.02em',
        }}>
          {activeCard.title}
        </h2>
        <p style={{
          margin: '0 0 22px', fontSize: 14, color: 'rgba(255,255,255,0.55)',
          maxWidth: 500, lineHeight: 1.65, fontFamily: 'sans-serif',
        }}>
          {activeCard.desc}
        </p>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 20px', borderRadius: 999,
          background: activeCard.color, color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace',
        }}>
          VIEW →
        </button>
      </div>
    </div>
  );
}
